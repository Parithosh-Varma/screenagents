import AsciiTable from "../components/AsciiTable.jsx";
import Code from "../components/Code.jsx";
import Pre from "../components/Pre.jsx";
import Section from "../components/Section.jsx";

const FLOW = `   agent ──► list_screenshot_backends ──► "grim is available here"
     │
     └────► capture_screenshot(region="0,0,1280,720")
                  │
                  ▼
            { "ok": true,
              "path":  "screenshot-20261018-1832-a1b2c3.png",
              "width": 1280, "height": 720, "bytes": 88214,
              "backend": "grim",
              "image_base64": "iVBORw0KGgo…" }`;

const CONFIG = [
  { t: '$ pip install "screenagents[mcp]"', c: "prompt" },
  { t: "" },
  { t: "// claude desktop · cursor · any mcp client", c: "comment" },
  { t: "{", c: "" },
  { t: '  "mcpServers": {', c: "" },
  { t: '    "screenagents": {', c: "" },
  { t: '      "command": "screenagents-mcp"', c: "key" },
  { t: "    }", c: "" },
  { t: "  }", c: "" },
  { t: "}", c: "" },
];

const TOOLS_ROWS = [
  ["capture_screenshot", "path, region, monitor, display, backend, overwrite, include_image", "ok, path, width, height, bytes, backend, image_base64"],
  ["list_screenshot_backends", "—", "ok, environment, backends[]"],
];

const RUN = [
  { t: "$ screenagents-mcp", c: "prompt" },
  { t: "[mcp] screenagents v0.1.0 listening on stdio", c: "out" },
  { t: "[mcp] capture_screenshot · list_screenshot_backends", c: "dim" },
];

export default function Mcp() {
  return (
    <>
      <Section
        label="mcp · setup"
        title="Give your agent eyes"
        lede="An MCP server over stdio. No port, no daemon, no background process — your client starts it, it answers, it exits."
      >
        <div className="grid-2">
          <Code title="install + configure" lines={CONFIG} />
          <Code title="run" lines={RUN} />
        </div>
      </Section>

      <Section
        label="mcp · round trip"
        title="Ask. Look. Answer."
        lede="The tool returns the PNG as base64 alongside its metadata, so a multimodal model can actually see your screen — not describe what it assumes is there."
      >
        <Pre art={FLOW} className="art-block" max={14} min={7} label="MCP capture round trip" />
      </Section>

      <Section label="mcp · tools" title="Two tools, no surprises">
        <AsciiTable
          headers={["tool", "arguments", "returns"]}
          rows={TOOLS_ROWS}
          align={["left", "left", "left"]}
          label="MCP tools"
        />
        <div className="grid-2 mt-3">
          <div className="note">
            <code>region</code> and <code>monitor</code> are optional — omit them
            for a full-screen capture. Set <code>include_image=false</code> when
            you only want the file metadata.
          </div>
          <div className="note">
            Errors come back as <code>{'{ "ok": false, "error": "…" }'}</code>{" "}
            instead of an exception, so the agent can read the reason and choose
            another backend.
          </div>
        </div>
      </Section>
    </>
  );
}
