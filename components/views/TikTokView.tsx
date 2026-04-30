"use client";
import { useState, useMemo } from "react";
import { ttVideos } from "@/lib/data";
import {
  MetricCard, OverviewGrid, SectionLabel, VideoCard,
  InlineMetrics, fmt
} from "@/components/ui";

const COLOR = "#69C9D0";

const METRICS = [
  { key: "views",          label: "Views" },
  { key: "likes",          label: "Likes" },
  { key: "comments",       label: "Comments" },
  { key: "shares",         label: "Shares" },
  { key: "saves",          label: "Saves" },
  { key: "totalEngagement",label: "Engagement" },
  { key: "retention",      label: "Retention %" },
  { key: "avgWatchTime",   label: "Avg watch (s)" },
];

// Parse M/D/YYYY or MM/DD/YYYY or YYYY-MM-DD → YYYY-MM
function getYM(v: any): string {
  const raw = v.publishedYM || v.publishedAt || v["Date "] || v["Date"] || "";
  if (!raw) return "";
  const s = String(raw).trim();
  // M/D/YYYY
  const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (mdy) return `${mdy[3]}-${mdy[1].padStart(2, "0")}`;
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}/.test(s)) return s.slice(0, 7);
  const d = new Date(s);
  if (!isNaN(d.getTime())) return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  return "";
}

function monthLabel(ym: string): string {
  if (!ym) return "";
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const [year, mo] = ym.split("-");
  return `${MONTHS[parseInt(mo) - 1]} ${year}`;
}

function getMonthsFromData(videos: any[]): string[] {
  const seen = new Set<string>();
  videos.forEach(v => { const ym = getYM(v); if (ym) seen.add(ym); });
  return Array.from(seen).sort((a, b) => b.localeCompare(a));
}

function filterVideos(videos: any[], dateRange: string): any[] {
  if (dateRange === "all") return videos;
  return videos.filter(v => getYM(v) === dateRange);
}

function sumMetric(videos: any[], key: string): number {
  return videos.reduce((a, v) => a + (Number(v[key]) || 0), 0);
}

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

function MetricPills({ active, onChange }: { active:string; onChange:(k:string)=>void }) {
  return (
    <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:12}}>
      {METRICS.map(m=>(
        <button key={m.key} onClick={()=>onChange(m.key)}
          style={{padding:"4px 12px",borderRadius:99,
            border:`1px solid ${m.key===active?COLOR+"44":"rgba(255,255,255,0.1)"}`,
            background:m.key===active?COLOR+"18":"transparent",
            color:m.key===active?COLOR:"rgba(255,255,255,0.45)",
            fontSize:11,cursor:"pointer",fontWeight:m.key===active?600:400}}>
          {m.label}
        </button>
      ))}
    </div>
  );
}

const TABS = [
  {id:"overview",label:"Overview"},
  {id:"videos",  label:"All videos"},
  {id:"compare", label:"Compare"},
];

