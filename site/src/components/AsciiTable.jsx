import { asciiTable } from "../lib/ascii.js";

// Renders a box-drawing ASCII table line by line so rows can highlight.
export default function AsciiTable({ headers, rows, align = [], label }) {
  const lines = asciiTable(headers, rows, align);

  return (
    <div className="ascii-table" role="img" aria-label={label}>
      {lines.map((line, index) => (
        <div key={index} className={`trow ${line.kind}`}>
          {line.text}
        </div>
      ))}
    </div>
  );
}
