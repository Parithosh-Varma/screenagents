"""The importable library API.

The public surface is intentionally tiny::

    from screenagents import screenshot

    shot = screenshot("desktop.png")
    print(shot.width, shot.height, shot.backend)

Captures are written to a hidden temp file next to the destination and then
atomically renamed into place, so a crashed or misbehaving backend never
leaves a half-written PNG behind.
"""
from __future__ import annotations

import os
import subprocess
import time
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Union

from . import backends
from .backends import Region
from .errors import (
    BackendUnavailableError,
    CaptureError,
    NoBackendError,
    ScreenAgentsError,
)

__all__ = [
    "Screenshot",
    "screenshot",
    "list_backends",
    "Region",
    "ScreenAgentsError",
    "NoBackendError",
    "BackendUnavailableError",
    "CaptureError",
]


@dataclass
class Screenshot:
    """Metadata about a captured image."""

    path: Path
    backend: str
    format: str
    bytes: int
    width: Optional[int] = None
    height: Optional[int] = None
    region: Optional[Region] = None

    def to_dict(self) -> dict:
        return {
            "path": str(self.path),
            "backend": self.backend,
            "format": self.format,
            "bytes": self.bytes,
            "width": self.width,
            "height": self.height,
            "region": self.region.csv if self.region else None,
        }


def default_filename(prefix: str = "screenshot", suffix: str = "png") -> str:
    stamp = time.strftime("%Y%m%d-%H%M%S")
    return f"{prefix}-{stamp}-{uuid.uuid4().hex[:6]}.{suffix}"


def _png_size(path: Path) -> tuple:
    try:
        with open(path, "rb") as handle:
            header = handle.read(24)
    except OSError:
        return None, None
    if len(header) < 24 or header[:8] != b"\x89PNG\r\n\x1a\n":
        return None, None
    width = int.from_bytes(header[16:20], "big")
    height = int.from_bytes(header[20:24], "big")
    return width, height


def _image_size(path: Path, fmt: str) -> tuple:
    if fmt == "png":
        return _png_size(path)
    return None, None


def list_backends() -> list:
    """Structured view of every known backend for CLI/MCP consumers."""
    return [backend.to_dict() for backend in backends.all_backends()]


def screenshot(
    path: Union[str, os.PathLike, None] = None,
    *,
    region: Union[str, Region, None] = None,
    monitor: Optional[int] = None,
    display: Union[str, int, None] = None,
    backend: Optional[str] = None,
    fmt: str = "png",
    overwrite: bool = False,
) -> Screenshot:
    """Capture the screen (or a portion of it) to ``path``.

    ``region`` accepts ``"x,y,width,height"`` or ``"WxH+X+Y"``. ``monitor`` is
    1-based (1 == primary). ``display`` is passed through to backends that can
    address a named display/output. If ``path`` is omitted a timestamped file
    is created in the current directory.
    """
    fmt = (fmt or "png").lstrip(".").lower()
    region_obj = Region.parse(region) if region is not None else None
    display_str = str(display) if display is not None else None

    chosen = backends.select(
        backend, region=region_obj, monitor=monitor, display=display_str
    )

    destination = Path(path) if path is not None else Path(default_filename(suffix=fmt))
    destination = destination.expanduser()
    if not destination.suffix:
        destination = destination.with_suffix("." + fmt)

    if destination.exists() and not overwrite:
        raise CaptureError(
            f"{destination} already exists (pass overwrite=True to replace it)"
        )

    try:
        destination.parent.mkdir(parents=True, exist_ok=True)
    except OSError as exc:
        raise CaptureError(f"cannot create {destination.parent}: {exc}") from exc

    # No leading dot: macOS screencapture(1) refuses to write to a hidden path.
    temp = destination.parent / (
        f"screenagents-tmp-{uuid.uuid4().hex}.{fmt}"
    )
    request = backends.CaptureRequest(
        output=str(temp),
        region=region_obj,
        monitor=monitor,
        display=display_str,
    )
    argv = chosen.build(request) if chosen.build else None
    if not argv:
        raise BackendUnavailableError(f"backend {chosen.name!r} has no build step")

    try:
        proc = subprocess.run(argv, capture_output=True, text=True)
    except FileNotFoundError as exc:
        raise BackendUnavailableError(
            f"backend {chosen.name!r} could not be launched: {exc}"
        ) from exc
    except OSError as exc:
        raise CaptureError(f"failed to run {chosen.name!r}: {exc}") from exc

    if proc.returncode != 0 or not temp.exists():
        detail = (proc.stderr or proc.stdout or "").strip()
        _cleanup(temp)
        raise CaptureError(
            f"backend {chosen.name!r} failed (exit {proc.returncode})"
            + (f": {detail}" if detail else "")
        )

    try:
        os.replace(temp, destination)
    except OSError as exc:
        _cleanup(temp)
        raise CaptureError(f"cannot write {destination}: {exc}") from exc

    width, height = _image_size(destination, fmt)
    return Screenshot(
        path=destination,
        backend=chosen.name,
        format=fmt,
        bytes=destination.stat().st_size,
        width=width,
        height=height,
        region=region_obj,
    )


def _cleanup(path: Path) -> None:
    try:
        path.unlink()
    except OSError:
        pass
