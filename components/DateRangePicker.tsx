"use client";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

export default function DateRangePicker({ value, onChange }: {
  value: string;
  onChange: (v: string) => void;
}) {
  const currentMonth = new Date().getMonth(); // 0-indexed
  const currentYear  = new Date().getFullYear();

  // Build last 12 months as options
  const options = Array.from({ length: 12 }, (_, i) => {
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
          padding: "8px 14px",
          color: "white",
          fontSize: 13,
          cursor: "pointer",
          outline: "none",
        }}
      >
        <option value="all" style={{ background: "#0f0f1a" }}>All time</option>
        {options.map(o => (
          <option key={o.val} value={o.val} style={{ background: "#0f0f1a" }}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
