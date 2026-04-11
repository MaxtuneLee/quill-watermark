import { StrictMode } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { appRoutes } from "./App";
import { AppProviders } from "./providers";
import { Toaster } from "@/components/ui/sonner";

const appRouter = createBrowserRouter(appRoutes);

export function RootApp() {
  return (
    <StrictMode>
      <AppProviders>
        <RouterProvider router={appRouter} />
        <Toaster />
      </AppProviders>
    </StrictMode>
  );
}
