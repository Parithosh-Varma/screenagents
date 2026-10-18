<div align="center">
<pre>
███████╗ ██████╗██████╗ ███████╗███████╗███╗   ██╗ █████╗  ██████╗ ███████╗███╗   ██╗████████╗███████╗
██╔════╝██╔════╝██╔══██╗██╔════╝██╔════╝████╗  ██║██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝██╔════╝
███████╗██║     ██████╔╝█████╗  █████╗  ██╔██╗ ██║███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║   ███████╗
╚════██║██║     ██╔══██╗██╔══╝  ██╔══╝  ██║╚██╗██║██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║   ╚════██║
███████║╚██████╗██║  ██║███████╗███████╗██║ ╚████║██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║   ███████║
╚══════╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚══════╝╚═╝  ╚═══╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝
</pre>

**Screenshot anything, instantly — no Playwright, no browser, no heavy dependencies.**

<p>
  <a href="https://github.com/Parithosh-Varma/screenagents/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/Parithosh-Varma/screenagents/actions/workflows/ci.yml/badge.svg"></a>
  <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-e0a458?style=flat-square&labelColor=0b0b0c">
  <img alt="Python 3.9+" src="https://img.shields.io/badge/python-3.9%2B-e0a458?style=flat-square&labelColor=0b0b0c">
  <img alt="Zero dependencies" src="https://img.shields.io/badge/dependencies-0-8fc07a?style=flat-square&labelColor=0b0b0c">
  <img alt="Platforms" src="https://img.shields.io/badge/platforms-macOS%20%7C%20Windows%20%7C%20Linux-e0a458?style=flat-square&labelColor=0b0b0c">
  <img alt="MCP ready" src="https://img.shields.io/badge/MCP-ready-e0a458?style=flat-square&labelColor=0b0b0c">
</p>

**CLI · Python library · MCP server** — one tiny package.

