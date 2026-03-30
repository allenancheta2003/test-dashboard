"use client";

export default function Sidebar({ active, onChange, onUpload, importedTypes = [] }: {
  active: string;
  onChange: (p: any) => void;
  onUpload: () => void;
  importedTypes?: string[];
}) {
  const platforms = [
    { id:"youtube",   label:"YouTube",   color:"#FF4444", emoji:"▶" },
    { id:"tiktok",    label:"TikTok",    color:"#69C9D0", emoji:"♪" },
    { id:"instagram", label:"Instagram", color:"#E1306C", emoji:"📸" },
    { id:"facebook",  label:"Facebook",  color:"#1877F2", emoji:"f" },
  ];

  // Which platforms have imported data
  const hasData: Record<string, boolean> = {
    youtube:   importedTypes.includes("youtube-shorts") || importedTypes.includes("youtube-longform"),
    tiktok:    importedTypes.includes("tiktok"),
    instagram: importedTypes.includes("instagram"),
    facebook:  importedTypes.includes("facebook"),
  };

  return (
    <aside style={{ width:220, flexShrink:0, borderRight:"1px solid rgba(255,255,255,0.07)", display:"flex", flexDirection:"column", padding:"24px 16px", gap:4, background:"#080810", minHeight:"100vh" }}>
      <div style={{ padding:"0 12px", marginBottom:24 }}>
        <span style={{ color:"rgba(255,255,255,0.8)", fontWeight:700, fontSize:16 }}>📊 Dashboard</span>
      </div>

      <p style={{ padding:"0 12px", fontSize:10, fontWeight:600, color:"rgba(255,255,255,0.25)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8 }}>Platforms</p>

      {platforms.map(p => {
        const on = p.id === active;
        return (
          <button
            key={p.id}
            onClick={() => onChange(p.id)}
            style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:8, border:"none", cursor:"pointer", background: on ? p.color+"18" : "transparent", color: on ? p.color : "rgba(255,255,255,0.45)", fontWeight: on ? 600 : 400, fontSize:14, textAlign:"left", position:"relative" }}
          >
            <span style={{ fontSize:16 }}>{p.emoji}</span>
            {p.label}
            <span style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:4 }}>
              {hasData[p.id] && (
                <span style={{ fontSize:9, padding:"1px 5px", borderRadius:99, background:"rgba(34,197,94,0.2)", color:"#22c55e" }}>live</span>
              )}
              {on && <span style={{ width:6, height:6, borderRadius:"50%", background:p.color }} />}
            </span>
          </button>
        );
      })}

      <div style={{ marginTop:"auto", paddingTop:16, borderTop:"1px solid rgba(255,255,255,0.07)" }}>
        <button
          onClick={onUpload}
          style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"10px 12px", borderRadius:8, border:"1px solid rgba(255,255,255,0.1)", cursor:"pointer", background:"transparent", color:"rgba(255,255,255,0.6)", fontSize:13, fontWeight:500 }}
        >
          ↑ Import CSV
          {importedTypes.length > 0 && (
            <span style={{ marginLeft:"auto", fontSize:11, color:"#22c55e" }}>{importedTypes.length} imported</span>
          )}
        </button>
      </div>
    </aside>
  );
}
