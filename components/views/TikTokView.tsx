"use client";
import { useState, useMemo } from "react";
import { ttVideos } from "@/lib/data";
import { MetricCard, OverviewGrid, SectionLabel, VideoCard, InlineMetrics, fmt } from "@/components/ui";
import { filterByDate, getYM, getMonthsFromVideos, monthLabel, getTopVideo, sumMetric, avgMetric, generateInsight, fmtPct } from "@/lib/analytics";
import AnalyticsChart from "@/components/AnalyticsChart";

const COLOR = "#69C9D0";

const METRICS = [
  { key: "views",          label: "Views" },
  { key: "likes",          label: "Likes" },
  { key: "comments",       label: "Comments" },
  { key: "shares",         label: "Shares" },
  { key: "saves",          label: "Saves" },
  { key: "totalEngagement",label: "Engagement" },
  { key: "retention",      label: "Retention %", fmt: (n: number) => fmtPct(n) },
  { key: "avgWatchTime",   label: "Avg watch",   fmt: (n: number) => n ? `${Math.round(n)}s` : "—" },
];

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "videos",   label: "All videos" },
  { id: "chart",    label: "Chart" },
  { id: "compare",  label: "Compare" },
];

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

export default function TikTokView({ dateRange, csvData }: { dateRange: string; csvData?: any[] }) {
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

  const allVideos = csvData?.length ? csvData : ttVideos;

  // TikTok date parsing (uses publishedAt directly)
  const filtered = useMemo(() => {
    if (dateRange === "all") return allVideos;
    if (dateRange === "unpublished") return allVideos.filter((v: any) => !v.publishedAt);
    return allVideos.filter((v: any) => {
      if (!v.publishedAt) return false;
      const d = new Date(v.publishedAt);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return ym === dateRange;
    });
  }, [allVideos, dateRange]);

  const months = useMemo(() => getMonthsFromVideos(allVideos), [allVideos]);
  const m1 = cmpMonth1 || months[0]?.val || "";
  const m2 = cmpMonth2 || months[1]?.val || "";
  const top    = getTopVideo(filtered, "views");
  const sorted = useMemo(() => [...filtered].sort((a, b) => (Number(b[sortKey]) || 0) - (Number(a[sortKey]) || 0)), [filtered, sortKey]);

  const chartData = useMemo(() => {
    const byMonth: Record<string, number[]> = {};
    allVideos.forEach((v: any) => {
      if (!v.publishedAt) return;
      const d = new Date(v.publishedAt);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!byMonth[ym]) byMonth[ym] = [];
      byMonth[ym].push(Number(v[chartMetric]) || 0);
    });
    const ms = Object.keys(byMonth).sort();
    return { labels: ms.map(monthLabel), values: ms.map(ym => byMonth[ym].reduce((a, b) => a + b, 0)) };
  }, [allVideos, chartMetric]);

  const getMonthVids = (ym: string) => allVideos.filter((v: any) => {
    if (!v.publishedAt) return false;
    const d = new Date(v.publishedAt);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === ym;
  });
  const m1Vids = getMonthVids(m1), m2Vids = getMonthVids(m2);
  const m1Val = sumMetric(m1Vids, cmpMetric), m2Val = sumMetric(m2Vids, cmpMetric);
  const delta = m1Val - m2Val, deltaPct = m2Val > 0 ? Math.round(delta / m2Val * 100) : 0;

  const insight = top ? generateInsight(top, filtered, "tiktok") : "";

  return (
    <div>
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {tab === "overview" && (
        !filtered.length
          ? <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)" }}>No TikTok data for this month. Try importing a CSV or selecting a different month.</div>
          : <>
            <SectionLabel>TikTok overview · {filtered.length} videos</SectionLabel>
            <OverviewGrid>
              <MetricCard label="Total views"      value={fmt(sumMetric(filtered, "views"))}          accent={COLOR} />
              <MetricCard label="Total likes"      value={fmt(sumMetric(filtered, "likes"))}          accent={COLOR} />
              <MetricCard label="Total shares"     value={fmt(sumMetric(filtered, "shares"))}         accent={COLOR} />
              <MetricCard label="Total saves"      value={fmt(sumMetric(filtered, "saves"))}          accent={COLOR} />
              <MetricCard label="Total comments"   value={fmt(sumMetric(filtered, "comments"))}       accent={COLOR} />
              <MetricCard label="Total engagement" value={fmt(sumMetric(filtered, "totalEngagement"))}accent={COLOR} />
              <MetricCard label="Avg. retention"   value={`${Math.round(avgMetric(filtered, "retention"))}%`} accent={COLOR} bar={avgMetric(filtered, "retention")} />
              <MetricCard label="Avg. watch time"  value={`${Math.round(avgMetric(filtered, "avgWatchTime"))}s`} accent={COLOR} />
            </OverviewGrid>
            {top && (
              <>
                <SectionLabel>Top performing video</SectionLabel>
                <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 16, marginBottom: 16 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 600, background: "#faeeda", color: "#854f0b", padding: "3px 10px", borderRadius: 99, marginBottom: 10 }}>🏆 Top performer</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "white", marginBottom: 3 }}>{top.title || "Untitled"}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 12 }}>{top.publishedAt || "—"}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                    {METRICS.slice(0, 6).map(m => (
                      <div key={m.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "7px 12px", minWidth: 60 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "white" }}>{m.fmt ? m.fmt(Number(top[m.key] || 0)) : fmt(Number(top[m.key] || 0))}</span>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{m.label}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
                    <span style={{ color: "white", fontWeight: 500 }}>Why it stood out: </span>{insight}
                  </div>
                </div>
              </>
            )}
          </>
      )}

      {tab === "videos" && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
            <SectionLabel style={{ margin: 0 }}>{sorted.length} videos · sort by</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {METRICS.slice(0, 6).map(m => (
                <button key={m.key} onClick={() => setSortKey(m.key)}
                  style={{ padding: "3px 10px", borderRadius: 99, border: `1px solid ${sortKey === m.key ? COLOR + "44" : "rgba(255,255,255,0.1)"}`,
                    background: sortKey === m.key ? COLOR + "18" : "transparent", color: sortKey === m.key ? COLOR : "rgba(255,255,255,0.4)", fontSize: 11, cursor: "pointer" }}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          {!sorted.length
            ? <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)" }}>No videos for this period.</div>
            : (
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 70px 70px 70px 70px 70px", gap: 8, padding: "6px 12px", fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  <div>#</div><div>Title</div>
                  {["Views","Likes","Shares","Saves","Engagement"].map(h => <div key={h} style={{ textAlign: "right" }}>{h}</div>)}
                </div>
                {sorted.map((v: any, i: number) => {
                  const maxVal = Math.max(...sorted.map((x: any) => Number(x[sortKey]) || 0));
                  const barW = maxVal > 0 ? Math.round((Number(v[sortKey]) || 0) / maxVal * 100) : 0;
                  const totalEng = v.totalEngagement || ((v.likes || 0) + (v.comments || 0) + (v.shares || 0) + (v.saves || 0));
                  return (
                    <div key={v.id || i} style={{ display: "grid", gridTemplateColumns: "28px 1fr 70px 70px 70px 70px 70px", gap: 8, alignItems: "center", padding: "10px 12px", background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: COLOR, textAlign: "center" }}>{i + 1}</div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 500, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.title || "Untitled"}</div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{v.publishedAt || "—"}</div>
                        <div style={{ height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 99, marginTop: 4, overflow: "hidden" }}>
                          <div style={{ width: `${barW}%`, height: "100%", background: COLOR + "88", borderRadius: 99 }} />
                        </div>
                      </div>
                      {[v.views, v.likes, v.shares, v.saves, totalEng].map((val, ki) => (
                        <div key={ki} style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.85)", textAlign: "right" }}>{fmt(Number(val) || 0)}</div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
        </>
      )}

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
            : <AnalyticsChart type={chartType} labels={chartData.labels}
                datasets={[{ label: METRICS.find(m => m.key === chartMetric)?.label || chartMetric, data: chartData.values, color: COLOR }]}
                yFormatter={METRICS.find(m => m.key === chartMetric)?.fmt} />}
        </>
      )}

      {tab === "compare" && (
        <>
          <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
            {[{ id: "month", label: "Month vs month" }, { id: "video", label: "Video vs video" }].map(m => (
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
              </div>
              <SectionLabel>Metric</SectionLabel>
              <MetricPills metrics={METRICS} active={cmpMetric} onChange={setCmpMetric} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                {[{ ym: m1, val: m1Val, isA: true }, { ym: m2, val: m2Val, isA: false }].map(({ ym, val, isA }) => (
                  <div key={ym} style={{ background: isA ? COLOR + "12" : "rgba(255,255,255,0.04)", border: `1px solid ${isA ? COLOR + "33" : "rgba(255,255,255,0.08)"}`, borderRadius: 12, padding: 14 }}>
                    <div style={{ fontSize: 11, color: isA ? COLOR : "rgba(255,255,255,0.4)", marginBottom: 6 }}>{monthLabel(ym)}</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: isA ? COLOR : "white" }}>
                      {METRICS.find(m => m.key === cmpMetric)?.fmt ? METRICS.find(m => m.key === cmpMetric)!.fmt!(val) : fmt(val)}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>{METRICS.find(m => m.key === cmpMetric)?.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: "center", padding: "8px 16px", background: "rgba(255,255,255,0.04)", borderRadius: 8, fontSize: 13, color: delta >= 0 ? "#22c55e" : "#ef4444", marginBottom: 16 }}>
                {delta >= 0 ? "▲" : "▼"} {fmt(Math.abs(delta))} ({deltaPct >= 0 ? "+" : ""}{deltaPct}%)
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
              ? <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)", fontSize: 14 }}>Need at least 2 videos. Try selecting "All time".</div>
              : <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                  {[cmpV1, cmpV2].map((vi, idx) => (
                    <select key={idx} value={vi} onChange={e => idx === 0 ? setCmpV1(Number(e.target.value)) : setCmpV2(Number(e.target.value))}
                      style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "#1a1a2e", color: "white", fontSize: 12, cursor: "pointer", maxWidth: 240 }}>
                      {filtered.map((v: any, i: number) => <option key={i} value={i}>{(v.title || "Untitled").slice(0, 50)}</option>)}
                    </select>
                  ))}
                </div>
                {[filtered[cmpV1], filtered[cmpV2]].filter(Boolean).map((v: any, idx: number) => (
                  <div key={idx} style={{ background: idx === 0 ? COLOR + "10" : "rgba(255,255,255,0.04)", border: `1px solid ${idx === 0 ? COLOR + "33" : "rgba(255,255,255,0.08)"}`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "white", marginBottom: 8 }}>{v?.title || "Untitled"}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(110px,1fr))", gap: 6 }}>
                      {METRICS.map(m => (
                        <div key={m.key} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "8px 10px" }}>
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>{m.label}</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: idx === 0 ? COLOR : "white" }}>
                            {m.fmt ? m.fmt(Number(v?.[m.key] || 0)) : fmt(Number(v?.[m.key] || 0))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <AnalyticsChart type="bar" labels={METRICS.map(m => m.label)}
                  datasets={[
                    { label: (filtered[cmpV1]?.title || "Video 1").slice(0, 25), data: METRICS.map(m => Number(filtered[cmpV1]?.[m.key]) || 0), color: COLOR },
                    { label: (filtered[cmpV2]?.title || "Video 2").slice(0, 25), data: METRICS.map(m => Number(filtered[cmpV2]?.[m.key]) || 0), color: "#888888" },
                  ]} />
              </>
          )}
        </>
      )}
    </div>
  );
}
