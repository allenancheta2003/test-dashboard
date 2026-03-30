"use client";
import { ttVideos } from "@/lib/data";
import {
  MetricCard, OverviewGrid, SectionLabel, VideoCard,
  InlineMetrics, fmt, fmtSec
} from "@/components/ui";

const COLOR = "#69C9D0";

export default function TikTokView({ dateRange, csvData }: { dateRange: string; csvData?: any[] }) {
  const allVideos = csvData?.length ? csvData : ttVideos;

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
  const totComments   = videos.reduce((a: number, v: any) => a + (v.comments || 0), 0);
  const totEngagement = videos.reduce((a: number, v: any) => a + (v.totalEngagement || 0), 0);
  const avgRetention  = videos.length ? Math.round(videos.reduce((a: number, v: any) => a + (v.retention || 0), 0) / videos.length) : 0;
  const avgWatch      = videos.length ? Math.round(videos.reduce((a: number, v: any) => a + (v.avgWatchTime || 0), 0) / videos.length) : 0;

  if (!videos.length) return (
    <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)" }}>
      No TikTok data for this month. Try importing a CSV or selecting a different month.
    </div>
  );

  return (
    <>
      <SectionLabel>TikTok overview · {videos.length} videos</SectionLabel>
      <OverviewGrid>
        <MetricCard label="Total views"      value={fmt(totViews)}      accent={COLOR} />
        <MetricCard label="Total likes"      value={fmt(totLikes)}      accent={COLOR} />
        <MetricCard label="Total shares"     value={fmt(totShares)}     accent={COLOR} />
        <MetricCard label="Total saves"      value={fmt(totSaves)}      accent={COLOR} />
        <MetricCard label="Total comments"   value={fmt(totComments)}   accent={COLOR} />
        <MetricCard label="Total engagement" value={fmt(totEngagement)} accent={COLOR} />
        <MetricCard label="Avg. retention"   value={`${avgRetention}%`} accent={COLOR} bar={avgRetention} />
        <MetricCard label="Avg. watch time"  value={`${avgWatch}s`}     accent={COLOR} />
      </OverviewGrid>

      <SectionLabel>Videos — click to expand all metrics</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {videos.map((v: any, i: number) => {
          const totalEng = v.totalEngagement || (v.likes + v.comments + v.shares + v.saves) || 0;
          return (
            <VideoCard
              key={v.id || i}
              id={String(v.id || i)}
              thumb={v.thumb || "🎵"}
              title={v.title || "Untitled"}
              publishedAt={v.publishedAt || ""}
              badge={v.duration ? `${v.duration}s` : undefined}
              accentColor={COLOR}
              quickStats={[
                { label: "views",      value: fmt(v.views || 0) },
                { label: "likes",      value: fmt(v.likes || 0) },
                { label: "retention",  value: `${v.retention || 0}%` },
                { label: "engagement", value: fmt(totalEng) },
              ]}
            >
              <div style={{ paddingTop: 12 }}>
                <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>All metrics</p>
                <InlineMetrics items={[
                  { label: "Views",            value: fmt(v.views || 0) },
                  { label: "Duration",         value: v.duration ? `${v.duration}s` : "—" },
                  { label: "Avg. watch time",  value: v.avgWatchTime ? `${v.avgWatchTime}s` : "—" },
                  { label: "Retention",        value: `${v.retention || 0}%` },
                  { label: "Shares",           value: fmt(v.shares || 0) },
                  { label: "Saves",            value: fmt(v.saves || 0) },
                  { label: "Comments",         value: fmt(v.comments || 0) },
                  { label: "Likes",            value: fmt(v.likes || 0) },
                  { label: "Total engagement", value: fmt(totalEng) },
                ]} />

                <div style={{ marginTop: 16 }}>
                  <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, marginBottom: 8 }}>Retention rate</p>
                  <div style={{ height: 8, borderRadius: 99, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                    <div style={{ width: `${v.retention || 0}%`, height: "100%", background: COLOR, borderRadius: 99 }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
                    <span>{v.retention || 0}% watched</span>
                    <span>avg {v.avgWatchTime || 0}s of {v.duration || 0}s</span>
                  </div>
                </div>

                {totalEng > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Engagement breakdown</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {[
                        { label: "Likes",    value: v.likes    || 0 },
                        { label: "Shares",   value: v.shares   || 0 },
                        { label: "Saves",    value: v.saves    || 0 },
                        { label: "Comments", value: v.comments || 0 },
                      ].map(row => {
                        const pct = totalEng > 0 ? Math.round(row.value / totalEng * 100) : 0;
                        return (
                          <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, width: 60, flexShrink: 0 }}>{row.label}</span>
                            <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 99, overflow: "hidden" }}>
                              <div style={{ width: `${pct}%`, height: "100%", background: COLOR, borderRadius: 99 }} />
                            </div>
                            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, width: 80, textAlign: "right" }}>{fmt(row.value)} ({pct}%)</span>
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
