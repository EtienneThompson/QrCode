import { FormEvent, useState } from "react";
import { createCode } from "../api";
import { ArrowLeftIcon, PlusIcon } from "./Icons";
import { ErrorAlert, PageHeader, Panel } from "./Layout";

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
    <div className="narrow">
      <PageHeader
        eyebrow={
          <a href="#/">
            <ArrowLeftIcon />
            All codes
          </a>
        }
        title="New QR code"
        description="The QR code points at a short tracking link that records each scan, then forwards the visitor to your destination. You can change the destination later without reprinting."
      />
      <form onSubmit={submit}>
        <Panel title="Details">
          <div className="field">
            <label className="field-label" htmlFor="code-name">
              Name <span className="field-optional">(optional)</span>
            </label>
            <input
              id="code-name"
              className="field-input"
              type="text"
              maxLength={200}
              autoFocus
              placeholder="e.g. Spring flyer"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="code-target">
              Destination URL
            </label>
            <input
              id="code-target"
              className="field-input"
              type="text"
              inputMode="url"
              required
              placeholder="https://example.com/landing-page"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
            />
            <span className="field-hint">Where people land after scanning.</span>
          </div>
          {error && <ErrorAlert>{error}</ErrorAlert>}
          <div>
            <button type="submit" className="button button--primary" disabled={busy}>
              <PlusIcon />
              {busy ? "Creating…" : "Create QR code"}
            </button>
          </div>
        </Panel>
      </form>
    </div>
  );
}
