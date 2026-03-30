"use client";
import { igVideos } from "@/lib/data";
import {
  MetricCard, OverviewGrid, SectionLabel, VideoCard,
  InlineMetrics, fmt, fmtSec
} from "@/components/ui";

const COLOR = "#E1306C";

export default function InstagramView({ dateRange, csvData }: { dateRange: string; csvData?: any[] }) {
  const allVideos = csvData?.length ? csvData : igVideos;

  const videos = dateRange === "all" ? allVideos : allVideos.filter((v: any) => {
    if (!v.publishedAt) return true;
    const d = new Date(v.publishedAt);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return ym === dateRange;
  });

  const totViews      = videos.reduce((a: number, v: any) => a + (v.views || 0), 0);
  const totLikes      = videos.reduce((a: number, v: any) => a + (v.likes || 0), 0);
  const totShares     = videos.reduce((a: number, v: any) => a + (v.shares || 0), 0);
  const totSaves      = videos.reduce((a: number, v: any) => a + (v.saves || 0), 0);
  const totReposts    = videos.reduce((a: number, v: any) => a + (v.reposts || 0), 0);
  const totComments   = videos.reduce((a: number, v: any) => a + (v.comments || 0), 0);
  const totEngagement = videos.reduce((a: number, v: any) => a + (v.totalEngagement || 0), 0);
  const avgRetention  = videos.length ? Math.round(videos.reduce((a: number, v: any) => a + (v.retention || 0), 0) / videos.length) : 0;
  const avgView3s     = videos.length ? Math.round(videos.reduce((a: number, v: any) => a + (v.viewRatePast3s || 0), 0) / videos.length) : 0;

  if (!videos.length) return (
    <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)" }}>
      No Instagram data for this month. Try importing a CSV or selecting a different month.
    </div>
  );

  return (
    <>
      <SectionLabel>Instagram overview · {videos.length} reels</SectionLabel>
      <OverviewGrid>
        <MetricCard label="Total views"         value={fmt(totViews)}      accent={COLOR} />
        <MetricCard label="Total likes"         value={fmt(totLikes)}      accent={COLOR} />
        <MetricCard label="Total shares"        value={fmt(totShares)}     accent={COLOR} />
        <MetricCard label="Total saves"         value={fmt(totSaves)}      accent={COLOR} />
        <MetricCard label="Total reposts"       value={fmt(totReposts)}    accent={COLOR} />
        <MetricCard label="Total comments"      value={fmt(totComments)}   accent={COLOR} />
        <MetricCard label="Total engagement"    value={fmt(totEngagement)} accent={COLOR} />
        <MetricCard label="Avg. retention"      value={`${avgRetention}%`} accent={COLOR} bar={avgRetention} />
        <MetricCard label="Avg. view rate (3s)" value={`${avgView3s}%`}    accent={COLOR} bar={avgView3s} />
      </OverviewGrid>

      <SectionLabel>Reels — click to expand all metrics</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {videos.map((v: any, i: number) => {
          const totalEng = v.totalEngagement || ((v.likes || 0) + (v.comments || 0) + (v.shares || 0) + (v.saves || 0) + (v.reposts || 0));
          return (
            <VideoCard
              key={v.id || i}
              id={String(v.id || i)}
              thumb={v.thumb || "📸"}
              title={v.title || "Untitled"}
              publishedAt={v.publishedAt || ""}
              badge={v.format || "reel"}
              accentColor={COLOR}
              quickStats={[
                { label: "views",      value: fmt(v.views || 0) },
                { label: "likes",      value: fmt(v.likes || 0) },
                { label: "saves",      value: fmt(v.saves || 0) },
                { label: "engagement", value: fmt(totalEng) },
              ]}
            >
              <div style={{ paddingTop: 12 }}>
                <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>All metrics</p>
                <InlineMetrics items={[
                  { label: "Views",             value: fmt(v.views || 0) },
                  { label: "Duration",          value: v.duration ? `${v.duration}s` : "—" },
                  { label: "Avg. watch time",   value: v.avgWatchTime ? `${v.avgWatchTime}s` : "—" },
                  { label: "View rate past 3s", value: `${v.viewRatePast3s || 0}%` },
                  { label: "Retention",         value: `${v.retention || 0}%` },
                  { label: "Shares",            value: fmt(v.shares || 0) },
                  { label: "Saves",             value: fmt(v.saves || 0) },
                  { label: "Reposts",           value: fmt(v.reposts || 0) },
                  { label: "Comments",          value: fmt(v.comments || 0) },
                  { label: "Likes",             value: fmt(v.likes || 0) },
                  { label: "Total engagement",  value: fmt(totalEng) },
                ]} />

                <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, marginBottom: 6 }}>View rate past 3s</p>
                    <div style={{ height: 8, borderRadius: 99, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                      <div style={{ width: `${v.viewRatePast3s || 0}%`, height: "100%", background: COLOR, borderRadius: 99 }} />
                    </div>
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 4 }}>{v.viewRatePast3s || 0}% kept watching past 3s</p>
                  </div>
                  <div>
                    <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, marginBottom: 6 }}>Retention</p>
                    <div style={{ height: 8, borderRadius: 99, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                      <div style={{ width: `${v.retention || 0}%`, height: "100%", background: COLOR, borderRadius: 99 }} />
                    </div>
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 4 }}>{v.retention || 0}% avg. completion</p>
                  </div>
                </div>

                {totalEng > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Engagement breakdown</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {[
                        { label: "Likes",    value: v.likes    || 0 },
                        { label: "Saves",    value: v.saves    || 0 },
                        { label: "Shares",   value: v.shares   || 0 },
                        { label: "Reposts",  value: v.reposts  || 0 },
                        { label: "Comments", value: v.comments || 0 },
                      ].map(row => {
                        const pct = totalEng > 0 ? Math.round(row.value / totalEng * 100) : 0;
                        return (
                          <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, width: 60, flexShrink: 0 }}>{row.label}</span>
                            <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 99, overflow: "hidden" }}>
                              <div style={{ width: `${pct}%`, height: "100%", background: COLOR, borderRadius: 99 }} />
                            </div>
                            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, width: 90, textAlign: "right" }}>{fmt(row.value)} ({pct}%)</span>
                          </div>
                        );
                      })}
                    </div>
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
