# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2026-10-18

First release.

### Added

- `screenshot()` Python API returning a `Screenshot` (path, backend, format, bytes,
  width, height, region), with support for regions (`x,y,w,h` and `WxH+X+Y`),
  1-based monitors, named displays, and forced backends.
- Twelve native backends, detected at runtime and session-aware:
  `screencapture` (macOS), `powershell` / `pwsh` (Windows), `grim`, `grimshot`,
  `scrot`, `maim`, `import`, `gnome-screenshot`, `spectacle`, `xfce4-screenshooter`
  and `flameshot` (Linux).
- `screenagents` CLI with `--region`, `--monitor`, `--display`, `--backend`,
  `--format`, `--force`, `--json`, `--list-backends`, `--doctor` and `--version`.
- Atomic capture writes and typed errors: `NoBackendError`,
  `BackendUnavailableError`, `CaptureError`.
- Optional MCP server (`screenagents-mcp`) exposing `capture_screenshot` and
  `list_screenshot_backends`, with base64 image payloads for multimodal agents.
- ASCII-art landing page in `site/` (React + Vite, light and dark themes).
- Test suite covering backends, capture pipeline, CLI and MCP surface, plus CI on
  Ubuntu, macOS and Windows across Python 3.9–3.12.

[0.1.0]: https://github.com/Parithosh-Varma/screenagents/releases/tag/v0.1.0
