import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Backends from "./pages/Backends.jsx";
import Cli from "./pages/Cli.jsx";
import Home from "./pages/Home.jsx";
import Install from "./pages/Install.jsx";
import Library from "./pages/Library.jsx";
import Mcp from "./pages/Mcp.jsx";
import NotFound from "./pages/NotFound.jsx";

// vite's `base` is for asset URLs only. Feeding a relative BASE_URL ('./')
// to <BrowserRouter basename> makes every route silently match nothing —
// React paints an empty tree with zero console errors. Force '/' in that case.
const base = import.meta.env.BASE_URL;
const basename = base && base.startsWith("/") ? base.replace(/\/$/, "") || "/" : "/";

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="install" element={<Install />} />
          <Route path="backends" element={<Backends />} />
          <Route path="cli" element={<Cli />} />
          <Route path="mcp" element={<Mcp />} />
          <Route path="library" element={<Library />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
