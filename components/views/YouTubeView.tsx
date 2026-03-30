"use client";
import { useState } from "react";
import { ytShorts, ytLongform } from "@/lib/data";
import {
  MetricCard, OverviewGrid, SectionLabel, VideoCard,
  LikeDislikeBar, DiscoveryBars, InlineMetrics, FormatToggle,
  fmt, fmtSec, fmtPct
} from "@/components/ui";

const COLOR = "#FF4444";

function filterByMonth(videos: any[], dateRange: string) {
  if (dateRange === "all") return videos;
  return videos.filter((v: any) => {
    if (!v.publishedAt) return true;
    const d = new Date(v.publishedAt);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return ym === dateRange;
  });
}

export default function YouTubeView({ dateRange, shortsCsvData, longCsvData }: {
  dateRange: string;
  shortsCsvData?: any[];
  longCsvData?: any[];
}) {
  const [format, setFormat] = useState<"shorts" | "longform">("shorts");

  const shortsVideos = filterByMonth(shortsCsvData?.length ? shortsCsvData : ytShorts, dateRange);
  const longVideos   = filterByMonth(longCsvData?.length   ? longCsvData   : ytLongform, dateRange);

  return (
    <div>
      <FormatToggle
        value={format}
        onChange={v => setFormat(v as "shorts" | "longform")}
        options={[
          { id: "shorts",   label: `Shorts (${shortsVideos.length})` },
          { id: "longform", label: `Long-form (${longVideos.length})` },
        ]}
      />
      {format === "shorts"   && <ShortsSection   videos={shortsVideos} />}
      {format === "longform" && <LongformSection videos={longVideos} />}
    </div>
  );
}

