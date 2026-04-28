import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { applyTenantTheme } from "./theme";
import { tenant } from "./tenant.generated";
import "./index.css";

applyTenantTheme(tenant.theme);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);