"""Tests for the ``screenagents`` command line."""
from __future__ import annotations

import json
from pathlib import Path

from screenagents import cli
from screenagents.capture import Screenshot
from screenagents.errors import CaptureError


def fake_screenshot_factory(result, captured=None):
    def _fake_screenshot(path=None, **kwargs):
        if captured is not None:
            captured.append({"path": path, **kwargs})
        return result

    return _fake_screenshot


def _sample_result(tmp_path):
    return Screenshot(
        path=tmp_path / "shot.png",
        backend="scrot",
        format="png",
        bytes=1234,
        width=1920,
        height=1080,
    )


def test_prints_path_on_success(tmp_path, monkeypatch, capsys):
    monkeypatch.setattr(cli, "screenshot", fake_screenshot_factory(_sample_result(tmp_path)))
    rc = cli.main([])
    assert rc == 0
    assert capsys.readouterr().out.strip() == str(tmp_path / "shot.png")


def test_json_output(tmp_path, monkeypatch, capsys):
    monkeypatch.setattr(cli, "screenshot", fake_screenshot_factory(_sample_result(tmp_path)))
    rc = cli.main(["--json"])
    assert rc == 0
    payload = json.loads(capsys.readouterr().out)
    assert payload["backend"] == "scrot"
    assert payload["width"] == 1920 and payload["height"] == 1080


def test_arguments_are_forwarded(tmp_path, monkeypatch):
    captured = []
    monkeypatch.setattr(
        cli, "screenshot", fake_screenshot_factory(_sample_result(tmp_path), captured)
    )
    cli.main(["-r", "1,2,3,4", "-m", "2", "--display", "DP-1", "-b", "scrot", "--force"])
    call = captured[0]
    assert call["region"] == "1,2,3,4"
    assert call["monitor"] == 2
    assert call["display"] == "DP-1"
    assert call["backend"] == "scrot"
    assert call["overwrite"] is True


def test_capture_error_returns_one(monkeypatch, capsys):
    def boom(*args, **kwargs):
        raise CaptureError("kaboom")

    monkeypatch.setattr(cli, "screenshot", boom)
    rc = cli.main([])
    assert rc == 1
    assert "kaboom" in capsys.readouterr().err


def test_bad_region_returns_two(capsys):
    rc = cli.main(["--region", "garbage"])
    assert rc == 2
    assert "region must look like" in capsys.readouterr().err


def test_list_backends(capsys):
    rc = cli.main(["--list-backends"])
    assert rc == 0
    out = capsys.readouterr().out
    assert "screencapture" in out and "scrot" in out and "grim" in out


def test_doctor_reports_environment(capsys):
    rc = cli.main(["--doctor"])
    assert rc == 0
    out = capsys.readouterr().out
    assert "environment:" in out and "backends:" in out
