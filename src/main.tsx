import ReactDOM from "react-dom/client";
import { RootApp } from "./app/RootApp";
import "./styles/tokens.css";
import "./styles/base.css";

const appContainer = document.getElementById("app");
if (appContainer) {
  ReactDOM.createRoot(appContainer).render(<RootApp />);
}
