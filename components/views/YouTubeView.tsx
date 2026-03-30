"use client";
import { useState } from "react";
import { ytShorts, ytLongform } from "@/lib/data";
import {
  MetricCard, OverviewGrid, SectionLabel, VideoCard,
  LikeDislikeBar, DiscoveryBars, InlineMetrics, FormatToggle,
  fmt, fmtSec
} from "@/components/ui";

const COLOR = "#FF4444";

function parseYM(dateStr: string): string {
  if (!dateStr || dateStr.trim() === "") return "";
  const s = dateStr.trim();
  if (/^\d{4}-\d{2}/.test(s)) return s.slice(0, 7);
  const months: Record<string,string> = {
    jan:"01",feb:"02",mar:"03",apr:"04",may:"05",jun:"06",
    jul:"07",aug:"08",sep:"09",oct:"10",nov:"11",dec:"12"
  };
  const m = s.match(/^([A-Za-z]{3})\s+\d+,\s*(\d{4})$/);
  if (m) { const mo=months[m[1].toLowerCase()]; if(mo) return `${m[2]}-${mo}`; }
  const d = new Date(s);
  if (!isNaN(d.getTime())) return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
  return "";
}

function filterByMonth(videos: any[], dateRange: string) {
  if (dateRange === "all") return videos;
  if (dateRange === "unpublished") return videos.filter(v => !parseYM(v.publishedAt || ""));
  return videos.filter(v => parseYM(v.publishedAt || "") === dateRange);
}

function parseAvgDur(val: string | number): number {
  if (!val) return 0;
  if (typeof val === "number") return val;
  const parts = String(val).split(":").map(Number);
  if (parts.length === 3) return parts[0]*3600+parts[1]*60+parts[2];
  if (parts.length === 2) return parts[0]*60+parts[1];
  return 0;
}

export default function YouTubeView({ dateRange, shortsCsvData, longCsvData }: {
  dateRange: string; shortsCsvData?: any[]; longCsvData?: any[];
}) {
  const [format, setFormat] = useState<"shorts"|"longform">("shorts");
  const shortsVideos = filterByMonth(shortsCsvData?.length ? shortsCsvData : ytShorts, dateRange);
  const longVideos   = filterByMonth(longCsvData?.length   ? longCsvData   : ytLongform, dateRange);
  return (
    <div>
      <FormatToggle
        value={format}
        onChange={v => setFormat(v as "shorts"|"longform")}
        options={[
          { id:"shorts",   label:`Shorts (${shortsVideos.length})` },
          { id:"longform", label:`Long-form (${longVideos.length})` },
        ]}
      />
      {format === "shorts"   && <ShortsSection   videos={shortsVideos} />}
      {format === "longform" && <LongformSection videos={longVideos} />}
    </div>
  );
}

