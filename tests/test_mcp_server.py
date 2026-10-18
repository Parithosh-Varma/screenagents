"""Tests for the optional MCP server surface.

Skipped when the ``mcp`` package is not installed (the core does not depend
on it).
"""
from __future__ import annotations

import asyncio

import pytest

pytest.importorskip("mcp")

from screenagents import mcp_server  # noqa: E402
from screenagents.capture import Screenshot  # noqa: E402


def tools_by_name() -> dict:
    assert mcp_server.mcp is not None
    return {t.name: t for t in mcp_server.mcp._tool_manager.list_tools()}


def call(name: str, arguments: dict):
    return asyncio.run(mcp_server.mcp._tool_manager.call_tool(name, arguments))


def test_tools_are_registered():
    tools = tools_by_name()
    assert "capture_screenshot" in tools
    assert "list_screenshot_backends" in tools


def test_capture_screenshot_returns_metadata_and_image(tmp_path, monkeypatch):
    payload = b"\x89PNG\r\n\x1a\n" + b"\x00" * 40
    out = tmp_path / "shot.png"
    out.write_bytes(payload)

    def fake_screenshot(path=None, **kwargs):
        return Screenshot(path=out, backend="fake", format="png", bytes=len(payload))

    monkeypatch.setattr(mcp_server, "screenshot", fake_screenshot)

    result = call("capture_screenshot", {"path": str(out)})
    assert result["ok"] is True
    assert result["backend"] == "fake"
    assert result["mime_type"] == "image/png"
    assert result["image_base64"]


def test_capture_screenshot_reports_errors(monkeypatch):
    def boom(*args, **kwargs):
        raise RuntimeError("nope")

    monkeypatch.setattr(mcp_server, "screenshot", boom)
    result = call("capture_screenshot", {})
    assert result["ok"] is False
    assert "nope" in result["error"]


def test_list_backends_reports_environment():
    result = call("list_screenshot_backends", {})
    assert result["ok"] is True
    assert any(b["name"] == "screencapture" for b in result["backends"])
    assert "platform" in result["environment"]
