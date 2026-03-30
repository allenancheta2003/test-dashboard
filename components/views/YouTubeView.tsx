"use client";
import { useState } from "react";
import { ytShorts, ytLongform } from "@/lib/data";
import {
  MetricCard, OverviewGrid, SectionLabel, VideoCard,
  LikeDislikeBar, DiscoveryBars, InlineMetrics, FormatToggle,
  fmt, fmtSec, fmtPct
} from "@/components/ui";

const COLOR = "#FF4444";

// Handles both "Mar 25, 2026" and "2026-03-25" formats
function parseVideoDate(dateStr: string): string {
  if (!dateStr || dateStr.trim() === "" || dateStr.trim() === "—") return "";
  const s = dateStr.trim();
  // Already in YYYY-MM format
  if (/^\d{4}-\d{2}$/.test(s)) return s;
  // YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 7);
  // "Mar 25, 2026" or "Mar 2026" format
  const months: Record<string, string> = {
    jan:"01", feb:"02", mar:"03", apr:"04", may:"05", jun:"06",
    jul:"07", aug:"08", sep:"09", oct:"10", nov:"11", dec:"12"
  };
  const match = s.match(/^([A-Za-z]{3})\s+(?:\d+,\s*)?(\d{4})$/);
  if (match) {
    const m = months[match[1].toLowerCase()];
    if (m) return `${match[2]}-${m}`;
  }
  // Try native Date parse as fallback
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }
  return "";
}

function filterByMonth(videos: any[], dateRange: string) {
  if (dateRange === "all") return videos;
  return videos.filter((v: any) => {
    const ym = parseVideoDate(v.publishedAt || v["Video publish time"] || "");
    if (!ym) return false;
    return ym === dateRange;
  });
}

