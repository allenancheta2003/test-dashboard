"use client";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

export default function DateRangePicker({ value, onChange, platform }: {
  value: string;
  onChange: (v: string) => void;
  platform?: string;
}) {
  const currentMonth = new Date().getMonth();
  const currentYear  = new Date().getFullYear();

  // Build last 24 months as options (most recent first)
  const monthOptions = Array.from({ length: 24 }, (_, i) => {
    const d = new Date(currentYear, currentMonth - i, 1);
    const label = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    const val   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { label, val };
  });

  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8,
          padding: "8px 32px 8px 14px",
          color: "white",
          fontSize: 13,
          cursor: "pointer",
          outline: "none",
          appearance: "none",
          WebkitAppearance: "none",
          minWidth: 160,
        }}
      >
        {/* ── Months (most recent first) ── */}
        <optgroup label="Month" style={{ background: "#0f0f1a", color: "rgba(255,255,255,0.4)" }}>
          {monthOptions.map(o => (
            <option key={o.val} value={o.val} style={{ background: "#0f0f1a", color: "white" }}>
              {o.label}
            </option>
          ))}
        </optgroup>

        {/* ── Unpublished — only relevant for YouTube (no publish date in CSV) ── */}
        {(!platform || platform === "youtube") && (
          <optgroup label="Other" style={{ background: "#0f0f1a", color: "rgba(255,255,255,0.4)" }}>
            <option value="unpublished" style={{ background: "#0f0f1a", color: "white" }}>
              Unpublished
            </option>
          </optgroup>
        )}

        {/* ── All time ── */}
        <optgroup label=" " style={{ background: "#0f0f1a" }}>
          <option value="all" style={{ background: "#0f0f1a", color: "white" }}>
            All time
          </option>
        </optgroup>
      </select>

      {/* Custom dropdown arrow */}
      <span style={{
        position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
        color: "rgba(255,255,255,0.4)", pointerEvents: "none", fontSize: 10,
      }}>▼</span>
    </div>
  );
}
