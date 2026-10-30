import { useCallback, useEffect, useMemo, useState } from "react";
import { deleteCode, getCode, listVisits, updateCode, type QrCode, type Visit } from "../api";
import {
  GRANULARITIES,
  MAX_BUCKETS,
  bucketCount,
  bucketize,
  byDayOfWeek,
  byHourOfDay,
  formatBucket,
  type Granularity,
} from "../aggregate";
import { deviceFromUserAgent, fileSafe, formatDateTime, timeAgo } from "../format";
import BarChart from "./BarChart";
import { ArrowLeftIcon, CheckIcon, CopyIcon, DownloadIcon, PencilIcon, TrashIcon } from "./Icons";
import { ErrorAlert, PageHeader, Panel, Spinner } from "./Layout";
import QrImage, { downloadPng, downloadSvg } from "./QrImage";

const RANGES = [
  { key: "1h", label: "1H", ms: 3_600_000, granularity: "minute" },
  { key: "24h", label: "24H", ms: 86_400_000, granularity: "hour" },
  { key: "7d", label: "7D", ms: 7 * 86_400_000, granularity: "hour" },
  { key: "30d", label: "30D", ms: 30 * 86_400_000, granularity: "day" },
  { key: "90d", label: "90D", ms: 90 * 86_400_000, granularity: "day" },
  { key: "1y", label: "1Y", ms: 365 * 86_400_000, granularity: "week" },
  { key: "all", label: "All", ms: null, granularity: null },
] as const;
type RangeKey = (typeof RANGES)[number]["key"];

const REFRESH_MS = 30_000;
const HOURS = Array.from({ length: 24 }, (_, h) =>
  new Date(2000, 0, 1, h).toLocaleTimeString(undefined, { hour: "numeric" }),
);
const WEEKDAYS = Array.from({ length: 7 }, (_, i) =>
  new Date(2024, 0, 1 + i).toLocaleDateString(undefined, { weekday: "short" }),
); // 2024-01-01 is a Monday

/** The finest granularity that keeps the chart readable for an arbitrary span. */
function autoGranularity(from: Date, to: Date): Granularity {
  return (["hour", "day", "week", "month"] as const).find((g) => bucketCount(from, to, g) <= 200) ?? "month";
}

