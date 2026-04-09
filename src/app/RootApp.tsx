import { StrictMode } from "react";
import { App } from "./App";
import { AppProviders } from "./providers";

export function RootApp() {
  return (
    <StrictMode>
      <AppProviders>
        <App />
      </AppProviders>
    </StrictMode>
  );
}
