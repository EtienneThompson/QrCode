import { useEffect, useState } from "react";
import { listCodes, type QrCode } from "../api";
import { timeAgo } from "../format";
import { ChevronRightIcon, PlusIcon, QrCodeIcon } from "./Icons";
import { ErrorAlert, PageHeader, Panel, Spinner } from "./Layout";
import QrImage from "./QrImage";

export default function CodeList() {
  const [codes, setCodes] = useState<QrCode[]>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    listCodes().then(setCodes, (err) => setError(err.message));
  }, []);

  const totalScans = codes?.reduce((sum, c) => sum + c.visitCount, 0) ?? 0;

  return (
    <>
      <PageHeader
        eyebrow="QR Tracker"
        title="My QR codes"
        description="Each code points at a tracking link that counts scans, then forwards to your destination."
      />
      {error && <ErrorAlert>Could not load QR codes: {error}</ErrorAlert>}
      {codes && codes.length > 0 && (
        <div className="stat-row">
          <div className="stat">
            <span className="stat-label">Codes</span>
            <span className="stat-value">{codes.length.toLocaleString()}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Total scans</span>
            <span className="stat-value">{totalScans.toLocaleString()}</span>
          </div>
        </div>
      )}
      <Panel title="Codes" description="Only you can see and manage these." flush>
        {!codes ? (
          !error && <Spinner label="Loading QR codes" />
        ) : codes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <QrCodeIcon />
            </div>
            <h3 className="empty-state-title">No QR codes yet</h3>
            <p className="empty-state-description">Create one to start tracking scans.</p>
            <a href="#/new" className="button button--primary empty-state-action">
              <PlusIcon />
              New QR code
            </a>
          </div>
        ) : (
          <ul className="code-list">
            {codes.map((code) => (
              <li key={code.id}>
                <a href={`#/codes/${code.id}`} className="code-row">
                  <QrImage value={code.shortUrl} size={56} />
                  <span className="code-row-text">
                    <span className="code-row-name">{code.name || code.targetUrl}</span>
                    <span className="code-row-target">→ {code.targetUrl}</span>
                    <span className="code-row-meta">
                      Created {timeAgo(code.createdAt)} · last scan {timeAgo(code.lastVisitAt).toLowerCase()}
                    </span>
                  </span>
                  <span className="code-row-count">
                    <span className="code-row-count-value">{code.visitCount.toLocaleString()}</span>
                    <span className="code-row-count-label">{code.visitCount === 1 ? "scan" : "scans"}</span>
                  </span>
                  <ChevronRightIcon />
                </a>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
