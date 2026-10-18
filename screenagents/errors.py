"""Exception hierarchy for screenagents.

Every failure a caller can reasonably hit is expressed as one of these so the
CLI and MCP layers can render a clean message instead of a raw traceback.
"""
from __future__ import annotations


class ScreenAgentsError(Exception):
    """Base class for every error raised by screenagents."""


class NoBackendError(ScreenAgentsError):
    """No usable native screen-capture backend exists on this machine."""


class BackendUnavailableError(ScreenAgentsError):
    """A backend was named or selected but cannot run here."""


class CaptureError(ScreenAgentsError):
    """A backend ran but the capture itself failed."""
