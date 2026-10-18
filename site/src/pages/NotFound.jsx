import { Link } from "react-router-dom";
import Pre from "../components/Pre.jsx";
import Section from "../components/Section.jsx";

const LOST = `      ┌───────────────────────────────┐
      │                               │
      │   404 · signal lost           │
      │   no capture at this path     │
      │                               │
      └───────────────┬───────────────┘
                      │
                 ░░░░░░░░░░░
                 ░ no image ░
                 ░░░░░░░░░░░`;

export default function NotFound() {
  return (
    <Section label="404" title="Nothing was captured here">
      <Pre art={LOST} className="art-block" max={16} min={9} label="404 — page not found" />
      <div className="cta-row mt-2">
        <Link className="btn primary" to="/">
          <span className="glyph">$</span> back home
        </Link>
        <Link className="btn" to="/cli">
          <span className="glyph">&gt;</span> command reference
        </Link>
      </div>
    </Section>
  );
}
