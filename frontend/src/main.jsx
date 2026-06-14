import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";

import "./index.css";
import "leaflet/dist/leaflet.css";

import App from "./App.jsx";

// Register Service Worker for Web Push notifications
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("Service Worker registered successfully with scope:", reg.scope);
      })
      .catch((err) => {
        console.error("Service Worker registration failed:", err);
      });
  });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: "#ffffff",
          color: "#111827",
          border: "1px solid #e5e7eb",
        },
      }}
    />
  </StrictMode>
);
