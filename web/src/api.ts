import { applicationId, getClientId, signOut } from "./auth";

const BASE = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");

export interface QrCode {
  id: string;
  name: string;
  targetUrl: string;
  shortUrl: string;
  createdAt: string;
  visitCount: number;
  lastVisitAt: string | null;
}

export interface Visit {
  at: string;
  userAgent: string;
  referer: string;
}

/**
 * Calls api.etiennethompson.com. It authenticates every request by the client id
 * from the login service plus this app's id: in the query string for GETs,
 * and in the JSON body otherwise.
 */
async function request<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  options: { query?: URLSearchParams; body?: object } = {},
): Promise<T> {
  const auth = { clientid: getClientId() ?? "", appid: applicationId ?? "" };
  const query = new URLSearchParams(options.query);
  let body: string | undefined;
  if (method === "GET") {
    query.set("clientid", auth.clientid);
    query.set("appid", auth.appid);
  } else {
    body = JSON.stringify({ ...options.body, ...auth });
  }

  const res = await fetch(`${BASE}${path}${query.size ? `?${query}` : ""}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body,
  });
  if (res.status === 401) {
    // Expired or unknown session: back to the sign-in page.
    signOut();
    throw new Error("Your session has expired. Please sign in again.");
  }
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message ?? `Request failed (${res.status})`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export const listCodes = () => request<QrCode[]>("GET", "/qr/codes");

export const getCode = (id: string) => request<QrCode>("GET", `/qr/codes/${id}`);

export const createCode = (body: { name: string; targetUrl: string }) =>
  request<QrCode>("POST", "/qr/codes", { body });

export const updateCode = (id: string, body: Partial<Pick<QrCode, "name" | "targetUrl">>) =>
  request<QrCode>("PATCH", `/qr/codes/${id}`, { body });

export const deleteCode = (id: string) => request<void>("DELETE", `/qr/codes/${id}`);

export function listVisits(id: string, from?: Date, to?: Date) {
  const query = new URLSearchParams();
  if (from) query.set("from", from.toISOString());
  if (to) query.set("to", to.toISOString());
  return request<Visit[]>("GET", `/qr/codes/${id}/visits`, { query });
}
