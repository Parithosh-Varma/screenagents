// Applied before React mounts so there is no flash of the wrong theme.
// Lives in public/ as a real file because the CSP forbids inline scripts.
(function () {
  try {
    var stored = localStorage.getItem("screenagents-theme");
    var theme =
      stored === "light" || stored === "dark"
        ? stored
        : window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark";
    document.documentElement.dataset.theme = theme;
  } catch (error) {
    /* default theme stays */
  }
})();
