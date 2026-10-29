// Sign-in goes through login.etiennethompson.com. It sends the user back to the
// redirect URL registered for this app in the admin portal with
// ?clientId=…&isUser=…&isAdmin=…, and the API accepts that client id plus our app id.

const loginEndpoint = (import.meta.env.VITE_LOGIN_ENDPOINT || "https://login.etiennethompson.com").replace(
  /\/+$/,
  "",
);
export const applicationId = import.meta.env.VITE_APPLICATION_ID as string | undefined;
// The login service picks the registered redirect URL that contains this.
const redirectBase = (import.meta.env.VITE_LOGIN_REDIRECT as string | undefined) || window.location.host;

export const authConfigured = Boolean(applicationId);

const CLIENT_ID_KEY = "qr-tracker.clientId";
// The page (#route) to return to after signing in.
const RETURN_HASH_KEY = "qr-tracker.returnHash";

export const getClientId = (): string | null => localStorage.getItem(CLIENT_ID_KEY);

/** Picks up the client id the login service sent back, then removes it from the address bar. */
export function completeSignIn(): void {
  const params = new URLSearchParams(window.location.search);
  const clientId = params.get("clientId");
  if (!clientId) return;

  localStorage.setItem(CLIENT_ID_KEY, clientId);
  for (const key of ["clientId", "isUser", "isAdmin"]) params.delete(key);
  const search = params.toString();
  const hash = sessionStorage.getItem(RETURN_HASH_KEY) ?? window.location.hash;
  sessionStorage.removeItem(RETURN_HASH_KEY);
  history.replaceState(null, "", `${window.location.pathname}${search ? `?${search}` : ""}${hash}`);
}

export function signIn(): void {
  sessionStorage.setItem(RETURN_HASH_KEY, window.location.hash);
  const params = new URLSearchParams({ appid: applicationId ?? "", redirectBase });
  window.location.assign(`${loginEndpoint}/login?${params}`);
}

/** Forgets the session and shows the sign-in page. */
export function signOut(): void {
  localStorage.removeItem(CLIENT_ID_KEY);
  window.location.reload();
}
