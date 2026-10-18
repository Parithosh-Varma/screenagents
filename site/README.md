# screenagents — landing page

The project's marketing site: ASCII art, light and dark themes, one page per topic.

React 18 + Vite + react-router. Fully static — no runtime dependencies beyond the
bundle itself.

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
```

## Build

```bash
npm run build      # -> dist/
npm run preview    # serve dist/ locally, SPA fallback included
```

`vite.config.js` sets `base: "./"`, so `dist/` works from any domain or subfolder.

## Deploy to Cloudflare Pages

```bash
npm run build
npx wrangler pages deploy dist --project-name screenagents
```

Or connect the repository in the Cloudflare dashboard with:

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `site` |

`public/_redirects` provides the SPA fallback and `public/_headers` sets a strict
Content-Security-Policy (Fonts come from Google Fonts; React writes the ASCII font
sizes as inline styles, hence `style-src 'unsafe-inline'`).

## Design notes

- One typeface: JetBrains Mono, everywhere.
- Every visual is ASCII text — banners are pre-rendered with figlet at build time
  (`npm run banners` → `src/banners.js`, checked in) and diagrams are plain strings.
- Light and dark are first-class: all colors are tokens in `src/styles/global.css`,
  the choice persists in `localStorage`, and `public/theme-init.js` applies it before
  React mounts so there is no flash of the wrong theme.
- ASCII art is auto-fitted to its container (`src/components/Pre.jsx`); the wide hero
  banner swaps for a narrow one under 700px.
