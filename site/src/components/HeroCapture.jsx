import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../lib/theme.js";

const COMMAND = "screenagents --region 0,0,1024,640 --json";
const OUT = [
  ["session", "wayland"],
  ["backend", "grim"],
  ["region", "0,0,1024,640"],
  ["output", "screenshot-20261018-1832-a1b2c3.png"],
];

const STEP = 34; // ms per typed character
const TYPE_START = 420;
const TYPE_END = TYPE_START + COMMAND.length * STEP;
const OUT_START = TYPE_END + 240;
const OUT_STEP = 130;
const CAPTURE_AT = OUT_START + OUT.length * OUT_STEP + 360;
const TOTAL = CAPTURE_AT + 3400;

export default function HeroCapture() {
  const reduced = useReducedMotion();
  const [frame, setFrame] = useState({ typed: 0, out: 0, captured: false });
  const last = useRef("");

  useEffect(() => {
    if (reduced) {
      setFrame({ typed: COMMAND.length, out: OUT.length, captured: true });
      return undefined;
    }
    let raf;
    let started;
    const loop = (now) => {
      if (started == null) started = now;
      const t = (now - started) % TOTAL;
      const typed = Math.max(0, Math.min(COMMAND.length, (t - TYPE_START) / STEP));
      const out = Math.max(0, Math.min(OUT.length, Math.floor((t - OUT_START) / OUT_STEP) + 1));
      const captured = t >= CAPTURE_AT;
      const signature = `${typed | 0}|${out}|${captured}`;
      if (signature !== last.current) {
        last.current = signature;
        setFrame({ typed: typed | 0, out, captured });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  const { typed, out, captured } = frame;

  return (
    <div>
      <div className={`frame ${captured ? "capture" : ""}`}>
        <div className="shutter" />
        <div className="frame-bar">
          <span className="lights" aria-hidden="true">
            ● ● ●
          </span>
          <span className="title">screenagents — zsh</span>
          <span className={captured ? "ok" : "faint"}>{captured ? "captured" : "live"}</span>
        </div>
        <div className="frame-body">
          <span className="line">
            <span className="prompt">$ </span>
            {COMMAND.slice(0, typed)}
            {!captured ? <span className="cursor" /> : null}
          </span>
          {OUT.slice(0, out).map(([key, value]) => (
            <span className="line" key={key}>
              <span className="dim">{"  "}{key.padEnd(9)}</span>
              <span className="accent">{value}</span>
            </span>
          ))}
        </div>
        <div className="result">
          {captured ? (
            <>
              <span className="ok">saved</span>
              <span>screenshot-20261018-1832-a1b2c3.png</span>
              <span className="chip">1024x640</span>
              <span className="chip">via grim</span>
            </>
          ) : (
            <span className="faint">awaiting capture…</span>
          )}
        </div>
      </div>
      <p className="faint mt-1" style={{ fontSize: "var(--step--2)" }}>
        one capture cycle, exactly as the CLI runs it — no browser, no Playwright
      </p>
    </div>
  );
}
