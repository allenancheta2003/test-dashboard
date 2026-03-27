"use client";

export default function Sidebar({ active, onChange, onUpload }: {
  active: string;
  onChange: (p: any) => void;
  onUpload: () => void;
}) {
  const platforms = [
    { id: "youtube",   label: "YouTube",   color: "#FF4444", emoji: "▶" },
    { id: "tiktok",    label: "TikTok",    color: "#69C9D0", emoji: "♪" },
    { id: "instagram", label: "Instagram", color: "#E1306C", emoji: "📸" },
    { id: "facebook",  label: "Facebook",  color: "#1877F2", emoji: "f" },
  ];

  return (
    <aside style={{ width: 220, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", padding: "24px 16px", gap: 4, background: "#080810", minHeight: "100vh" }}>
      <div style={{ padding: "0 12px", marginBottom: 24 }}>
        <span style={{ color: "rgba(255,255,255,0.8)", fontWeight: 700, fontSize: 16 }}>📊 Dashboard</span>
      </div>

      <p style={{ padding: "0 12px", fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Platforms</p>

      {platforms.map(p => {
        const on = p.id === active;
        return (
          <button
            key={p.id}
            onClick={() => onChange(p.id)}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer", background: on ? p.color + "18" : "transparent", color: on ? p.color : "rgba(255,255,255,0.45)", fontWeight: on ? 600 : 400, fontSize: 14, textAlign: "left" }}
          >
            <span style={{ fontSize: 16 }}>{p.emoji}</span>
            {p.label}
            {on && <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: p.color }} />}
          </button>
        );
      })}

      <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <button
          onClick={onUpload}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer", background: "transparent", color: "rgba(255,255,255,0.4)", fontSize: 14 }}
        >
          ↑ Import CSV
        </button>
      </div>
    </aside>
  );
}