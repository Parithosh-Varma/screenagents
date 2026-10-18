import AsciiTable from "../components/AsciiTable.jsx";
import Code from "../components/Code.jsx";
import Pre from "../components/Pre.jsx";
import Section from "../components/Section.jsx";

const USAGE = `usage: screenagents [path] [options]

  path                                output file (default: timestamped png in cwd)

  -r, --region WxH+X+Y | x,y,w,h      capture a sub-area
  -m, --monitor N                     1-based monitor index (1 = primary)
      --display NAME                  named display/output where supported
  -b, --backend NAME                  force a backend (see --list-backends)
  -f, --format png                    image format / extension
      --force                         overwrite an existing file
      --json                          print capture metadata as json
      --list-backends                 list backends and availability
      --doctor                        print environment + diagnostics
      --version                       print version and exit
  -h, --help                          show this help and exit`;

const OPTIONS = [
  ["-r, --region", "capture only this rectangle; both notations accepted"],
  ["-m, --monitor", "1-based monitor number; 1 is the primary"],
  ["--display", "named output (grim's DP-1, screencapture's display id)"],
  ["-b, --backend", "force one backend instead of auto-detecting"],
  ["-f, --format", "image format / file extension (default png)"],
  ["--force", "overwrite the output file if it exists"],
  ["--json", "print path, size, dimensions and backend as json"],
  ["--list-backends", "every backend, with the reason if it cannot run"],
  ["--doctor", "platform, session, display vars, then the same list"],
  ["--version", "print the version"],
  ["-h, --help", "print usage"],
];

const EXIT = [
  ["0", "captured, file written"],
  ["1", "no backend / backend failed / capture error"],
  ["2", "bad arguments (unparseable region, and friends)"],
];

const EXAMPLES = [
  { t: "$ screenagents", c: "prompt" },
  { t: "screenshot-20261018-1832-a1b2c3.png", c: "out" },
  { t: "" },
  { t: "$ screenagents ~/Desktop/shot.png", c: "prompt" },
  { t: "$ screenagents -r 0,0,800,600", c: "prompt" },
  { t: "$ screenagents -r 1920x1080+1920+0", c: "prompt" },
  { t: "$ screenagents -m 2 --force shot.png", c: "prompt" },
  { t: "$ screenagents -b grim --display DP-1", c: "prompt" },
  { t: "" },
  { t: "$ screenagents --json | jq .width", c: "prompt" },
  { t: "800", c: "out" },
];

export default function Cli() {
  return (
    <>
      <Section
        label="cli · usage"
        title="One command, no ceremony"
        lede="Full screen by default. Everything else is a flag. Paths and regions are validated before any process is spawned."
      >
        <Pre art={USAGE} className="art-block" max={13} min={7} label="screenagents usage" />
      </Section>

      <Section label="cli · options" title="Every flag">
        <AsciiTable
          headers={["option", "meaning"]}
          rows={OPTIONS}
          align={["left", "left"]}
          label="Command line options"
        />
      </Section>

      <Section label="cli · examples" title="Copy, paste, done">
        <Code title="terminal" lines={EXAMPLES} />
      </Section>

      <Section
        label="cli · exit codes"
        title="Scriptable by design"
        lede="Nothing is ever printed to stdout except the path (or JSON with --json). Errors go to stderr, so $(screenagents) is safe to use in scripts."
      >
        <AsciiTable
          headers={["code", "meaning"]}
          rows={EXIT}
          align={["center", "left"]}
          label="Exit codes"
        />
      </Section>
    </>
  );
}
