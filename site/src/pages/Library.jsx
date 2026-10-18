import AsciiTable from "../components/AsciiTable.jsx";
import Code from "../components/Code.jsx";
import Section from "../components/Section.jsx";

const py = (source) =>
  source.split("\n").map((t) => ({
    t,
    c: t.trimStart().startsWith("#") ? "comment" : "",
  }));

const BASIC = py(`from screenagents import screenshot, Region

shot = screenshot("desktop.png")                      # full screen
shot = screenshot("corner.png", region="0,0,640,480") # x,y,width,height
shot = screenshot("right.png",  region="1920x1080+1920+0", overwrite=True)
shot = screenshot("second.png", monitor=2)            # 1-based, where supported

print(shot.width, shot.height, shot.backend, shot.bytes)
print(shot.to_dict())`);

const ERRORS = py(`from screenagents import screenshot, NoBackendError, CaptureError

try:
    shot = screenshot("shot.png")
except NoBackendError as exc:
    print("no usable backend:", exc)   # tells you what to install
except CaptureError as exc:
    print("capture failed:", exc)      # backend stderr is included`);

const FORCE = py(`from screenagents import screenshot, Region

crop = Region(x=100, y=100, width=400, height=300)
shot = screenshot("crop.png", region=crop, backend="grim", overwrite=True)

# Region accepts both notations, and round-trips them:
crop.csv        # "100,100,400,300"
crop.geometry   # "400x300+100+100"`);

const FIELDS = [
  ["path", "Path", "where the file landed (absolute or as you passed it)"],
  ["backend", "str", "the backend that actually ran, e.g. 'scrot'"],
  ["format", "str", "'png' by default"],
  ["bytes", "int", "file size on disk"],
  ["width", "int | None", "parsed from the PNG header; None for other formats"],
  ["height", "int | None", "same"],
  ["region", "Region | None", "the region requested, if any"],
];

const EXCEPTIONS = [
  ["ScreenAgentsError", "base class — catch this to catch everything"],
  ["NoBackendError", "nothing usable on this machine"],
  ["BackendUnavailableError", "named/selected backend cannot run here"],
  ["CaptureError", "backend ran but failed (bad region, permissions, …)"],
];

export default function Library() {
  return (
    <>
      <Section
        label="library · basics"
        title="Three lines, one import"
        lede="screenshot() returns a Screenshot, not a path. All the metadata you would otherwise re-derive is already on it."
      >
        <Code title="python" lines={BASIC} />
      </Section>

      <Section label="library · recipe" title="Force a backend, pass a region object">
        <div className="grid-2">
          <Code title="python" lines={FORCE} />
          <div className="note">
            Captures land in a hidden <code>.screenagents-*.png</code> temp file
            and are renamed into place only after the backend exits cleanly. A
            failed capture never leaves a half-written image, and never clobbers
            the file that was already there.
          </div>
        </div>
      </Section>

      <Section label="library · errors" title="Errors you can act on">
        <div className="grid-2">
          <Code title="python" lines={ERRORS} />
          <AsciiTable
            headers={["exception", "raised when"]}
            rows={EXCEPTIONS}
            align={["left", "left"]}
            label="Exception hierarchy"
          />
        </div>
      </Section>

      <Section label="library · object" title="Everything a Screenshot knows">
        <AsciiTable
          headers={["field", "type", "notes"]}
          rows={FIELDS}
          align={["left", "left", "left"]}
          label="Screenshot fields"
        />
      </Section>
    </>
  );
}
