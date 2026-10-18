"""Optional MCP server so agents can grab screenshots.

Requires the ``mcp`` package::

    pip install "screenagents[mcp]"

Run over stdio with ``screenagents-mcp`` (or ``python -m screenagents.mcp_server``).
"""
from __future__ import annotations

import base64
import sys
from typing import Optional

from . import __version__, backends
from .capture import list_backends, screenshot
from .errors import ScreenAgentsError

try:  # keep the core library dependency-free
    from mcp.server.fastmcp import FastMCP
except ImportError:  # pragma: no cover - exercised without the extra installed
    FastMCP = None  # type: ignore

_INSTRUCTIONS = (
    "Capture the local screen with the OS's own screenshot tool. Use "
    "capture_screenshot to save a PNG (optionally a region or monitor) and "
    "list_screenshot_backends to see what is available on this machine. "
    "capture_screenshot also returns the image as base64 so callers can view it."
)

mcp = None
if FastMCP is not None:
    mcp = FastMCP("screenagents", instructions=_INSTRUCTIONS)

    @mcp.tool()
    def capture_screenshot(
        path: str = "",
        region: str = "",
        monitor: int = 0,
        display: str = "",
        backend: str = "",
        overwrite: bool = False,
        include_image: bool = True,
    ) -> dict:
        """Take a screenshot and return its metadata.

        Args:
            path: Where to save it. Empty -> timestamped PNG in the CWD.
            region: ``x,y,width,height`` or ``WxH+X+Y``; empty -> full screen.
            monitor: 1-based monitor index (0 -> default/all).
            display: Named display/output where supported.
            backend: Force a specific backend; empty -> auto-detect.
            overwrite: Replace an existing file.
            include_image: Also return the PNG as base64 (``image_base64``).
        """
        try:
            shot = screenshot(
                path or None,
                region=region or None,
                monitor=monitor or None,
                display=display or None,
                backend=backend or None,
                overwrite=overwrite,
            )
        except (ScreenAgentsError, ValueError) as exc:
            return {"ok": False, "error": str(exc)}
        except Exception as exc:  # tool boundary: never crash the server
            return {"ok": False, "error": f"{type(exc).__name__}: {exc}"}

        result = {"ok": True, **shot.to_dict()}
        if include_image:
            try:
                result["image_base64"] = base64.b64encode(
                    shot.path.read_bytes()
                ).decode("ascii")
                result["mime_type"] = "image/png" if shot.format == "png" else ""
            except OSError as exc:  # pragma: no cover - rare race
                result["image_error"] = str(exc)
        return result

    @mcp.tool()
    def list_screenshot_backends() -> dict:
        """List every known screenshot backend and whether it can run here."""
        return {"ok": True, "environment": backends.environment(),
                "backends": list_backends()}


def main() -> int:
    if mcp is None:
        print(
            "screenagents: the MCP server needs the 'mcp' package. "
            'Install it with: pip install "screenagents[mcp]"',
            file=sys.stderr,
        )
        return 1
    mcp.run()
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
