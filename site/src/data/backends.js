// Mirrors screenagents/backends.py — the registry is the source of truth.
// Keep this list in sync when backends are added or removed.

export const BACKENDS = [
  { name: "screencapture",  description: "macOS built-in screencapture(1)",       platform: "macOS",   session: "—",       region: true,  monitor: true,  display: true,  builtin: true },
  { name: "powershell",     description: "Windows PowerShell + System.Drawing",   platform: "Windows", session: "—",       region: true,  monitor: true,  display: false, builtin: true },
  { name: "pwsh",           description: "PowerShell 7+ + System.Drawing",        platform: "Windows", session: "—",       region: true,  monitor: true,  display: false, builtin: true },
  { name: "grim",           description: "Wayland grim (wlroots compositors)",    platform: "Linux",   session: "wayland", region: true,  monitor: false, display: true,  builtin: false },
  { name: "grimshot",       description: "Wayland grimshot helper script",        platform: "Linux",   session: "wayland", region: false, monitor: false, display: false, builtin: false },
  { name: "scrot",          description: "X11 scrot",                             platform: "Linux",   session: "x11",     region: true,  monitor: false, display: false, builtin: false },
  { name: "maim",           description: "X11 maim",                              platform: "Linux",   session: "x11",     region: true,  monitor: false, display: false, builtin: false },
  { name: "import",         description: "ImageMagick import (X11)",              platform: "Linux",   session: "x11",     region: true,  monitor: false, display: false, builtin: false },
  { name: "gnome-screenshot", description: "GNOME gnome-screenshot",              platform: "Linux",   session: "any",     region: false, monitor: false, display: false, builtin: false },
  { name: "spectacle",      description: "KDE Spectacle",                         platform: "Linux",   session: "any",     region: false, monitor: true,  display: false, builtin: false },
  { name: "xfce4-screenshooter", description: "Xfce xfce4-screenshooter",         platform: "Linux",   session: "x11",     region: false, monitor: false, display: false, builtin: false },
  { name: "flameshot",      description: "Flameshot",                             platform: "Linux",   session: "any",     region: false, monitor: false, display: false, builtin: false },
];

export const YES = "yes";
export const NO = "—";

export function backendRows() {
  return BACKENDS.map((b) => [
    b.name,
    b.platform,
    b.session,
    b.region ? YES : NO,
    b.monitor ? YES : NO,
    b.display ? YES : NO,
  ]);
}

export const BACKEND_HEADERS = ["backend", "platform", "session", "region", "monitor", "display"];

export const BACKEND_ALIGN = ["left", "left", "left", "center", "center", "center"];
