"""Unit tests for backend detection and command construction.

These run on any OS because they monkeypatch ``sys.platform``, ``shutil.which``
and the display-server environment variables.
"""
from __future__ import annotations

import pytest

from screenagents import backends
from screenagents.backends import CaptureRequest, Region


# ---------------------------------------------------------------------------
# Region parsing
# ---------------------------------------------------------------------------
def test_region_from_csv():
    region = Region.parse("10,20,300,400")
    assert (region.x, region.y, region.width, region.height) == (10, 20, 300, 400)


def test_region_from_x11_geometry():
    region = Region.parse("1920x1080+100+50")
    assert (region.x, region.y, region.width, region.height) == (100, 50, 1920, 1080)


def test_region_from_negative_x11_geometry():
    region = Region.parse("800x600-10-20")
    assert (region.x, region.y) == (-10, -20)


def test_region_from_width_height_only():
    region = Region.parse("640x480")
    assert (region.x, region.y, region.width, region.height) == (0, 0, 640, 480)


def test_region_from_sequence_and_roundtrip():
    region = Region.parse((1, 2, 3, 4))
    assert region.csv == "1,2,3,4"
    assert region.geometry == "3x4+1+2"


@pytest.mark.parametrize("bad", ["", "nope", "1,2,3", "0x0", "100,200,0,50"])
def test_region_rejects_bad_input(bad):
    with pytest.raises(ValueError):
        Region.parse(bad)


def test_region_rejects_zero_size():
    with pytest.raises(ValueError):
        Region(x=0, y=0, width=0, height=10)


# ---------------------------------------------------------------------------
# Command builders
# ---------------------------------------------------------------------------
def test_macos_full_screen_command():
    backend = backends.backend_by_name("screencapture")
    argv = backend.build(CaptureRequest(output="/tmp/a.png"))
    assert argv == ["screencapture", "-x", "-t", "png", "/tmp/a.png"]


def test_macos_region_and_display_command():
    backend = backends.backend_by_name("screencapture")
    argv = backend.build(
        CaptureRequest(output="/tmp/a.png", region=Region(1, 2, 3, 4), display="2")
    )
    assert "-R" in argv and argv[argv.index("-R") + 1] == "1,2,3,4"
    assert "-D" in argv and argv[argv.index("-D") + 1] == "2"


def test_linux_scrot_region_command():
    argv = backends.backend_by_name("scrot").build(
        CaptureRequest(output="/tmp/a.png", region=Region(5, 6, 7, 8))
    )
    assert argv == ["scrot", "-o", "-a", "5,6,7,8", "/tmp/a.png"]


def test_linux_grim_command_uses_output_name():
    argv = backends.backend_by_name("grim").build(
        CaptureRequest(output="/tmp/a.png", display="DP-1")
    )
    assert argv == ["grim", "-o", "DP-1", "/tmp/a.png"]


def test_windows_region_script_embedded():
    argv = backends.backend_by_name("powershell").build(
        CaptureRequest(output=r"C:\tmp\a.png", region=Region(1, 2, 30, 40))
    )
    script = argv[-1]
    assert "System.Drawing.Rectangle 1,2,30,40" in script
    assert r"$bmp.Save('C:\tmp\a.png'" in script


def test_windows_monitor_script_is_zero_indexed():
    argv = backends.backend_by_name("powershell").build(
        CaptureRequest(output=r"C:\a.png", monitor=2)
    )
    assert "$screens[1].Bounds" in argv[-1]


def test_windows_path_quotes_are_escaped():
    argv = backends.backend_by_name("powershell").build(
        CaptureRequest(output=r"C:\it's\a.png")
    )
    assert "C:\\it''s\\a.png" in argv[-1]


# ---------------------------------------------------------------------------
# Availability
# ---------------------------------------------------------------------------
@pytest.fixture
def linux_x11(monkeypatch):
    monkeypatch.setattr(backends.sys, "platform", "linux")
    monkeypatch.setenv("DISPLAY", ":0")
    monkeypatch.delenv("WAYLAND_DISPLAY", raising=False)
    monkeypatch.delenv("XDG_SESSION_TYPE", raising=False)
    return monkeypatch


def test_session_detection(linux_x11):
    assert backends.current_session() == "x11"
    linux_x11.setenv("WAYLAND_DISPLAY", "wayland-0")
    assert backends.current_session() == "wayland"


def test_x11_backend_available_when_tool_present(linux_x11):
    linux_x11.setattr(
        backends.shutil, "which",
        lambda exe: "/usr/bin/scrot" if exe == "scrot" else None,
    )
    ok, reason = backends.backend_by_name("scrot").available()
    assert ok and reason == "ready"


def test_wayland_backend_unavailable_on_x11(linux_x11):
    linux_x11.setattr(
        backends.shutil, "which",
        lambda exe: f"/usr/bin/{exe}" if exe == "grim" else None,
    )
    ok, reason = backends.backend_by_name("grim").available()
    assert not ok
    assert "wayland" in reason


def test_linux_backend_unavailable_without_session(linux_x11):
    linux_x11.setattr(
        backends.shutil, "which",
        lambda exe: f"/usr/bin/{exe}" if exe == "scrot" else None,
    )
    linux_x11.delenv("DISPLAY")
    ok, reason = backends.backend_by_name("scrot").available()
    assert not ok
    assert "no X11 or Wayland session" in reason


def test_backend_reports_wrong_platform(monkeypatch):
    monkeypatch.setattr(backends.sys, "platform", "linux")
    ok, reason = backends.backend_by_name("screencapture").available()
    assert not ok and "not supported" in reason


# ---------------------------------------------------------------------------
# Selection
# ---------------------------------------------------------------------------
def test_select_prefers_region_capable_backend(linux_x11):
    linux_x11.setattr(
        backends.shutil, "which",
        lambda exe: f"/usr/bin/{exe}" if exe in ("gnome-screenshot", "scrot") else None,
    )
    backend = backends.select(region=Region(0, 0, 10, 10))
    assert backend.name == "scrot"


def test_select_falls_back_to_generic_when_no_region_needed(linux_x11):
    linux_x11.setattr(
        backends.shutil, "which",
        lambda exe: f"/usr/bin/{exe}" if exe == "gnome-screenshot" else None,
    )
    assert backends.select().name == "gnome-screenshot"


def test_select_unknown_name_raises():
    with pytest.raises(backends.NoBackendError):
        backends.select("does-not-exist")


def test_explicit_backend_without_region_support_raises(linux_x11):
    linux_x11.setattr(
        backends.shutil, "which",
        lambda exe: f"/usr/bin/{exe}" if exe == "gnome-screenshot" else None,
    )
    with pytest.raises(backends.BackendUnavailableError):
        backends.select("gnome-screenshot", region=Region(0, 0, 5, 5))


def test_autoselect_skips_backend_without_region_support(linux_x11):
    linux_x11.setattr(
        backends.shutil, "which",
        lambda exe: f"/usr/bin/{exe}" if exe == "gnome-screenshot" else None,
    )
    with pytest.raises(backends.NoBackendError):
        backends.select(region=Region(0, 0, 5, 5))


def test_select_reports_clean_error_when_nothing_available(linux_x11):
    linux_x11.setattr(backends.shutil, "which", lambda exe: None)
    with pytest.raises(backends.NoBackendError) as excinfo:
        backends.select()
    assert "no working screen-capture backend" in str(excinfo.value)
