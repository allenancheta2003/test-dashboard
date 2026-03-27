"use client";
import { DateRange } from "@/lib/data";

const OPTIONS: { id: DateRange; label: string }[] = [
  { id: "7d",  label: "Last 7 days" },
  { id: "28d", label: "Last 28 days" },
  { id: "90d", label: "Last 90 days" },
];

export default function DateRangePicker({ value, onChange }: {
  value: DateRange; onChange: (v: DateRange) => void;
}) {
  return (
    <div className="flex gap-1 p-1 bg-white/[0.05] rounded-lg">
      {OPTIONS.map(o => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className="px-3 py-1.5 rounded-md text-xs transition-all"
          style={{
            background: value === o.id ? "rgba(255,255,255,0.1)" : "transparent",
            color: value === o.id ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)",
            fontWeight: value === o.id ? 600 : 400,
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