export default function YouTubeView({ dateRange, shortsCsvData, longCsvData }: {
  dateRange: string;
  shortsCsvData?: any[];
  longCsvData?: any[];
}) {
  const [format, setFormat] = useState<"shorts" | "longform">("shorts");

  // If shortsCsvData has content, ALL of it goes into Shorts
  // Only split into longform if longCsvData is separately imported
  const allImported = shortsCsvData?.length ? shortsCsvData : null;

  const shortsVideos = filterByMonth(
    allImported ? allImported : ytShorts,
    dateRange
  );

  const longVideos = filterByMonth(
    longCsvData?.length ? longCsvData : ytLongform,
    dateRange
  );

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
  const totViews    = videos.reduce((a: number, v: any) => a + (Number(v.views)       || 0), 0);
  const totLikes    = videos.reduce((a: number, v: any) => a + (Number(v.likes)       || 0), 0);
  const totComments = videos.reduce((a: number, v: any) => a + (Number(v.comments)    || 0), 0);
  const totSubs     = videos.reduce((a: number, v: any) => a + (Number(v.subscribers) || 0), 0);
  const totImpr     = videos.reduce((a: number, v: any) => a + (Number(v.impressions) || 0), 0);
  const avgCTR      = videos.length ? (videos.reduce((a: number, v: any) => a + (Number(v.ctr) || 0), 0) / videos.length).toFixed(1) : "0.0";

  if (!videos.length) return (
    <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)", fontSize: 14 }}>
      No Shorts data for this period. Import a CSV or select a different month.
    </div>
  );

  return (
    <>
      <SectionLabel>Shorts overview · {videos.length} videos</SectionLabel>
      <OverviewGrid>
        <MetricCard label="Total views"        value={fmt(totViews)}    accent={COLOR} />
        <MetricCard label="Total likes"        value={fmt(totLikes)}    accent={COLOR} />
        <MetricCard label="Total comments"     value={fmt(totComments)} accent={COLOR} />
        <MetricCard label="Subscribers gained" value={`+${fmt(totSubs)}`} accent={COLOR} />
        <MetricCard label="Total impressions"  value={fmt(totImpr)}     accent={COLOR} />
        <MetricCard label="Avg. CTR"           value={`${avgCTR}%`}     accent={COLOR} bar={parseFloat(avgCTR) * 10} />
      </OverviewGrid>

      <SectionLabel>Videos — click to expand</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {videos.map((v: any, i: number) => {
          const likes    = Number(v.likes)    || 0;
          const dislikes = Number(v.dislikes) || 0;
          const dur      = Number(v.duration) || 0;
          const likeRatio = likes + dislikes > 0 ? Math.round(likes / (likes + dislikes) * 100) : 100;
          return (
            <VideoCard
              key={v.id || v.Content || i}
              id={String(v.id || i)}
              thumb={v.thumb || "🎬"}
              title={v.title || "Untitled"}
              publishedAt={v.publishedAt || ""}
              badge={dur > 0 ? fmtSec(dur) : undefined}
              accentColor={COLOR}
              quickStats={[
                { label: "views",       value: fmt(Number(v.views) || 0) },
                { label: "likes",       value: fmt(likes) },
                { label: "impressions", value: fmt(Number(v.impressions) || 0) },
              ]}
            >
              <div style={{ paddingTop: 12 }}>
                <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                  All metrics
                </p>
                <InlineMetrics items={[
                  { label: "Views",              value: fmt(Number(v.views)       || 0) },
                  { label: "Duration",           value: dur > 0 ? fmtSec(dur) : "—", sub: dur > 0 ? `${dur}s` : undefined },
                  { label: "Avg. view duration", value: v.avgViewDuration ? fmtSec(Number(v.avgViewDuration)) : "—" },
                  { label: "Stayed to watch",    value: v.stayedToWatch ? `${v.stayedToWatch}%` : "—" },
                  { label: "Comments",           value: fmt(Number(v.comments)    || 0) },
                  { label: "Likes",              value: fmt(likes) },
                  { label: "Subscribers gained", value: `+${fmt(Number(v.subscribers) || 0)}` },
                  { label: "Impressions",        value: fmt(Number(v.impressions)  || 0) },
                  { label: "CTR",                value: v.ctr ? `${Number(v.ctr).toFixed(1)}%` : "—" },
                  { label: "Watch time (hrs)",   value: v.watchTimeHours ? `${Number(v.watchTimeHours).toFixed(1)}h` : "—" },
                ]} />

                <div style={{ marginTop: 16 }}>
                  <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                    Likes vs. dislikes
                  </p>
                  <LikeDislikeBar likes={likes} dislikes={dislikes} />
                  <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, marginTop: 4 }}>
                    {fmt(likes)} likes · {fmt(dislikes)} dislikes · {likeRatio}% positive
                  </p>
                </div>

                {v.discovery && (
                  <div style={{ marginTop: 16 }}>
                    <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                      How viewers find this Short
                    </p>
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
  const totViews = videos.reduce((a: number, v: any) => a + (Number(v.views) || 0), 0);
  const totLikes = videos.reduce((a: number, v: any) => a + (Number(v.likes) || 0), 0);
  const avgCTR   = videos.length ? (videos.reduce((a: number, v: any) => a + (Number(v.ctr) || 0), 0) / videos.length).toFixed(1) : "0.0";
  const avgSEO   = videos.length ? Math.round(videos.reduce((a: number, v: any) => a + (Number(v.seoScore) || 0), 0) / videos.length) : 0;
  const avgPct   = videos.length ? (videos.reduce((a: number, v: any) => a + (Number(v.avgPctViewed) || 0), 0) / videos.length).toFixed(1) : "0.0";

  if (!videos.length) return (
    <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)", fontSize: 14 }}>
      No Long-form data for this period. Import a <code>youtube-longform.csv</code> file using the Import CSV button.
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
          const likes    = Number(v.likes)    || 0;
          const dislikes = Number(v.dislikes) || 0;
          const dur      = Number(v.duration) || 0;
          const likeRatio = likes + dislikes > 0 ? Math.round(likes / (likes + dislikes) * 100) : 100;
          return (
            <VideoCard
              key={v.id || i}
              id={String(v.id || i)}
              thumb={v.thumb || "🎬"}
              title={v.title || "Untitled"}
              publishedAt={v.publishedAt || ""}
              badge={dur > 0 ? fmtSec(dur) : undefined}
              accentColor={COLOR}
              quickStats={[
                { label: "views",      value: fmt(Number(v.views) || 0) },
                { label: "avg viewed", value: `${Number(v.avgPctViewed) || 0}%` },
                { label: "CTR",        value: `${Number(v.ctr) || 0}%` },
              ]}
            >
              <div style={{ paddingTop: 12 }}>
                <InlineMetrics items={[
                  { label: "Views",              value: fmt(Number(v.views) || 0) },
                  { label: "Duration",           value: dur > 0 ? fmtSec(dur) : "—" },
                  { label: "Avg. view duration", value: v.avgViewDuration ? fmtSec(Number(v.avgViewDuration)) : "—" },
                  { label: "Avg. % viewed",      value: `${Number(v.avgPctViewed) || 0}%` },
                  { label: "CTR",                value: v.ctr ? `${Number(v.ctr).toFixed(1)}%` : "—" },
                  { label: "SEO score",          value: v.seoScore ? `${v.seoScore}/100` : "—" },
                  { label: "Comments",           value: fmt(Number(v.comments) || 0) },
                  { label: "Likes",              value: fmt(likes) },
                  { label: "Subscribers gained", value: `+${fmt(Number(v.subscribers) || 0)}` },
                  { label: "Impressions",        value: fmt(Number(v.impressions) || 0) },
                ]} />
                <div style={{ marginTop: 16 }}>
                  <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Likes vs. dislikes</p>
                  <LikeDislikeBar likes={likes} dislikes={dislikes} />
                </div>
              </div>
            </VideoCard>
          );
        })}
      </div>
    </>
  );
}
