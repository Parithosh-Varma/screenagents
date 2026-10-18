# screenagents

**Screenshot your screen the way your computer already knows how.**
No Playwright. No headless browser. No 300 MB of Chromium. No "install these
six system libraries first."

`screenagents` is a tiny, dependency-free Python package that shells out to the
native screenshot tool of the operating system it runs on, wrapped in a clean
CLI, an importable library, and an optional MCP server so AI agents can see
your screen.

```bash
pip install screenagents
screenagents                    # -> screenshot-20261018-183200-a1b2c3.png
screenagents -r 0,0,800,600     # just the top-left 800x600
screenagents check.png --json   # machine-readable metadata
```

## Why

Most "screenshot a page" tooling drags in a browser engine. That's fine if you
need to render a web page, and completely absurd if you just want a picture of
the screen you're already looking at. Every OS ships this:

| Platform | Backend used |
| --- | --- |
| macOS | `screencapture` (built in) |
| Windows | PowerShell + `System.Drawing` (built in) |
| Linux / Wayland | `grim`, `grimshot`, `gnome-screenshot`, `spectacle`, `flameshot` |
| Linux / X11 | `scrot`, `maim`, ImageMagick `import`, `gnome-screenshot`, `xfce4-screenshooter`, `spectacle`, `flameshot` |

`screenagents` finds one of these, builds the right command, and gets out of
your way. The core has **zero** third-party dependencies — it's all stdlib.

## Install

```bash
pip install screenagents            # core CLI + library
pip install "screenagents[mcp]"     # + MCP server for agents
```

Need a Linux backend? Install whichever suits your desktop:

```bash
# Wayland (sway, hyprland, ...)
sudo apt install grim
# X11
sudo apt install scrot        # or: maim, imagemagick
# GNOME / KDE / Xfce already ship their own
```

Run `screenagents --doctor` to see exactly what it found and why anything else
is unavailable.

## CLI

```
screenagents [path] [options]

  -r, --region WxH+X+Y | x,y,w,h   capture a sub-area
  -m, --monitor N                  1-based monitor (1 = primary)
      --display NAME               named output where supported (e.g. grim)
  -b, --backend NAME               force a backend (see --list-backends)
  -f, --format png                 image format / extension
      --force                      overwrite an existing file
      --json                       print capture metadata as JSON
      --list-backends              show every backend and its availability
      --doctor                     print environment + backend diagnostics
```

```bash
$ screenagents --list-backends
ok  screencapture  macOS built-in screencapture(1)
--  grim           Wayland grim (wlroots compositors)  (no X11 or Wayland session detected ...)
ok  scrot          X11 scrot
```

```bash
$ screenagents -r 100,100,400,300 --json
{
  "path": "screenshot-20261018-183200-a1b2c3.png",
  "backend": "scrot",
  "format": "png",
  "bytes": 24510,
  "width": 400,
  "height": 300,
  "region": "100,100,400,300"
}
```

## Library

```python
from screenagents import screenshot, Region

shot = screenshot("desktop.png")                       # full screen
shot = screenshot("corner.png", region="0,0,640,480")  # x,y,w,h
shot = screenshot("right.png", region="1920x1080+1920+0", overwrite=True)
shot = screenshot("second.png", monitor=2)             # where supported

print(shot.width, shot.height, shot.backend, shot.bytes)
```

`screenshot()` raises a subclass of `ScreenAgentsError` (`NoBackendError`,
`BackendUnavailableError`, `CaptureError`) so callers never get a raw traceback
for a missing tool. Captures are written to a hidden temp file and atomically
renamed into place — a failed capture never leaves a half-written image behind.

## MCP server (for agents)

`screenagents` ships an MCP server over stdio:

```bash
pip install "screenagents[mcp]"
screenagents-mcp
```

Tools exposed:

- **`capture_screenshot`** — capture the screen (optional `region`, `monitor`,
  `display`, `backend`). Returns path, dimensions, byte size, and the PNG as
  base64 so multimodal agents can *see* the result.
- **`list_screenshot_backends`** — environment plus every backend's
  availability, so an agent can decide before it captures.

Claude Desktop / Cursor / any MCP client config:

```json
{
  "mcpServers": {
    "screenagents": { "command": "screenagents-mcp" }
  }
}
```

## How it works

```
CLI / MCP / your code
        │
        ▼
   capture.py   ── atomic temp file, PNG size parsing, typed errors
        │
        ▼
  backends.py   ── detect platform + session, pick the first usable native tool
        │
        ▼
 screencapture │ powershell │ grim │ scrot │ maim │ import │ ...
```

There is no server, no port, no permission dance beyond what your OS already
requires for screen recording.

## Development

```bash
python -m venv .venv && . .venv/bin/activate
pip install -e ".[dev]"
pytest
```

## License

MIT
