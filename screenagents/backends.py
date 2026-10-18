"""Native screen-capture backends.

Nothing here is a hard dependency. Each backend shells out to a program that
already ships with (or is the blessed screenshot tool for) the host OS:

* macOS  -> ``screencapture`` (built in)
* Windows -> PowerShell + System.Drawing (built in)
* Linux  -> whichever of grim / scrot / maim / ImageMagick / gnome-screenshot /
             spectacle / xfce4-screenshooter / flameshot happens to be present

The module is deliberately import-light and side-effect free so it can be unit
tested on a headless box with a different OS than it will ultimately run on.
"""
from __future__ import annotations

import os
import re
import shutil
import sys
from dataclasses import dataclass
from typing import Callable, List, Optional, Sequence, Tuple

from .errors import BackendUnavailableError, NoBackendError

__all__ = [
    "Region",
    "CaptureRequest",
    "Backend",
    "all_backends",
    "backend_by_name",
    "available_backends",
    "current_session",
    "environment",
    "select",
]


# ---------------------------------------------------------------------------
# Region parsing
# ---------------------------------------------------------------------------
_COMMA = re.compile(r"^(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)$")
_X11 = re.compile(r"^(\d+)x(\d+)([+-]\d+)([+-]\d+)$")
_WH = re.compile(r"^(\d+)x(\d+)$")


@dataclass(frozen=True)
class Region:
    """A rectangular sub-area of the screen, in pixels.

    Parsed from either an ``x,y,width,height`` string or an X11 geometry
    string (``widthxheight+x+y``). The two forms are what the underlying
    tools expect, so both are offered back via ``csv`` / ``geometry``.
    """

    x: int
    y: int
    width: int
    height: int

    def __post_init__(self) -> None:
        if self.width <= 0 or self.height <= 0:
            raise ValueError(
                "region width and height must be positive, got "
                f"{self.width}x{self.height}"
            )

    @classmethod
    def parse(cls, value: object) -> "Region":
        if isinstance(value, Region):
            return value
        if isinstance(value, (list, tuple)):
            if len(value) != 4:
                raise ValueError(
                    "region sequence must be (x, y, width, height)"
                )
            return cls(*(int(v) for v in value))
        if not isinstance(value, str):
            raise ValueError(f"cannot parse region from {value!r}")

        text = value.strip()
        match = _COMMA.match(text)
        if match:
            x, y, w, h = (int(g) for g in match.groups())
            return cls(x, y, w, h)

        match = _X11.match(text)
        if match:
            w, h, x, y = (int(g) for g in match.groups())
            return cls(x, y, w, h)

        match = _WH.match(text)
        if match:
            w, h = (int(g) for g in match.groups())
            return cls(0, 0, w, h)

        raise ValueError(
            "region must look like 'x,y,width,height' or 'widthxheight+x+y', "
            f"got {value!r}"
        )

    @property
    def csv(self) -> str:
        return f"{self.x},{self.y},{self.width},{self.height}"

    @property
    def geometry(self) -> str:
        return f"{self.width}x{self.height}+{self.x}+{self.y}"

    def __str__(self) -> str:  # pragma: no cover - trivial
        return self.geometry


# ---------------------------------------------------------------------------
# Requests + backend definition
# ---------------------------------------------------------------------------
@dataclass(frozen=True)
class CaptureRequest:
    """Everything a backend needs to know in order to build its command."""

    output: str
    region: Optional[Region] = None
    monitor: Optional[int] = None
    display: Optional[str] = None


@dataclass(frozen=True)
class Backend:
    name: str
    description: str
    platforms: Tuple[str, ...]
    requires: Tuple[str, ...] = ()
    session: Optional[Tuple[str, ...]] = None
    supports_region: bool = False
    supports_monitor: bool = False
    supports_display: bool = False
    build: Optional[Callable[[CaptureRequest], List[str]]] = None

    def available(self) -> Tuple[bool, str]:
        """Return ``(is_available, human_readable_reason)``."""
        if sys.platform not in self.platforms:
            return False, f"not supported on {sys.platform}"
        missing = [exe for exe in self.requires if shutil.which(exe) is None]
        if missing:
            return False, "missing executable: " + ", ".join(missing)
        if "linux" in self.platforms:
            session = current_session()
            if session is None:
                return False, (
                    "no X11 or Wayland session detected "
                    "(DISPLAY / WAYLAND_DISPLAY are unset)"
                )
            if self.session and session not in self.session:
                return False, (
                    f"needs a {'/'.join(self.session)} session "
                    f"(this is {session})"
                )
        return True, "ready"

    def to_dict(self) -> dict:
        ok, reason = self.available()
        return {
            "name": self.name,
            "description": self.description,
            "available": ok,
            "reason": reason,
            "supports_region": self.supports_region,
            "supports_monitor": self.supports_monitor,
            "supports_display": self.supports_display,
        }


