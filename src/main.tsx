import { ConfigProvider } from "antd";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { productionOperationsTheme } from "./lib/antdTheme";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConfigProvider theme={productionOperationsTheme}>
      <App />
    </ConfigProvider>
  </StrictMode>,
);
