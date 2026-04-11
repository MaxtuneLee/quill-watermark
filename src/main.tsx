if (import.meta.env.DEV) {
  void import("react-grab");
}

import ReactDOM from "react-dom/client";
import { RootApp } from "./app/RootApp";
import "./styles/base.css";

const appContainer = document.getElementById("app");
if (appContainer) {
  ReactDOM.createRoot(appContainer).render(<RootApp />);
}