function ShortsSection({ videos }: { videos: any[] }) {
  const totViews    = videos.reduce((a,v) => a+(Number(v.views)||0), 0);
  const totLikes    = videos.reduce((a,v) => a+(Number(v.likes)||0), 0);
  const totComments = videos.reduce((a,v) => a+(Number(v.comments)||0), 0);
  const totSubs     = videos.reduce((a,v) => a+(Number(v.subscribers)||0), 0);
  const totImpr     = videos.reduce((a,v) => a+(Number(v.impressions)||0), 0);
  const avgStayed   = videos.length ? (videos.reduce((a,v)=>a+(Number(v.stayedToWatch)||0),0)/videos.length).toFixed(1) : "0";
  const avgCTR      = videos.length ? (videos.reduce((a,v)=>a+(Number(v.ctr)||0),0)/videos.length).toFixed(2) : "0";
  if (!videos.length) return (
    <div style={{textAlign:"center",padding:60,color:"rgba(255,255,255,0.3)",fontSize:14}}>
      No Shorts data for this period. Import a CSV or select a different month.
    </div>
  );
  return (
    <>
      <SectionLabel>Shorts overview · {videos.length} videos</SectionLabel>
      <OverviewGrid>
        <MetricCard label="Total views"          value={fmt(totViews)}      accent={COLOR} />
        <MetricCard label="Total likes"          value={fmt(totLikes)}      accent={COLOR} />
        <MetricCard label="Total comments"       value={fmt(totComments)}   accent={COLOR} />
        <MetricCard label="Subscribers gained"   value={`+${fmt(totSubs)}`} accent={COLOR} />
        <MetricCard label="Total impressions"    value={fmt(totImpr)}       accent={COLOR} />
        <MetricCard label="Avg. stayed to watch" value={`${avgStayed}%`}    accent={COLOR} bar={parseFloat(avgStayed)} />
        <MetricCard label="Avg. CTR"             value={`${avgCTR}%`}       accent={COLOR} bar={parseFloat(avgCTR)*10} />
      </OverviewGrid>
      <SectionLabel>Videos — click row to expand · click button to open on YouTube</SectionLabel>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {videos.map((v: any, i: number) => {
          const likes     = Number(v.likes)        || 0;
          const likesPct  = Number(v.likesPct)     || 0;
          const dislikes  = likesPct > 0 ? Math.round(likes/(likesPct/100)-likes) : 0;
          const dur       = Number(v.duration)     || 0;
          const avgDurSec = parseAvgDur(v.avgViewDuration);
          const stayed    = Number(v.stayedToWatch)|| 0;
          const videoId   = v.videoId || "";
          const ytUrl     = videoId ? `https://youtube.com/shorts/${videoId}` : null;
          return (
            <VideoCard
              key={v.id||i} id={String(v.id||i)}
              thumb={v.thumb||"🎬"} title={v.title||"Untitled"}
              publishedAt={v.publishedAt||"Unpublished"}
              badge={dur>0?fmtSec(dur):undefined}
              accentColor={COLOR}
              quickStats={[
                {label:"views",  value:fmt(Number(v.views)||0)},
                {label:"likes",  value:fmt(likes)},
                {label:"stayed", value:`${stayed}%`},
              ]}
            >
              <div style={{paddingTop:12}}>
                {ytUrl && (
                  <a href={ytUrl} target="_blank" rel="noopener noreferrer"
                    style={{display:"inline-flex",alignItems:"center",gap:6,marginBottom:14,padding:"6px 12px",borderRadius:8,background:"rgba(255,68,68,0.15)",color:"#FF4444",fontSize:12,fontWeight:600,textDecoration:"none",border:"1px solid rgba(255,68,68,0.3)"}}
                    onClick={e=>e.stopPropagation()}>
                    ▶ Open on YouTube
                  </a>
                )}
                <p style={{color:"rgba(255,255,255,0.25)",fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>All metrics</p>
                <InlineMetrics items={[
                  {label:"Views",              value:fmt(Number(v.views)||0)},
                  {label:"Duration",           value:dur>0?fmtSec(dur):"—", sub:dur>0?`${dur}s`:undefined},
                  {label:"Avg. view duration", value:avgDurSec>0?fmtSec(avgDurSec):"—", sub:avgDurSec>0?`${avgDurSec}s`:undefined},
                  {label:"Stayed to watch",    value:stayed>0?`${stayed}%`:"—"},
                  {label:"Comments",           value:fmt(Number(v.comments)||0)},
                  {label:"Likes",              value:fmt(likes)},
                  {label:"Subscribers gained", value:`+${fmt(Number(v.subscribers)||0)}`},
                  {label:"Impressions",        value:fmt(Number(v.impressions)||0)},
                  {label:"CTR",                value:v.ctr?`${Number(v.ctr).toFixed(2)}%`:"—"},
                  {label:"Watch time",         value:v.watchTimeHours?`${Number(v.watchTimeHours).toFixed(1)}h`:"—"},
                ]} />
                <div style={{marginTop:16}}>
                  <p style={{color:"rgba(255,255,255,0.25)",fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Likes vs. dislikes</p>
                  <LikeDislikeBar likes={likes} dislikes={dislikes} />
                  <p style={{color:"rgba(255,255,255,0.25)",fontSize:11,marginTop:4}}>
                    {fmt(likes)} likes · {likesPct>0?`${likesPct}% positive`:"no dislike data"}
                  </p>
                </div>
                {stayed>0&&(
                  <div style={{marginTop:16}}>
                    <p style={{color:"rgba(255,255,255,0.25)",fontSize:10,marginBottom:6}}>Stayed to watch</p>
                    <div style={{height:8,borderRadius:99,background:"rgba(255,255,255,0.1)",overflow:"hidden"}}>
                      <div style={{width:`${Math.min(stayed,100)}%`,height:"100%",background:COLOR,borderRadius:99}} />
                    </div>
                    <p style={{color:"rgba(255,255,255,0.3)",fontSize:11,marginTop:4}}>{stayed}% of viewers watched this Short</p>
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
  const totViews = videos.reduce((a,v)=>a+(Number(v.views)||0),0);
  const totLikes = videos.reduce((a,v)=>a+(Number(v.likes)||0),0);
  const avgCTR   = videos.length?(videos.reduce((a,v)=>a+(Number(v.ctr)||0),0)/videos.length).toFixed(2):"0";
  const avgPct   = videos.length?(videos.reduce((a,v)=>a+(Number(v.avgPctViewed)||0),0)/videos.length).toFixed(1):"0";
  if (!videos.length) return (
    <div style={{textAlign:"center",padding:60,color:"rgba(255,255,255,0.3)",fontSize:14}}>
      No Long-form data. Import a <code>youtube-longform.csv</code> file.
    </div>
  );
  return (
    <>
      <SectionLabel>Long-form overview · {videos.length} videos</SectionLabel>
      <OverviewGrid>
        <MetricCard label="Total views"   value={fmt(totViews)} accent={COLOR} />
        <MetricCard label="Total likes"   value={fmt(totLikes)} accent={COLOR} />
        <MetricCard label="Avg. CTR"      value={`${avgCTR}%`}  accent={COLOR} bar={parseFloat(avgCTR)*10} />
        <MetricCard label="Avg. % viewed" value={`${avgPct}%`}  accent={COLOR} bar={parseFloat(avgPct)} />
      </OverviewGrid>
      <SectionLabel>Videos — click to expand</SectionLabel>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {videos.map((v: any,i: number)=>{
          const likes=Number(v.likes)||0;
          const likesPct=Number(v.likesPct)||0;
          const dislikes=likesPct>0?Math.round(likes/(likesPct/100)-likes):0;
          const dur=Number(v.duration)||0;
          const avgDurSec=parseAvgDur(v.avgViewDuration);
          const videoId=v.videoId||"";
          const ytUrl=videoId?`https://youtube.com/watch?v=${videoId}`:null;
          return (
            <VideoCard
              key={v.id||i} id={String(v.id||i)}
              thumb={v.thumb||"🎬"} title={v.title||"Untitled"}
              publishedAt={v.publishedAt||"Unpublished"}
              badge={dur>0?fmtSec(dur):undefined}
              accentColor={COLOR}
              quickStats={[
                {label:"views",      value:fmt(Number(v.views)||0)},
                {label:"avg viewed", value:`${Number(v.avgPctViewed)||0}%`},
                {label:"CTR",        value:`${Number(v.ctr)||0}%`},
              ]}
            >
              <div style={{paddingTop:12}}>
                {ytUrl&&(
                  <a href={ytUrl} target="_blank" rel="noopener noreferrer"
                    style={{display:"inline-flex",alignItems:"center",gap:6,marginBottom:14,padding:"6px 12px",borderRadius:8,background:"rgba(255,68,68,0.15)",color:"#FF4444",fontSize:12,fontWeight:600,textDecoration:"none",border:"1px solid rgba(255,68,68,0.3)"}}
                    onClick={e=>e.stopPropagation()}>
                    ▶ Open on YouTube
                  </a>
                )}
                <InlineMetrics items={[
                  {label:"Views",              value:fmt(Number(v.views)||0)},
                  {label:"Duration",           value:dur>0?fmtSec(dur):"—"},
                  {label:"Avg. view duration", value:avgDurSec>0?fmtSec(avgDurSec):"—"},
                  {label:"Avg. % viewed",      value:`${Number(v.avgPctViewed)||0}%`},
                  {label:"CTR",                value:v.ctr?`${Number(v.ctr).toFixed(2)}%`:"—"},
                  {label:"Comments",           value:fmt(Number(v.comments)||0)},
                  {label:"Likes",              value:fmt(likes)},
                  {label:"Subscribers gained", value:`+${fmt(Number(v.subscribers)||0)}`},
                  {label:"Watch time",         value:v.watchTimeHours?`${Number(v.watchTimeHours).toFixed(1)}h`:"—"},
                ]} />
                <div style={{marginTop:16}}>
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
