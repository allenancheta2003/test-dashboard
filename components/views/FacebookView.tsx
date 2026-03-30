"use client";
import { fbPosts } from "@/lib/data";
import { MetricCard, OverviewGrid, SectionLabel, VideoCard, InlineMetrics, fmt, fmtSec } from "@/components/ui";

const COLOR = "#1877F2";

function parseYM(v: any): string {
  const raw = v.publishedYM || v.publishedAt || "";
  if (!raw) return "";
  if (/^\d{4}-\d{2}/.test(raw)) return raw.slice(0,7);
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[1].padStart(2,"0")}`;
  return "";
}

function filterByMonth(posts: any[], dateRange: string) {
  if (dateRange === "all") return posts;
  if (dateRange === "unpublished") return posts.filter(v => !parseYM(v));
  return posts.filter(v => parseYM(v) === dateRange);
}

export default function FacebookView({ dateRange, csvData }: { dateRange: string; csvData?: any[] }) {
  const allPosts = csvData?.length ? csvData : fbPosts;
  const posts    = filterByMonth(allPosts, dateRange);

  const totViews      = posts.reduce((a,v) => a+(Number(v.views)          ||0), 0);
  const totReach      = posts.reduce((a,v) => a+(Number(v.reach)          ||0), 0);
  const totReactions  = posts.reduce((a,v) => a+(Number(v.reactions)      ||0), 0);
  const totComments   = posts.reduce((a,v) => a+(Number(v.comments)       ||0), 0);
  const totShares     = posts.reduce((a,v) => a+(Number(v.shares)         ||0), 0);
  const totClicks     = posts.reduce((a,v) => a+(Number(v.clicks)         ||0), 0);
  const totViews3s    = posts.reduce((a,v) => a+(Number(v.views3s)        ||0), 0);
  const totEngagement = posts.reduce((a,v) => a+(Number(v.totalEngagement)||0), 0);

  if (!posts.length) return (
    <div style={{ textAlign:"center", padding:60, color:"rgba(255,255,255,0.3)", fontSize:14 }}>
      No Facebook data for this period. Import a CSV or select a different month.
    </div>
  );

  return (
    <>
      <SectionLabel>Facebook overview · {posts.length} posts</SectionLabel>
      <OverviewGrid>
        <MetricCard label="Total views"         value={fmt(totViews)}      accent={COLOR} />
        <MetricCard label="Total reach"         value={fmt(totReach)}      accent={COLOR} />
        <MetricCard label="Total reactions"     value={fmt(totReactions)}  accent={COLOR} />
        <MetricCard label="Total comments"      value={fmt(totComments)}   accent={COLOR} />
        <MetricCard label="Total shares"        value={fmt(totShares)}     accent={COLOR} />
        <MetricCard label="Total clicks"        value={fmt(totClicks)}     accent={COLOR} />
        <MetricCard label="3-sec video views"   value={fmt(totViews3s)}    accent={COLOR} />
        <MetricCard label="Total engagement"    value={fmt(totEngagement)} accent={COLOR} />
      </OverviewGrid>

      <SectionLabel>Posts — click to expand · click button to open on Facebook</SectionLabel>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {posts.map((v: any, i: number) => {
          const dur       = Number(v.duration)       || 0;
          const avgSecs   = Number(v.avgSecondsViewed)|| 0;
          const permalink = v.permalink || "";
          const totalEng  = Number(v.totalEngagement)||(
            (Number(v.reactions)||0)+(Number(v.comments)||0)+(Number(v.shares)||0)
          );
          return (
            <VideoCard
              key={v.id||i} id={String(v.id||i)}
              thumb={v.thumb||"📄"} title={v.title||"Untitled"}
              publishedAt={v.publishedAt||"Unpublished"}
              badge={v.format||undefined} accentColor={COLOR}
              quickStats={[
                { label:"views",     value:fmt(Number(v.views)    ||0) },
                { label:"reach",     value:fmt(Number(v.reach)    ||0) },
                { label:"reactions", value:fmt(Number(v.reactions)||0) },
                { label:"clicks",    value:fmt(Number(v.clicks)   ||0) },
              ]}
            >
              <div style={{ paddingTop:12 }}>
                {permalink && (
                  <a href={permalink} target="_blank" rel="noopener noreferrer"
                    style={{ display:"inline-flex", alignItems:"center", gap:6, marginBottom:14, padding:"6px 12px", borderRadius:8, background:"rgba(24,119,242,0.15)", color:COLOR, fontSize:12, fontWeight:600, textDecoration:"none", border:"1px solid rgba(24,119,242,0.3)" }}
                    onClick={e=>e.stopPropagation()}>
                    ↗ Open on Facebook
                  </a>
                )}
                <p style={{ color:"rgba(255,255,255,0.25)", fontSize:10, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>All metrics</p>
                <InlineMetrics items={[
                  { label:"Views",              value:fmt(Number(v.views)          ||0) },
                  { label:"Reach",              value:fmt(Number(v.reach)          ||0) },
                  { label:"Duration",           value:dur>0?fmtSec(dur):"—", sub:dur>0?`${dur}s`:undefined },
                  { label:"Reactions",          value:fmt(Number(v.reactions)      ||0) },
                  { label:"Comments",           value:fmt(Number(v.comments)       ||0) },
                  { label:"Shares",             value:fmt(Number(v.shares)         ||0) },
                  { label:"Total clicks",       value:fmt(Number(v.clicks)         ||0) },
                  { label:"3-sec video views",  value:fmt(Number(v.views3s)        ||0) },
                  { label:"Seconds viewed",     value:Number(v.secondsViewed)>0?`${Math.round(Number(v.secondsViewed))}s`:"—" },
                  { label:"Avg. seconds viewed",value:avgSecs>0?`${avgSecs.toFixed(1)}s`:"—" },
                  { label:"Total engagement",   value:fmt(totalEng) },
                  { label:"Post type",          value:v.format||"—" },
                ]} />
                {totalEng > 0 && (
                  <div style={{ marginTop:16 }}>
                    <p style={{ color:"rgba(255,255,255,0.25)", fontSize:10, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>Engagement breakdown</p>
                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      {[
                        { label:"Reactions", value:Number(v.reactions)||0 },
                        { label:"Shares",    value:Number(v.shares)   ||0 },
                        { label:"Comments",  value:Number(v.comments) ||0 },
                        { label:"Clicks",    value:Number(v.clicks)   ||0 },
                      ].map(row => {
                        const total = (Number(v.reactions)||0)+(Number(v.shares)||0)+(Number(v.comments)||0)+(Number(v.clicks)||0);
                        const pct = total>0?Math.round(row.value/total*100):0;
                        return (
                          <div key={row.label} style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <span style={{ color:"rgba(255,255,255,0.4)", fontSize:11, width:65, flexShrink:0 }}>{row.label}</span>
                            <div style={{ flex:1, height:6, background:"rgba(255,255,255,0.1)", borderRadius:99, overflow:"hidden" }}>
                              <div style={{ width:`${pct}%`, height:"100%", background:COLOR, borderRadius:99 }} />
                            </div>
                            <span style={{ color:"rgba(255,255,255,0.5)", fontSize:11, width:90, textAlign:"right" }}>{fmt(row.value)} ({pct}%)</span>
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
