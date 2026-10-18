import { useState } from "react";
import Code from "../components/Code.jsx";
import Pre from "../components/Pre.jsx";
import Section from "../components/Section.jsx";

const PLATFORMS = {
  "debian / ubuntu": [
    { t: "$ sudo apt update", c: "prompt" },
    { t: "" },
    { t: "# Wayland (sway, hyprland, gnome-wayland, …)", c: "comment" },
    { t: "$ sudo apt install grim", c: "prompt" },
    { t: "" },
    { t: "# X11", c: "comment" },
    { t: "$ sudo apt install scrot", c: "prompt" },
  ],
  fedora: [
    { t: "# Wayland", c: "comment" },
    { t: "$ sudo dnf install grim", c: "prompt" },
    { t: "" },
    { t: "# X11", c: "comment" },
    { t: "$ sudo dnf install scrot", c: "prompt" },
  ],
  arch: [
    { t: "# Wayland", c: "comment" },
    { t: "$ sudo pacman -S grim", c: "prompt" },
    { t: "" },
    { t: "# X11", c: "comment" },
    { t: "$ sudo pacman -S scrot", c: "prompt" },
  ],
  "already covered": [
    { t: "# desktops that ship their own screenshot tool", c: "comment" },
    { t: "GNOME   -> gnome-screenshot", c: "out" },
    { t: "KDE     -> spectacle", c: "out" },
    { t: "Xfce    -> xfce4-screenshooter", c: "out" },
    { t: "" },
    { t: "# ImageMagick or maim work on X11 too", c: "comment" },
    { t: "import  /  maim", c: "out" },
  ],
};

const DOCTOR = `environment:
  platform: 'linux'
  python: '3.12.3'
  session: 'wayland'
  DISPLAY: ''
  WAYLAND_DISPLAY: 'wayland-0'

backends:
-- screencapture        macOS built-in screencapture(1)  (not supported on linux)
ok grim                 Wayland grim (wlroots compositors)
-- scrot                X11 scrot  (needs a x11 session (this is wayland))
`;

const FROM_SOURCE = [
  { t: "git clone https://github.com/Parithosh-Varma/screenagents", c: "out" },
  { t: "$ cd screenagents", c: "prompt" },
  { t: "$ python -m venv .venv && . .venv/bin/activate", c: "prompt" },
  { t: '$ pip install -e ".[mcp]"', c: "prompt" },
  { t: "$ pytest -q", c: "prompt" },
  { t: "49 passed, 1 skipped", c: "ok" },
];

export default function Install() {
  const [platform, setPlatform] = useState("debian / ubuntu");

  return (
    <>
      <Section
        label="install · core"
        title="pip install screenagents"
        lede="The core has zero dependencies. Nothing else gets pulled down."
      >
        <div className="grid-2">
          <Code
            title="terminal"
            lines={[
              { t: "$ pip install screenagents", c: "prompt" },
              { t: "Successfully installed screenagents-0.1.0", c: "ok" },
              { t: "" },
              { t: "$ screenagents --version", c: "prompt" },
              { t: "screenagents 0.1.0", c: "out" },
            ]}
          />
          <div className="note">
            Python 3.9 or newer. No compiler, no system headers, no build step —
            the OS tool does the actual work.
          </div>
        </div>
      </Section>

      <Section
        label="install · linux"
        title="Pick a Linux backend"
        lede="macOS and Windows need nothing installed. On Linux, screenagents uses whichever of these your distro provides — pick a tab."
      >
        <div className="tabs" role="tablist" aria-label="Linux distributions">
          {Object.keys(PLATFORMS).map((name) => (
            <button
              key={name}
              role="tab"
              aria-selected={platform === name}
              className="tab"
              onClick={() => setPlatform(name)}
              type="button"
            >
              {name}
            </button>
          ))}
        </div>
        <Code title={platform} lines={PLATFORMS[platform]} />
        <p className="faint mt-2" style={{ fontSize: "var(--step--1)" }}>
          Anything that can put a PNG on disk will work — those are just the ones
          screenagents knows by name.
        </p>
      </Section>

      <Section
        label="install · macos / windows"
        title="Already done"
      >
        <div className="grid-2">
          <Code
            title="macOS"
            lines={[
              { t: "# nothing to install — screencapture ships with macOS", c: "comment" },
              { t: "$ screenagents", c: "prompt" },
              { t: "screenshot-20261018-1832-a1b2c3.png", c: "out" },
              { t: "" },
              { t: "# first run prompts for Screen Recording permission:", c: "comment" },
              { t: "#   System Settings > Privacy & Security", c: "comment" },
              { t: "#   > Screen Recording", c: "comment" },
            ]}
          />
          <Code
            title="Windows"
            lines={[
              { t: "> pip install screenagents", c: "prompt" },
              { t: "> screenagents", c: "prompt" },
              { t: "screenshot-20261018-1832-a1b2c3.png", c: "out" },
              { t: "" },
              { t: "# PowerShell + System.Drawing are part of Windows;", c: "comment" },
              { t: "# PowerShell 7+ (pwsh) is preferred when present", c: "comment" },
            ]}
          />
        </div>
      </Section>

      <Section
        label="install · verify"
        title="Ask it what it found"
        lede="--doctor prints the facts that decide backend availability, then each backend with a reason if it cannot run. paste this into a bug report if something misbehaves."
      >
        <Pre art={DOCTOR} className="art-block" max={13} min={8} label="screenagents --doctor output" />
      </Section>

      <Section label="install · source" title="From a clone">
        <Code title="terminal" lines={FROM_SOURCE} />
      </Section>
    </>
  );
}
