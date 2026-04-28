"use client";
import { useState, useMemo } from "react";
import { ytShorts, ytLongform } from "@/lib/data";
import {
  MetricCard, OverviewGrid, SectionLabel, VideoCard,
  LikeDislikeBar, DiscoveryBars, InlineMetrics, FormatToggle,
  fmt, fmtSec
} from "@/components/ui";
import AnalyticsChart from "@/components/AnalyticsChart";

const COLOR = "#FF4444";

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
  if (!ym) return "";
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const [year, mo] = ym.split("-");
  return `${MONTHS[parseInt(mo) - 1]} ${year}`;
}

// ─── Account selector ─────────────────────────────────────────────────────────

const ACCOUNTS = [
  { id: "ibrahim", label: "Team Ibrahim YT", color: "#FF4444" },
  { id: "glendora", label: "Glendora YT",    color: "#FF8C00" },
];

// ─── Chart section (used by both Shorts and Longform) ─────────────────────────

const SHORTS_CHART_METRICS = [
  { key: "views",         label: "Views" },
  { key: "likes",         label: "Likes" },
  { key: "comments",      label: "Comments" },
  { key: "stayedToWatch", label: "Stayed %" },
  { key: "subscribers",   label: "Subscribers" },
  { key: "impressions",   label: "Impressions" },
  { key: "ctr",           label: "CTR %" },
];

const LONGFORM_CHART_METRICS = [
  { key: "views",         label: "Views" },
  { key: "likes",         label: "Likes" },
  { key: "comments",      label: "Comments" },
  { key: "ctr",           label: "CTR %" },
  { key: "avgPctViewed",  label: "Avg % viewed" },
  { key: "subscribers",   label: "Subscribers" },
  { key: "impressions",   label: "Impressions" },
  { key: "watchTimeHours",label: "Watch hrs" },
];

