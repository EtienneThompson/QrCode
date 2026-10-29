import { FormEvent, useState } from "react";
import { createCode } from "../api";

export default function CreateCode() {
  const [targetUrl, setTargetUrl] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      const url = /^https?:\/\//i.test(targetUrl.trim()) ? targetUrl.trim() : `https://${targetUrl.trim()}`;
      const code = await createCode({ name, targetUrl: url });
      window.location.hash = `/codes/${code.id}`;
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <section className="card narrow">
      <h1>New QR code</h1>
      <p className="muted">
        The QR code points at a short tracking link that records each scan, then forwards
        the visitor to your destination. You can change the destination later without reprinting.
      </p>
      <form onSubmit={submit} className="form">
        <label>
          Name <span className="muted">(optional)</span>
          <input
            type="text"
            maxLength={200}
            autoFocus
            placeholder="e.g. Spring flyer"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Destination URL
          <input
            type="text"
            inputMode="url"
            required
            placeholder="https://example.com/landing-page"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="button primary" disabled={busy}>
          {busy ? "Creating…" : "Create QR code"}
        </button>
      </form>
    </section>
  );
}
