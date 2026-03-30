"use client";
import { fbPosts } from "@/lib/data";
import { MetricCard, OverviewGrid, SectionLabel, VideoCard, InlineMetrics, fmt } from "@/components/ui";

const COLOR = "#1877F2";

export default function FacebookView({ dateRange, csvData }: { dateRange: string; csvData?: any[] }) {
  const allPosts = csvData?.length ? csvData : fbPosts;

  const posts = dateRange === "all" ? allPosts : allPosts.filter((v: any) => {
    if (!v.publishedAt) return true;
    const d = new Date(v.publishedAt);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return ym === dateRange;
  });

  const totReach  = posts.reduce((a: number, v: any) => a + (v.reach  || 0), 0);
  const totImp    = posts.reduce((a: number, v: any) => a + (v.impressions || 0), 0);
  const totLikes  = posts.reduce((a: number, v: any) => a + (v.likes  || 0), 0);
  const totCom    = posts.reduce((a: number, v: any) => a + (v.comments || 0), 0);
  const totShares = posts.reduce((a: number, v: any) => a + (v.shares || 0), 0);
  const totClicks = posts.reduce((a: number, v: any) => a + (v.clicks || 0), 0);

  if (!posts.length) return (
    <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)" }}>
      No Facebook data for this month. Try importing a CSV or selecting a different month.
    </div>
  );

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
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {posts.map((v: any, i: number) => (
          <VideoCard
            key={v.id || i}
            id={String(v.id || i)}
            thumb={v.thumb || "📄"}
            title={v.title || "Untitled"}
            publishedAt={v.publishedAt || ""}
            accentColor={COLOR}
            quickStats={[
              { label: "reach",  value: fmt(v.reach  || 0) },
              { label: "likes",  value: fmt(v.likes  || 0) },
              { label: "clicks", value: fmt(v.clicks || 0) },
            ]}
          >
            <div style={{ paddingTop: 12 }}>
              <InlineMetrics items={[
                { label: "Reach",       value: fmt(v.reach       || 0) },
                { label: "Impressions", value: fmt(v.impressions || 0) },
                { label: "Likes",       value: fmt(v.likes       || 0) },
                { label: "Comments",    value: fmt(v.comments    || 0) },
                { label: "Shares",      value: fmt(v.shares      || 0) },
                { label: "Link clicks", value: fmt(v.clicks      || 0) },
              ]} />
            </div>
          </VideoCard>
        ))}
      </div>
    </>
  );
}
