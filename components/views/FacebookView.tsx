"use client";
import { fbPosts } from "@/lib/data";
import { MetricCard, OverviewGrid, SectionLabel, VideoCard, InlineMetrics, fmt } from "@/components/ui";

const COLOR = "#1877F2";

export default function FacebookView({ dateRange, csvData }: { dateRange: string; csvData?: any[] }) {
  const posts = csvData?.length ? csvData : fbPosts;

  const totReach  = posts.reduce((a: number, v: any) => a + v.reach, 0);
  const totImp    = posts.reduce((a: number, v: any) => a + v.impressions, 0);
  const totLikes  = posts.reduce((a: number, v: any) => a + v.likes, 0);
  const totCom    = posts.reduce((a: number, v: any) => a + v.comments, 0);
  const totShares = posts.reduce((a: number, v: any) => a + v.shares, 0);
  const totClicks = posts.reduce((a: number, v: any) => a + v.clicks, 0);

  return (
    <>
      <SectionLabel>Facebook overview · {posts.length} posts</SectionLabel>
      <OverviewGrid>
        <MetricCard label="Total reach"       value={fmt(totReach)}  accent={COLOR} />
        <MetricCard label="Total impressions" value={fmt(totImp)}    accent={COLOR} />
        <MetricCard label="Total likes"       value={fmt(totLikes)}  accent={COLOR} />
        <MetricCard label="Total comments"    value={fmt(totCom)}    accent={COLOR} />
        <MetricCard label="Total shares"      value={fmt(totShares)} accent={COLOR} />
        <MetricCard label="Total link clicks" value={fmt(totClicks)} accent={COLOR} />
      </OverviewGrid>

      <SectionLabel>Posts — click to expand</SectionLabel>
      <div className="flex flex-col gap-2">
        {posts.map((v: any) => (
          <VideoCard
            key={v.id} id={v.id} thumb={v.thumb} title={v.title} publishedAt={v.publishedAt}
            accentColor={COLOR}
            quickStats={[
              { label: "reach",    value: fmt(v.reach) },
              { label: "likes",    value: fmt(v.likes) },
              { label: "clicks",   value: fmt(v.clicks) },
            ]}
          >
            <div className="pt-3">
              <InlineMetrics items={[
                { label: "Reach",        value: fmt(v.reach) },
                { label: "Impressions",  value: fmt(v.impressions) },
                { label: "Likes",        value: fmt(v.likes) },
                { label: "Comments",     value: fmt(v.comments) },
                { label: "Shares",       value: fmt(v.shares) },
                { label: "Link clicks",  value: fmt(v.clicks) },
              ]} />
            </div>
          </VideoCard>
        ))}
      </div>
    </>
  );
}
