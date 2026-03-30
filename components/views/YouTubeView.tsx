"use client";
import { useState } from "react";
import { ytShorts, ytLongform } from "@/lib/data";
import {
  MetricCard, OverviewGrid, SectionLabel, VideoCard,
  LikeDislikeBar, DiscoveryBars, InlineMetrics, FormatToggle,
  fmt, fmtSec, fmtPct
} from "@/components/ui";

const COLOR = "#FF4444";

export default function YouTubeView({ dateRange, shortsCsvData, longCsvData }: { dateRange: string; shortsCsvData?: any[]; longCsvData?: any[] }) {
  const [format, setFormat] = useState<"shorts" | "longform">("shorts");

  return (
    <div>
      <FormatToggle
        value={format}
        onChange={v => setFormat(v as "shorts" | "longform")}
        options={[{ id: "shorts", label: "Shorts" }, { id: "longform", label: "Long-form" }]}
      />

      {format === "shorts" ? <ShortsSection /> : <LongformSection />}
    </div>
  );
}

function ShortsSection({ videos }: { videos: any[] }) {
  const totViews   = videos.reduce((a, v) => a + v.views, 0);
  const totLikes   = videos.reduce((a, v) => a + v.likes, 0);
  const totComments= videos.reduce((a, v) => a + v.comments, 0);
  const totSubs    = videos.reduce((a, v) => a + v.subscribers, 0);
  const avgStayed  = Math.round(videos.reduce((a, v) => a + v.stayedToWatch, 0) / videos.length);
  const avgAvd     = Math.round(videos.reduce((a, v) => a + v.avgViewDuration, 0) / videos.length);

  return (
    <>
      <SectionLabel>Shorts overview · {videos.length} videos</SectionLabel>
      <OverviewGrid>
        <MetricCard label="Total views"        value={fmt(totViews)}    accent={COLOR} />
        <MetricCard label="Total likes"        value={fmt(totLikes)}    accent={COLOR} />
        <MetricCard label="Total comments"     value={fmt(totComments)} accent={COLOR} />
        <MetricCard label="Subscribers gained" value={`+${fmt(totSubs)}`} accent={COLOR} />
        <MetricCard label="Avg. stayed to watch" value={`${avgStayed}%`} accent={COLOR} bar={avgStayed} />
      </OverviewGrid>

      <SectionLabel>Videos — click to expand</SectionLabel>
      <div className="flex flex-col gap-2">
        {videos.map(v => {
          const likeRatio = Math.round(v.likes / (v.likes + v.dislikes) * 100);
          return (
            <VideoCard
              key={v.id}
              id={v.id}
              thumb={v.thumb}
              title={v.title}
              publishedAt={v.publishedAt}
              badge={`${fmtSec(v.duration)}`}
              accentColor={COLOR}
              quickStats={[
                { label: "views",    value: fmt(v.views) },
                { label: "likes",    value: fmt(v.likes) },
                { label: "retained", value: `${v.stayedToWatch}%` },
              ]}
            >
              {/* ── All YT Shorts metrics ── */}
              <div className="pt-3">
                <p className="text-white/25 text-[10px] uppercase tracking-widest font-semibold mb-2">Performance</p>
                <InlineMetrics items={[
                  { label: "Views",               value: fmt(v.views) },
                  { label: "Duration",            value: fmtSec(v.duration),        sub: `${v.duration}s` },
                  { label: "Avg. view duration",  value: fmtSec(v.avgViewDuration), sub: `${v.avgViewDuration}s` },
                  { label: "Stayed to watch",     value: `${v.stayedToWatch}%` },
                  { label: "Comments",            value: fmt(v.comments) },
                  { label: "Likes",               value: fmt(v.likes) },
                  { label: "Subscribers gained",  value: `+${fmt(v.subscribers)}` },
                ]} />

                {/* Likes vs Dislikes */}
                <div className="mt-4">
                  <p className="text-white/25 text-[10px] uppercase tracking-widest font-semibold mb-2">Likes vs. dislikes</p>
                  <LikeDislikeBar likes={v.likes} dislikes={v.dislikes} />
                  <p className="text-white/25 text-[11px] mt-1">
                    {fmt(v.likes)} likes · {fmt(v.dislikes)} dislikes · {likeRatio}% positive
                  </p>
                </div>

                {/* Discovery */}
                <div className="mt-4">
                  <p className="text-white/25 text-[10px] uppercase tracking-widest font-semibold mb-3">How viewers find this Short</p>
                  <DiscoveryBars color={COLOR} data={{
                    "Suggested videos": v.discovery.suggested,
                    "Hashtag page":     v.discovery.hashtag,
                    "Following feed":   v.discovery.following,
                    "Search":           v.discovery.search,
                    "Other":            v.discovery.other,
                  }} />
                </div>
              </div>
            </VideoCard>
          );
        })}
      </div>
    </>
  );
}