# ---------------------------------------------------------------------------
# Session / environment detection
# ---------------------------------------------------------------------------
def current_session() -> Optional[str]:
    """Best-effort guess at the display server on Linux."""
    if not sys.platform.startswith("linux"):
        return None
    if os.environ.get("WAYLAND_DISPLAY"):
        return "wayland"
    if os.environ.get("DISPLAY"):
        return "x11"
    session_type = (os.environ.get("XDG_SESSION_TYPE") or "").lower()
    if session_type in ("wayland", "x11"):
        return session_type
    return None


def environment() -> dict:
    """Snapshot of the host facts that determine backend availability."""
    return {
        "platform": sys.platform,
        "python": sys.version.split()[0],
        "session": current_session(),
        "DISPLAY": os.environ.get("DISPLAY", ""),
        "WAYLAND_DISPLAY": os.environ.get("WAYLAND_DISPLAY", ""),
        "XDG_SESSION_TYPE": os.environ.get("XDG_SESSION_TYPE", ""),
    }


# ---------------------------------------------------------------------------
# Command builders
# ---------------------------------------------------------------------------
def _build_macos(req: CaptureRequest) -> List[str]:
    argv = ["screencapture", "-x", "-t", "png"]
    if req.region:
        argv += ["-R", req.region.csv]
    target = req.display if req.display is not None else req.monitor
    if target is not None:
        argv += ["-D", str(target)]
    argv.append(req.output)
    return argv


def _windows_script(req: CaptureRequest) -> str:
    if req.region:
        r = req.region
        bounds = (
            "$bounds = New-Object System.Drawing.Rectangle "
            f"{r.x},{r.y},{r.width},{r.height}"
        )
    elif req.monitor is not None:
        index = req.monitor - 1
        if index < 0:
            raise ValueError("monitor numbers start at 1")
        bounds = (
            "$screens = [System.Windows.Forms.Screen]::AllScreens\n"
            f"if ($screens.Length -le {index}) "
            f'{{ throw "monitor {req.monitor} not found" }}\n'
            f"$bounds = $screens[{index}].Bounds"
        )
    else:
        bounds = (
            "$bounds = [System.Windows.Forms.SystemInformation]::VirtualScreen"
        )

    path = req.output.replace("'", "''")
    return (
        "$ErrorActionPreference = 'Stop'\n"
        "Add-Type -AssemblyName System.Windows.Forms\n"
        "Add-Type -AssemblyName System.Drawing\n"
        f"{bounds}\n"
        "$bmp = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height\n"
        "$g = [System.Drawing.Graphics]::FromImage($bmp)\n"
        "$g.CopyFromScreen($bounds.Location, "
        "[System.Drawing.Point]::Empty, $bounds.Size)\n"
        f"$bmp.Save('{path}', [System.Drawing.Imaging.ImageFormat]::Png)\n"
        "$g.Dispose()\n"
        "$bmp.Dispose()\n"
    )


def _powershell_builder(exe: str) -> Callable[[CaptureRequest], List[str]]:
    def build(req: CaptureRequest) -> List[str]:
        return [
            exe,
            "-NoProfile",
            "-NonInteractive",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            _windows_script(req),
        ]

    return build


def _build_grim(req: CaptureRequest) -> List[str]:
    argv = ["grim"]
    if req.region:
        argv += ["-g", f"{req.region.x},{req.region.y} {req.region.width}x{req.region.height}"]
    if req.display:
        argv += ["-o", req.display]
    argv.append(req.output)
    return argv


def _build_scrot(req: CaptureRequest) -> List[str]:
    argv = ["scrot", "-o"]
    if req.region:
        argv += ["-a", req.region.csv]
    argv.append(req.output)
    return argv


def _build_maim(req: CaptureRequest) -> List[str]:
    argv = ["maim"]
    if req.region:
        argv += ["-g", req.region.geometry]
    argv.append(req.output)
    return argv


def _build_import(req: CaptureRequest) -> List[str]:
    argv = ["import", "-window", "root"]
    if req.region:
        argv += ["-crop", req.region.geometry, "+repage"]
    argv.append(req.output)
    return argv


def _build_gnome_screenshot(req: CaptureRequest) -> List[str]:
    return ["gnome-screenshot", "-f", req.output]


def _build_spectacle(req: CaptureRequest) -> List[str]:
    argv = ["spectacle", "-b", "-n"]
    argv.append("-m" if req.monitor is not None else "-f")
    argv += ["-o", req.output]
    return argv


def _build_xfce4(req: CaptureRequest) -> List[str]:
    return ["xfce4-screenshooter", "-f", "-s", req.output]


def _build_flameshot(req: CaptureRequest) -> List[str]:
    return ["flameshot", "full", "-p", req.output]


def _build_grimshot(req: CaptureRequest) -> List[str]:
    return ["grimshot", "save", "screen", req.output]


