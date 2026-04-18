if (import.meta.env.DEV) {
  void import("react-grab");
}

import ReactDOM from "react-dom/client";
import { RootApp } from "./app/RootApp";
import { registerServiceWorker } from "./pwa/register-sw";
import "./styles/base.css";
import "vite-plugin-react-click-to-component/client";

const appContainer = document.getElementById("app");
if (appContainer) {
  ReactDOM.createRoot(appContainer).render(<RootApp />);
}

if (import.meta.env.PROD) {
  registerServiceWorker();
}
