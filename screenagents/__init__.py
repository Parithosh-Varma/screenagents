"""screenagents: cross-platform screen capture for humans and agents.

No Playwright, no browser, no heavy dependencies. Just the screenshot tool
your operating system already has.
"""
from __future__ import annotations

from .backends import Region, available_backends, environment
from .capture import Screenshot, list_backends, screenshot
from .errors import (
    BackendUnavailableError,
    CaptureError,
    NoBackendError,
    ScreenAgentsError,
)

__version__ = "0.1.0"

__all__ = [
    "__version__",
    "screenshot",
    "Screenshot",
    "list_backends",
    "available_backends",
    "environment",
    "Region",
    "ScreenAgentsError",
    "NoBackendError",
    "BackendUnavailableError",
    "CaptureError",
]