function ChartSection({ videos, chartMetrics }: { videos: any[]; chartMetrics: { key: string; label: string }[] }) {
  const [chartMetric, setChartMetric] = useState("views");
  const [chartType, setChartType]     = useState<"bar" | "line">("bar");
  // Filter by specific video titles
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);

  // Get all unique video titles for the filter
  const allTitles = useMemo(() =>
    Array.from(new Set(videos.map(v => v.title || "Untitled"))).slice(0, 20),
    [videos]
  );

  // Build chart data — by month, optionally filtered to selected videos
  const filteredForChart = selectedVideos.length > 0
    ? videos.filter(v => selectedVideos.includes(v.title || "Untitled"))
    : videos;

  const chartData = useMemo(() => {
    const byMonth: Record<string, number[]> = {};
    filteredForChart.forEach(v => {
      const ym = parseYM(v.publishedAt || "");
      if (!ym) return;
      if (!byMonth[ym]) byMonth[ym] = [];
      byMonth[ym].push(Number(v[chartMetric]) || 0);
    });
    const sortedMonths = Object.keys(byMonth).sort();
    return {
      labels: sortedMonths.map(monthLabel),
      values: sortedMonths.map(ym => byMonth[ym].reduce((a, b) => a + b, 0)),
    };
  }, [filteredForChart, chartMetric]);

  const toggleVideo = (title: string) => {
    setSelectedVideos(prev =>
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  return (
    <div>
      {/* Metric selector */}
      <SectionLabel>Metric</SectionLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
        {chartMetrics.map(m => (
          <button key={m.key} onClick={() => setChartMetric(m.key)}
            style={{ padding: "4px 12px", borderRadius: 99,
              border: `1px solid ${chartMetric === m.key ? COLOR + "44" : "rgba(255,255,255,0.1)"}`,
              background: chartMetric === m.key ? COLOR + "18" : "transparent",
              color: chartMetric === m.key ? COLOR : "rgba(255,255,255,0.45)",
              fontSize: 11, cursor: "pointer", fontWeight: chartMetric === m.key ? 600 : 400 }}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Chart type */}
      <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
        {["bar", "line"].map(t => (
          <button key={t} onClick={() => setChartType(t as "bar" | "line")}
            style={{ padding: "4px 12px", borderRadius: 99,
              border: `1px solid ${chartType === t ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)"}`,
              background: chartType === t ? "rgba(255,255,255,0.1)" : "transparent",
              color: chartType === t ? "white" : "rgba(255,255,255,0.4)",
              fontSize: 11, cursor: "pointer" }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Video filter */}
      {allTitles.length > 1 && (
        <>
          <SectionLabel>Filter by video {selectedVideos.length > 0 && `(${selectedVideos.length} selected)`}</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 14,
            maxHeight: 180, overflowY: "auto", padding: "4px 0" }}>
            <button onClick={() => setSelectedVideos([])}
              style={{ textAlign: "left", padding: "5px 10px", borderRadius: 8, border: "none", cursor: "pointer",
                background: selectedVideos.length === 0 ? COLOR + "18" : "transparent",
                color: selectedVideos.length === 0 ? COLOR : "rgba(255,255,255,0.5)",
                fontSize: 12, fontWeight: selectedVideos.length === 0 ? 600 : 400 }}>
              All videos
            </button>
            {allTitles.map(title => {
              const on = selectedVideos.includes(title);
              return (
                <button key={title} onClick={() => toggleVideo(title)}
                  style={{ textAlign: "left", padding: "5px 10px", borderRadius: 8, border: "none", cursor: "pointer",
                    background: on ? COLOR + "18" : "transparent",
                    color: on ? COLOR : "rgba(255,255,255,0.5)",
                    fontSize: 12, fontWeight: on ? 600 : 400,
                    display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 14, height: 14, borderRadius: 4, border: `1px solid ${on ? COLOR : "rgba(255,255,255,0.2)"}`,
                    background: on ? COLOR : "transparent", display: "inline-flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, color: "white", flexShrink: 0 }}>
                    {on ? "✓" : ""}
                  </span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Chart */}
      {chartData.labels.length < 2
        ? <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)", fontSize: 14 }}>
            Import data across multiple months to see a trend chart.
          </div>
        : <AnalyticsChart type={chartType} labels={chartData.labels}
            datasets={[{ label: chartMetrics.find(m => m.key === chartMetric)?.label || chartMetric, data: chartData.values, color: COLOR }]} />
      }
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "videos",   label: "All videos" },
  { id: "chart",    label: "Chart" },
];

export default function YouTubeView({ dateRange, shortsCsvData, longCsvData, glendoraShortsData, glendoraLongData }: {
  dateRange: string;
  shortsCsvData?: any[];
  longCsvData?: any[];
  glendoraShortsData?: any[];
  glendoraLongData?: any[];
}) {
  const [account, setAccount] = useState("ibrahim");
  const [format, setFormat]   = useState<"shorts" | "longform">("shorts");
  const [tab, setTab]         = useState("overview");
  const [sortKey, setSortKey] = useState("views");

  // Pick data based on selected account
  const isGlendora = account === "glendora";
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
  const sorted       = [...videos].sort((a, b) => (Number(b[sortKey]) || 0) - (Number(a[sortKey]) || 0));
  const chartMetrics = format === "shorts" ? SHORTS_CHART_METRICS : LONGFORM_CHART_METRICS;

  return (
    <div>
      {/* Account selector */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {ACCOUNTS.map(acc => (
          <button key={acc.id} onClick={() => setAccount(acc.id)}
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
        onChange={v => { setFormat(v as "shorts" | "longform"); setTab("overview"); }}
        options={[
          { id: "shorts",   label: `Shorts (${shortsVideos.length})` },
          { id: "longform", label: `Long-form (${longVideos.length})` },
        ]}
      />

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: 12 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13,
              background: tab === t.id ? "rgba(255,255,255,0.1)" : "transparent",
              color: tab === t.id ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)",
              fontWeight: tab === t.id ? 600 : 400 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        format === "shorts"
          ? <ShortsSection videos={shortsVideos} />
          : <LongformSection videos={longVideos} />
      )}

      {/* ── ALL VIDEOS ── */}
      {tab === "videos" && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
            <SectionLabel style={{ margin: 0 }}>{sorted.length} videos · sort by</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {(format === "shorts"
                ? ["views","likes","comments","stayedToWatch","subscribers","ctr"]
                : ["views","likes","comments","ctr","avgPctViewed","subscribers"]
              ).map(key => (
                <button key={key} onClick={() => setSortKey(key)}
                  style={{ padding: "3px 10px", borderRadius: 99,
                    border: `1px solid ${sortKey === key ? COLOR + "44" : "rgba(255,255,255,0.1)"}`,
                    background: sortKey === key ? COLOR + "18" : "transparent",
                    color: sortKey === key ? COLOR : "rgba(255,255,255,0.4)",
                    fontSize: 11, cursor: "pointer", textTransform: "capitalize" }}>
                  {key === "stayedToWatch" ? "Stayed %" : key === "avgPctViewed" ? "Avg viewed" : key === "ctr" ? "CTR" : key}
                </button>
              ))}
            </div>
          </div>

          {!sorted.length
            ? <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)", fontSize: 14 }}>No videos for this period.</div>
            : (
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {/* Header */}
                <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 72px 72px 72px 72px", gap: 8, padding: "6px 12px",
                  fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  <div>#</div>
                  <div>Title</div>
                  <div style={{ textAlign: "right" }}>Views</div>
                  <div style={{ textAlign: "right" }}>Likes</div>
                  <div style={{ textAlign: "right" }}>CTR</div>
                  <div style={{ textAlign: "right" }}>{format === "shorts" ? "Stayed %" : "Avg viewed"}</div>
                </div>
                {sorted.map((v, i) => {
                  const maxVal = Math.max(...sorted.map(x => Number(x[sortKey]) || 0));
                  const barW = maxVal > 0 ? Math.round((Number(v[sortKey]) || 0) / maxVal * 100) : 0;
                  const dur = Number(v.duration) || 0;
                  const isShort = format === "shorts";
                  const ytId = v.videoId || "";
                  const link = ytId ? `https://youtube.com/${isShort ? "shorts/" : "watch?v="}${ytId}` : null;
                  return (
                    <div key={v.id || i} style={{ display: "grid", gridTemplateColumns: "28px 1fr 72px 72px 72px 72px", gap: 8, alignItems: "center",
                      padding: "10px 12px", background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: COLOR, textAlign: "center" }}>{i + 1}</div>
                      <div>
                        {link
                          ? <a href={link} target="_blank" rel="noopener noreferrer"
                              style={{ fontSize: 12, fontWeight: 500, color: "white", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {v.title || "Untitled"}
                            </a>
                          : <div style={{ fontSize: 12, fontWeight: 500, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.title || "Untitled"}</div>
                        }
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{v.publishedAt || "Unpublished"}</div>
                        <div style={{ height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 99, marginTop: 4, overflow: "hidden" }}>
                          <div style={{ width: `${barW}%`, height: "100%", background: COLOR + "88", borderRadius: 99 }} />
                        </div>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.85)", textAlign: "right" }}>{fmt(Number(v.views) || 0)}</div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.85)", textAlign: "right" }}>{fmt(Number(v.likes) || 0)}</div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.85)", textAlign: "right" }}>{v.ctr ? `${Number(v.ctr).toFixed(2)}%` : "—"}</div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.85)", textAlign: "right" }}>
                        {format === "shorts" ? `${Number(v.stayedToWatch) || 0}%` : `${Number(v.avgPctViewed) || 0}%`}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </>
      )}

      {/* ── CHART ── */}
      {tab === "chart" && (
        <ChartSection videos={allVideos} chartMetrics={chartMetrics} />
      )}
    </div>
  );
}

// ─── Shorts Section ───────────────────────────────────────────────────────────

function ShortsSection({ videos }: { videos: any[] }) {
  const totViews    = videos.reduce((a, v) => a + (Number(v.views) || 0), 0);
  const totLikes    = videos.reduce((a, v) => a + (Number(v.likes) || 0), 0);
  const totComments = videos.reduce((a, v) => a + (Number(v.comments) || 0), 0);
  const totSubs     = videos.reduce((a, v) => a + (Number(v.subscribers) || 0), 0);
  const avgStayed   = videos.length ? (videos.reduce((a, v) => a + (Number(v.stayedToWatch) || 0), 0) / videos.length).toFixed(1) : "0";
  const avgCTR      = videos.length ? (videos.reduce((a, v) => a + (Number(v.ctr) || 0), 0) / videos.length).toFixed(2) : "0";

  if (!videos.length) return (
    <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)", fontSize: 14 }}>
      No Shorts data for this period. Import a CSV or select a different month.
    </div>
  );

  return (
    <>
      <SectionLabel>Shorts overview · {videos.length} videos</SectionLabel>
      <OverviewGrid>
        <MetricCard label="Total views"          value={fmt(totViews)}      accent={COLOR} />
        <MetricCard label="Total likes"          value={fmt(totLikes)}      accent={COLOR} />
        <MetricCard label="Total comments"       value={fmt(totComments)}   accent={COLOR} />
        <MetricCard label="Subscribers gained"   value={`+${fmt(totSubs)}`} accent={COLOR} />
        <MetricCard label="Avg. stayed to watch" value={`${avgStayed}%`}    accent={COLOR} bar={parseFloat(avgStayed)} />
        <MetricCard label="Avg. CTR"             value={`${avgCTR}%`}       accent={COLOR} bar={parseFloat(avgCTR) * 10} />
      </OverviewGrid>
      <SectionLabel>Videos — click to expand · click button to open on YouTube</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {videos.map((v: any, i: number) => {
          const likes     = Number(v.likes) || 0;
          const likesPct  = Number(v.likesPct) || 0;
          const dislikes  = likesPct > 0 ? Math.round(likes / (likesPct / 100) - likes) : 0;
          const dur       = Number(v.duration) || 0;
          const avgDurSec = parseAvgDur(v.avgViewDuration);
          const stayed    = Number(v.stayedToWatch) || 0;
          const videoId   = v.videoId || "";
          const ytUrl     = videoId ? `https://youtube.com/shorts/${videoId}` : null;
          return (
            <VideoCard
              key={v.id || i} id={String(v.id || i)}
              thumb={v.thumb || "🎬"} title={v.title || "Untitled"}
              publishedAt={v.publishedAt || "Unpublished"}
              badge={dur > 0 ? fmtSec(dur) : undefined}
              accentColor={COLOR}
              quickStats={[
                { label: "views",  value: fmt(Number(v.views) || 0) },
                { label: "likes",  value: fmt(likes) },
                { label: "stayed", value: `${stayed}%` },
              ]}
            >
              <div style={{ paddingTop: 12 }}>
                {ytUrl && (
                  <a href={ytUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 14, padding: "6px 12px", borderRadius: 8, background: "rgba(255,68,68,0.15)", color: "#FF4444", fontSize: 12, fontWeight: 600, textDecoration: "none", border: "1px solid rgba(255,68,68,0.3)" }}
                    onClick={e => e.stopPropagation()}>
                    ▶ Open on YouTube
                  </a>
                )}
                <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>All metrics</p>
                <InlineMetrics items={[
                  { label: "Views",              value: fmt(Number(v.views) || 0) },
                  { label: "Duration",           value: dur > 0 ? fmtSec(dur) : "—", sub: dur > 0 ? `${dur}s` : undefined },
                  { label: "Avg. view duration", value: avgDurSec > 0 ? fmtSec(avgDurSec) : "—", sub: avgDurSec > 0 ? `${avgDurSec}s` : undefined },
                  { label: "Stayed to watch",    value: stayed > 0 ? `${stayed}%` : "—" },
                  { label: "Comments",           value: fmt(Number(v.comments) || 0) },
                  { label: "Likes",              value: fmt(likes) },
                  { label: "Subscribers gained", value: `+${fmt(Number(v.subscribers) || 0)}` },
                  { label: "CTR",                value: v.ctr ? `${Number(v.ctr).toFixed(2)}%` : "—" },
                  { label: "Watch time",         value: v.watchTimeHours ? `${Number(v.watchTimeHours).toFixed(1)}h` : "—" },
                ]} />
                <div style={{ marginTop: 16 }}>
                  <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Likes vs. dislikes</p>
                  <LikeDislikeBar likes={likes} dislikes={dislikes} />
                  <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, marginTop: 4 }}>
                    {fmt(likes)} likes · {likesPct > 0 ? `${likesPct}% positive` : "no dislike data"}
                  </p>
                </div>
                {stayed > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, marginBottom: 6 }}>Stayed to watch</p>
                    <div style={{ height: 8, borderRadius: 99, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                      <div style={{ width: `${Math.min(stayed, 100)}%`, height: "100%", background: COLOR, borderRadius: 99 }} />
                    </div>
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 4 }}>{stayed}% of viewers watched this Short</p>
                  </div>
                )}
              </div>
            </VideoCard>
          );
        })}
      </div>
    </>
  );
}

// ─── Long-form Section ────────────────────────────────────────────────────────

function LongformSection({ videos }: { videos: any[] }) {
  const totViews    = videos.reduce((a, v) => a + (Number(v.views) || 0), 0);
  const totLikes    = videos.reduce((a, v) => a + (Number(v.likes) || 0), 0);
  const totSubs     = videos.reduce((a, v) => a + (Number(v.subscribers) || 0), 0);
  const totComments = videos.reduce((a, v) => a + (Number(v.comments) || 0), 0);
  const avgCTR      = videos.length ? (videos.reduce((a, v) => a + (Number(v.ctr) || 0), 0) / videos.length).toFixed(2) : "0";
  const avgPct      = videos.length ? (videos.reduce((a, v) => a + (Number(v.avgPctViewed) || 0), 0) / videos.length).toFixed(1) : "0";
  const totImpr     = videos.reduce((a, v) => a + (Number(v.impressions) || 0), 0);

  if (!videos.length) return (
    <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)", fontSize: 14 }}>
      No Long-form data. Import a <code>youtube-longform.csv</code> file.
    </div>
  );

  return (
    <>
      <SectionLabel>Long-form overview · {videos.length} videos</SectionLabel>
      <OverviewGrid>
        <MetricCard label="Total views"        value={fmt(totViews)}      accent={COLOR} />
        <MetricCard label="Total likes"        value={fmt(totLikes)}      accent={COLOR} />
        <MetricCard label="Total comments"     value={fmt(totComments)}   accent={COLOR} />
        <MetricCard label="Subscribers gained" value={`+${fmt(totSubs)}`} accent={COLOR} />
        <MetricCard label="Avg. CTR"           value={`${avgCTR}%`}       accent={COLOR} bar={parseFloat(avgCTR) * 10} />
        <MetricCard label="Avg. % viewed"      value={`${avgPct}%`}       accent={COLOR} bar={parseFloat(avgPct)} />
        <MetricCard label="Total impressions"  value={fmt(totImpr)}       accent={COLOR} />
      </OverviewGrid>
      <SectionLabel>Videos — click to expand</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {videos.map((v: any, i: number) => {
          const likes     = Number(v.likes) || 0;
          const likesPct  = Number(v.likesPct) || 0;
          const dislikes  = likesPct > 0 ? Math.round(likes / (likesPct / 100) - likes) : 0;
          const dur       = Number(v.duration) || 0;
          const avgDurSec = parseAvgDur(v.avgViewDuration);
          const videoId   = v.videoId || "";
          const ytUrl     = videoId ? `https://youtube.com/watch?v=${videoId}` : null;
          return (
            <VideoCard
              key={v.id || i} id={String(v.id || i)}
              thumb={v.thumb || "🎬"} title={v.title || "Untitled"}
              publishedAt={v.publishedAt || "Unpublished"}
              badge={dur > 0 ? fmtSec(dur) : undefined}
              accentColor={COLOR}
              quickStats={[
                { label: "views",      value: fmt(Number(v.views) || 0) },
                { label: "avg viewed", value: `${Number(v.avgPctViewed) || 0}%` },
                { label: "CTR",        value: v.ctr ? `${Number(v.ctr).toFixed(2)}%` : "—" },
              ]}
            >
              <div style={{ paddingTop: 12 }}>
                {ytUrl && (
                  <a href={ytUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 14, padding: "6px 12px", borderRadius: 8, background: "rgba(255,68,68,0.15)", color: "#FF4444", fontSize: 12, fontWeight: 600, textDecoration: "none", border: "1px solid rgba(255,68,68,0.3)" }}
                    onClick={e => e.stopPropagation()}>
                    ▶ Open on YouTube
                  </a>
                )}
                <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>All metrics</p>
                <InlineMetrics items={[
                  { label: "Views",              value: fmt(Number(v.views) || 0) },
                  { label: "Duration",           value: dur > 0 ? fmtSec(dur) : "—" },
                  { label: "Avg. view duration", value: avgDurSec > 0 ? fmtSec(avgDurSec) : "—" },
                  { label: "Avg. % viewed",      value: `${Number(v.avgPctViewed) || 0}%` },
                  { label: "CTR",                value: v.ctr ? `${Number(v.ctr).toFixed(2)}%` : "—" },
                  { label: "Comments",           value: fmt(Number(v.comments) || 0) },
                  { label: "Likes",              value: fmt(likes) },
                  { label: "Subscribers gained", value: `+${fmt(Number(v.subscribers) || 0)}` },
                  { label: "Watch time",         value: v.watchTimeHours ? `${Number(v.watchTimeHours).toFixed(1)}h` : "—" },
                  { label: "Impressions",        value: fmt(Number(v.impressions) || 0) },
                ]} />
                <div style={{ marginTop: 16 }}>
                  <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Likes vs. dislikes</p>
                  <LikeDislikeBar likes={likes} dislikes={dislikes} />
                  <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, marginTop: 4 }}>
                    {fmt(likes)} likes · {likesPct > 0 ? `${likesPct}% positive` : "no dislike data"}
                  </p>
                </div>
                {Number(v.avgPctViewed) > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, marginBottom: 6 }}>Avg. % viewed</p>
                    <div style={{ height: 8, borderRadius: 99, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                      <div style={{ width: `${Math.min(Number(v.avgPctViewed), 100)}%`, height: "100%", background: COLOR, borderRadius: 99 }} />
                    </div>
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 4 }}>{Number(v.avgPctViewed).toFixed(1)}% of the video watched on average</p>
                  </div>
                )}
              </div>
            </VideoCard>
          );
        })}
      </div>
    </>
  );
}
