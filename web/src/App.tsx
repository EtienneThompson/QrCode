import { useEffect, useState } from "react";
import { getClientId, signIn, signOut } from "./auth";
import CodeDetail from "./components/CodeDetail";
import CodeList from "./components/CodeList";
import CreateCode from "./components/CreateCode";
import { LockIcon, LogInIcon, LogOutIcon, PlusIcon } from "./components/Icons";
import { PublicShell, SplashCard, Topbar } from "./components/Layout";

type Route = { page: "list" } | { page: "new" } | { page: "detail"; id: string };

function parseHash(): Route {
  const hash = window.location.hash.replace(/^#\/?/, "");
  if (hash === "new") return { page: "new" };
  const match = hash.match(/^codes\/([0-9A-Za-z]+)$/);
  return match ? { page: "detail", id: match[1] } : { page: "list" };
}

export default function App() {
  const [route, setRoute] = useState(parseHash);
  const signedIn = Boolean(getClientId());

  useEffect(() => {
    const onChange = () => setRoute(parseHash());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  if (!signedIn) {
    return (
      <PublicShell>
        <SplashCard
          icon={<LockIcon />}
          title="Sign in required"
          description="Sign in with your Etienne Thompson account to manage your QR codes."
        >
          <button className="button button--primary button--full" onClick={signIn}>
            <LogInIcon />
            Sign in
          </button>
        </SplashCard>
      </PublicShell>
    );
  }

  return (
    <div className="host">
      <Topbar>
        <a href="#/" className={`host-nav-link ${route.page === "list" ? "active" : ""}`}>
          My codes
        </a>
        <a href="#/new" className="button button--primary button--sm">
          <PlusIcon />
          <span>New QR code</span>
        </a>
        <button className="host-sign-out" onClick={signOut}>
          <LogOutIcon />
          <span>Sign out</span>
        </button>
      </Topbar>
      <main className="host-content" key={route.page === "detail" ? route.id : route.page}>
        {route.page === "list" && <CodeList />}
        {route.page === "new" && <CreateCode />}
        {route.page === "detail" && <CodeDetail id={route.id} />}
      </main>
    </div>
  );
}
