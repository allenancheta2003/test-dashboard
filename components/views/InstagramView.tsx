"use client";
import { igVideos } from "@/lib/data";
import {
  MetricCard, OverviewGrid, SectionLabel, VideoCard,
  InlineMetrics, fmt, fmtSec
} from "@/components/ui";

const COLOR = "#E1306C";

export default function InstagramView({ dateRange, csvData }: { dateRange: string; csvData?: any[] }) {
  const videos = csvData?.length ? csvData : igVideos;

  const totViews      = videos.reduce((a: number, v: any) => a + v.views, 0);
  const totLikes      = videos.reduce((a: number, v: any) => a + v.likes, 0);
  const totShares     = videos.reduce((a: number, v: any) => a + v.shares, 0);
  const totSaves      = videos.reduce((a: number, v: any) => a + v.saves, 0);
  const totReposts    = videos.reduce((a: number, v: any) => a + v.reposts, 0);
  const totComments   = videos.reduce((a: number, v: any) => a + v.comments, 0);
  const totEngagement = videos.reduce((a: number, v: any) => a + v.totalEngagement, 0);
  const avgRetention  = Math.round(videos.reduce((a: number, v: any) => a + v.retention, 0) / videos.length);
  const avgView3s     = Math.round(videos.reduce((a: number, v: any) => a + v.viewRatePast3s, 0) / videos.length);

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
        <MetricCard label="Avg. view rate (3s)" value={`${avgView3s}%`}   accent={COLOR} bar={avgView3s} />
      </OverviewGrid>

      <SectionLabel>Reels — click to expand all metrics</SectionLabel>
      <div className="flex flex-col gap-2">
        {videos.map((v: any) => (
          <VideoCard
            key={v.id}
            id={v.id}
            thumb={v.thumb}
            title={v.title}
            publishedAt={v.publishedAt}
            badge={v.format}
            accentColor={COLOR}
            quickStats={[
              { label: "views",     value: fmt(v.views) },
              { label: "likes",     value: fmt(v.likes) },
              { label: "saves",     value: fmt(v.saves) },
              { label: "engagement",value: fmt(v.totalEngagement) },
            ]}
          >
            <div className="pt-3">
              <p className="text-white/25 text-[10px] uppercase tracking-widest font-semibold mb-2">All metrics</p>
              <InlineMetrics items={[
                { label: "Views",               value: fmt(v.views) },
                { label: "Duration",            value: `${v.duration}s` },
                { label: "Avg. watch time",     value: `${v.avgWatchTime}s` },
                { label: "View rate past 3s",   value: `${v.viewRatePast3s}%` },
                { label: "Retention",           value: `${v.retention}%` },
                { label: "Shares",              value: fmt(v.shares) },
                { label: "Saves",               value: fmt(v.saves) },
                { label: "Reposts",             value: fmt(v.reposts) },
                { label: "Comments",            value: fmt(v.comments) },
                { label: "Likes",               value: fmt(v.likes) },
                { label: "Total engagement",    value: fmt(v.totalEngagement) },
              ]} />

              {/* 3s view rate + retention bars */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-white/25 text-[10px] mb-2">View rate past 3s</p>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${v.viewRatePast3s}%`, background: COLOR }} />
                  </div>
                  <p className="text-white/30 text-[11px] mt-1">{v.viewRatePast3s}% kept watching past 3s</p>
                </div>
                <div>
                  <p className="text-white/25 text-[10px] mb-2">Retention</p>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${v.retention}%`, background: COLOR }} />
                  </div>
                  <p className="text-white/30 text-[11px] mt-1">{v.retention}% avg. completion</p>
                </div>
              </div>

              {/* Engagement breakdown */}
              <div className="mt-4">
                <p className="text-white/25 text-[10px] uppercase tracking-widest font-semibold mb-2">Engagement breakdown</p>
                <div className="flex flex-col gap-2">
                  {[
                    { label: "Likes",    value: v.likes,    pct: Math.round(v.likes / v.totalEngagement * 100) },
                    { label: "Saves",    value: v.saves,    pct: Math.round(v.saves / v.totalEngagement * 100) },
                    { label: "Shares",   value: v.shares,   pct: Math.round(v.shares / v.totalEngagement * 100) },
                    { label: "Reposts",  value: v.reposts,  pct: Math.round(v.reposts / v.totalEngagement * 100) },
                    { label: "Comments", value: v.comments, pct: Math.round(v.comments / v.totalEngagement * 100) },
                  ].map(row => (
                    <div key={row.label} className="flex items-center gap-3">
                      <span className="text-white/40 text-[11px] w-16 flex-shrink-0">{row.label}</span>
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${row.pct}%`, background: COLOR }} />
                      </div>
                      <span className="text-white/50 text-[11px] w-24 text-right tabular-nums">{fmt(row.value)} ({row.pct}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </VideoCard>
        ))}
      </div>
    </>
  );
}