# ---------------------------------------------------------------------------
# Registry (order matters: first available match wins)
# ---------------------------------------------------------------------------
_BACKENDS: Tuple[Backend, ...] = (
    Backend(
        name="screencapture",
        description="macOS built-in screencapture(1)",
        platforms=("darwin",),
        requires=("screencapture",),
        supports_region=True,
        supports_monitor=True,
        supports_display=True,
        build=_build_macos,
    ),
    Backend(
        name="powershell",
        description="Windows PowerShell + System.Drawing (built in)",
        platforms=("win32",),
        requires=("powershell",),
        supports_region=True,
        supports_monitor=True,
        build=_powershell_builder("powershell"),
    ),
    Backend(
        name="pwsh",
        description="PowerShell 7+ + System.Drawing",
        platforms=("win32",),
        requires=("pwsh",),
        supports_region=True,
        supports_monitor=True,
        build=_powershell_builder("pwsh"),
    ),
    Backend(
        name="grim",
        description="Wayland grim (wlroots compositors)",
        platforms=("linux",),
        session=("wayland",),
        requires=("grim",),
        supports_region=True,
        supports_display=True,
        build=_build_grim,
    ),
    Backend(
        name="grimshot",
        description="Wayland grimshot helper script",
        platforms=("linux",),
        session=("wayland",),
        requires=("grimshot",),
        build=_build_grimshot,
    ),
    Backend(
        name="scrot",
        description="X11 scrot",
        platforms=("linux",),
        session=("x11",),
        requires=("scrot",),
        supports_region=True,
        build=_build_scrot,
    ),
    Backend(
        name="maim",
        description="X11 maim",
        platforms=("linux",),
        session=("x11",),
        requires=("maim",),
        supports_region=True,
        build=_build_maim,
    ),
    Backend(
        name="import",
        description="ImageMagick import (X11)",
        platforms=("linux",),
        session=("x11",),
        requires=("import",),
        supports_region=True,
        build=_build_import,
    ),
    Backend(
        name="gnome-screenshot",
        description="GNOME gnome-screenshot",
        platforms=("linux",),
        requires=("gnome-screenshot",),
        build=_build_gnome_screenshot,
    ),
    Backend(
        name="spectacle",
        description="KDE Spectacle",
        platforms=("linux",),
        requires=("spectacle",),
        supports_monitor=True,
        build=_build_spectacle,
    ),
    Backend(
        name="xfce4-screenshooter",
        description="Xfce xfce4-screenshooter",
        platforms=("linux",),
        session=("x11",),
        requires=("xfce4-screenshooter",),
        build=_build_xfce4,
    ),
    Backend(
        name="flameshot",
        description="Flameshot",
        platforms=("linux",),
        requires=("flameshot",),
        build=_build_flameshot,
    ),
)


def all_backends() -> List[Backend]:
    """Every backend known to screenagents, regardless of availability."""
    return list(_BACKENDS)


def backend_by_name(name: str) -> Optional[Backend]:
    for backend in _BACKENDS:
        if backend.name == name:
            return backend
    return None


def available_backends() -> List[Backend]:
    """Backends that can actually run here, in preference order."""
    return [b for b in _BACKENDS if b.available()[0]]


def _check_capabilities(
    backend: Backend,
    region: Optional[Region],
    monitor: Optional[int],
    display: Optional[str],
) -> None:
    what = []
    if region is not None and not backend.supports_region:
        what.append("a region")
    if monitor is not None and not (backend.supports_monitor or backend.supports_display):
        what.append("a specific monitor")
    if display is not None and not backend.supports_display:
        what.append("a specific display")
    if what:
        raise BackendUnavailableError(
            f"backend {backend.name!r} cannot capture {' or '.join(what)}"
        )


def select(
    name: Optional[str] = None,
    *,
    region: Optional[Region] = None,
    monitor: Optional[int] = None,
    display: Optional[str] = None,
) -> Backend:
    """Pick a backend, honouring an explicit name or requested capabilities."""
    if name:
        backend = backend_by_name(name)
        if backend is None:
            known = ", ".join(b.name for b in _BACKENDS)
            raise NoBackendError(f"unknown backend {name!r} (known: {known})")
        ok, reason = backend.available()
        if not ok:
            raise BackendUnavailableError(
                f"backend {name!r} is unavailable: {reason}"
            )
        _check_capabilities(backend, region, monitor, display)
        return backend

    for backend in _BACKENDS:
        ok, _reason = backend.available()
        if not ok:
            continue
        try:
            _check_capabilities(backend, region, monitor, display)
        except BackendUnavailableError:
            continue
        return backend

    env = environment()
    raise NoBackendError(
        "no working screen-capture backend found. "
        f"platform={env['platform']}, session={env['session']}, "
        f"DISPLAY={env['DISPLAY']!r}, WAYLAND_DISPLAY={env['WAYLAND_DISPLAY']!r}. "
        "Install one of: grim (Wayland), scrot/maim (X11) or use a desktop "
        "that ships gnome-screenshot/spectacle. Run 'screenagents --doctor' "
        "for details."
    )
