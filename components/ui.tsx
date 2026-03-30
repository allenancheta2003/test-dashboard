"use client";
import { useState } from "react";

export function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return Math.round(n).toString();
}

export function fmtSec(s: number): string {
  if (s >= 3600) {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return `${h}h ${m}m${sec > 0 ? ` ${sec}s` : ""}`;
  }
  if (s >= 60) {
    const m = Math.floor(s / 60), sec = s % 60;
    return `${m}m${sec > 0 ? ` ${sec}s` : ""}`;
  }
  return `${s}s`;
}

export function fmtPct(n: number, decimals = 1): string {
  return n.toFixed(decimals) + "%";
}

export function MetricCard({ label, value, sub, accent, bar }: {
  label: string; value: string; sub?: string; accent?: string; bar?: number;
}) {
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
      <span style={{ color: accent || "white", fontSize: 24, fontWeight: 600 }}>{value}</span>
      {sub && <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>{sub}</span>}
      {bar !== undefined && (
        <div style={{ height: 4, borderRadius: 99, background: "rgba(255,255,255,0.1)", overflow: "hidden", marginTop: 4 }}>
          <div style={{ width: `${Math.min(bar, 100)}%`, height: "100%", borderRadius: 99, background: accent || "white" }} />
        </div>
      )}
    </div>
  );
}

export function OverviewGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
      {children}
    </div>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
      {children}
    </p>
  );
}

export function LikeDislikeBar({ likes, dislikes }: { likes: number; dislikes: number }) {
  const total = likes + dislikes;
  if (total === 0) return null;
  const likeP = Math.round((likes / total) * 100);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>
        <span>{likeP}% liked</span>
        <span>{100 - likeP}% disliked</span>
      </div>
      <div style={{ height: 8, borderRadius: 99, overflow: "hidden", display: "flex" }}>
        <div style={{ width: `${likeP}%`, height: "100%", background: "#22c55e" }} />
        <div style={{ width: `${100 - likeP}%`, height: "100%", background: "#ef4444" }} />
      </div>
    </div>
  );
}

export function DiscoveryBars({ data, color }: { data: Record<string, number>; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {Object.entries(data).map(([label, pct]) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, width: 120, flexShrink: 0 }}>{label}</span>
          <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", borderRadius: 99, background: color }} />
          </div>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, width: 32, textAlign: "right" }}>{pct}%</span>
        </div>
      ))}
    </div>
  );
}

export function InlineMetrics({ items }: { items: { label: string; value: string; sub?: string }[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8, marginTop: 12 }}>
      {items.map(({ label, value, sub }) => (
        <div key={label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 2 }}>{label}</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "white" }}>{value}</div>
          {sub && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>{sub}</div>}
        </div>
      ))}
    </div>
  );
}

export function VideoCard({ id, thumb, title, publishedAt, badge, quickStats, children, accentColor }: {
  id: string; thumb: string; title: string; publishedAt: string;
  badge?: string; quickStats: { label: string; value: string }[];
  children?: React.ReactNode; accentColor: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{ borderRadius: 12, border: `1px solid ${open ? accentColor + "40" : "rgba(255,255,255,0.07)"}`, background: open ? accentColor + "08" : "rgba(255,255,255,0.03)", cursor: "pointer" }}
      onClick={() => setOpen(o => !o)}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px" }}>
        <div style={{ width: 48, height: 36, borderRadius: 8, background: accentColor + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, marginTop: 2 }}>
          {thumb}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title now wraps fully — no truncation */}
          <p style={{ color: "white", fontSize: 13, fontWeight: 500, margin: 0, lineHeight: 1.4 }}>{title}</p>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, margin: "4px 0 0" }}>
            {publishedAt}
            {badge && <span style={{ marginLeft: 8, fontSize: 10, padding: "1px 6px", borderRadius: 99, background: accentColor + "20", color: accentColor }}>{badge}</span>}
          </p>
        </div>
        <div style={{ display: "flex", gap: 20, flexShrink: 0 }}>
          {quickStats.map(s => (
            <div key={s.label} style={{ textAlign: "right" }}>
              <div style={{ color: "white", fontSize: 13, fontWeight: 600 }}>{s.value}</div>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0, marginTop: 4 }}>▼</span>
      </div>
      {open && (
        <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${accentColor}20` }} onClick={e => e.stopPropagation()}>
          {children}
        </div>
      )}
    </div>
  );
}

export function FormatToggle({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: { id: string; label: string }[];
}) {
  return (
    <div style={{ display: "flex", gap: 4, padding: 4, background: "rgba(255,255,255,0.05)", borderRadius: 10, width: "fit-content", marginBottom: 20 }}>
      {options.map(o => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          style={{ padding: "6px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, background: value === o.id ? "rgba(255,255,255,0.1)" : "transparent", color: value === o.id ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)", fontWeight: value === o.id ? 600 : 400 }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