[Install](#install) · [Quick start](#quick-start) · [Backends](#backends) · [Python API](#python-library) · [MCP server](#mcp-server) · [Troubleshooting](#troubleshooting) · [Landing page](https://github.com/Parithosh-Varma/screenagents/tree/main/site)

</div>

---

`screenagents` is a small, dependency-free Python package that takes screenshots by
delegating to the screenshot tool your operating system already ships with. It
wraps twelve native backends — `screencapture` on macOS, PowerShell +
`System.Drawing` on Windows, `grim`/`scrot`/`maim`/ImageMagick and friends on Linux —
behind one honest API, one sane CLI, and one MCP tool for agents.

It does not render web pages, boot Chromium, or install a browser engine to take a
picture of your desktop.

```console
$ pip install screenagents
$ screenagents
screenshot-20261018-1832-a1b2c3.png
```

## Why

Every OS already knows how to screenshot itself. Most automation stacks ignore that
and drag in a headless browser — hundreds of megabytes of runtime to copy pixels
that are sitting right there.

| | screenagents | headless browser tooling |
| --- | --- | --- |
| Captures the actual desktop | ✅ native API/CLI | ❌ renders a page instead |
| Third-party dependencies | **0** | dozens |
| Install size | ~40 KB | 300 MB+ |
| Works on Wayland / X11 / Aqua / Win32 | ✅ | limited |
| Region and monitor targeting | ✅ flags | ✅ (of the page, not the screen) |
| Usable by an LLM agent | ✅ MCP tool, base64 image | varies |

If you need to screenshot a *web page*, use Playwright. If you need a picture of the
*screen*, this is the tool.

## Features

- **Zero dependencies.** Core is Python stdlib only (`subprocess`, `os`, `struct`).
- **Twelve native backends.** Detected at runtime, ordered best-first, session-aware
  (Wayland vs X11), with capability checks for region / monitor / named output.
- **Honest failures.** Typed exceptions with the backend's own stderr, plus a
  `--doctor` command that explains exactly why each backend is or is not available.
- **Atomic writes.** Captures land in a hidden temp file and are renamed into place
  only on success — a failed capture never leaves a half-written PNG or clobbers an
  existing file.
- **Metadata included.** Dimensions parsed from the PNG header, byte size, region and
  backend recorded on every result.
- **Agent-ready.** Optional MCP server returning the PNG as base64 so multimodal
  models can actually look at the screen.
- **Trivially embeddable.** `screenshot()` is one function; the CLI is one file.

## Install

```bash
pip install screenagents            # core: CLI + library
pip install "screenagents[mcp]"     # + MCP server for agents
```

Requires Python 3.9+. macOS and Windows need nothing else. On Linux, install one of
the backends below — most desktop environments already have one.

## Quick start

```console
$ screenagents                          # full screen, timestamped file in cwd
$ screenagents ~/Desktop/shot.png       # choose the path
$ screenagents -r 0,0,800,600           # x,y,width,height
$ screenagents -r 1920x1080+1920+0      # X11 geometry notation
$ screenagents -m 2                     # second monitor (where supported)
$ screenagents -b grim --display DP-1   # force a backend and output
$ screenagents --json                   # machine-readable metadata
$ screenagents --list-backends          # what can run here, and why not
$ screenagents --doctor                 # environment + full diagnostics
```

`--json` output:

```json
{
  "path": "screenshot-20261018-1832-a1b2c3.png",
  "backend": "grim",
  "format": "png",
  "bytes": 88214,
  "width": 1024,
  "height": 640,
  "region": "0,0,1024,640"
}
```

Exit codes: `0` success, `1` capture/backend failure, `2` bad arguments. Only the path
(or JSON) goes to stdout, so `$(screenagents)` is safe in scripts.

## Backends

| Backend | Platform | Session | Region | Monitor | Named output |
| --- | --- | --- | --- | --- | --- |
| `screencapture` | macOS | any | ✅ | ✅ | ✅ |
| `powershell` / `pwsh` | Windows | any | ✅ | ✅ | — |
| `grim` | Linux | Wayland | ✅ | — | ✅ |
| `grimshot` | Linux | Wayland | — | — | — |
| `scrot` | Linux | X11 | ✅ | — | — |
| `maim` | Linux | X11 | ✅ | — | — |
| `import` (ImageMagick) | Linux | X11 | ✅ | — | — |
| `gnome-screenshot` | Linux | any | — | — | — |
| `spectacle` | Linux | any | — | ✅ | — |
| `xfce4-screenshooter` | Linux | X11 | — | — | — |
| `flameshot` | Linux | any | — | — | — |

Selection rules, in order: platform matches → session matches (Linux) → binary exists
on `PATH` → requested capabilities are supported → first match wins. Passing
`--backend NAME` skips the search but still validates availability.

Install a Linux backend:

```bash
sudo apt install grim       # Wayland (Debian/Ubuntu)
sudo apt install scrot      # X11 (Debian/Ubuntu)
sudo dnf install grim       # Fedora
sudo pacman -S grim         # Arch
```

## Python library

```python
from screenagents import screenshot, Region

shot = screenshot("desktop.png")                       # full screen
shot = screenshot("corner.png", region="0,0,640,480")  # x,y,width,height
shot = screenshot("right.png", region="1920x1080+1920+0", overwrite=True)
shot = screenshot("second.png", monitor=2)             # 1-based

print(shot.width, shot.height, shot.backend, shot.bytes)
print(shot.to_dict())
```

`Screenshot` carries `path`, `backend`, `format`, `bytes`, `width`, `height` and
`region`. Errors are typed — catch `ScreenAgentsError`, or one of
`NoBackendError`, `BackendUnavailableError`, `CaptureError` — and always include the
backend's stderr when there is one.

## MCP server

```bash
pip install "screenagents[mcp]"
screenagents-mcp     # stdio transport
```

| Tool | Arguments | Returns |
| --- | --- | --- |
| `capture_screenshot` | `path`, `region`, `monitor`, `display`, `backend`, `overwrite`, `include_image` | `ok`, `path`, `width`, `height`, `bytes`, `backend`, `image_base64`, `mime_type` |
| `list_screenshot_backends` | — | `ok`, `environment`, `backends[]` |

Claude Desktop / Cursor / any MCP client:

```json
{
  "mcpServers": {
    "screenagents": {
      "command": "screenagents-mcp"
    }
  }
}
```

Errors come back as `{"ok": false, "error": "…"}` instead of raising, so an agent can
read the reason and pick another backend.

## How it works

```
   cli · library · mcp
           │
           ▼
      capture.py ─────── atomic temp file, size from the png header
           │
           │  CaptureRequest(region, monitor, display)
           ▼
      backends.py ────── platform + session detection, best-first order
           │
           │  argv
           ▼
      the OS tool ────── screencapture · powershell · grim · scrot · maim
                         import · gnome-screenshot · spectacle · flameshot
```

No server, no port, no daemon. The only permission involved is the screen-recording
permission your OS already enforces.

## Troubleshooting

**"no working screen-capture backend found"** — run `screenagents --doctor`. On
Linux it prints your session (`x11`/`wayland`) and what to install. On Wayland,
`grim` is the usual answer; on X11, `scrot`.

**macOS captures a black image or nothing** — grant Screen Recording permission to
your terminal in System Settings → Privacy & Security → Screen Recording, then
restart the terminal.

**A region flag is rejected** — the auto-selected backend cannot crop. Let detection
pick a region-capable one (drop `--backend`), or use a backend marked ✅ above.

**PNG is fine but dimensions are `null`** — dimensions are read from the PNG header;
non-PNG output still works, it just has no size metadata.

## Landing page

The `site/` directory holds the project's ASCII-art landing page (React + Vite,
light and dark themes, one page per topic).

```bash
cd site
npm install
npm run dev       # local development
npm run build     # static build in site/dist
```

## Development

```bash
git clone https://github.com/Parithosh-Varma/screenagents
cd screenagents
python -m venv .venv && . .venv/bin/activate
pip install -e ".[dev,mcp]"
pytest -q
```

The test suite runs on any OS: backend detection and command construction are tested
with `sys.platform`, `shutil.which` and the session environment patched, and the
capture pipeline is exercised with a fake backend. A real capture test runs when a
backend is available and skips otherwise — which is why CI is green on headless
runners.

See [CONTRIBUTING.md](CONTRIBUTING.md) to add a backend.

## Contributing

Issues and pull requests are welcome. Please run `pytest -q` before opening a PR and
include `screenagents --doctor` output in backend-related bug reports.

## License

[MIT](LICENSE) © 2026 Parithosh Varma