export default function TikTokView({ dateRange, csvData }: { dateRange:string; csvData?: any[] }) {
  const [tab,setTab]             = useState("overview");
  const [sortKey,setSortKey]     = useState("views");
  const [cmpMode,setCmpMode]     = useState("month");
  const [cmpMetric,setCmpMetric] = useState("views");
  const [m1,setM1]               = useState("");
  const [m2,setM2]               = useState("");
  const [v1,setV1]               = useState(0);
  const [v2,setV2]               = useState(1);
  const [d1,setD1]               = useState("");
  const [d2,setD2]               = useState("");
  const [d3,setD3]               = useState("");
  const [d4,setD4]               = useState("");

  const allVideos = useMemo(() => csvData?.length ? csvData : ttVideos, [csvData]);
  const videos    = useMemo(() => filterVideos(allVideos, dateRange), [allVideos, dateRange]);
  const months    = useMemo(() => getMonthsFromData(allVideos), [allVideos]);
  const mon1      = m1 || months[0] || "";
  const mon2      = m2 || months[1] || "";
  const sorted    = useMemo(() => [...videos].sort((a,b)=>(Number(b[sortKey])||0)-(Number(a[sortKey])||0)), [videos,sortKey]);

  const totViews      = sumMetric(videos,"views");
  const totLikes      = sumMetric(videos,"likes");
  const totShares     = sumMetric(videos,"shares");
  const totSaves      = sumMetric(videos,"saves");
  const totComments   = sumMetric(videos,"comments");
  const totEngagement = sumMetric(videos,"totalEngagement");
  const avgRetention  = videos.length ? Math.round(sumMetric(videos,"retention")/videos.length) : 0;
  const avgWatch      = videos.length ? (sumMetric(videos,"avgWatchTime")/videos.length).toFixed(1) : "0";

  const getMonthVids = (ym:string) => allVideos.filter(v=>getYM(v)===ym);
  const m1Vids = getMonthVids(mon1), m2Vids = getMonthVids(mon2);
  const m1Val  = sumMetric(m1Vids,cmpMetric), m2Val = sumMetric(m2Vids,cmpMetric);
  const delta  = m1Val-m2Val, deltaPct = m2Val>0?Math.round(delta/m2Val*100):0;

  return (
    <div>
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {/* ── OVERVIEW ── */}
      {tab==="overview" && (
        !videos.length
          ? <div style={{textAlign:"center",padding:60,color:"rgba(255,255,255,0.3)"}}>No TikTok data for this period. Import a CSV or select a different month.</div>
          : <>
            <SectionLabel>TikTok overview · {videos.length} videos</SectionLabel>
            <OverviewGrid>
              <MetricCard label="Total views"      value={fmt(totViews)}      accent={COLOR} />
              <MetricCard label="Total likes"      value={fmt(totLikes)}      accent={COLOR} />
              <MetricCard label="Total shares"     value={fmt(totShares)}     accent={COLOR} />
              <MetricCard label="Total saves"      value={fmt(totSaves)}      accent={COLOR} />
              <MetricCard label="Total comments"   value={fmt(totComments)}   accent={COLOR} />
              <MetricCard label="Total engagement" value={fmt(totEngagement)} accent={COLOR} />
              <MetricCard label="Avg. retention"   value={`${avgRetention}%`} accent={COLOR} bar={avgRetention} />
              <MetricCard label="Avg. watch time"  value={`${avgWatch}s`}     accent={COLOR} />
            </OverviewGrid>

            {/* Top video */}
            {sorted.length > 0 && (()=>{
              const top = sorted[0];
              const totalViews = totViews;
              const share = totalViews>0?Math.round((Number(top.views)||0)/totalViews*100):0;
              return (
                <div style={{background:"rgba(255,255,255,0.04)",borderRadius:14,padding:16,marginBottom:16}}>
                  <div style={{display:"inline-flex",alignItems:"center",fontSize:11,fontWeight:600,background:"#faeeda",color:"#854f0b",padding:"3px 10px",borderRadius:99,marginBottom:10}}>
                    🏆 Top performer
                  </div>
                  <div style={{fontSize:15,fontWeight:600,color:"white",marginBottom:3}}>{top.title||top.description||"Untitled"}</div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginBottom:10}}>
                    {top.publishedAt||"—"}
                    {top.pillar&&<span style={{marginLeft:8,padding:"1px 8px",borderRadius:99,background:COLOR+"18",color:COLOR,fontSize:10}}>{top.pillar}</span>}
                    {share>0&&<span style={{marginLeft:8,color:COLOR,fontWeight:500}}>{share}% of period's views</span>}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(100px,1fr))",gap:8,marginBottom:12}}>
                    {METRICS.map(m=>(
                      <div key={m.key} style={{background:"rgba(255,255,255,0.06)",borderRadius:8,padding:"8px 10px"}}>
                        <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",marginBottom:2}}>{m.label}</div>
                        <div style={{fontSize:14,fontWeight:600,color:"white"}}>
                          {m.key==="retention"?`${Number(top[m.key]||0)}%`:
                           m.key==="avgWatchTime"?`${Number(top[m.key]||0)}s`:
                           fmt(Number(top[m.key]||0))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {top.link&&(
                    <a href={top.link} target="_blank" rel="noopener noreferrer"
                      style={{display:"inline-flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,
                        background:COLOR+"18",color:COLOR,fontSize:12,fontWeight:600,textDecoration:"none",border:`1px solid ${COLOR}33`}}>
                      ↗ Open on TikTok
                    </a>
                  )}
                </div>
              );
            })()}

            <SectionLabel>All videos — click to expand</SectionLabel>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {sorted.map((v:any,i:number)=>{
                const totalEng = Number(v.totalEngagement)||(Number(v.likes||0)+Number(v.comments||0)+Number(v.shares||0)+Number(v.saves||0));
                const displayTitle = v.title||v.description||"Untitled";
                return (
                  <VideoCard key={v.id||i} id={String(v.id||i)}
                    thumb={v.thumb||"🎵"} title={displayTitle}
                    publishedAt={v.publishedAt||""}
                    badge={v.duration?`${Number(v.duration).toFixed(0)}s`:undefined}
                    accentColor={COLOR}
                    quickStats={[
                      {label:"views",      value:fmt(Number(v.views)||0)},
                      {label:"likes",      value:fmt(Number(v.likes)||0)},
                      {label:"retention",  value:`${Number(v.retention)||0}%`},
                      {label:"engagement", value:fmt(totalEng)},
                    ]}>
                    <div style={{paddingTop:12}}>
                      {v.link&&(
                        <a href={v.link} target="_blank" rel="noopener noreferrer"
                          style={{display:"inline-flex",alignItems:"center",gap:5,marginBottom:12,padding:"5px 10px",borderRadius:8,
                            background:COLOR+"18",color:COLOR,fontSize:12,fontWeight:600,textDecoration:"none",border:`1px solid ${COLOR}33`}}
                          onClick={e=>e.stopPropagation()}>
                          ↗ Open on TikTok
                        </a>
                      )}
                      {v.pillar&&(
                        <div style={{marginBottom:10,fontSize:12,color:"rgba(255,255,255,0.5)"}}>
                          Pillar: <span style={{color:COLOR,fontWeight:500}}>{v.pillar}</span>
                        </div>
                      )}
                      <InlineMetrics items={[
                        {label:"Views",            value:fmt(Number(v.views)||0)},
                        {label:"Duration",         value:v.duration?`${Number(v.duration).toFixed(1)}s`:"—"},
                        {label:"Avg. watch time",  value:v.avgWatchTime?`${Number(v.avgWatchTime).toFixed(1)}s`:"—"},
                        {label:"Retention",        value:`${Number(v.retention)||0}%`},
                        {label:"Shares",           value:fmt(Number(v.shares)||0)},
                        {label:"Saves",            value:fmt(Number(v.saves)||0)},
                        {label:"Comments",         value:fmt(Number(v.comments)||0)},
                        {label:"Likes",            value:fmt(Number(v.likes)||0)},
                        {label:"Total engagement", value:fmt(totalEng)},
                      ]} />
                    </div>
                  </VideoCard>
                );
              })}
            </div>
          </>
      )}

      {/* ── ALL VIDEOS ── */}
      {tab==="videos" && (
        <>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,flexWrap:"wrap",gap:8}}>
            <SectionLabel style={{margin:0}}>{sorted.length} videos · sort by</SectionLabel>
            <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
              {["views","likes","shares","saves","comments","totalEngagement","retention"].map(key=>(
                <button key={key} onClick={()=>setSortKey(key)}
                  style={{padding:"3px 10px",borderRadius:99,
                    border:`1px solid ${sortKey===key?COLOR+"44":"rgba(255,255,255,0.1)"}`,
                    background:sortKey===key?COLOR+"18":"transparent",
                    color:sortKey===key?COLOR:"rgba(255,255,255,0.4)",fontSize:11,cursor:"pointer"}}>
                  {key==="totalEngagement"?"Engagement":key==="retention"?"Retention":key.charAt(0).toUpperCase()+key.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            <div style={{display:"grid",gridTemplateColumns:"24px 1fr 68px 60px 60px 60px 78px",gap:8,
              padding:"6px 12px",fontSize:10,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.06em"}}>
              <div>#</div><div>Title</div>
              {["Views","Likes","Shares","Saves","Engagement"].map(h=><div key={h} style={{textAlign:"right"}}>{h}</div>)}
            </div>
            {sorted.map((v:any,i:number)=>{
              const maxVal = Math.max(...sorted.map((x:any)=>Number(x[sortKey])||0),1);
              const barW   = Math.round((Number(v[sortKey])||0)/maxVal*100);
              const totalEng = Number(v.totalEngagement)||(Number(v.likes||0)+Number(v.comments||0)+Number(v.shares||0)+Number(v.saves||0));
              const displayTitle = v.title||v.description||"Untitled";
              return (
                <div key={v.id||i} style={{display:"grid",gridTemplateColumns:"24px 1fr 68px 60px 60px 60px 78px",gap:8,
                  alignItems:"center",padding:"10px 12px",background:"rgba(255,255,255,0.03)",
                  border:"0.5px solid rgba(255,255,255,0.07)",borderRadius:10}}>
                  <div style={{fontSize:12,fontWeight:600,color:COLOR,textAlign:"center"}}>{i+1}</div>
                  <div>
                    {v.link
                      ? <a href={v.link} target="_blank" rel="noopener noreferrer"
                          style={{fontSize:12,fontWeight:500,color:"white",textDecoration:"none",display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}
                          title={displayTitle}>{displayTitle}</a>
                      : <div style={{fontSize:12,fontWeight:500,color:"white",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{displayTitle}</div>
                    }
                    <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:1}}>{v.publishedAt||"—"}{v.pillar&&` · ${v.pillar}`}</div>
                    <div style={{height:3,background:"rgba(255,255,255,0.08)",borderRadius:99,marginTop:3,overflow:"hidden"}}>
                      <div style={{width:`${barW}%`,height:"100%",background:COLOR+"88",borderRadius:99}} />
                    </div>
                  </div>
                  {[v.views,v.likes,v.shares,v.saves,totalEng].map((val,ki)=>(
                    <div key={ki} style={{fontSize:12,fontWeight:500,color:"rgba(255,255,255,0.85)",textAlign:"right"}}>{fmt(Number(val)||0)}</div>
                  ))}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── COMPARE ── */}
      {tab==="compare" && (
        <>
          <div style={{display:"flex",gap:4,marginBottom:16}}>
            {[{id:"month",label:"Month vs month"},{id:"video",label:"Video vs video"},{id:"custom",label:"Custom range"}].map(m=>(
              <button key={m.id} onClick={()=>setCmpMode(m.id)}
                style={{padding:"6px 14px",borderRadius:8,
                  border:`1px solid ${cmpMode===m.id?"rgba(255,255,255,0.3)":"rgba(255,255,255,0.1)"}`,
                  background:cmpMode===m.id?"rgba(255,255,255,0.1)":"transparent",
                  color:cmpMode===m.id?"white":"rgba(255,255,255,0.4)",
                  fontSize:12,cursor:"pointer",fontWeight:cmpMode===m.id?600:400}}>
                {m.label}
              </button>
            ))}
          </div>

          {cmpMode==="month"&&(
            <>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,flexWrap:"wrap"}}>
                {[{val:mon1,set:setM1},{val:mon2,set:setM2}].map(({val,set},idx)=>(
                  <select key={idx} value={val} onChange={e=>set(e.target.value)}
                    style={{padding:"7px 12px",borderRadius:8,border:"1px solid rgba(255,255,255,0.15)",background:"#1a1a2e",color:"white",fontSize:13,cursor:"pointer"}}>
                    {months.map(ym=><option key={ym} value={ym}>{monthLabel(ym)}</option>)}
                  </select>
                ))}
                {months.length<2&&<span style={{fontSize:12,color:"rgba(255,255,255,0.3)"}}>Import data from multiple months to compare</span>}
              </div>
              <div style={{marginBottom:12}}>
                <p style={{fontSize:10,fontWeight:600,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Metric</p>
                <MetricPills active={cmpMetric} onChange={setCmpMetric} />
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                {[{ym:mon1,val:m1Val,vids:m1Vids,isA:true},{ym:mon2,val:m2Val,vids:m2Vids,isA:false}].map(({ym,val,vids,isA})=>(
                  <div key={ym} style={{background:isA?COLOR+"12":"rgba(255,255,255,0.04)",border:`1px solid ${isA?COLOR+"33":"rgba(255,255,255,0.08)"}`,borderRadius:12,padding:14}}>
                    <div style={{fontSize:11,color:isA?COLOR:"rgba(255,255,255,0.4)",marginBottom:6}}>{monthLabel(ym)}</div>
                    <div style={{fontSize:24,fontWeight:700,color:isA?COLOR:"white",marginBottom:4}}>{fmt(val)}</div>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginBottom:10}}>{METRICS.find(m=>m.key===cmpMetric)?.label} · {vids.length} videos</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
                      {METRICS.map(m=>(
                        <div key={m.key} style={{background:"rgba(255,255,255,0.04)",borderRadius:6,padding:"5px 8px"}}>
                          <div style={{fontSize:10,color:"rgba(255,255,255,0.35)"}}>{m.label}</div>
                          <div style={{fontSize:13,fontWeight:600,color:m.key===cmpMetric?(isA?COLOR:"white"):"rgba(255,255,255,0.7)"}}>{fmt(sumMetric(vids,m.key))}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{textAlign:"center",padding:"8px 16px",background:"rgba(255,255,255,0.04)",borderRadius:8,fontSize:13,color:delta>=0?"#22c55e":"#ef4444"}}>
                {delta>=0?"▲":"▼"} {fmt(Math.abs(delta))} ({deltaPct>=0?"+":""}{deltaPct}%) — {monthLabel(mon1)} vs {monthLabel(mon2)}
              </div>
            </>
          )}

          {cmpMode==="video"&&(
            allVideos.length<2
              ? <div style={{textAlign:"center",padding:60,color:"rgba(255,255,255,0.3)"}}>Need at least 2 videos. Try selecting "All time".</div>
              : <>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,flexWrap:"wrap"}}>
                  {[v1,v2].map((vi,idx)=>(
                    <select key={idx} value={vi} onChange={e=>idx===0?setV1(Number(e.target.value)):setV2(Number(e.target.value))}
                      style={{padding:"7px 12px",borderRadius:8,border:"1px solid rgba(255,255,255,0.15)",background:"#1a1a2e",color:"white",fontSize:12,cursor:"pointer",maxWidth:280}}>
                      {allVideos.map((v:any,i:number)=><option key={i} value={i}>{((v.title||v.description||"Untitled")).slice(0,55)}</option>)}
                    </select>
                  ))}
                </div>
                {[allVideos[v1],allVideos[v2]].filter(Boolean).map((v:any,idx:number)=>(
                  <div key={idx} style={{background:idx===0?COLOR+"10":"rgba(255,255,255,0.04)",border:`1px solid ${idx===0?COLOR+"33":"rgba(255,255,255,0.08)"}`,borderRadius:12,padding:14,marginBottom:10}}>
                    <div style={{fontSize:13,fontWeight:600,color:"white",marginBottom:4}}>{v?.title||v?.description||"Untitled"}</div>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginBottom:10}}>{v?.publishedAt||"—"}</div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))",gap:6}}>
                      {METRICS.map(m=>(
                        <div key={m.key} style={{background:"rgba(255,255,255,0.05)",borderRadius:8,padding:"8px 10px"}}>
                          <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",marginBottom:2}}>{m.label}</div>
                          <div style={{fontSize:14,fontWeight:600,color:idx===0?COLOR:"white"}}>{fmt(Number(v?.[m.key]||0))}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </>
          )}

          {cmpMode==="custom"&&(
            <>
              <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:12,alignItems:"flex-start",marginBottom:16}}>
                {[{label:"Range A",d1,setD1,d2,setD2},null,{label:"Range B",d1:d3,setD1:setD3,d2:d4,setD2:setD4}].map((item,idx)=>
                  item===null
                    ? <span key="vs" style={{color:"rgba(255,255,255,0.4)",fontSize:14,textAlign:"center",paddingTop:22}}>vs</span>
                    : (
                      <div key={idx}>
                        <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginBottom:6}}>{item.label}</div>
                        <div style={{display:"flex",flexDirection:"column",gap:6}}>
                          <input type="date" value={item.d1} onChange={e=>item.setD1(e.target.value)}
                            style={{padding:"6px 10px",borderRadius:8,border:"1px solid rgba(255,255,255,0.15)",background:"#1a1a2e",color:"white",fontSize:12}} />
                          <input type="date" value={item.d2} onChange={e=>item.setD2(e.target.value)}
                            style={{padding:"6px 10px",borderRadius:8,border:"1px solid rgba(255,255,255,0.15)",background:"#1a1a2e",color:"white",fontSize:12}} />
                        </div>
                      </div>
                    )
                )}
              </div>
              {d1&&d2&&d3&&d4?(()=>{
                const parseDate = (s:string) => new Date(s);
                const ra = allVideos.filter(v=>{
                  const raw = v.publishedAt||"";
                  const mdy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                  const dt = mdy ? new Date(`${mdy[3]}-${mdy[1].padStart(2,"0")}-${mdy[2].padStart(2,"0")}`) : new Date(raw);
                  return dt>=parseDate(d1)&&dt<=parseDate(d2);
                });
                const rb = allVideos.filter(v=>{
                  const raw = v.publishedAt||"";
                  const mdy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                  const dt = mdy ? new Date(`${mdy[3]}-${mdy[1].padStart(2,"0")}-${mdy[2].padStart(2,"0")}`) : new Date(raw);
                  return dt>=parseDate(d3)&&dt<=parseDate(d4);
                });
                const aV=sumMetric(ra,"views"),bV=sumMetric(rb,"views"),dd=aV-bV;
                return (
                  <>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                      {[{label:`${d1} → ${d2}`,val:aV,vids:ra,isA:true},{label:`${d3} → ${d4}`,val:bV,vids:rb,isA:false}].map(({label,val,vids,isA})=>(
                        <div key={label} style={{background:isA?COLOR+"12":"rgba(255,255,255,0.04)",border:`1px solid ${isA?COLOR+"33":"rgba(255,255,255,0.08)"}`,borderRadius:12,padding:14}}>
                          <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginBottom:6}}>{label}</div>
                          <div style={{fontSize:22,fontWeight:700,color:isA?COLOR:"white"}}>{fmt(val)}</div>
                          <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginTop:2,marginBottom:10}}>views · {vids.length} videos</div>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
                            {METRICS.slice(0,6).map(m=>(
                              <div key={m.key} style={{background:"rgba(255,255,255,0.04)",borderRadius:6,padding:"5px 8px"}}>
                                <div style={{fontSize:10,color:"rgba(255,255,255,0.35)"}}>{m.label}</div>
                                <div style={{fontSize:13,fontWeight:600,color:"rgba(255,255,255,0.8)"}}>{fmt(sumMetric(vids,m.key))}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{textAlign:"center",padding:"8px 16px",background:"rgba(255,255,255,0.04)",borderRadius:8,fontSize:13,color:dd>=0?"#22c55e":"#ef4444"}}>
                      Range A {dd>=0?"▲":"▼"} {fmt(Math.abs(dd))} ({bV>0?Math.round(dd/bV*100):0}%) vs Range B
                    </div>
                  </>
                );
              })():(
                <div style={{textAlign:"center",padding:40,color:"rgba(255,255,255,0.3)",fontSize:13}}>Select both date ranges above to compare.</div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
