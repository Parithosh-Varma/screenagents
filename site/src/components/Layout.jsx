import { useEffect } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { BANNER_MINI } from "../banners.js";
import { useTheme } from "../lib/theme.js";
import Pre from "./Pre.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

const LINKS = [
  { to: "/", label: "home", end: true },
  { to: "/install", label: "install" },
  { to: "/backends", label: "backends" },
  { to: "/cli", label: "cli" },
  { to: "/mcp", label: "mcp" },
  { to: "/library", label: "library" },
];

export const REPO = "https://github.com/Parithosh-Varma/screenagents";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function Layout() {
  const { theme, setTheme } = useTheme();

  return (
    <>
      <ScrollToTop />
      <header className="nav">
        <div className="wrap nav-inner">
          <Link to="/" className="brand">
            <span className="accent">▣</span> screenagents
          </Link>
          <nav className="nav-links" aria-label="Main">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="footer">
        <div className="wrap">
          <Pre art={BANNER_MINI} className="mini" max={11} min={5} label="screenagents" />
          <div className="cols">
            <nav aria-label="Pages">
              {LINKS.map((link) => (
                <Link key={link.to} to={link.to}>
                  {link.label}
                </Link>
              ))}
            </nav>
            <nav aria-label="Project">
              <a href={REPO}>github</a>
              <a href={`${REPO}/issues`}>issues</a>
              <a href={`${REPO}/blob/main/LICENSE`}>license · MIT</a>
            </nav>
            <span>
              zero dependencies · python 3.9+ · v0.1.0
              <br />
              <span className="faint">built with react &amp; ascii — no playwright</span>
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
