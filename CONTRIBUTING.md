# Contributing to screenagents

Thanks for helping. This project stays small on purpose: one function, one CLI, one
MCP tool, and a registry of native backends. Contributions that keep it that way are
very welcome.

## Setup

```bash
git clone https://github.com/Parithosh-Varma/screenagents
cd screenagents
python -m venv .venv && . .venv/bin/activate
pip install -e ".[dev,mcp]"
pytest -q
```

The suite passes on a headless machine: detection and command building are tested with
`sys.platform`, `shutil.which` and the display-session variables patched, and the
capture pipeline runs against a fake backend. The one real-capture test skips when no
backend is available.

## Adding a backend

1. Write a builder in `screenagents/backends.py` that returns an argv list for a
   `CaptureRequest` (look at `_build_scrot` for the pattern).
2. Register it in `_BACKENDS`, in preference order, with its platform, session
   (`x11` / `wayland` / `None`), required executables, and the capabilities it really
   supports — do not claim region support the tool does not have.
3. Add unit tests in `tests/test_backends.py` for the command it builds and for its
   availability rules.
4. Add a row to `BACKENDS` in `site/src/data/backends.js` and to the table in
   `README.md` so the docs stay in sync.

## Ground rules

- **No new runtime dependencies.** If it cannot be done with the stdlib plus an
  existing OS tool, open an issue first.
- **Errors are typed.** Raise `NoBackendError`, `BackendUnavailableError` or
  `CaptureError`; never let a raw `subprocess` failure escape.
- **No partial files.** Everything goes through the temp-file-then-rename path in
  `capture.py`.
- Run `pytest -q` before opening a PR. For backend-related changes, include the
  output of `screenagents --doctor` in the PR description.

## Scope

In: capture quality, backend coverage, agent ergonomics, docs.
Out: image editing, video, web-page rendering (that is Playwright's job).

## License

By contributing you agree your work is released under the [MIT License](LICENSE).
