import { useEffect, useState } from "react";
import { getClientId, signIn, signOut } from "./auth";
import CodeDetail from "./components/CodeDetail";
import CodeList from "./components/CodeList";
import CreateCode from "./components/CreateCode";

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

  return (
    <>
      <header className="topbar">
        <a href="#/" className="brand">
          <span className="brand-mark" aria-hidden>▦</span> QR Tracker
        </a>
        {signedIn && (
          <nav>
            <a href="#/" className={route.page === "list" ? "active" : ""}>
              My codes
            </a>
            <a href="#/new" className={`button ${route.page === "new" ? "active" : ""}`}>
              + New QR code
            </a>
            <span className="account">
              <button className="link small" onClick={signOut}>
                Sign out
              </button>
            </span>
          </nav>
        )}
      </header>
      <main>
        {!signedIn ? (
          <section className="card narrow empty">
            <h1>Sign in</h1>
            <p className="muted">Sign in with your Etienne Thompson account to manage your QR codes.</p>
            <button className="button primary" onClick={signIn}>
              Sign in
            </button>
          </section>
        ) : (
          <>
            {route.page === "list" && <CodeList />}
            {route.page === "new" && <CreateCode />}
            {route.page === "detail" && <CodeDetail id={route.id} />}
          </>
        )}
      </main>
    </>
  );
}
