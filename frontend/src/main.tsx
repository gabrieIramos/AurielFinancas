
  import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Service worker não registrado em dev
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
  