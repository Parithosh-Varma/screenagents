// ASCII helpers: build text tables and misc art utilities.

export function pad(text, width, align = "left") {
  const value = String(text ?? "");
  const missing = Math.max(0, width - [...value].length);
  if (align === "right") return " ".repeat(missing) + value;
  if (align === "center") {
    const left = Math.floor(missing / 2);
    return " ".repeat(left) + value + " ".repeat(missing - left);
  }
  return value + " ".repeat(missing);
}

// Build a box-drawing ASCII table as an array of `{ text, kind }` lines.
export function asciiTable(headers, rows, align = []) {
  const widths = headers.map((_, column) =>
    Math.max(
      ...[headers, ...rows].map((row) => [...String(row[column] ?? "")].length)
    )
  );

  const edge = "+" + widths.map((w) => "-".repeat(w + 2)).join("+") + "+";
  const renderRow = (row) =>
    "| " +
    row
      .map((cell, index) => pad(cell, widths[index], align[index] || "left"))
      .join(" | ") +
    " |";

  return [
    { text: edge, kind: "edge" },
    { text: renderRow(headers), kind: "head" },
    { text: edge, kind: "edge" },
    ...rows.map((row) => ({ text: renderRow(row), kind: "body" })),
    { text: edge, kind: "edge" },
  ];
}

export function maxCols(art) {
  const lengths = String(art)
    .split("\n")
    .map((line) => [...line].length);
  return Math.max(1, ...lengths);
}

export function stripTrailing(art) {
  return String(art)
    .split("\n")
    .map((line) => line.replace(/\s+$/, ""))
    .join("\n")
    .replace(/^\n+|\n+$/g, "");
}

// A filled ASCII rule, e.g. rule("01 · why") -> "── 01 · why ─────────"
export function rule(label, width = 72) {
  const prefix = `── ${label} `;
  return stripTrailing(prefix + "─".repeat(Math.max(4, width - prefix.length)));
}
