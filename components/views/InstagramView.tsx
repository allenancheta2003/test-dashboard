"use client";
import { igVideos } from "@/lib/data";
import { MetricCard, OverviewGrid, SectionLabel, VideoCard, InlineMetrics, fmt, fmtSec } from "@/components/ui";

const COLOR = "#E1306C";

function parseYM(v: any): string {
  const raw = v.publishedYM || v.publishedAt || "";
  if (!raw) return "";
  if (/^\d{4}-\d{2}/.test(raw)) return raw.slice(0,7);
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[1].padStart(2,"0")}`;
  return "";
}

function filterByMonth(videos: any[], dateRange: string) {
  if (dateRange === "all") return videos;
  if (dateRange === "unpublished") return videos.filter(v => !parseYM(v));
  return videos.filter(v => parseYM(v) === dateRange);
}

export default function InstagramView({ dateRange, csvData }: { dateRange: string; csvData?: any[] }) {
  const allVideos = csvData?.length ? csvData : igVideos;
  const videos    = filterByMonth(allVideos, dateRange);

  const totViews      = videos.reduce((a,v) => a+(Number(v.views)    ||0), 0);
  const totReach      = videos.reduce((a,v) => a+(Number(v.reach)    ||0), 0);
  const totLikes      = videos.reduce((a,v) => a+(Number(v.likes)    ||0), 0);
  const totShares     = videos.reduce((a,v) => a+(Number(v.shares)   ||0), 0);
  const totSaves      = videos.reduce((a,v) => a+(Number(v.saves)    ||0), 0);
  const totComments   = videos.reduce((a,v) => a+(Number(v.comments) ||0), 0);
  const totFollows    = videos.reduce((a,v) => a+(Number(v.follows)  ||0), 0);
  const totEngagement = totLikes + totComments + totShares + totSaves;

  if (!videos.length) return (
    <div style={{ textAlign:"center", padding:60, color:"rgba(255,255,255,0.3)", fontSize:14 }}>
      No Instagram data for this period. Import a CSV or select a different month.
    </div>
  );

  return (
    <>
      <SectionLabel>Instagram overview · {videos.length} posts</SectionLabel>
      <OverviewGrid>
        <MetricCard label="Total views"      value={fmt(totViews)}      accent={COLOR} />
        <MetricCard label="Total reach"      value={fmt(totReach)}      accent={COLOR} />
        <MetricCard label="Total likes"      value={fmt(totLikes)}      accent={COLOR} />
        <MetricCard label="Total comments"   value={fmt(totComments)}   accent={COLOR} />
        <MetricCard label="Total shares"     value={fmt(totShares)}     accent={COLOR} />
        <MetricCard label="Total saves"      value={fmt(totSaves)}      accent={COLOR} />
        <MetricCard label="New follows"      value={fmt(totFollows)}    accent={COLOR} />
        <MetricCard label="Total engagement" value={fmt(totEngagement)} accent={COLOR} />
      </OverviewGrid>

      <SectionLabel>Posts — click to expand · click button to open on Instagram</SectionLabel>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {videos.map((v: any, i: number) => {
          const totalEng  = (Number(v.likes)||0)+(Number(v.comments)||0)+(Number(v.shares)||0)+(Number(v.saves)||0);
          const dur       = Number(v.duration) || 0;
          const permalink = v.permalink || "";
          return (
            <VideoCard
              key={v.id||i} id={String(v.id||i)}
              thumb={v.thumb||"📸"} title={v.title||"Untitled"}
              publishedAt={v.publishedAt||"Unpublished"}
              badge={v.format||"reel"} accentColor={COLOR}
              quickStats={[
                { label:"views",    value:fmt(Number(v.views)   ||0) },
                { label:"likes",    value:fmt(Number(v.likes)   ||0) },
                { label:"saves",    value:fmt(Number(v.saves)   ||0) },
                { label:"reach",    value:fmt(Number(v.reach)   ||0) },
              ]}
            >
              <div style={{ paddingTop:12 }}>
                {permalink && (
                  <a href={permalink} target="_blank" rel="noopener noreferrer"
                    style={{ display:"inline-flex", alignItems:"center", gap:6, marginBottom:14, padding:"6px 12px", borderRadius:8, background:"rgba(225,48,108,0.15)", color:COLOR, fontSize:12, fontWeight:600, textDecoration:"none", border:"1px solid rgba(225,48,108,0.3)" }}
                    onClick={e=>e.stopPropagation()}>
                    ↗ Open on Instagram
                  </a>
                )}
                <p style={{ color:"rgba(255,255,255,0.25)", fontSize:10, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>All metrics</p>
                <InlineMetrics items={[
                  { label:"Views",            value:fmt(Number(v.views)   ||0) },
                  { label:"Reach",            value:fmt(Number(v.reach)   ||0) },
                  { label:"Duration",         value:dur>0?fmtSec(dur):"—", sub:dur>0?`${dur}s`:undefined },
                  { label:"Likes",            value:fmt(Number(v.likes)   ||0) },
                  { label:"Comments",         value:fmt(Number(v.comments)||0) },
                  { label:"Shares",           value:fmt(Number(v.shares)  ||0) },
                  { label:"Saves",            value:fmt(Number(v.saves)   ||0) },
                  { label:"New follows",      value:fmt(Number(v.follows) ||0) },
                  { label:"Total engagement", value:fmt(totalEng) },
                  { label:"Post type",        value:v.format||"—" },
                ]} />
                {totalEng > 0 && (
                  <div style={{ marginTop:16 }}>
                    <p style={{ color:"rgba(255,255,255,0.25)", fontSize:10, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>Engagement breakdown</p>
                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      {[
                        { label:"Likes",    value:Number(v.likes)   ||0 },
                        { label:"Saves",    value:Number(v.saves)   ||0 },
                        { label:"Shares",   value:Number(v.shares)  ||0 },
                        { label:"Comments", value:Number(v.comments)||0 },
                      ].map(row => {
                        const pct = totalEng>0?Math.round(row.value/totalEng*100):0;
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
