import { Link } from "react-router-dom";
import AsciiTable from "../components/AsciiTable.jsx";
import Code from "../components/Code.jsx";
import Pre from "../components/Pre.jsx";
import Section from "../components/Section.jsx";
import {
  BACKEND_ALIGN,
  BACKEND_HEADERS,
  backendRows,
} from "../data/backends.js";

const FLOW = `   cli · library · mcp
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
                         import · gnome-screenshot · spectacle · flameshot`;

const RULES = `   1  platform matches      darwin  |  win32  |  linux
   2  session matches       wayland vs x11 (linux only)
   3  binary exists         shutil.which(name) is not None
   4  capabilities hold      region / monitor / display requested
   5  first match wins      unless you pass --backend name`;

const backendLine = (mark, name, rest) => `${mark}  ${name.padEnd(13)}  ${rest}`;

const LIST_OUTPUT = [
  { t: "$ screenagents --list-backends", c: "prompt" },
  { t: backendLine("ok", "screencapture", "macOS built-in screencapture(1)"), c: "dim" },
  { t: backendLine("ok", "grim", "Wayland grim (wlroots compositors)"), c: "ok" },
  { t: backendLine("--", "scrot", "X11 scrot  (needs a x11 session (this is wayland))"), c: "dim" },
  { t: backendLine("--", "flameshot", "Flameshot  (missing executable: flameshot)"), c: "dim" },
];

export default function Backends() {
  return (
    <>
      <Section
        label="backends"
        title="What runs under the hood"
        lede="Every backend is a native command, nothing more. The registry lives in backends.py — this table is generated from the same data."
      >
        <AsciiTable
          headers={BACKEND_HEADERS}
          rows={backendRows()}
          align={BACKEND_ALIGN}
          label="Screen capture backends by platform, session, and feature support"
        />
        <p className="faint mt-2" style={{ fontSize: "var(--step--1)" }}>
          region = <code>-r/--region</code> · monitor = <code>-m/--monitor</code> ·
          display = <code>--display</code> · session "any" = works on both X11 and Wayland
        </p>
      </Section>

      <Section
        label="backends · pipeline"
        title="From call to PNG"
        lede="Positional arguments, a region object, and a temp file. That is the whole contract."
      >
        <Pre art={FLOW} className="art-block" max={14} min={7} label="screenagents capture pipeline" />
      </Section>

      <Section
        label="backends · selection"
        title="How one gets picked"
        lede="In order, skipping anything that fails a step. A region request skips backends that cannot crop. Forcing --backend skips the search but still validates."
      >
        <Pre art={RULES} className="art-block" max={14} min={8} label="backend selection rules" />
        <div className="mt-3">
          <Code title="see the decision for yourself" lines={LIST_OUTPUT} />
        </div>
        <p className="dim mt-2">
          Want it to fail loudly instead of fall back? <code>--backend grim</code>{" "}
          errors with the exact reason — <Link to="/cli">see exit codes</Link>.
        </p>
      </Section>
    </>
  );
}
