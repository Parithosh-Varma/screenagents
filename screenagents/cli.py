"""Command line interface: ``screenagents``."""
from __future__ import annotations

import argparse
import json
import sys
from typing import List, Optional

from . import __version__, backends
from .capture import list_backends, screenshot
from .errors import ScreenAgentsError


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="screenagents",
        description=(
            "Screenshot your screen using the tools your OS already has. "
            "No Playwright, no browser, no heavy dependencies."
        ),
    )
    parser.add_argument(
        "path",
        nargs="?",
        help="output file (default: timestamped PNG in the current directory)",
    )
    parser.add_argument(
        "-r",
        "--region",
        help="capture a sub-area: 'x,y,width,height' or 'WxH+X+Y'",
    )
    parser.add_argument(
        "-m",
        "--monitor",
        type=int,
        help="1-based monitor index (1 = primary) where supported",
    )
    parser.add_argument(
        "--display",
        help="named display/output where supported (e.g. grim's output name)",
    )
    parser.add_argument(
        "-b", "--backend", help="force a specific backend (see --list-backends)"
    )
    parser.add_argument(
        "-f", "--format", default="png", help="image format/extension (default: png)"
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="overwrite the output file if it already exists",
    )
    parser.add_argument(
        "--json", action="store_true", help="print capture metadata as JSON"
    )
    parser.add_argument(
        "--list-backends",
        action="store_true",
        help="list every known backend and whether it can run here",
    )
    parser.add_argument(
        "--doctor",
        action="store_true",
        help="print environment and backend diagnostics",
    )
    parser.add_argument(
        "--version", action="version", version=f"screenagents {__version__}"
    )
    return parser


def _print_backends() -> None:
    rows = list_backends()
    width = max(len(row["name"]) for row in rows)
    for row in rows:
        mark = "ok " if row["available"] else "-- "
        line = f"{mark}{row['name']:<{width}}  {row['description']}"
        if not row["available"]:
            line += f"  ({row['reason']})"
        print(line)


def _print_doctor() -> None:
    env = backends.environment()
    print("environment:")
    for key, value in env.items():
        print(f"  {key}: {value!r}")
    print("\nbackends:")
    _print_backends()


def main(argv: Optional[List[str]] = None) -> int:
    args = build_parser().parse_args(argv)

    if args.list_backends:
        _print_backends()
        return 0

    if args.doctor:
        _print_doctor()
        return 0

    try:
        shot = screenshot(
            args.path,
            region=args.region,
            monitor=args.monitor,
            display=args.display,
            backend=args.backend,
            fmt=args.format,
            overwrite=args.force,
        )
    except ScreenAgentsError as exc:
        print(f"screenagents: {exc}", file=sys.stderr)
        return 1
    except ValueError as exc:
        print(f"screenagents: {exc}", file=sys.stderr)
        return 2

    if args.json:
        print(json.dumps(shot.to_dict(), indent=2))
    else:
        print(shot.path)
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
