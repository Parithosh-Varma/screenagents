"""Tests for the capture pipeline (subprocess mocked, no real display)."""
from __future__ import annotations

import struct
from pathlib import Path

import pytest

from screenagents import backends
from screenagents.backends import Backend
from screenagents.capture import screenshot
from screenagents.errors import CaptureError, NoBackendError


def png_bytes(width: int, height: int) -> bytes:
    signature = b"\x89PNG\r\n\x1a\n"
    ihdr = b"IHDR" + struct.pack(">II", width, height)
    return signature + struct.pack(">I", 13) + ihdr


class FakeProc:
    def __init__(self, returncode=0, stdout="", stderr=""):
        self.returncode = returncode
        self.stdout = stdout
        self.stderr = stderr


def install_run(monkeypatch, *, returncode=0, payload=b"", stderr=""):
    """Fake subprocess.run that optionally writes bytes to the target path."""
    calls = []

    def run(argv, **kwargs):
        calls.append(list(argv))
        if returncode == 0 and payload:
            Path(argv[-1]).write_bytes(payload)
        return FakeProc(returncode=returncode, stderr=stderr)

    monkeypatch.setattr("subprocess.run", run)
    return calls


@pytest.fixture
def fake_backend(monkeypatch):
    """Force capture() to use a deterministic in-process backend."""
    seen = []

    def build(req):
        seen.append(req)
        return ["fake-capture", req.output]

    backend = Backend(
        name="fake",
        description="test backend",
        platforms=("linux",),
        supports_region=True,
        build=build,
    )
    monkeypatch.setattr(backends, "select", lambda name=None, **kw: backend)
    return backend, seen


def test_screenshot_writes_file_and_reports_size(tmp_path, fake_backend, monkeypatch):
    install_run(monkeypatch, payload=png_bytes(120, 80))
    dest = tmp_path / "shot.png"

    shot = screenshot(str(dest))

    assert dest.exists()
    assert shot.width == 120 and shot.height == 80
    assert shot.format == "png" and shot.backend == "fake"
    assert shot.bytes == len(png_bytes(120, 80))
    assert shot.to_dict()["path"] == str(dest)


def test_region_is_forwarded_to_backend(tmp_path, fake_backend, monkeypatch):
    _backend, seen = fake_backend
    install_run(monkeypatch, payload=png_bytes(10, 10))

    screenshot(str(tmp_path / "r.png"), region="5,6,7,8")

    assert seen[0].region is not None
    assert seen[0].region.csv == "5,6,7,8"


def test_default_path_lands_in_cwd(tmp_path, fake_backend, monkeypatch):
    install_run(monkeypatch, payload=png_bytes(4, 4))
    monkeypatch.chdir(tmp_path)

    shot = screenshot()

    assert shot.path.resolve().parent == tmp_path.resolve()
    assert shot.path.suffix == ".png"
    assert shot.path.exists()


def test_existing_file_is_not_clobbered(tmp_path, fake_backend, monkeypatch):
    install_run(monkeypatch, payload=png_bytes(4, 4))
    dest = tmp_path / "shot.png"
    dest.write_bytes(b"keep me")

    with pytest.raises(CaptureError):
        screenshot(str(dest))

    assert dest.read_bytes() == b"keep me"


def test_overwrite_allowed_when_requested(tmp_path, fake_backend, monkeypatch):
    install_run(monkeypatch, payload=png_bytes(4, 4))
    dest = tmp_path / "shot.png"
    dest.write_bytes(b"old")

    screenshot(str(dest), overwrite=True)

    assert dest.read_bytes() == png_bytes(4, 4)


def test_backend_failure_raises_and_cleans_up(tmp_path, fake_backend, monkeypatch):
    install_run(monkeypatch, returncode=1, stderr="boom", payload=b"")
    dest = tmp_path / "shot.png"

    with pytest.raises(CaptureError) as excinfo:
        screenshot(str(dest))

    assert "boom" in str(excinfo.value)
    assert not dest.exists()
    assert list(tmp_path.glob("screenagents-tmp-*")) == []


def test_missing_output_file_is_treated_as_failure(tmp_path, fake_backend, monkeypatch):
    install_run(monkeypatch, returncode=0, payload=b"")
    with pytest.raises(CaptureError):
        screenshot(str(tmp_path / "shot.png"))


def test_invalid_region_raises_value_error(tmp_path):
    with pytest.raises(ValueError):
        screenshot(str(tmp_path / "shot.png"), region="garbage")


def test_no_backend_surfaces_clean_error(monkeypatch, tmp_path):
    def boom(*args, **kwargs):
        raise NoBackendError("nothing here")

    monkeypatch.setattr(backends, "select", boom)

    with pytest.raises(NoBackendError):
        screenshot(str(tmp_path / "shot.png"))


def test_real_capture_when_a_backend_exists(tmp_path):
    if not backends.available_backends():
        pytest.skip("no screen-capture backend available in this environment")
    shot = screenshot(str(tmp_path / "real.png"), overwrite=True)
    assert shot.path.exists() and shot.bytes > 0
