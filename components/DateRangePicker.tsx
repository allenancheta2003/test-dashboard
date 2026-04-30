"use client";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

function monthLabel(ym: string): string {
  const [year, mo] = ym.split("-");
  return `${MONTH_NAMES[parseInt(mo) - 1]} ${year}`;
}

export default function DateRangePicker({ value, onChange, platform, availableMonths }: {
  value: string;
  onChange: (v: string) => void;
  platform?: string;
  availableMonths?: string[]; // YYYY-MM strings from actual data
}) {
  // If availableMonths provided, use those. Otherwise fall back to last 24 months.
  const monthOptions = availableMonths?.length
    ? [...availableMonths].sort((a, b) => b.localeCompare(a)).map(ym => ({ val: ym, label: monthLabel(ym) }))
    : Array.from({ length: 24 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        return { val: ym, label: monthLabel(ym) };
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
        {/* Months — only those with actual data */}
        {monthOptions.length > 0 && (
          <optgroup label="Month" style={{ background: "#0f0f1a", color: "rgba(255,255,255,0.4)" }}>
            {monthOptions.map(o => (
              <option key={o.val} value={o.val} style={{ background: "#0f0f1a", color: "white" }}>
                {o.label}
              </option>
            ))}
          </optgroup>
        )}

        {/* Unpublished — only for YouTube */}
        {(!platform || platform === "youtube") && (
          <optgroup label="Other" style={{ background: "#0f0f1a", color: "rgba(255,255,255,0.4)" }}>
            <option value="unpublished" style={{ background: "#0f0f1a", color: "white" }}>
              Unpublished
            </option>
          </optgroup>
        )}

        {/* All time */}
        <optgroup label=" " style={{ background: "#0f0f1a" }}>
          <option value="all" style={{ background: "#0f0f1a", color: "white" }}>
            All time
          </option>
        </optgroup>
      </select>

      <span style={{
        position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
        color: "rgba(255,255,255,0.4)", pointerEvents: "none", fontSize: 10,
      }}>▼</span>
    </div>
  );
}
