import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter";
import App from "./App";
import { authConfigured, completeSignIn } from "./auth";
import { AlertIcon } from "./components/Icons";
import { PublicShell, SplashCard } from "./components/Layout";
import "./styles.css";

const root = createRoot(document.getElementById("root")!);

if (!authConfigured) {
  root.render(
    <PublicShell>
      <SplashCard
        icon={<AlertIcon />}
        iconVariant="danger"
        title="Sign-in unavailable"
        description="Sign-in is not configured. Set VITE_APPLICATION_ID (see README)."
      />
    </PublicShell>,
  );
} else {
  completeSignIn();
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
