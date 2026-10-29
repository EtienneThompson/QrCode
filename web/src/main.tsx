import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { authConfigured, completeSignIn } from "./auth";
import "./styles.css";

const root = createRoot(document.getElementById("root")!);

if (!authConfigured) {
  root.render(
    <main>
      <p className="error">Sign-in is not configured. Set VITE_APPLICATION_ID (see README).</p>
    </main>,
  );
} else {
  completeSignIn();
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