function ShortsSection({ videos }: { videos: any[] }) {
  const totViews    = videos.reduce((a: number, v: any) => a + (v.views || 0), 0);
  const totLikes    = videos.reduce((a: number, v: any) => a + (v.likes || 0), 0);
  const totComments = videos.reduce((a: number, v: any) => a + (v.comments || 0), 0);
  const totSubs     = videos.reduce((a: number, v: any) => a + (v.subscribers || 0), 0);
  const avgStayed   = videos.length ? Math.round(videos.reduce((a: number, v: any) => a + (v.stayedToWatch || 0), 0) / videos.length) : 0;
  const avgAvd      = videos.length ? Math.round(videos.reduce((a: number, v: any) => a + (v.avgViewDuration || 0), 0) / videos.length) : 0;

  if (!videos.length) return (
    <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)" }}>
      No Shorts data for this month. Try importing a CSV or selecting a different month.
    </div>
  );

  return (
    <>
      <SectionLabel>Shorts overview · {videos.length} videos</SectionLabel>
      <OverviewGrid>
        <MetricCard label="Total views"          value={fmt(totViews)}    accent={COLOR} />
        <MetricCard label="Total likes"          value={fmt(totLikes)}    accent={COLOR} />
        <MetricCard label="Total comments"       value={fmt(totComments)} accent={COLOR} />
        <MetricCard label="Subscribers gained"   value={`+${fmt(totSubs)}`} accent={COLOR} />
        <MetricCard label="Avg. stayed to watch" value={`${avgStayed}%`} accent={COLOR} bar={avgStayed} />
      </OverviewGrid>

      <SectionLabel>Videos — click to expand</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {videos.map((v: any, i: number) => {
          const likes    = v.likes    || 0;
          const dislikes = v.dislikes || 0;
          const likeRatio = likes + dislikes > 0 ? Math.round(likes / (likes + dislikes) * 100) : 100;
          return (
            <VideoCard
              key={v.id || i}
              id={String(v.id || i)}
              thumb={v.thumb || "🎬"}
              title={v.title || "Untitled"}
              publishedAt={v.publishedAt || ""}
              badge={v.duration ? fmtSec(v.duration) : undefined}
              accentColor={COLOR}
              quickStats={[
                { label: "views",    value: fmt(v.views || 0) },
                { label: "likes",    value: fmt(v.likes || 0) },
                { label: "retained", value: `${v.stayedToWatch || 0}%` },
              ]}
            >
              <div style={{ paddingTop: 12 }}>
                <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Performance</p>
                <InlineMetrics items={[
                  { label: "Views",              value: fmt(v.views || 0) },
                  { label: "Duration",           value: v.duration ? fmtSec(v.duration) : "—", sub: v.duration ? `${v.duration}s` : undefined },
                  { label: "Avg. view duration", value: v.avgViewDuration ? fmtSec(v.avgViewDuration) : "—", sub: v.avgViewDuration ? `${v.avgViewDuration}s` : undefined },
                  { label: "Stayed to watch",    value: `${v.stayedToWatch || 0}%` },
                  { label: "Comments",           value: fmt(v.comments || 0) },
                  { label: "Likes",              value: fmt(v.likes || 0) },
                  { label: "Subscribers gained", value: `+${fmt(v.subscribers || 0)}` },
                  { label: "Impressions",        value: fmt(v.impressions || 0) },
                  { label: "CTR",                value: v.ctr ? `${v.ctr}%` : "—" },
                ]} />

                <div style={{ marginTop: 16 }}>
                  <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Likes vs. dislikes</p>
                  <LikeDislikeBar likes={likes} dislikes={dislikes} />
                  <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, marginTop: 4 }}>
                    {fmt(likes)} likes · {fmt(dislikes)} dislikes · {likeRatio}% positive
                  </p>
                </div>

                {v.discovery && (
                  <div style={{ marginTop: 16 }}>
                    <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>How viewers find this Short</p>
                    <DiscoveryBars color={COLOR} data={{
                      "Suggested videos": v.discovery.suggested || 0,
                      "Hashtag page":     v.discovery.hashtag   || 0,
                      "Following feed":   v.discovery.following || 0,
                      "Search":           v.discovery.search    || 0,
                      "Other":            v.discovery.other     || 0,
                    }} />
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

function LongformSection({ videos }: { videos: any[] }) {
  const totViews  = videos.reduce((a: number, v: any) => a + (v.views || 0), 0);
  const totLikes  = videos.reduce((a: number, v: any) => a + (v.likes || 0), 0);
  const avgCTR    = videos.length ? (videos.reduce((a: number, v: any) => a + (v.ctr || 0), 0) / videos.length).toFixed(1) : "0.0";
  const avgSEO    = videos.length ? Math.round(videos.reduce((a: number, v: any) => a + (v.seoScore || 0), 0) / videos.length) : 0;
  const avgPct    = videos.length ? (videos.reduce((a: number, v: any) => a + (v.avgPctViewed || 0), 0) / videos.length).toFixed(1) : "0.0";

  if (!videos.length) return (
    <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)" }}>
      No Long-form data for this month. Try importing a CSV or selecting a different month.
    </div>
  );

  return (
    <>
      <SectionLabel>Long-form overview · {videos.length} videos</SectionLabel>
      <OverviewGrid>
        <MetricCard label="Total views"    value={fmt(totViews)}    accent={COLOR} />
        <MetricCard label="Total likes"    value={fmt(totLikes)}    accent={COLOR} />
        <MetricCard label="Avg. CTR"       value={`${avgCTR}%`}    accent={COLOR} bar={parseFloat(avgCTR) * 10} />
        <MetricCard label="Avg. SEO score" value={`${avgSEO}/100`} accent={COLOR} bar={avgSEO} />
        <MetricCard label="Avg. % viewed"  value={`${avgPct}%`}    accent={COLOR} bar={parseFloat(avgPct)} />
      </OverviewGrid>

      <SectionLabel>Videos — click to expand</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {videos.map((v: any, i: number) => {
          const likes    = v.likes    || 0;
          const dislikes = v.dislikes || 0;
          const likeRatio = likes + dislikes > 0 ? Math.round(likes / (likes + dislikes) * 100) : 100;
          return (
            <VideoCard
              key={v.id || i}
              id={String(v.id || i)}
              thumb={v.thumb || "🎬"}
              title={v.title || "Untitled"}
              publishedAt={v.publishedAt || ""}
              badge={v.duration ? fmtSec(v.duration) : undefined}
              accentColor={COLOR}
              quickStats={[
                { label: "views",      value: fmt(v.views || 0) },
                { label: "avg viewed", value: `${v.avgPctViewed || 0}%` },
                { label: "CTR",        value: `${v.ctr || 0}%` },
              ]}
            >
              <div style={{ paddingTop: 12 }}>
                <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Performance</p>
                <InlineMetrics items={[
                  { label: "Views",              value: fmt(v.views || 0) },
                  { label: "Duration",           value: v.duration ? fmtSec(v.duration) : "—", sub: v.duration ? `${v.duration}s` : undefined },
                  { label: "Avg. view duration", value: v.avgViewDuration ? fmtSec(v.avgViewDuration) : "—", sub: v.avgViewDuration ? `${v.avgViewDuration}s` : undefined },
                  { label: "Avg. % viewed",      value: `${v.avgPctViewed || 0}%` },
                  { label: "CTR",                value: `${v.ctr || 0}%` },
                  { label: "SEO score",          value: v.seoScore ? `${v.seoScore}/100` : "—" },
                  { label: "Comments",           value: fmt(v.comments || 0) },
                  { label: "Likes",              value: fmt(v.likes || 0) },
                  { label: "Subscribers gained", value: `+${fmt(v.subscribers || 0)}` },
                  { label: "Impressions",        value: fmt(v.impressions || 0) },
                ]} />

                <div style={{ marginTop: 16 }}>
                  <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Likes vs. dislikes</p>
                  <LikeDislikeBar likes={likes} dislikes={dislikes} />
                  <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, marginTop: 4 }}>
                    {fmt(likes)} likes · {fmt(dislikes)} dislikes · {likeRatio}% positive
                  </p>
                </div>

                <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, marginBottom: 4 }}>SEO score</p>
                    <div style={{ height: 8, borderRadius: 99, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                      <div style={{ width: `${v.seoScore || 0}%`, height: "100%", background: COLOR, borderRadius: 99 }} />
                    </div>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 4 }}>{v.seoScore || 0}/100</p>
                  </div>
                  <div>
                    <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, marginBottom: 4 }}>Click-through rate</p>
                    <div style={{ height: 8, borderRadius: 99, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                      <div style={{ width: `${(v.ctr || 0) * 10}%`, height: "100%", background: COLOR, borderRadius: 99 }} />
                    </div>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 4 }}>{v.ctr || 0}%</p>
                  </div>
                </div>
              </div>
            </VideoCard>
          );
        })}
      </div>
    </>
  );
}
