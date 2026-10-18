import { Link } from "react-router-dom";
import { BANNER_HERO, BANNER_SMALL } from "../banners.js";
import AsciiTable from "../components/AsciiTable.jsx";
import Code from "../components/Code.jsx";
import HeroCapture from "../components/HeroCapture.jsx";
import Pre from "../components/Pre.jsx";
import Section from "../components/Section.jsx";
import {
  BACKEND_ALIGN,
  BACKEND_HEADERS,
  backendRows,
} from "../data/backends.js";

const ART_NO_BROWSER = `   ┌────────────┐
   │ ██████████ │
   │ ██████████ │
   └────────────┘
    x chromium
    x playwright
    x webdriver`;

const ART_ZERO_DEPS = `   $ pip install screenagents
     └─ 0 packages pulled

   stdlib runs the show
   subprocess + os + struct`;

const ART_NATIVE = `   macOS    ->  screencapture
   Windows  ->  powershell
   Linux    ->  grim / scrot
                maim / import`;

const QUICK = [
  { t: "$ screenagents", c: "prompt" },
  { t: "screenshot-20261018-1832-a1b2c3.png", c: "out" },
  { t: "" },
  { t: "$ screenagents -r 0,0,800,600 --json", c: "prompt" },
  { t: '{ "path": "screenshot-…-77ff10.png", "backend": "scrot", "width": 800, "height": 600 }', c: "out" },
  { t: "" },
  { t: "$ screenagents -m 2 -b grim --force", c: "prompt" },
  { t: "screenshot-20261018-1833-77ff10.png", c: "out" },
];

const AGENT_SNIPPET = [
  { t: '{ "mcpServers": {', c: "" },
  { t: '    "screenagents": {', c: "" },
  { t: '      "command": "screenagents-mcp"', c: "key" },
  { t: "    }", c: "" },
  { t: "} }", c: "" },
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <Pre
            art={BANNER_HERO}
            className="banner-hero banner-wide"
            max={15}
            min={6}
            label="screenagents"
          />
          <Pre
            art={BANNER_SMALL}
            className="banner-hero banner-narrow"
            max={22}
            min={6}
            label="screenagents"
          />
          <p className="tagline">
            Screenshot anything, <em>instantly</em>. No Playwright. No headless
            browser. No 300&#8239;MB of Chromium.
          </p>
          <p className="sub">
            A tiny Python package that shells out to the screenshot tool your
            operating system already has — then hands you a file, metadata, or
            an image for your agent. CLI, library, and MCP server in one.
          </p>
          <div className="cta-row">
            <Link className="btn primary" to="/install">
              <span className="glyph">$</span> install
            </Link>
            <Link className="btn" to="/cli">
              <span className="glyph">&gt;</span> command reference
            </Link>
            <a className="btn" href="https://github.com/Parithosh-Varma/screenagents">
              <span className="glyph">#</span> github
            </a>
          </div>
          <div className="trust" aria-hidden="false">
            <span><b>os</b> macOS · Windows · Wayland · X11</span>
            <span><b>deps</b> 0</span>
            <span><b>python</b> 3.9+</span>
            <span><b>license</b> MIT</span>
          </div>
          <div className="mt-3">
            <HeroCapture />
          </div>
        </div>
      </section>

      <Section
        label="01 · why"
        title="A screenshot is not a rendering problem."
      >
        <div className="grid-3">
          <article className="panel">
            <span className="kicker">no browser</span>
            <h3>Chromium never enters the room</h3>
            <Pre art={ART_NO_BROWSER} className="art" max={12} min={7} />
            <p>
              Tools that boot a browser to take a picture of your desktop are
              solving the wrong problem. screenagents asks the OS.
            </p>
          </article>
          <article className="panel">
            <span className="kicker">zero dependencies</span>
            <h3>The core is stdlib only</h3>
            <Pre art={ART_ZERO_DEPS} className="art" max={12} min={7} />
            <p>
              <code>pip install screenagents</code> pulls nothing else. The MCP
              server is optional and the only extra there is <code>mcp</code>.
            </p>
          </article>
          <article className="panel">
            <span className="kicker">native everywhere</span>
            <h3>Uses what's already installed</h3>
            <Pre art={ART_NATIVE} className="art" max={12} min={7} />
            <p>
              Twelve backends, detected at runtime, ordered by fitness — region
              and monitor support included. <Link to="/backends">see the table</Link>.
            </p>
          </article>
        </div>
      </Section>

      <Section
        label="02 · one command"
        title="Take the picture. Move on."
        lede="Full screen by default. A region, a monitor, a specific backend, JSON metadata, atomic writes — all one flag away."
      >
        <Code title="terminal" lines={QUICK} />
      </Section>

      <Section
        label="03 · backends"
        title="Twelve native backends, picked for you"
        lede="Detection order is best-first and session-aware: on X11 only X11 tools are considered, on Wayland only Wayland tools, unless you force one with --backend."
      >
        <AsciiTable
          headers={BACKEND_HEADERS}
          rows={backendRows()}
          align={BACKEND_ALIGN}
          label="Screen capture backends by platform, session, and feature support"
        />
        <p className="faint mt-2" style={{ fontSize: "var(--step--1)" }}>
          region = can capture <code>x,y,w,h</code> · monitor = can target one display ·
          display = can target a named output · full detail on the{" "}
          <Link to="/backends">backends page</Link>.
        </p>
      </Section>

      <Section
        label="04 · agents"
        title="Give your agent eyes"
        lede="The bundled MCP server exposes capture_screenshot — it returns the PNG as base64, so a multimodal model can actually look at your screen instead of guessing."
      >
        <div className="grid-2">
          <Code title="claude desktop / cursor / any mcp client" lines={AGENT_SNIPPET} />
          <div className="stack">
            <p className="dim">
              Agents can ask for exactly what they need: a region, a monitor, or
              a named output — and decide which backend to use after reading{" "}
              <code>list_screenshot_backends</code>.
            </p>
            <p className="dim">
              Nothing runs in the background, nothing listens on a port, and the
              only permission involved is the screen-recording permission your OS
              already enforces.
            </p>
            <Link className="btn" to="/mcp">
              <span className="glyph">&gt;</span> mcp setup
            </Link>
          </div>
        </div>
      </Section>

      <Section label="05 · start" title="Two seconds from now">
        <div className="grid-2">
          <Code
            title="install"
            lines={[
              { t: "$ pip install screenagents", c: "prompt" },
              { t: "$ screenagents --doctor", c: "prompt" },
              { t: "ok  screencapture  macOS built-in screencapture(1)", c: "ok" },
              { t: "--  grim  (no X11 or Wayland session detected)", c: "dim" },
              { t: "ok  scrot  X11 scrot", c: "ok" },
              { t: "" },
              { t: '$ screenagents -r 0,0,640,480', c: "prompt" },
              { t: "screenshot-20261018-1835-0aa4de.png", c: "out" },
            ]}
          />
          <div className="panel">
            <span className="kicker">what you get</span>
            <h3>one file, honestly labeled</h3>
            <p>
              A PNG next to you, a screenshot object in Python, or base64 in your
              agent's context. Dimensions parsed from the file header, bytes
              counted, backend recorded.
            </p>
            <div className="cta-row">
              <Link className="btn primary" to="/install">
                <span className="glyph">$</span> install
              </Link>
              <Link className="btn" to="/library">
                <span className="glyph">&gt;</span> python api
              </Link>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
