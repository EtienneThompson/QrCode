import { useEffect, useState } from "react";
import { listCodes, type QrCode } from "../api";
import { timeAgo } from "../format";
import QrImage from "./QrImage";

export default function CodeList() {
  const [codes, setCodes] = useState<QrCode[]>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    listCodes().then(setCodes, (err) => setError(err.message));
  }, []);

  if (error) return <p className="error">Could not load QR codes: {error}</p>;
  if (!codes) return <p className="muted">Loading…</p>;

  if (codes.length === 0) {
    return (
      <section className="card narrow empty">
        <h1>No QR codes yet</h1>
        <p className="muted">Create one to start tracking scans.</p>
        <a href="#/new" className="button primary">
          + New QR code
        </a>
      </section>
    );
  }

  const totalScans = codes.reduce((sum, c) => sum + c.visitCount, 0);

  return (
    <section>
      <div className="page-head">
        <h1>My QR codes</h1>
        <div className="summary">
          <div>
            <span className="stat-value">{codes.length}</span>
            <span className="stat-label">codes</span>
          </div>
          <div>
            <span className="stat-value">{totalScans.toLocaleString()}</span>
            <span className="stat-label">total scans</span>
          </div>
        </div>
      </div>
      <ul className="code-list">
        {codes.map((code) => (
          <li key={code.id}>
            <a href={`#/codes/${code.id}`} className="code-row card">
              <QrImage value={code.shortUrl} size={64} />
              <div className="code-info">
                <strong>{code.name || code.targetUrl}</strong>
                <span className="muted truncate">→ {code.targetUrl}</span>
                <span className="muted small">
                  Created {timeAgo(code.createdAt)} · last scan {timeAgo(code.lastVisitAt).toLowerCase()}
                </span>
              </div>
              <div className="code-count">
                <span className="stat-value">{code.visitCount.toLocaleString()}</span>
                <span className="stat-label">scans</span>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
