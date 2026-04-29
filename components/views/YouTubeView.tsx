"use client";
import { useState, useMemo } from "react";
import { ytShorts, ytLongform } from "@/lib/data";
import {
  MetricCard, OverviewGrid, SectionLabel, VideoCard,
  LikeDislikeBar, InlineMetrics, FormatToggle,
  fmt, fmtSec
} from "@/components/ui";
import AnalyticsChart from "@/components/AnalyticsChart";

const COLORS: Record<string, string> = {
  ibrahim: "#FF4444",
  glendora: "#FF8C00",
};

const ACCOUNTS = [
  { id: "ibrahim",  label: "Team Ibrahim YT",  color: "#FF4444" },
  { id: "glendora", label: "Glendora YT",       color: "#FF8C00" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseYM(dateStr: string): string {
  if (!dateStr || dateStr.trim() === "") return "";
  const s = dateStr.trim();
  if (/^\d{4}-\d{2}/.test(s)) return s.slice(0, 7);
  const months: Record<string, string> = {
    jan:"01",feb:"02",mar:"03",apr:"04",may:"05",jun:"06",
    jul:"07",aug:"08",sep:"09",oct:"10",nov:"11",dec:"12"
  };
  const m = s.match(/^([A-Za-z]{3})\s+\d+,\s*(\d{4})$/);
  if (m) { const mo = months[m[1].toLowerCase()]; if (mo) return `${m[2]}-${mo}`; }
  const d = new Date(s);
  if (!isNaN(d.getTime())) return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  return "";
}

function filterByMonth(videos: any[], dateRange: string) {
  if (dateRange === "all") return videos;
  if (dateRange === "unpublished") return videos.filter(v => !parseYM(v.publishedAt || ""));
  return videos.filter(v => parseYM(v.publishedAt || "") === dateRange);
}

function parseAvgDur(val: string | number): number {
  if (!val) return 0;
  if (typeof val === "number") return val;
  const parts = String(val).split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

function monthLabel(ym: string): string {
  if (!ym) return "Unknown";
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const [year, mo] = ym.split("-");
  return `${MONTHS[parseInt(mo) - 1]} ${year}`;
}

function getMonths(videos: any[]) {
  const seen = new Set<string>();
  videos.forEach(v => { const ym = parseYM(v.publishedAt || ""); if (ym) seen.add(ym); });
  return Array.from(seen).sort((a, b) => b.localeCompare(a));
}

function sumMetric(videos: any[], key: string) {
  return videos.reduce((a, v) => a + (Number(v[key]) || 0), 0);
}

// ─── Shared tab bar ───────────────────────────────────────────────────────────

function TabBar({ tabs, active, onChange }: { tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: 12 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          style={{ padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13,
            background: active === t.id ? "rgba(255,255,255,0.1)" : "transparent",
            color: active === t.id ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)",
            fontWeight: active === t.id ? 600 : 400 }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── Metric pill selector ─────────────────────────────────────────────────────

function MetricPills({ metrics, active, onChange, color }: {
  metrics: { key: string; label: string }[]; active: string; onChange: (k: string) => void; color: string;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
      {metrics.map(m => (
        <button key={m.key} onClick={() => onChange(m.key)}
          style={{ padding: "4px 12px", borderRadius: 99,
            border: `1px solid ${m.key === active ? color + "44" : "rgba(255,255,255,0.1)"}`,
            background: m.key === active ? color + "18" : "transparent",
            color: m.key === active ? color : "rgba(255,255,255,0.45)",
            fontSize: 11, cursor: "pointer", fontWeight: m.key === active ? 600 : 400 }}>
          {m.label}
        </button>
      ))}
    </div>
  );
}

// ─── Video table (visible metrics, no expand needed) ──────────────────────────

function VideoTable({ videos, format, color, sortKey, onSort }: {
  videos: any[]; format: "shorts" | "longform"; color: string; sortKey: string; onSort: (k: string) => void;
}) {
  const cols = format === "shorts"
    ? ["views","likes","comments","stayedToWatch","ctr","subscribers"]
    : ["views","likes","comments","ctr","avgPctViewed","subscribers"];

  const colLabels: Record<string, string> = {
    views:"Views", likes:"Likes", comments:"Comments", stayedToWatch:"Stayed %",
    ctr:"CTR %", subscribers:"Subs", avgPctViewed:"Avg viewed", impressions:"Impressions",
  };

  const maxVal = Math.max(...videos.map(v => Number(v[sortKey]) || 0), 1);
  const gridCols = `24px 1fr ${cols.map(() => "68px").join(" ")}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {/* Header */}
      <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: 8,
        padding: "6px 12px", fontSize: 10, color: "rgba(255,255,255,0.3)",
        textTransform: "uppercase", letterSpacing: "0.06em" }}>
        <div>#</div>
        <div>Title</div>
        {cols.map(k => (
          <button key={k} onClick={() => onSort(k)}
            style={{ textAlign: "right", background: "none", border: "none", cursor: "pointer", padding: 0,
              color: k === sortKey ? color : "rgba(255,255,255,0.3)",
              fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em",
              fontWeight: k === sortKey ? 700 : 400 }}>
            {colLabels[k]}{k === sortKey ? " ↓" : ""}
          </button>
        ))}
      </div>

      {/* Rows */}
      {videos.map((v, i) => {
        const barW = Math.round((Number(v[sortKey]) || 0) / maxVal * 100);
        const ytId = v.videoId || "";
        const link = ytId ? `https://youtube.com/${format === "shorts" ? "shorts/" : "watch?v="}${ytId}` : null;
        return (
          <div key={v.id || i} style={{ display: "grid", gridTemplateColumns: gridCols, gap: 8,
            alignItems: "center", padding: "10px 12px",
            background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color, textAlign: "center" }}>{i + 1}</div>
            <div>
              {link
                ? <a href={link} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 12, fontWeight: 500, color: "white", textDecoration: "none",
                      display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    title={v.title}>{v.title || "Untitled"}</a>
                : <div style={{ fontSize: 12, fontWeight: 500, color: "white",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.title || "Untitled"}</div>
              }
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{v.publishedAt || "Unpublished"}</div>
              <div style={{ height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 99, marginTop: 3, overflow: "hidden" }}>
                <div style={{ width: `${barW}%`, height: "100%", background: color + "88", borderRadius: 99 }} />
              </div>
            </div>
            {cols.map(k => {
              const val = Number(v[k]) || 0;
              let display = fmt(val);
              if (k === "ctr") display = val ? `${val.toFixed(2)}%` : "—";
              else if (k === "stayedToWatch" || k === "avgPctViewed") display = val ? `${val}%` : "—";
              return (
                <div key={k} style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.85)", textAlign: "right" }}>
                  {display}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ─── Chart section ────────────────────────────────────────────────────────────

const SHORTS_METRICS  = [
  { key: "views",         label: "Views" },
  { key: "likes",         label: "Likes" },
  { key: "comments",      label: "Comments" },
  { key: "stayedToWatch", label: "Stayed %" },
  { key: "ctr",           label: "CTR %" },
  { key: "subscribers",   label: "Subscribers" },
  { key: "impressions",   label: "Impressions" },
];

const LONGFORM_METRICS = [
  { key: "views",         label: "Views" },
  { key: "likes",         label: "Likes" },
  { key: "comments",      label: "Comments" },
  { key: "ctr",           label: "CTR %" },
  { key: "avgPctViewed",  label: "Avg % viewed" },
  { key: "subscribers",   label: "Subscribers" },
  { key: "impressions",   label: "Impressions" },
  { key: "watchTimeHours",label: "Watch hrs" },
];

function ChartSection({ allVideos, format, color }: {
  allVideos: any[]; format: "shorts" | "longform"; color: string;
}) {
  const chartMetricsList = format === "shorts" ? SHORTS_METRICS : LONGFORM_METRICS;
  const [chartMetric, setChartMetric] = useState("views");
  const [chartType,   setChartType]   = useState<"bar" | "line">("bar");
  const [selMonths,   setSelMonths]   = useState<string[]>([]);
  const [selVideos,   setSelVideos]   = useState<string[]>([]);

  const allMonths = useMemo(() => getMonths(allVideos), [allVideos]);

  // When months are selected, show videos in those months
  const videosInMonths = useMemo(() => {
    if (!selMonths.length) return allVideos;
    return allVideos.filter(v => selMonths.includes(parseYM(v.publishedAt || "")));
  }, [allVideos, selMonths]);

  const allTitles = useMemo(() =>
    Array.from(new Set(videosInMonths.map(v => v.title || "Untitled"))).slice(0, 30),
    [videosInMonths]
  );

  // Final filtered set for chart
  const chartVideos = useMemo(() => {
    let vids = selMonths.length ? videosInMonths : allVideos;
    if (selVideos.length) vids = vids.filter(v => selVideos.includes(v.title || "Untitled"));
    return vids;
  }, [videosInMonths, selVideos, selMonths, allVideos]);

  // Build chart data by month
  const chartData = useMemo(() => {
    const byMonth: Record<string, number[]> = {};
    chartVideos.forEach(v => {
      const ym = parseYM(v.publishedAt || "");
      if (!ym) return;
      if (!byMonth[ym]) byMonth[ym] = [];
      byMonth[ym].push(Number(v[chartMetric]) || 0);
    });
    const sortedMs = Object.keys(byMonth).sort();
    return {
      labels: sortedMs.map(monthLabel),
      values: sortedMs.map(ym => byMonth[ym].reduce((a, b) => a + b, 0)),
    };
  }, [chartVideos, chartMetric]);

  const toggleMonth = (ym: string) => {
    setSelMonths(prev => prev.includes(ym) ? prev.filter(m => m !== ym) : [...prev, ym]);
    setSelVideos([]); // reset video filter when months change
  };

  const toggleVideo = (title: string) =>
    setSelVideos(prev => prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]);

  return (
    <div>
      {/* Metric */}
      <SectionLabel>Metric</SectionLabel>
      <MetricPills metrics={chartMetricsList} active={chartMetric} onChange={setChartMetric} color={color} />

      {/* Chart type */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {["bar", "line"].map(t => (
          <button key={t} onClick={() => setChartType(t as "bar" | "line")}
            style={{ padding: "4px 12px", borderRadius: 99,
              border: `1px solid ${chartType === t ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)"}`,
              background: chartType === t ? "rgba(255,255,255,0.1)" : "transparent",
              color: chartType === t ? "white" : "rgba(255,255,255,0.4)", fontSize: 11, cursor: "pointer" }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 16 }}>
        {/* Left: filters */}
        <div>
          {/* Month filter */}
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Filter by month {selMonths.length > 0 && `(${selMonths.length})`}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 3, maxHeight: 200, overflowY: "auto" }}>
              <button onClick={() => { setSelMonths([]); setSelVideos([]); }}
                style={{ textAlign: "left", padding: "5px 8px", borderRadius: 6, border: "none", cursor: "pointer",
                  background: selMonths.length === 0 ? color + "18" : "transparent",
                  color: selMonths.length === 0 ? color : "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: selMonths.length === 0 ? 600 : 400 }}>
                All months
              </button>
              {allMonths.map(ym => {
                const on = selMonths.includes(ym);
                return (
                  <button key={ym} onClick={() => toggleMonth(ym)}
                    style={{ textAlign: "left", padding: "5px 8px", borderRadius: 6, border: "none", cursor: "pointer",
                      background: on ? color + "18" : "transparent",
                      color: on ? color : "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: on ? 600 : 400,
                      display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 12, height: 12, borderRadius: 3,
                      border: `1px solid ${on ? color : "rgba(255,255,255,0.2)"}`,
                      background: on ? color : "transparent", display: "inline-flex",
                      alignItems: "center", justifyContent: "center", fontSize: 9, color: "white", flexShrink: 0 }}>
                      {on ? "✓" : ""}
                    </span>
                    {monthLabel(ym)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Video filter — shows once months are selected */}
          {allTitles.length > 0 && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                Filter by video {selVideos.length > 0 && `(${selVideos.length})`}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 3, maxHeight: 240, overflowY: "auto" }}>
                <button onClick={() => setSelVideos([])}
                  style={{ textAlign: "left", padding: "5px 8px", borderRadius: 6, border: "none", cursor: "pointer",
                    background: selVideos.length === 0 ? color + "18" : "transparent",
                    color: selVideos.length === 0 ? color : "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: selVideos.length === 0 ? 600 : 400 }}>
                  All videos
                </button>
                {allTitles.map(title => {
                  const on = selVideos.includes(title);
                  return (
                    <button key={title} onClick={() => toggleVideo(title)}
                      style={{ textAlign: "left", padding: "5px 8px", borderRadius: 6, border: "none", cursor: "pointer",
                        background: on ? color + "18" : "transparent",
                        color: on ? color : "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: on ? 600 : 400,
                        display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 12, height: 12, borderRadius: 3,
                        border: `1px solid ${on ? color : "rgba(255,255,255,0.2)"}`,
                        background: on ? color : "transparent", display: "inline-flex",
                        alignItems: "center", justifyContent: "center", fontSize: 9, color: "white", flexShrink: 0 }}>
                        {on ? "✓" : ""}
                      </span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>{title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: chart */}
        <div>
          {chartData.labels.length === 0
            ? <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
                No data for selected filters.
              </div>
            : chartData.labels.length === 1
              ? <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
                  Only one month of data — select more months or import more CSVs to see a trend.
                </div>
              : <AnalyticsChart type={chartType} labels={chartData.labels}
                  datasets={[{ label: chartMetricsList.find(m => m.key === chartMetric)?.label || chartMetric, data: chartData.values, color }]} />
          }
          {/* Show which videos are contributing */}
          {chartVideos.length > 0 && (
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 8, textAlign: "center" }}>
              {chartVideos.length} video{chartVideos.length !== 1 ? "s" : ""} · {selVideos.length > 0 ? selVideos.length + " selected" : "all"} · showing {chartMetricsList.find(m => m.key === chartMetric)?.label} by month
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Compare section ──────────────────────────────────────────────────────────

function CompareSection({ allVideos, format, color }: {
  allVideos: any[]; format: "shorts" | "longform"; color: string;
}) {
  const metricsList = format === "shorts" ? SHORTS_METRICS : LONGFORM_METRICS;
  const [cmpMode,   setCmpMode]   = useState("month");
  const [cmpMetric, setCmpMetric] = useState("views");
  const [m1, setM1] = useState("");
  const [m2, setM2] = useState("");
  const [v1, setV1] = useState(0);
  const [v2, setV2] = useState(1);
  const [d1, setD1] = useState(""); const [d2, setD2] = useState("");
  const [d3, setD3] = useState(""); const [d4, setD4] = useState("");

  const months = useMemo(() => getMonths(allVideos), [allVideos]);
  const mon1 = m1 || months[0] || "";
  const mon2 = m2 || months[1] || "";

  const getMonthVids = (ym: string) => allVideos.filter(v => parseYM(v.publishedAt || "") === ym);
  const m1Vids = getMonthVids(mon1); const m2Vids = getMonthVids(mon2);
  const m1Val = sumMetric(m1Vids, cmpMetric); const m2Val = sumMetric(m2Vids, cmpMetric);
  const delta = m1Val - m2Val; const deltaPct = m2Val > 0 ? Math.round(delta / m2Val * 100) : 0;

  const allFilteredVids = filterByMonth(allVideos, "all");
  const vid1 = allFilteredVids[v1];
  const vid2 = allFilteredVids[v2];

  return (
    <div>
      {/* Mode */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {[
          { id: "month",  label: "Month vs month" },
          { id: "video",  label: "Video vs video" },
          { id: "custom", label: "Custom range" },
        ].map(m => (
          <button key={m.id} onClick={() => setCmpMode(m.id)}
            style={{ padding: "6px 14px", borderRadius: 8,
              border: `1px solid ${cmpMode === m.id ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)"}`,
              background: cmpMode === m.id ? "rgba(255,255,255,0.1)" : "transparent",
              color: cmpMode === m.id ? "white" : "rgba(255,255,255,0.4)",
              fontSize: 12, cursor: "pointer", fontWeight: cmpMode === m.id ? 600 : 400 }}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Month vs month */}
      {cmpMode === "month" && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            {[{ val: mon1, set: setM1 }, { val: mon2, set: setM2 }].map(({ val, set }, idx) => (
              <select key={idx} value={val} onChange={e => set(e.target.value)}
                style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "#1a1a2e", color: "white", fontSize: 13, cursor: "pointer" }}>
                {months.map(ym => <option key={ym} value={ym}>{monthLabel(ym)}</option>)}
              </select>
            ))}
            {months.length < 2 && <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Import data from multiple months to compare</span>}
          </div>

          <SectionLabel>Metric to compare</SectionLabel>
          <MetricPills metrics={metricsList} active={cmpMetric} onChange={setCmpMetric} color={color} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            {[{ ym: mon1, val: m1Val, vids: m1Vids, isA: true }, { ym: mon2, val: m2Val, vids: m2Vids, isA: false }].map(({ ym, val, vids, isA }) => (
              <div key={ym} style={{ background: isA ? color + "12" : "rgba(255,255,255,0.04)",
                border: `1px solid ${isA ? color + "33" : "rgba(255,255,255,0.08)"}`, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, color: isA ? color : "rgba(255,255,255,0.4)", marginBottom: 6 }}>
                  {monthLabel(ym)}{isA ? " — A" : " — B"}
                </div>
                <div style={{ fontSize: 26, fontWeight: 700, color: isA ? color : "white", marginBottom: 4 }}>
                  {metricsList.find(m => m.key === cmpMetric)?.label.includes("%") ? `${val.toFixed(1)}%` : fmt(val)}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                  {metricsList.find(m => m.key === cmpMetric)?.label} · {vids.length} videos
                </div>
                {/* Show all metrics for the month */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 12 }}>
                  {metricsList.map(m => (
                    <div key={m.key} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 6, padding: "6px 8px" }}>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 2 }}>{m.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: m.key === cmpMetric ? (isA ? color : "white") : "rgba(255,255,255,0.7)" }}>
                        {fmt(sumMetric(vids, m.key))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", padding: "10px 16px", background: "rgba(255,255,255,0.04)", borderRadius: 8,
            fontSize: 13, color: delta >= 0 ? "#22c55e" : "#ef4444", marginBottom: 16 }}>
            {delta >= 0 ? "▲" : "▼"} {fmt(Math.abs(delta))} ({deltaPct >= 0 ? "+" : ""}{deltaPct}%) — {monthLabel(mon1)} vs {monthLabel(mon2)}
          </div>

          <AnalyticsChart type="bar" labels={metricsList.map(m => m.label)}
            datasets={[
              { label: monthLabel(mon1), data: metricsList.map(m => sumMetric(m1Vids, m.key)), color },
              { label: monthLabel(mon2), data: metricsList.map(m => sumMetric(m2Vids, m.key)), color: "#888888" },
            ]} />
        </>
      )}

      {/* Video vs video */}
      {cmpMode === "video" && (
        allFilteredVids.length < 2
          ? <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)", fontSize: 14 }}>Need at least 2 videos. Try selecting "All time".</div>
          : <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              {[v1, v2].map((vi, idx) => (
                <select key={idx} value={vi} onChange={e => idx === 0 ? setV1(Number(e.target.value)) : setV2(Number(e.target.value))}
                  style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "#1a1a2e", color: "white", fontSize: 12, cursor: "pointer", maxWidth: 260 }}>
                  {allFilteredVids.map((v, i) => <option key={i} value={i}>{(v.title || "Untitled").slice(0, 55)}</option>)}
                </select>
              ))}
            </div>
            {[vid1, vid2].filter(Boolean).map((v, idx) => (
              <div key={idx} style={{ background: idx === 0 ? color + "10" : "rgba(255,255,255,0.04)",
                border: `1px solid ${idx === 0 ? color + "33" : "rgba(255,255,255,0.08)"}`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "white", marginBottom: 8 }}>{v?.title || "Untitled"}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>{v?.publishedAt || "—"}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(110px,1fr))", gap: 6 }}>
                  {metricsList.map(m => {
                    const val = Number(v?.[m.key] || 0);
                    const display = m.label.includes("%") ? `${val.toFixed(1)}%` : fmt(val);
                    return (
                      <div key={m.key} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "8px 10px" }}>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>{m.label}</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: idx === 0 ? color : "white" }}>{display}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <AnalyticsChart type="bar" labels={metricsList.map(m => m.label)}
              datasets={[
                { label: (vid1?.title || "Video A").slice(0, 25), data: metricsList.map(m => Number(vid1?.[m.key]) || 0), color },
                { label: (vid2?.title || "Video B").slice(0, 25), data: metricsList.map(m => Number(vid2?.[m.key]) || 0), color: "#888888" },
              ]} />
          </>
      )}

      {/* Custom range */}
      {cmpMode === "custom" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "flex-start", marginBottom: 16 }}>
            {[
              { label: "Range A", d1, setD1, d2, setD2 },
              null,
              { label: "Range B", d1: d3, setD1: setD3, d2: d4, setD2: setD4 },
            ].map((item, idx) => item === null
              ? <span key="vs" style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, textAlign: "center", paddingTop: 22 }}>vs</span>
              : (
                <div key={idx}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>{item.label}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <input type="date" value={item.d1} onChange={e => item.setD1(e.target.value)}
                      style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "#1a1a2e", color: "white", fontSize: 12 }} />
                    <input type="date" value={item.d2} onChange={e => item.setD2(e.target.value)}
                      style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "#1a1a2e", color: "white", fontSize: 12 }} />
                  </div>
                </div>
              )
            )}
          </div>
          {d1 && d2 && d3 && d4 && (() => {
            const ra = allVideos.filter(v => { const dt = new Date(v.publishedAt || ""); return dt >= new Date(d1) && dt <= new Date(d2); });
            const rb = allVideos.filter(v => { const dt = new Date(v.publishedAt || ""); return dt >= new Date(d3) && dt <= new Date(d4); });
            const aV = sumMetric(ra, "views"); const bV = sumMetric(rb, "views"); const dd = aV - bV;
            return (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                  {[{ label: `${d1} → ${d2}`, val: aV, vids: ra, isA: true }, { label: `${d3} → ${d4}`, val: bV, vids: rb, isA: false }].map(({ label, val, vids, isA }) => (
                    <div key={label} style={{ background: isA ? color + "12" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${isA ? color + "33" : "rgba(255,255,255,0.08)"}`, borderRadius: 12, padding: 14 }}>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>{label}</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: isA ? color : "white" }}>{fmt(val)}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>views · {vids.length} videos</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, marginTop: 10 }}>
                        {metricsList.slice(0, 6).map(m => (
                          <div key={m.key} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 6, padding: "5px 8px" }}>
                            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{m.label}</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>{fmt(sumMetric(vids, m.key))}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ textAlign: "center", padding: "8px 16px", background: "rgba(255,255,255,0.04)", borderRadius: 8,
                  fontSize: 13, color: dd >= 0 ? "#22c55e" : "#ef4444" }}>
                  Range A {dd >= 0 ? "▲" : "▼"} {fmt(Math.abs(dd))} ({bV > 0 ? Math.round(dd / bV * 100) : 0}%) vs Range B
                </div>
              </>
            );
          })()}
          {(!d1 || !d2 || !d3 || !d4) && (
            <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Select both date ranges above to compare.</div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "videos",   label: "All videos" },
  { id: "chart",    label: "Chart" },
  { id: "compare",  label: "Compare" },
];

export default function YouTubeView({
  dateRange,
  // Team Ibrahim
  shortsCsvData, longCsvData,
  // Glendora
  glendoraShortsData, glendoraLongData,
}: {
  dateRange: string;
  shortsCsvData?: any[];
  longCsvData?: any[];
  glendoraShortsData?: any[];
  glendoraLongData?: any[];
}) {
  const [account, setAccount] = useState("ibrahim");
  const [format,  setFormat]  = useState<"shorts" | "longform">("shorts");
  const [tab,     setTab]     = useState("overview");
  const [sortKey, setSortKey] = useState("views");

  const isGlendora = account === "glendora";
  const color = COLORS[account];

  const shortsSource = isGlendora
    ? (glendoraShortsData?.length ? glendoraShortsData : [])
    : (shortsCsvData?.length ? shortsCsvData : ytShorts);

  const longSource = isGlendora
    ? (glendoraLongData?.length ? glendoraLongData : [])
    : (longCsvData?.length ? longCsvData : ytLongform);

  const shortsVideos = filterByMonth(shortsSource, dateRange);
  const longVideos   = filterByMonth(longSource,   dateRange);
  const videos       = format === "shorts" ? shortsVideos : longVideos;
  const allVideos    = format === "shorts" ? shortsSource : longSource;
  const sorted       = useMemo(() =>
    [...videos].sort((a, b) => (Number(b[sortKey]) || 0) - (Number(a[sortKey]) || 0)),
    [videos, sortKey]
  );

  // Overview metrics
  const totViews    = videos.reduce((a, v) => a + (Number(v.views) || 0), 0);
  const totLikes    = videos.reduce((a, v) => a + (Number(v.likes) || 0), 0);
  const totComments = videos.reduce((a, v) => a + (Number(v.comments) || 0), 0);
  const totSubs     = videos.reduce((a, v) => a + (Number(v.subscribers) || 0), 0);
  const totImpr     = videos.reduce((a, v) => a + (Number(v.impressions) || 0), 0);
  const avgCTR      = videos.length ? (videos.reduce((a, v) => a + (Number(v.ctr) || 0), 0) / videos.length).toFixed(2) : "0";
  const avgStayed   = videos.length ? (videos.reduce((a, v) => a + (Number(v.stayedToWatch) || 0), 0) / videos.length).toFixed(1) : "0";
  const avgPct      = videos.length ? (videos.reduce((a, v) => a + (Number(v.avgPctViewed) || 0), 0) / videos.length).toFixed(1) : "0";

  return (
    <div>
      {/* Account selector */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {ACCOUNTS.map(acc => (
          <button key={acc.id} onClick={() => { setAccount(acc.id); setTab("overview"); }}
            style={{ padding: "6px 16px", borderRadius: 8,
              border: `1px solid ${account === acc.id ? acc.color + "44" : "rgba(255,255,255,0.1)"}`,
              background: account === acc.id ? acc.color + "18" : "transparent",
              color: account === acc.id ? acc.color : "rgba(255,255,255,0.4)",
              fontSize: 13, cursor: "pointer", fontWeight: account === acc.id ? 600 : 400 }}>
            {acc.label}
          </button>
        ))}
      </div>

      {/* Format toggle */}
      <FormatToggle
        value={format}
        onChange={v => { setFormat(v as "shorts" | "longform"); setTab("overview"); setSortKey("views"); }}
        options={[
          { id: "shorts",   label: `Shorts (${shortsVideos.length})` },
          { id: "longform", label: `Long-form (${longVideos.length})` },
        ]}
      />

      {/* Tabs */}
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        !videos.length
          ? <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)", fontSize: 14 }}>
              No data for this period. Import a CSV or select a different month.
              {isGlendora && <div style={{ marginTop: 8, fontSize: 12 }}>Import a <code>glendora-shorts.csv</code> or <code>glendora-longform.csv</code> file.</div>}
            </div>
          : <>
            <SectionLabel>{videos.length} videos · {dateRange === "all" ? "all time" : monthLabel(dateRange)}</SectionLabel>
            <OverviewGrid>
              <MetricCard label="Total views"          value={fmt(totViews)}        accent={color} />
              <MetricCard label="Total likes"          value={fmt(totLikes)}        accent={color} />
              <MetricCard label="Total comments"       value={fmt(totComments)}     accent={color} />
              <MetricCard label="Subscribers gained"   value={`+${fmt(totSubs)}`}   accent={color} />
              <MetricCard label="Avg. CTR"             value={`${avgCTR}%`}          accent={color} bar={parseFloat(avgCTR) * 10} />
              {format === "shorts" && <MetricCard label="Avg. stayed to watch" value={`${avgStayed}%`} accent={color} bar={parseFloat(avgStayed)} />}
              {format === "longform" && <MetricCard label="Avg. % viewed" value={`${avgPct}%`} accent={color} bar={parseFloat(avgPct)} />}
              <MetricCard label="Total impressions"    value={fmt(totImpr)}         accent={color} />
            </OverviewGrid>

            {/* Top video card — visible without clicking */}
            {sorted.length > 0 && (() => {
              const top = sorted[0];
              const share = totViews > 0 ? Math.round((Number(top.views) || 0) / totViews * 100) : 0;
              const dur = Number(top.duration) || 0;
              const ytId = top.videoId || "";
              const link = ytId ? `https://youtube.com/${format === "shorts" ? "shorts/" : "watch?v="}${ytId}` : null;
              return (
                <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 16, marginBottom: 16 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 600,
                    background: "#faeeda", color: "#854f0b", padding: "3px 10px", borderRadius: 99, marginBottom: 10 }}>
                    🏆 Top performer this period
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "white", marginBottom: 3 }}>{top.title || "Untitled"}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 12 }}>
                    {top.publishedAt || "—"}
                    {dur > 0 && <span style={{ marginLeft: 8 }}>{fmtSec(dur)}</span>}
                    {share > 0 && <span style={{ marginLeft: 8, color, fontWeight: 500 }}>{share}% of period's views</span>}
                  </div>
                  {/* All key metrics as visible pills */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8, marginBottom: 12 }}>
                    {[
                      { label: "Views",    val: fmt(Number(top.views) || 0) },
                      { label: "Likes",    val: fmt(Number(top.likes) || 0) },
                      { label: "Comments", val: fmt(Number(top.comments) || 0) },
                      { label: "CTR",      val: top.ctr ? `${Number(top.ctr).toFixed(2)}%` : "—" },
                      { label: "Subs gained", val: `+${fmt(Number(top.subscribers) || 0)}` },
                      ...(format === "shorts" ? [{ label: "Stayed to watch", val: top.stayedToWatch ? `${top.stayedToWatch}%` : "—" }] : []),
                      ...(format === "longform" ? [{ label: "Avg % viewed", val: top.avgPctViewed ? `${Number(top.avgPctViewed).toFixed(1)}%` : "—" }] : []),
                      { label: "Impressions", val: fmt(Number(top.impressions) || 0) },
                    ].map(({ label, val }) => (
                      <div key={label} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "8px 10px" }}>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "white" }}>{val}</div>
                      </div>
                    ))}
                  </div>
                  {link && (
                    <a href={link} target="_blank" rel="noopener noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8,
                        background: color + "18", color, fontSize: 12, fontWeight: 600, textDecoration: "none",
                        border: `1px solid ${color}33` }}>
                      ▶ Open on YouTube
                    </a>
                  )}
                </div>
              );
            })()}
          </>
      )}

      {/* ── ALL VIDEOS ── */}
      {tab === "videos" && (
        !sorted.length
          ? <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)", fontSize: 14 }}>No videos for this period.</div>
          : <VideoTable videos={sorted} format={format} color={color} sortKey={sortKey} onSort={setSortKey} />
      )}

      {/* ── CHART ── */}
      {tab === "chart" && (
        <ChartSection allVideos={allVideos} format={format} color={color} />
      )}

      {/* ── COMPARE ── */}
      {tab === "compare" && (
        <CompareSection allVideos={allVideos} format={format} color={color} />
      )}
    </div>
  );
}
