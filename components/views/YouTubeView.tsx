"use client";
import { useState, useMemo } from "react";
import { ytShorts, ytLongform } from "@/lib/data";
import {
  MetricCard, OverviewGrid, SectionLabel, VideoCard,
  LikeDislikeBar, InlineMetrics, FormatToggle, fmt, fmtSec
} from "@/components/ui";
import {
  filterByDate, getYM, getMonthsFromVideos, monthLabel,
  getTopVideo, sumMetric, avgMetric, generateInsight, fmtPct
} from "@/lib/analytics";
import AnalyticsChart from "@/components/AnalyticsChart";

const COLOR = "#FF4444";

function parseAvgDur(val: string | number): number {
  if (!val) return 0;
  if (typeof val === "number") return val;
  const parts = String(val).split(":").map(Number);
  if (parts.length === 3) return parts[0]*3600+parts[1]*60+parts[2];
  if (parts.length === 2) return parts[0]*60+parts[1];
  return 0;
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function TabBar({ tabs, active, onChange }: { tabs:{id:string;label:string}[]; active:string; onChange:(id:string)=>void }) {
  return (
    <div style={{display:"flex",gap:4,marginBottom:20,borderBottom:"1px solid rgba(255,255,255,0.07)",paddingBottom:12}}>
      {tabs.map(t=>(
        <button key={t.id} onClick={()=>onChange(t.id)}
          style={{padding:"6px 14px",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,
            background:active===t.id?"rgba(255,255,255,0.1)":"transparent",
            color:active===t.id?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.4)",
            fontWeight:active===t.id?600:400}}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

function MetricPills({ metrics, active, onChange }: { metrics:{key:string;label:string}[]; active:string; onChange:(k:string)=>void }) {
  return (
    <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:12}}>
      {metrics.map(m=>(
        <button key={m.key} onClick={()=>onChange(m.key)}
          style={{padding:"4px 12px",borderRadius:99,border:`1px solid ${m.key===active?COLOR+"44":"rgba(255,255,255,0.1)"}`,
            background:m.key===active?COLOR+"18":"transparent",
            color:m.key===active?COLOR:"rgba(255,255,255,0.45)",
            fontSize:11,cursor:"pointer",fontWeight:m.key===active?600:400}}>
          {m.label}
        </button>
      ))}
    </div>
  );
}

function MonthSelect({ value, months, onChange }: { value:string; months:{val:string;label:string}[]; onChange:(v:string)=>void }) {
  return (
    <select value={value} onChange={e=>onChange(e.target.value)}
      style={{padding:"7px 12px",borderRadius:8,border:"1px solid rgba(255,255,255,0.15)",
        background:"#1a1a2e",color:"white",fontSize:13,cursor:"pointer"}}>
      {months.map(m=><option key={m.val} value={m.val}>{m.label}</option>)}
    </select>
  );
}

function TopCard({ video, allVideos, platform, metrics }: { video:any; allVideos:any[]; platform:string; metrics:{key:string;label:string;fmt?:(n:number)=>string}[] }) {
  if (!video) return null;
  const totalViews = sumMetric(allVideos, "views");
  const share = totalViews > 0 ? Math.round((Number(video.views)||0)/totalViews*100) : 0;
  const insight = generateInsight(video, allVideos, platform);
  const dur = Number(video.duration)||0;
  const videoId = video.videoId || "";
  const isShort = dur <= 180;
  const ytUrl = videoId ? `https://youtube.com/${isShort?"shorts/":"watch?v="}${videoId}` : null;
  return (
    <div style={{background:"rgba(255,255,255,0.04)",borderRadius:14,padding:16,marginBottom:16}}>
      <div style={{display:"inline-flex",alignItems:"center",fontSize:11,fontWeight:600,background:"#faeeda",color:"#854f0b",padding:"3px 10px",borderRadius:99,marginBottom:10}}>
        🏆 Top performer
      </div>
      <div style={{fontSize:15,fontWeight:600,color:"white",marginBottom:3}}>{video.title||"Untitled"}</div>
      <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginBottom:12}}>
        {video.publishedAt||"—"}
        {share>0&&<span style={{marginLeft:8,color:COLOR,fontWeight:500}}>{share}% of period's views</span>}
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
        {metrics.map(m=>{
          const val = video[m.key];
          if (val===undefined||val===null) return null;
          const display = m.fmt ? m.fmt(Number(val)) : fmt(Number(val));
          return (
            <div key={m.key} style={{display:"flex",flexDirection:"column",alignItems:"center",background:"rgba(255,255,255,0.06)",borderRadius:8,padding:"7px 12px",minWidth:60}}>
              <span style={{fontSize:14,fontWeight:600,color:"white"}}>{display}</span>
              <span style={{fontSize:10,color:"rgba(255,255,255,0.4)",marginTop:2}}>{m.label}</span>
            </div>
          );
        })}
      </div>
      <div style={{background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"10px 12px",fontSize:12,color:"rgba(255,255,255,0.55)",lineHeight:1.6,marginBottom:ytUrl?12:0}}>
        <span style={{color:"white",fontWeight:500}}>Why it stood out: </span>{insight}
      </div>
      {ytUrl&&(
        <a href={ytUrl} target="_blank" rel="noopener noreferrer"
          style={{display:"inline-flex",alignItems:"center",gap:5,marginTop:10,padding:"6px 12px",borderRadius:8,background:"rgba(255,68,68,0.15)",color:COLOR,fontSize:12,fontWeight:600,textDecoration:"none",border:"1px solid rgba(255,68,68,0.3)"}}>
          ▶ Open on YouTube
        </a>
      )}
    </div>
  );
}

function VideoTable({ videos, metrics, sortKey, onSort }: { videos:any[]; metrics:{key:string;label:string;fmt?:(n:number)=>string}[]; sortKey:string; onSort:(k:string)=>void }) {
  const maxVal = Math.max(...videos.map(v=>Number(v[sortKey])||0));
  const cols = `28px 1fr ${metrics.map(()=>"72px").join(" ")}`;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:5}}>
      <div style={{display:"grid",gridTemplateColumns:cols,gap:8,padding:"6px 12px",fontSize:10,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.06em"}}>
        <div>#</div>
        <div>Title</div>
        {metrics.map(m=>(
          <button key={m.key} onClick={()=>onSort(m.key)}
            style={{textAlign:"right",background:"none",border:"none",cursor:"pointer",padding:0,
              color:m.key===sortKey?COLOR:"rgba(255,255,255,0.3)",fontSize:10,textTransform:"uppercase",letterSpacing:"0.06em",fontWeight:m.key===sortKey?700:400}}>
            {m.label}{m.key===sortKey?" ↓":""}
          </button>
        ))}
      </div>
      {videos.map((v,i)=>{
        const barW = maxVal>0?Math.round((Number(v[sortKey])||0)/maxVal*100):0;
        const dur = Number(v.duration)||0;
        const isShort = dur<=180;
        const ytId = v.videoId||"";
        const link = ytId?`https://youtube.com/${isShort?"shorts/":"watch?v="}${ytId}`:null;
        return (
          <div key={v.id||i} style={{display:"grid",gridTemplateColumns:cols,gap:8,alignItems:"center",padding:"10px 12px",background:"rgba(255,255,255,0.03)",border:"0.5px solid rgba(255,255,255,0.07)",borderRadius:10}}>
            <div style={{fontSize:12,fontWeight:600,color:COLOR,textAlign:"center"}}>{i+1}</div>
            <div>
              {link?(
                <a href={link} target="_blank" rel="noopener noreferrer"
                  style={{fontSize:12,fontWeight:500,color:"white",textDecoration:"none",display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}
                  title={v.title}>{v.title||"Untitled"}</a>
              ):(
                <div style={{fontSize:12,fontWeight:500,color:"white",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.title||"Untitled"}</div>
              )}
              <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:1}}>{v.publishedAt||"Unpublished"}</div>
              <div style={{height:3,background:"rgba(255,255,255,0.08)",borderRadius:99,marginTop:4,overflow:"hidden"}}>
                <div style={{width:`${barW}%`,height:"100%",background:COLOR+"88",borderRadius:99}} />
              </div>
            </div>
            {metrics.map(m=>(
              <div key={m.key} style={{fontSize:12,fontWeight:500,color:"rgba(255,255,255,0.85)",textAlign:"right"}}>
                {m.fmt?m.fmt(Number(v[m.key]||0)):fmt(Number(v[m.key]||0))}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const TABS = [
  {id:"overview",label:"Overview"},
  {id:"videos",  label:"All videos"},
  {id:"chart",   label:"Chart"},
  {id:"compare", label:"Compare"},
];

const SHORTS_METRICS = [
  {key:"views",         label:"Views"},
  {key:"likes",         label:"Likes"},
  {key:"comments",      label:"Comments"},
  {key:"stayedToWatch", label:"Stayed %",   fmt:(n:number)=>fmtPct(n)},
  {key:"subscribers",   label:"Subs"},
  {key:"impressions",   label:"Impressions"},
  {key:"ctr",           label:"CTR %",      fmt:(n:number)=>fmtPct(n,2)},
  {key:"watchTimeHours",label:"Watch hrs",  fmt:(n:number)=>n?n.toFixed(1)+"h":"—"},
];

const LONG_METRICS = [
  {key:"views",         label:"Views"},
  {key:"likes",         label:"Likes"},
  {key:"comments",      label:"Comments"},
  {key:"avgPctViewed",  label:"Avg viewed", fmt:(n:number)=>fmtPct(n)},
  {key:"subscribers",   label:"Subs"},
  {key:"impressions",   label:"Impressions"},
  {key:"ctr",           label:"CTR %",      fmt:(n:number)=>fmtPct(n,2)},
];

export default function YouTubeView({ dateRange, shortsCsvData, longCsvData }: {
  dateRange: string; shortsCsvData?: any[]; longCsvData?: any[];
}) {
  const [format, setFormat]       = useState<"shorts"|"longform">("shorts");
  const [tab, setTab]             = useState("overview");
  const [sortKey, setSortKey]     = useState("views");
  const [chartMetric, setChartMetric] = useState("views");
  const [chartType, setChartType] = useState<"bar"|"line">("bar");
  const [cmpMode, setCmpMode]     = useState("month");
  const [cmpMetric, setCmpMetric] = useState("views");
  const [cmpMonth1, setCmpMonth1] = useState("");
  const [cmpMonth2, setCmpMonth2] = useState("");
  const [cmpV1, setCmpV1]         = useState(0);
  const [cmpV2, setCmpV2]         = useState(1);
  const [customD1, setCustomD1]   = useState("");
  const [customD2, setCustomD2]   = useState("");
  const [customD3, setCustomD3]   = useState("");
  const [customD4, setCustomD4]   = useState("");

  const allShorts = shortsCsvData?.length ? shortsCsvData : ytShorts;
  const allLong   = longCsvData?.length   ? longCsvData   : ytLongform;
  const allVideos = format === "shorts" ? allShorts : allLong;
  const metrics   = format === "shorts" ? SHORTS_METRICS : LONG_METRICS;
  const filtered  = filterByDate(allVideos, dateRange);
  const months    = useMemo(() => getMonthsFromVideos(allVideos), [allVideos]);
  const m1 = cmpMonth1 || months[0]?.val || "";
  const m2 = cmpMonth2 || months[1]?.val || "";
  const top    = getTopVideo(filtered, "views");
  const sorted = useMemo(() => [...filtered].sort((a,b)=>(Number(b[sortKey])||0)-(Number(a[sortKey])||0)), [filtered, sortKey]);

  const chartData = useMemo(() => {
    const byMonth: Record<string,number[]> = {};
    allVideos.forEach(v=>{const ym=getYM(v);if(!ym)return;if(!byMonth[ym])byMonth[ym]=[];byMonth[ym].push(Number(v[chartMetric])||0);});
    const ms = Object.keys(byMonth).sort();
    return {labels:ms.map(monthLabel), values:ms.map(ym=>byMonth[ym].reduce((a,b)=>a+b,0))};
  }, [allVideos, chartMetric]);

  const getMonthVids = (ym:string) => allVideos.filter(v=>getYM(v)===ym);
  const m1Vids=getMonthVids(m1), m2Vids=getMonthVids(m2);
  const m1Val=sumMetric(m1Vids,cmpMetric), m2Val=sumMetric(m2Vids,cmpMetric);
  const delta=m1Val-m2Val, deltaPct=m2Val>0?Math.round(delta/m2Val*100):0;

  return (
    <div>
      {/* Format toggle */}
      <FormatToggle value={format} onChange={v=>setFormat(v as "shorts"|"longform")}
        options={[{id:"shorts",label:`Shorts (${allShorts.length})`},{id:"longform",label:`Long-form (${allLong.length})`}]} />

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {/* ── OVERVIEW ── */}
      {tab==="overview" && (
        !filtered.length
          ? <div style={{textAlign:"center",padding:60,color:"rgba(255,255,255,0.3)",fontSize:14}}>No data for this period. Import a CSV or select a different month.</div>
          : <>
            <SectionLabel>{filtered.length} videos · {dateRange==="all"?"all time":monthLabel(dateRange)}</SectionLabel>
            <OverviewGrid>
              <MetricCard label="Total views"          value={fmt(sumMetric(filtered,"views"))}           accent={COLOR} />
              <MetricCard label="Total likes"          value={fmt(sumMetric(filtered,"likes"))}           accent={COLOR} />
              <MetricCard label="Total comments"       value={fmt(sumMetric(filtered,"comments"))}        accent={COLOR} />
              <MetricCard label="Subscribers gained"   value={`+${fmt(sumMetric(filtered,"subscribers"))}`} accent={COLOR} />
              {format==="shorts"&&<MetricCard label="Avg. stayed to watch" value={fmtPct(avgMetric(filtered,"stayedToWatch"))} accent={COLOR} bar={avgMetric(filtered,"stayedToWatch")} />}
              <MetricCard label="Avg. CTR" value={fmtPct(avgMetric(filtered,"ctr"),2)} accent={COLOR} bar={avgMetric(filtered,"ctr")*10} />
            </OverviewGrid>
            <SectionLabel>Top performing video</SectionLabel>
            <TopCard video={top} allVideos={filtered} platform="youtube" metrics={metrics.slice(0,6)} />
          </>
      )}

      {/* ── ALL VIDEOS ── */}
      {tab==="videos" && (
        <>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,flexWrap:"wrap",gap:8}}>
            <SectionLabel style={{margin:0}}>{sorted.length} videos · sort by</SectionLabel>
            <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
              {metrics.slice(0,6).map(m=>(
                <button key={m.key} onClick={()=>setSortKey(m.key)}
                  style={{padding:"3px 10px",borderRadius:99,border:`1px solid ${sortKey===m.key?COLOR+"44":"rgba(255,255,255,0.1)"}`,
                    background:sortKey===m.key?COLOR+"18":"transparent",color:sortKey===m.key?COLOR:"rgba(255,255,255,0.4)",fontSize:11,cursor:"pointer"}}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          {!sorted.length
            ? <div style={{textAlign:"center",padding:60,color:"rgba(255,255,255,0.3)",fontSize:14}}>No videos for this period.</div>
            : <VideoTable videos={sorted} metrics={metrics.slice(0,5)} sortKey={sortKey} onSort={setSortKey} />}
        </>
      )}

      {/* ── CHART ── */}
      {tab==="chart" && (
        <>
          <SectionLabel>Metric</SectionLabel>
          <MetricPills metrics={metrics} active={chartMetric} onChange={setChartMetric} />
          <div style={{display:"flex",gap:4,marginBottom:14}}>
            {["bar","line"].map(t=>(
              <button key={t} onClick={()=>setChartType(t as "bar"|"line")}
                style={{padding:"4px 12px",borderRadius:99,border:`1px solid ${chartType===t?"rgba(255,255,255,0.3)":"rgba(255,255,255,0.1)"}`,
                  background:chartType===t?"rgba(255,255,255,0.1)":"transparent",
                  color:chartType===t?"white":"rgba(255,255,255,0.4)",fontSize:11,cursor:"pointer"}}>
                {t.charAt(0).toUpperCase()+t.slice(1)}
              </button>
            ))}
          </div>
          {chartData.labels.length < 2
            ? <div style={{textAlign:"center",padding:60,color:"rgba(255,255,255,0.3)",fontSize:14}}>Import data across multiple months to see a trend chart.</div>
            : <AnalyticsChart type={chartType} labels={chartData.labels}
                datasets={[{label:metrics.find(m=>m.key===chartMetric)?.label||chartMetric,data:chartData.values,color:COLOR}]}
                yFormatter={metrics.find(m=>m.key===chartMetric)?.fmt} />}
        </>
      )}

      {/* ── COMPARE ── */}
      {tab==="compare" && (
        <>
          {/* Compare mode selector */}
          <div style={{display:"flex",gap:4,marginBottom:16}}>
            {[{id:"month",label:"Month vs month"},{id:"video",label:"Video vs video"},{id:"custom",label:"Custom range"}].map(m=>(
              <button key={m.id} onClick={()=>setCmpMode(m.id)}
                style={{padding:"6px 14px",borderRadius:8,border:`1px solid ${cmpMode===m.id?"rgba(255,255,255,0.3)":"rgba(255,255,255,0.1)"}`,
                  background:cmpMode===m.id?"rgba(255,255,255,0.1)":"transparent",
                  color:cmpMode===m.id?"white":"rgba(255,255,255,0.4)",fontSize:12,cursor:"pointer",fontWeight:cmpMode===m.id?600:400}}>
                {m.label}
              </button>
            ))}
          </div>

          {/* Month vs month */}
          {cmpMode==="month" && (
            <>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,flexWrap:"wrap"}}>
                <MonthSelect value={m1} months={months} onChange={setCmpMonth1} />
                <span style={{color:"rgba(255,255,255,0.4)",fontSize:13}}>vs</span>
                <MonthSelect value={m2} months={months} onChange={setCmpMonth2} />
              </div>
              <SectionLabel>Metric to compare</SectionLabel>
              <MetricPills metrics={metrics} active={cmpMetric} onChange={setCmpMetric} />
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                {[{ym:m1,val:m1Val,isA:true},{ym:m2,val:m2Val,isA:false}].map(({ym,val,isA})=>(
                  <div key={ym} style={{background:isA?COLOR+"12":"rgba(255,255,255,0.04)",border:`1px solid ${isA?COLOR+"33":"rgba(255,255,255,0.08)"}`,borderRadius:12,padding:14}}>
                    <div style={{fontSize:11,color:isA?COLOR:"rgba(255,255,255,0.4)",marginBottom:6}}>{monthLabel(ym)}{isA?" — selected":""}</div>
                    <div style={{fontSize:24,fontWeight:700,color:isA?COLOR:"white"}}>
                      {metrics.find(m=>m.key===cmpMetric)?.fmt?metrics.find(m=>m.key===cmpMetric)!.fmt!(val):fmt(val)}
                    </div>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginTop:3}}>{metrics.find(m=>m.key===cmpMetric)?.label}</div>
                  </div>
                ))}
              </div>
              <div style={{textAlign:"center",padding:"8px 16px",background:"rgba(255,255,255,0.04)",borderRadius:8,fontSize:13,color:delta>=0?"#22c55e":"#ef4444",marginBottom:16}}>
                {delta>=0?"▲":"▼"} {fmt(Math.abs(delta))} ({deltaPct>=0?"+":""}{deltaPct}%) — {monthLabel(m1)} vs {monthLabel(m2)}
              </div>
              <AnalyticsChart type="bar" labels={metrics.map(m=>m.label)}
                datasets={[
                  {label:monthLabel(m1),data:metrics.map(m=>sumMetric(m1Vids,m.key)),color:COLOR},
                  {label:monthLabel(m2),data:metrics.map(m=>sumMetric(m2Vids,m.key)),color:"#888888"},
                ]} />
            </>
          )}

          {/* Video vs video */}
          {cmpMode==="video" && (
            filtered.length < 2
              ? <div style={{textAlign:"center",padding:60,color:"rgba(255,255,255,0.3)",fontSize:14}}>Need at least 2 videos. Try selecting "All time".</div>
              : <>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,flexWrap:"wrap"}}>
                  {[cmpV1,cmpV2].map((vi,idx)=>(
                    <select key={idx} value={vi} onChange={e=>idx===0?setCmpV1(Number(e.target.value)):setCmpV2(Number(e.target.value))}
                      style={{padding:"7px 12px",borderRadius:8,border:"1px solid rgba(255,255,255,0.15)",background:"#1a1a2e",color:"white",fontSize:12,cursor:"pointer",maxWidth:240}}>
                      {filtered.map((v,i)=><option key={i} value={i}>{(v.title||"Untitled").slice(0,50)}</option>)}
                    </select>
                  ))}
                </div>
                {[filtered[cmpV1],filtered[cmpV2]].filter(Boolean).map((v,idx)=>(
                  <div key={idx} style={{background:idx===0?COLOR+"10":"rgba(255,255,255,0.04)",border:`1px solid ${idx===0?COLOR+"33":"rgba(255,255,255,0.08)"}`,borderRadius:12,padding:14,marginBottom:10}}>
                    <div style={{fontSize:13,fontWeight:600,color:"white",marginBottom:8}}>{v?.title||"Untitled"}</div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))",gap:6}}>
                      {metrics.map(m=>(
                        <div key={m.key} style={{background:"rgba(255,255,255,0.05)",borderRadius:8,padding:"8px 10px"}}>
                          <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",marginBottom:2}}>{m.label}</div>
                          <div style={{fontSize:14,fontWeight:600,color:idx===0?COLOR:"white"}}>
                            {m.fmt?m.fmt(Number(v?.[m.key]||0)):fmt(Number(v?.[m.key]||0))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <AnalyticsChart type="bar" labels={metrics.map(m=>m.label)}
                  datasets={[
                    {label:(filtered[cmpV1]?.title||"Video 1").slice(0,25),data:metrics.map(m=>Number(filtered[cmpV1]?.[m.key])||0),color:COLOR},
                    {label:(filtered[cmpV2]?.title||"Video 2").slice(0,25),data:metrics.map(m=>Number(filtered[cmpV2]?.[m.key])||0),color:"#888888"},
                  ]} />
              </>
          )}

          {/* Custom date range */}
          {cmpMode==="custom" && (
            <>
              <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:8,alignItems:"flex-start",marginBottom:16}}>
                {[
                  {label:"Range A",d1:customD1,setD1:setCustomD1,d2:customD2,setD2:setCustomD2},
                  null,
                  {label:"Range B",d1:customD3,setD1:setCustomD3,d2:customD4,setD2:setCustomD4},
                ].map((item,idx)=>item===null
                  ? <span key="vs" style={{color:"rgba(255,255,255,0.4)",fontSize:14,textAlign:"center",paddingTop:24}}>vs</span>
                  : (
                    <div key={idx}>
                      <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginBottom:4}}>{item.label}</div>
                      <div style={{display:"flex",gap:4,flexDirection:"column"}}>
                        <input type="date" value={item.d1} onChange={e=>item.setD1(e.target.value)}
                          style={{padding:"6px 10px",borderRadius:8,border:"1px solid rgba(255,255,255,0.15)",background:"#1a1a2e",color:"white",fontSize:12}} />
                        <input type="date" value={item.d2} onChange={e=>item.setD2(e.target.value)}
                          style={{padding:"6px 10px",borderRadius:8,border:"1px solid rgba(255,255,255,0.15)",background:"#1a1a2e",color:"white",fontSize:12}} />
                      </div>
                    </div>
                  )
                )}
              </div>
              {customD1&&customD2&&customD3&&customD4&&(()=>{
                const ra=allVideos.filter(v=>{const d=new Date(v.publishedAt||"");return d>=new Date(customD1)&&d<=new Date(customD2);});
                const rb=allVideos.filter(v=>{const d=new Date(v.publishedAt||"");return d>=new Date(customD3)&&d<=new Date(customD4);});
                const aV=sumMetric(ra,"views"), bV=sumMetric(rb,"views"), d=aV-bV;
                return (
                  <>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                      {[{label:`${customD1} → ${customD2}`,val:aV,videos:ra,isA:true},{label:`${customD3} → ${customD4}`,val:bV,videos:rb,isA:false}].map(({label,val,videos:rv,isA})=>(
                        <div key={label} style={{background:isA?COLOR+"12":"rgba(255,255,255,0.04)",border:`1px solid ${isA?COLOR+"33":"rgba(255,255,255,0.08)"}`,borderRadius:12,padding:14}}>
                          <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginBottom:6}}>{label}</div>
                          <div style={{fontSize:22,fontWeight:700,color:isA?COLOR:"white"}}>{fmt(val)}</div>
                          <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginTop:2}}>views · {rv.length} videos</div>
                        </div>
                      ))}
                    </div>
                    <div style={{textAlign:"center",padding:"8px 16px",background:"rgba(255,255,255,0.04)",borderRadius:8,fontSize:13,color:d>=0?"#22c55e":"#ef4444"}}>
                      Range A {d>=0?"▲":"▼"} {fmt(Math.abs(d))} ({bV>0?Math.round(d/bV*100):0}%) vs Range B
                    </div>
                  </>
                );
              })()}
              {(!customD1||!customD2||!customD3||!customD4)&&<div style={{textAlign:"center",padding:40,color:"rgba(255,255,255,0.3)",fontSize:13}}>Select both date ranges above to compare.</div>}
            </>
          )}
        </>
      )}
    </div>
  );
}
