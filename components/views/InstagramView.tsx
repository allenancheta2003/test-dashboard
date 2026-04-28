"use client";
import { useState, useMemo } from "react";
import { igVideos } from "@/lib/data";
import { MetricCard, OverviewGrid, SectionLabel, VideoCard, InlineMetrics, fmt, fmtSec } from "@/components/ui";
import { filterByDate, getYM, getMonthsFromVideos, monthLabel, getTopVideo, sumMetric, avgMetric, generateInsight, fmtPct } from "@/lib/analytics";
import AnalyticsChart from "@/components/AnalyticsChart";

const COLOR = "#E1306C";

function parseYM(v: any): string {
  const raw = v.publishedYM || v.publishedAt || "";
  if (!raw) return "";
  if (/^\d{4}-\d{2}/.test(raw)) return raw.slice(0, 7);
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[1].padStart(2, "0")}`;
  return "";
}

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

function MetricPills({ metrics, active, onChange }: { metrics: { key: string; label: string }[]; active: string; onChange: (k: string) => void }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
      {metrics.map(m => (
        <button key={m.key} onClick={() => onChange(m.key)}
          style={{ padding: "4px 12px", borderRadius: 99, border: `1px solid ${m.key === active ? COLOR + "44" : "rgba(255,255,255,0.1)"}`,
            background: m.key === active ? COLOR + "18" : "transparent",
            color: m.key === active ? COLOR : "rgba(255,255,255,0.45)",
            fontSize: 11, cursor: "pointer", fontWeight: m.key === active ? 600 : 400 }}>
          {m.label}
        </button>
      ))}
    </div>
  );
}

function TopCard({ video, allVideos }: { video: any; allVideos: any[] }) {
  if (!video) return null;
  const totalViews = sumMetric(allVideos, "views");
  const share = totalViews > 0 ? Math.round((Number(video.views) || 0) / totalViews * 100) : 0;
  const insight = generateInsight(video, allVideos, "instagram");
  const pills = [
    { label: "Views", val: fmt(Number(video.views) || 0) },
    { label: "% of period", val: share + "%" },
    { label: "Likes", val: fmt(Number(video.likes) || 0) },
    { label: "Saves", val: fmt(Number(video.saves) || 0) },
    { label: "Reach", val: fmt(Number(video.reach) || 0) },
    { label: "Comments", val: fmt(Number(video.comments) || 0) },
  ];
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 16, marginBottom: 16 }}>
      <div style={{ display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 600, background: "#faeeda", color: "#854f0b", padding: "3px 10px", borderRadius: 99, marginBottom: 10 }}>
        🏆 Top performer
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: "white", marginBottom: 3 }}>{video.title || "Untitled"}</div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 12 }}>
        {video.publishedAt || "—"}
        {share > 0 && <span style={{ marginLeft: 8, color: COLOR, fontWeight: 500 }}>{share}% of period's views</span>}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {pills.map(p => (
          <div key={p.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "7px 12px", minWidth: 60 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "white" }}>{p.val}</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{p.label}</span>
          </div>
        ))}
      </div>
      <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, marginBottom: video.permalink ? 10 : 0 }}>
        <span style={{ color: "white", fontWeight: 500 }}>Why it stood out: </span>{insight}
      </div>
      {video.permalink && (
        <a href={video.permalink} target="_blank" rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 10, padding: "6px 12px", borderRadius: 8, background: "rgba(225,48,108,0.15)", color: COLOR, fontSize: 12, fontWeight: 600, textDecoration: "none", border: "1px solid rgba(225,48,108,0.3)" }}>
          ↗ Open on Instagram
        </a>
      )}
    </div>
  );
}

const METRICS = [
  { key: "views",    label: "Views" },
  { key: "reach",    label: "Reach" },
  { key: "likes",    label: "Likes" },
  { key: "comments", label: "Comments" },
  { key: "shares",   label: "Shares" },
  { key: "saves",    label: "Saves" },
  { key: "follows",  label: "Follows" },
];

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "posts",    label: "All posts" },
  { id: "chart",    label: "Chart" },
  { id: "compare",  label: "Compare" },
];

export default function InstagramView({ dateRange, csvData }: { dateRange: string; csvData?: any[] }) {
  const [tab, setTab]               = useState("overview");
  const [sortKey, setSortKey]       = useState("views");
  const [chartMetric, setChartMetric] = useState("views");
  const [chartType, setChartType]   = useState<"bar" | "line">("bar");
  const [cmpMode, setCmpMode]       = useState("month");
  const [cmpMetric, setCmpMetric]   = useState("views");
  const [cmpMonth1, setCmpMonth1]   = useState("");
  const [cmpMonth2, setCmpMonth2]   = useState("");
  const [cmpV1, setCmpV1]           = useState(0);
  const [cmpV2, setCmpV2]           = useState(1);

  const allVideos = csvData?.length ? csvData : igVideos;
  const filtered  = filterByDate(allVideos, dateRange);
  const months    = useMemo(() => getMonthsFromVideos(allVideos), [allVideos]);
  const m1 = cmpMonth1 || months[0]?.val || "";
  const m2 = cmpMonth2 || months[1]?.val || "";
  const top    = getTopVideo(filtered, "views");
  const sorted = useMemo(() => [...filtered].sort((a, b) => (Number(b[sortKey]) || 0) - (Number(a[sortKey]) || 0)), [filtered, sortKey]);

  const chartData = useMemo(() => {
    const byMonth: Record<string, number[]> = {};
    allVideos.forEach(v => { const ym = parseYM(v); if (!ym) return; if (!byMonth[ym]) byMonth[ym] = []; byMonth[ym].push(Number(v[chartMetric]) || 0); });
    const ms = Object.keys(byMonth).sort();
    return { labels: ms.map(monthLabel), values: ms.map(ym => byMonth[ym].reduce((a, b) => a + b, 0)) };
  }, [allVideos, chartMetric]);

  const getMonthVids = (ym: string) => allVideos.filter(v => parseYM(v) === ym);
  const m1Vids = getMonthVids(m1), m2Vids = getMonthVids(m2);
  const m1Val = sumMetric(m1Vids, cmpMetric), m2Val = sumMetric(m2Vids, cmpMetric);
  const delta = m1Val - m2Val, deltaPct = m2Val > 0 ? Math.round(delta / m2Val * 100) : 0;

  const totViews    = sumMetric(filtered, "views");
  const totReach    = sumMetric(filtered, "reach");
  const totLikes    = sumMetric(filtered, "likes");
  const totShares   = sumMetric(filtered, "shares");
  const totSaves    = sumMetric(filtered, "saves");
  const totComments = sumMetric(filtered, "comments");
  const totFollows  = sumMetric(filtered, "follows");
  const totEng      = totLikes + totComments + totShares + totSaves;

  return (
    <div>
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        !filtered.length
          ? <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)", fontSize: 14 }}>No Instagram data for this period. Import a CSV or select a different month.</div>
          : <>
            <SectionLabel>Instagram overview · {filtered.length} posts</SectionLabel>
            <OverviewGrid>
              <MetricCard label="Total views"      value={fmt(totViews)}    accent={COLOR} />
              <MetricCard label="Total reach"      value={fmt(totReach)}    accent={COLOR} />
              <MetricCard label="Total likes"      value={fmt(totLikes)}    accent={COLOR} />
              <MetricCard label="Total comments"   value={fmt(totComments)} accent={COLOR} />
              <MetricCard label="Total shares"     value={fmt(totShares)}   accent={COLOR} />
              <MetricCard label="Total saves"      value={fmt(totSaves)}    accent={COLOR} />
              <MetricCard label="New follows"      value={fmt(totFollows)}  accent={COLOR} />
              <MetricCard label="Total engagement" value={fmt(totEng)}      accent={COLOR} />
            </OverviewGrid>
            <SectionLabel>Top performing post</SectionLabel>
            <TopCard video={top} allVideos={filtered} />
          </>
      )}

      {/* ── ALL POSTS ── */}
      {tab === "posts" && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
            <SectionLabel style={{ margin: 0 }}>{sorted.length} posts · sort by</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {METRICS.map(m => (
                <button key={m.key} onClick={() => setSortKey(m.key)}
                  style={{ padding: "3px 10px", borderRadius: 99, border: `1px solid ${sortKey === m.key ? COLOR + "44" : "rgba(255,255,255,0.1)"}`,
                    background: sortKey === m.key ? COLOR + "18" : "transparent", color: sortKey === m.key ? COLOR : "rgba(255,255,255,0.4)", fontSize: 11, cursor: "pointer" }}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          {!sorted.length
            ? <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)", fontSize: 14 }}>No posts for this period.</div>
            : (
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {/* Header */}
                <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 70px 70px 70px 70px 70px", gap: 8, padding: "6px 12px", fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  <div>#</div><div>Post</div>
                  {["Views","Reach","Likes","Saves","Shares"].map(h => <div key={h} style={{ textAlign: "right" }}>{h}</div>)}
                </div>
                {sorted.map((v, i) => {
                  const maxVal = Math.max(...sorted.map(x => Number(x[sortKey]) || 0));
                  const barW = maxVal > 0 ? Math.round((Number(v[sortKey]) || 0) / maxVal * 100) : 0;
                  return (
                    <div key={v.id || i} style={{ display: "grid", gridTemplateColumns: "28px 1fr 70px 70px 70px 70px 70px", gap: 8, alignItems: "center", padding: "10px 12px", background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: COLOR, textAlign: "center" }}>{i + 1}</div>
                      <div>
                        {v.permalink
                          ? <a href={v.permalink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 500, color: "white", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.title || "Untitled"}</a>
                          : <div style={{ fontSize: 12, fontWeight: 500, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.title || "Untitled"}</div>
                        }
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{v.publishedAt || "Unpublished"}</div>
                        <div style={{ height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 99, marginTop: 4, overflow: "hidden" }}>
                          <div style={{ width: `${barW}%`, height: "100%", background: COLOR + "88", borderRadius: 99 }} />
                        </div>
                      </div>
                      {["views","reach","likes","saves","shares"].map(k => (
                        <div key={k} style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.85)", textAlign: "right" }}>{fmt(Number(v[k]) || 0)}</div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
        </>
      )}

      {/* ── CHART ── */}
      {tab === "chart" && (
        <>
          <SectionLabel>Metric</SectionLabel>
          <MetricPills metrics={METRICS} active={chartMetric} onChange={setChartMetric} />
          <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
            {["bar", "line"].map(t => (
              <button key={t} onClick={() => setChartType(t as "bar" | "line")}
                style={{ padding: "4px 12px", borderRadius: 99, border: `1px solid ${chartType === t ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)"}`,
                  background: chartType === t ? "rgba(255,255,255,0.1)" : "transparent",
                  color: chartType === t ? "white" : "rgba(255,255,255,0.4)", fontSize: 11, cursor: "pointer" }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          {chartData.labels.length < 2
            ? <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)", fontSize: 14 }}>Import data across multiple months to see a trend chart.</div>
            : <AnalyticsChart type={chartType} labels={chartData.labels} datasets={[{ label: METRICS.find(m => m.key === chartMetric)?.label || chartMetric, data: chartData.values, color: COLOR }]} />}
        </>
      )}

      {/* ── COMPARE ── */}
      {tab === "compare" && (
        <>
          <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
            {[{ id: "month", label: "Month vs month" }, { id: "video", label: "Post vs post" }].map(m => (
              <button key={m.id} onClick={() => setCmpMode(m.id)}
                style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${cmpMode === m.id ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)"}`,
                  background: cmpMode === m.id ? "rgba(255,255,255,0.1)" : "transparent",
                  color: cmpMode === m.id ? "white" : "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer", fontWeight: cmpMode === m.id ? 600 : 400 }}>
                {m.label}
              </button>
            ))}
          </div>

          {cmpMode === "month" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                {[{ val: m1, set: setCmpMonth1 }, { val: m2, set: setCmpMonth2 }].map(({ val, set }, idx) => (
                  <select key={idx} value={val} onChange={e => set(e.target.value)}
                    style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "#1a1a2e", color: "white", fontSize: 13, cursor: "pointer" }}>
                    {months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                  </select>
                ))}
                {months.length < 2 && <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Import data from multiple months to compare</span>}
              </div>
              <SectionLabel>Metric</SectionLabel>
              <MetricPills metrics={METRICS} active={cmpMetric} onChange={setCmpMetric} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                {[{ ym: m1, val: m1Val, isA: true }, { ym: m2, val: m2Val, isA: false }].map(({ ym, val, isA }) => (
                  <div key={ym} style={{ background: isA ? COLOR + "12" : "rgba(255,255,255,0.04)", border: `1px solid ${isA ? COLOR + "33" : "rgba(255,255,255,0.08)"}`, borderRadius: 12, padding: 14 }}>
                    <div style={{ fontSize: 11, color: isA ? COLOR : "rgba(255,255,255,0.4)", marginBottom: 6 }}>{monthLabel(ym)}{isA ? " — selected" : ""}</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: isA ? COLOR : "white" }}>{fmt(val)}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>{METRICS.find(m => m.key === cmpMetric)?.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: "center", padding: "8px 16px", background: "rgba(255,255,255,0.04)", borderRadius: 8, fontSize: 13, color: delta >= 0 ? "#22c55e" : "#ef4444", marginBottom: 16 }}>
                {delta >= 0 ? "▲" : "▼"} {fmt(Math.abs(delta))} ({deltaPct >= 0 ? "+" : ""}{deltaPct}%) — {monthLabel(m1)} vs {monthLabel(m2)}
              </div>
              <AnalyticsChart type="bar" labels={METRICS.map(m => m.label)}
                datasets={[
                  { label: monthLabel(m1), data: METRICS.map(m => sumMetric(m1Vids, m.key)), color: COLOR },
                  { label: monthLabel(m2), data: METRICS.map(m => sumMetric(m2Vids, m.key)), color: "#888888" },
                ]} />
            </>
          )}

          {cmpMode === "video" && (
            filtered.length < 2
              ? <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)", fontSize: 14 }}>Need at least 2 posts. Try selecting "All time".</div>
              : <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                  {[cmpV1, cmpV2].map((vi, idx) => (
                    <select key={idx} value={vi} onChange={e => idx === 0 ? setCmpV1(Number(e.target.value)) : setCmpV2(Number(e.target.value))}
                      style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "#1a1a2e", color: "white", fontSize: 12, cursor: "pointer", maxWidth: 240 }}>
                      {filtered.map((v, i) => <option key={i} value={i}>{(v.title || "Untitled").slice(0, 50)}</option>)}
                    </select>
                  ))}
                </div>
                {[filtered[cmpV1], filtered[cmpV2]].filter(Boolean).map((v, idx) => (
                  <div key={idx} style={{ background: idx === 0 ? COLOR + "10" : "rgba(255,255,255,0.04)", border: `1px solid ${idx === 0 ? COLOR + "33" : "rgba(255,255,255,0.08)"}`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "white", marginBottom: 8 }}>{v?.title || "Untitled"}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(110px,1fr))", gap: 6 }}>
                      {METRICS.map(m => (
                        <div key={m.key} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "8px 10px" }}>
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>{m.label}</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: idx === 0 ? COLOR : "white" }}>{fmt(Number(v?.[m.key] || 0))}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <AnalyticsChart type="bar" labels={METRICS.map(m => m.label)}
                  datasets={[
                    { label: (filtered[cmpV1]?.title || "Post 1").slice(0, 25), data: METRICS.map(m => Number(filtered[cmpV1]?.[m.key]) || 0), color: COLOR },
                    { label: (filtered[cmpV2]?.title || "Post 2").slice(0, 25), data: METRICS.map(m => Number(filtered[cmpV2]?.[m.key]) || 0), color: "#888888" },
                  ]} />
              </>
          )}
        </>
      )}
    </div>
  );
}
