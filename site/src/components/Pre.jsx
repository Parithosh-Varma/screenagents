import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { maxCols } from "../lib/ascii.js";

// Renders ASCII art and scales the font so `cols` characters fit the container.
// Uses innerClientWidth (clientWidth minus padding/borders) — measuring the box
// instead paints art wider than its frame on every breakpoint.
export default function Pre({
  art,
  min = 5,
  max = 14,
  align = "left",
  className = "",
  label,
  pad = 0,
  style,
}) {
  const ref = useRef(null);
  const [size, setSize] = useState(max);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const cols = Math.max(1, maxCols(art));
    const fit = () => {
      const cs = getComputedStyle(el);
      const inner =
        el.clientWidth -
        parseFloat(cs.paddingLeft || 0) -
        parseFloat(cs.paddingRight || 0) -
        parseFloat(cs.borderLeftWidth || 0) -
        parseFloat(cs.borderRightWidth || 0) -
        pad;
      if (inner <= 0) return;
      setSize(Math.max(min, Math.min(max, inner / (cols * 0.6018))));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    if (document.fonts?.ready) document.fonts.ready.then(fit).catch(() => {});
    return () => observer.disconnect();
  }, [art, min, max, pad]);

  return (
    <pre
      ref={ref}
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ fontSize: `${size}px`, textAlign: align, ...style }}
    >
      {String(art ?? "")}
    </pre>
  );
}
