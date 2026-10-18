import { useState } from "react";

// Terminal-styled code block. `lines` is an array of { t, c } where `c` is an
// optional class: prompt | out | ok | bad | dim | comment | key | str | num.
export default function Code({ title, path, lines, text, dense = false }) {
  const [copied, setCopied] = useState(false);
  const raw = text ?? lines.map((line) => line.t).join("\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(raw);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="code">
      <div className="code-head">
        {title ? <span className="dim">{title}</span> : null}
        {path ? <span className="path">{path}</span> : null}
        <button className="copy" type="button" onClick={copy}>
          {copied ? "[copied]" : "[copy]"}
        </button>
      </div>
      <div className="code-body" style={dense ? { lineHeight: 1.4 } : undefined}>
        {lines.map((line, index) => (
          <span key={index} className={`ln ${line.c || ""}`}>
            {line.t || " "}
          </span>
        ))}
      </div>
    </div>
  );
}