export default function CodeDetail({ id }: { id: string }) {
  const [code, setCode] = useState<QrCode>();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [error, setError] = useState<string>();
  const [rangeKey, setRangeKey] = useState<RangeKey>("7d");
  const [granularity, setGranularity] = useState<Granularity>("hour");
  const [window_, setWindow] = useState<{ from: Date; to: Date }>();
  const [copied, setCopied] = useState(false);

  const range = RANGES.find((r) => r.key === rangeKey)!;

  const load = useCallback(async () => {
    try {
      const c = await getCode(id);
      const to = new Date();
      const from = range.ms ? new Date(to.getTime() - range.ms) : new Date(c.createdAt);
      const v = await listVisits(id, from, to);
      setCode(c);
      setVisits(v);
      setWindow({ from, to });
      setError(undefined);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [id, range.ms]);

  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  function selectRange(key: RangeKey) {
    const r = RANGES.find((x) => x.key === key)!;
    setRangeKey(key);
    if (r.granularity) setGranularity(r.granularity);
    else if (code) setGranularity(autoGranularity(new Date(code.createdAt), new Date()));
  }

  const timestamps = useMemo(() => visits.map((v) => v.at), [visits]);
  const buckets = useMemo(
    () => (window_ ? bucketize(timestamps, window_.from, window_.to, granularity) : []),
    [timestamps, window_, granularity],
  );

  if (error && !code) return <ErrorAlert>Could not load this QR code: {error}</ErrorAlert>;
  if (!code || !window_) return <Spinner label="Loading QR code" />;

  const peak = buckets.reduce((best, b) => (b.count > best.count ? b : best), buckets[0]);
  const granularityLabel = GRANULARITIES.find((g) => g.key === granularity)!.label.toLowerCase();
  const title = code.name || "Untitled QR code";
  const recent = visits.slice(-25).reverse();

  async function rename() {
    const name = prompt("Name", code!.name);
    if (name !== null) setCode(await updateCode(id, { name }));
  }

  async function changeTarget() {
    const targetUrl = prompt("New destination URL (the printed QR code keeps working)", code!.targetUrl);
    if (!targetUrl) return;
    try {
      setCode(await updateCode(id, { targetUrl }));
    } catch (err) {
      alert((err as Error).message);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(code!.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function remove() {
    if (!confirm(`Delete "${title}" and all of its scan history? The QR code will stop working.`)) return;
    await deleteCode(id);
    window.location.hash = "/";
  }

  return (
    <>
      <PageHeader
        eyebrow={
          <a href="#/">
            <ArrowLeftIcon />
            All codes
          </a>
        }
        title={title}
        actions={
          <>
            <button className="button button--secondary button--sm" onClick={rename}>
              <PencilIcon />
              Rename
            </button>
            <button className="button button--danger button--sm" onClick={remove}>
              <TrashIcon />
              Delete
            </button>
          </>
        }
      />

      <div className="detail-grid">
        <Panel title="QR code" className="qr-panel">
          <div className="qr-card">
            <QrImage value={code.shortUrl} size={220} />
            <div className="qr-downloads">
              <button className="button button--secondary button--sm" onClick={() => downloadPng(code.shortUrl, fileSafe(title))}>
                <DownloadIcon />
                PNG
              </button>
              <button className="button button--secondary button--sm" onClick={() => downloadSvg(code.shortUrl, fileSafe(title))}>
                <DownloadIcon />
                SVG
              </button>
            </div>
          </div>
          <dl className="qr-facts">
            <div>
              <dt>Tracking link</dt>
              <dd>
                <code className="truncate" title={code.shortUrl}>
                  {code.shortUrl}
                </code>
                <button className="button button--link" onClick={copyLink}>
                  {copied ? <CheckIcon /> : <CopyIcon />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </dd>
            </div>
            <div>
              <dt>Destination</dt>
              <dd>
                <a href={code.targetUrl} target="_blank" rel="noreferrer" className="truncate" title={code.targetUrl}>
                  {code.targetUrl}
                </a>
                <button className="button button--link" onClick={changeTarget}>
                  Change
                </button>
              </dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatDateTime(code.createdAt)}</dd>
            </div>
          </dl>
        </Panel>

        <div className="stats">
          <div className="stat-row stat-row--four">
            <div className="stat stat--hero">
              <span className="stat-label">Total scans</span>
              <span className="stat-value">{code.visitCount.toLocaleString()}</span>
            </div>
            <div className="stat">
              <span className="stat-label">In selected range</span>
              <span className="stat-value">{visits.length.toLocaleString()}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Busiest {granularityLabel}</span>
              <span className="stat-value">{peak && peak.count > 0 ? peak.count.toLocaleString() : "–"}</span>
              {peak && peak.count > 0 && <span className="stat-note">{formatBucket(peak.start, granularity)}</span>}
            </div>
            <div className="stat">
              <span className="stat-label">Last scan</span>
              <span className="stat-value">{timeAgo(code.lastVisitAt)}</span>
            </div>
          </div>

          <Panel
            title={`Scans per ${granularityLabel}`}
            actions={
              <>
                <div className="segmented" role="group" aria-label="Time range">
                  {RANGES.map((r) => (
                    <button key={r.key} aria-pressed={r.key === rangeKey} onClick={() => selectRange(r.key)}>
                      {r.label}
                    </button>
                  ))}
                </div>
                <div className="segmented" role="group" aria-label="Group by">
                  {GRANULARITIES.map((g) => {
                    const tooMany = bucketCount(window_.from, window_.to, g.key) > MAX_BUCKETS;
                    return (
                      <button
                        key={g.key}
                        aria-pressed={g.key === granularity}
                        disabled={tooMany}
                        title={tooMany ? "Too many data points for this range" : undefined}
                        onClick={() => setGranularity(g.key)}
                      >
                        {g.label}
                      </button>
                    );
                  })}
                </div>
              </>
            }
          >
            <BarChart
              labels={buckets.map((b) => formatBucket(b.start, granularity))}
              values={buckets.map((b) => b.count)}
              ariaLabel={`Scans per ${granularityLabel}, ${range.label} range`}
            />
            <details className="chart-table">
              <summary>Show as table</summary>
              <table>
                <thead>
                  <tr>
                    <th>{GRANULARITIES.find((g) => g.key === granularity)!.label}</th>
                    <th className="num">Scans</th>
                  </tr>
                </thead>
                <tbody>
                  {buckets
                    .filter((b) => b.count > 0)
                    .reverse()
                    .map((b) => (
                      <tr key={b.start.getTime()}>
                        <td>{formatBucket(b.start, granularity)}</td>
                        <td className="num">{b.count.toLocaleString()}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </details>
          </Panel>

          <div className="two-col">
            <Panel title="By hour of day">
              <BarChart labels={HOURS} values={byHourOfDay(timestamps)} ariaLabel="Scans by hour of day" height={180} />
            </Panel>
            <Panel title="By day of week">
              <BarChart labels={WEEKDAYS} values={byDayOfWeek(timestamps)} ariaLabel="Scans by day of week" height={180} />
            </Panel>
          </div>

          <Panel title="Recent scans" description="The latest 25 in the selected range." flush>
            {recent.length === 0 ? (
              <p className="panel-empty">No scans in this range yet.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Device</th>
                    <th>Referrer</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((v, i) => (
                    <tr key={i}>
                      <td>{formatDateTime(v.at)}</td>
                      <td title={v.userAgent}>{deviceFromUserAgent(v.userAgent)}</td>
                      <td className="truncate">{v.referer || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