function LongformSection({ videos }: { videos: any[] }) {
  const totViews   = videos.reduce((a, v) => a + v.views, 0);
  const totLikes   = videos.reduce((a, v) => a + v.likes, 0);
  const avgCTR     = (videos.reduce((a, v) => a + v.ctr, 0) / videos.length).toFixed(1);
  const avgSEO     = Math.round(videos.reduce((a, v) => a + v.seoScore, 0) / videos.length);
  const avgPct     = (videos.reduce((a, v) => a + v.avgPctViewed, 0) / videos.length).toFixed(1);

  return (
    <>
      <SectionLabel>Long-form overview · {videos.length} videos</SectionLabel>
      <OverviewGrid>
        <MetricCard label="Total views"      value={fmt(totViews)} accent={COLOR} />
        <MetricCard label="Total likes"      value={fmt(totLikes)} accent={COLOR} />
        <MetricCard label="Avg. CTR"         value={`${avgCTR}%`}  accent={COLOR} bar={parseFloat(avgCTR) * 10} />
        <MetricCard label="Avg. SEO score"   value={`${avgSEO}/100`} accent={COLOR} bar={avgSEO} />
        <MetricCard label="Avg. % viewed"    value={`${avgPct}%`}  accent={COLOR} bar={parseFloat(avgPct)} />
      </OverviewGrid>

      <SectionLabel>Videos — click to expand</SectionLabel>
      <div className="flex flex-col gap-2">
        {videos.map(v => {
          const likeRatio = Math.round(v.likes / (v.likes + v.dislikes) * 100);
          return (
            <VideoCard
              key={v.id}
              id={v.id}
              thumb={v.thumb}
              title={v.title}
              publishedAt={v.publishedAt}
              badge={fmtSec(v.duration)}
              accentColor={COLOR}
              quickStats={[
                { label: "views",      value: fmt(v.views) },
                { label: "avg viewed", value: `${v.avgPctViewed}%` },
                { label: "CTR",        value: `${v.ctr}%` },
              ]}
            >
              <div className="pt-3">
                <p className="text-white/25 text-[10px] uppercase tracking-widest font-semibold mb-2">Performance</p>
                <InlineMetrics items={[
                  { label: "Views",               value: fmt(v.views) },
                  { label: "Duration",            value: fmtSec(v.duration),        sub: `${v.duration}s` },
                  { label: "Avg. view duration",  value: fmtSec(v.avgViewDuration), sub: `${v.avgViewDuration}s` },
                  { label: "Avg. % viewed",       value: `${v.avgPctViewed}%` },
                  { label: "CTR",                 value: `${v.ctr}%` },
                  { label: "SEO score",           value: `${v.seoScore}/100` },
                  { label: "Comments",            value: fmt(v.comments) },
                  { label: "Likes",               value: fmt(v.likes) },
                  { label: "Subscribers gained",  value: `+${fmt(v.subscribers)}` },
                ]} />

                <div className="mt-4">
                  <p className="text-white/25 text-[10px] uppercase tracking-widest font-semibold mb-2">Likes vs. dislikes</p>
                  <LikeDislikeBar likes={v.likes} dislikes={v.dislikes} />
                  <p className="text-white/25 text-[11px] mt-1">
                    {fmt(v.likes)} likes · {fmt(v.dislikes)} dislikes · {likeRatio}% positive
                  </p>
                </div>

                {/* SEO + CTR bars */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-white/25 text-[10px] mb-1">SEO score</p>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full bg-[#FF4444]" style={{ width: `${v.seoScore}%` }} />
                    </div>
                    <p className="text-white/40 text-[11px] mt-1">{v.seoScore}/100</p>
                  </div>
                  <div>
                    <p className="text-white/25 text-[10px] mb-1">Click-through rate</p>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full bg-[#FF4444]" style={{ width: `${v.ctr * 10}%` }} />
                    </div>
                    <p className="text-white/40 text-[11px] mt-1">{v.ctr}%</p>
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
