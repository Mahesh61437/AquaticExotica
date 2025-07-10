import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { prefetchHomepageData } from "./lib/api-cache";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Prefetch homepage data as soon as possible to improve loading performance
prefetchHomepageData().catch(error => {
  console.warn("Failed to prefetch homepage data:", error);
});

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
