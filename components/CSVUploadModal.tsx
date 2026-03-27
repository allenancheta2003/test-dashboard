"use client";
import { useState, useRef } from "react";
import { Platform } from "@/lib/data";

// ─── CSV field mappings per platform ─────────────────────────────────────────
// Maps your CSV column headers → our internal field names
// Adjust these to match the exact column names from each platform's export

const FIELD_MAPS: Record<Platform, Record<string, string>> = {
  youtube: {
    // YouTube Studio CSV headers
    "Video title":             "title",
    "Video publish time":      "publishedAt",
    "Views":                   "views",
    "Watch time (hours)":      "duration",
    "Average view duration":   "avgViewDuration",
    "Average percentage viewed": "avgPctViewed",
    "Impressions click-through rate (%)": "ctr",
    "Likes":                   "likes",
    "Comments added":          "comments",
    "Subscribers":             "subscribers",
  },
  tiktok: {
    // TikTok Analytics CSV headers
    "Video Title":             "title",
    "Date":                    "publishedAt",
    "Views":                   "views",
    "Likes":                   "likes",
    "Comments":                "comments",
    "Shares":                  "shares",
    "Saves":                   "saves",
    "Average watch time (sec)":"avgWatchTime",
    "Total play time (sec)":   "duration",
    "Retention Rate (%)":      "retention",
    "Total Engagements":       "totalEngagement",
  },
  instagram: {
    // Instagram Insights CSV headers
    "Reel title":              "title",
    "Date":                    "publishedAt",
    "Plays":                   "views",
    "Likes":                   "likes",
    "Comments":                "comments",
    "Shares":                  "shares",
    "Saves":                   "saves",
    "Reposts":                 "reposts",
    "Average watch time (sec)":"avgWatchTime",
    "Duration (sec)":          "duration",
    "3s view rate (%)":        "viewRatePast3s",
    "Retention (%)":           "retention",
    "Total Interactions":      "totalEngagement",
  },
  facebook: {
    // Facebook Page Insights CSV headers
    "Post Title":              "title",
    "Date Published":          "publishedAt",
    "Reach":                   "reach",
    "Impressions":             "impressions",
    "Likes":                   "likes",
    "Comments":                "comments",
    "Shares":                  "shares",
    "Link Clicks":             "clicks",
  },
};

const PLATFORM_LABELS: Record<Platform, string> = {
  youtube: "YouTube", tiktok: "TikTok", instagram: "Instagram", facebook: "Facebook",
};

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.replace(/^"|"$/g, "").trim());
  return lines.slice(1).map(line => {
    const vals = line.split(",").map(v => v.replace(/^"|"$/g, "").trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = vals[i] ?? ""; });
    return row;
  });
}

function mapRow(row: Record<string, string>, fieldMap: Record<string, string>, idx: number): any {
  const out: any = { id: `csv_${idx}`, thumb: "📄" };
  for (const [csvCol, internalKey] of Object.entries(fieldMap)) {
    const raw = row[csvCol];
    if (raw === undefined) continue;
    const num = parseFloat(raw.replace(/,/g, ""));
    out[internalKey] = isNaN(num) ? raw : num;
  }
  if (!out.title) out.title = `Row ${idx + 1}`;
  if (!out.publishedAt) out.publishedAt = "—";
  return out;
}

export default function CSVUploadModal({ platform, onImport, onClose }: {
  platform: Platform;
  onImport: (p: Platform, rows: any[]) => void;
  onClose: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setError(null);
    if (!file.name.endsWith(".csv")) { setError("Please upload a .csv file"); return; }
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      const rows = parseCSV(text);
      if (!rows.length) { setError("CSV appears to be empty"); return; }
      const fieldMap = FIELD_MAPS[platform];
      const mapped = rows.map((r, i) => mapRow(r, fieldMap, i));
      setPreview(mapped.slice(0, 3)); // show first 3 as preview
      // store full mapped data on confirm
      (window as any).__csvFull = mapped;
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleConfirm = () => {
    const full = (window as any).__csvFull;
    if (full) onImport(platform, full);
  };

  const fieldMap = FIELD_MAPS[platform];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 bg-[#0f0f1a] border border-white/10 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
          <div>
            <h2 className="text-white font-semibold">Import {PLATFORM_LABELS[platform]} CSV</h2>
            <p className="text-white/35 text-xs mt-0.5">Export from {PLATFORM_LABELS[platform]} Studio/Analytics, then upload here</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Drop Zone */}
          {!preview && (
            <>
              <div
                className="border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer"
                style={{ borderColor: dragging ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.1)", background: dragging ? "rgba(255,255,255,0.04)" : "transparent" }}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 mx-auto mb-3 text-white/25">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <p className="text-white/50 text-sm font-medium">Drop your CSV here or click to browse</p>
                <p className="text-white/25 text-xs mt-1">.csv files only</p>
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => { if (e.target.files?.[0]) processFile(e.target.files[0]); }} />
              </div>
              {error && <p className="text-rose-400 text-sm mt-3">{error}</p>}
            </>
          )}

          {/* Preview */}
          {preview && (
            <div>
              <p className="text-white/50 text-sm mb-3">Preview — first 3 rows mapped:</p>
              <div className="bg-white/[0.04] rounded-xl p-4 overflow-x-auto mb-4">
                <table className="text-xs w-full">
                  <thead>
                    <tr>
                      {Object.values(fieldMap).slice(0, 6).map(k => (
                        <th key={k} className="text-white/30 font-medium text-left pb-2 pr-4">{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-t border-white/[0.06]">
                        {Object.values(fieldMap).slice(0, 6).map(k => (
                          <td key={k} className="text-white/60 py-1.5 pr-4 tabular-nums">
                            {row[k] !== undefined ? String(row[k]).slice(0, 20) : "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
                  style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.9)" }}
                >
                  Import {(window as any).__csvFull?.length} rows
                </button>
                <button
                  onClick={() => { setPreview(null); (window as any).__csvFull = null; }}
                  className="px-4 py-2.5 rounded-lg text-sm text-white/40 hover:text-white/70 border border-white/10 transition-all"
                >
                  Try another file
                </button>
              </div>
            </div>
          )}

          {/* Expected columns */}
          <div className="mt-5 border-t border-white/[0.07] pt-4">
            <p className="text-white/25 text-[10px] uppercase tracking-widest font-semibold mb-2">Expected column names in your CSV</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(fieldMap).map(col => (
                <span key={col} className="text-[11px] text-white/40 bg-white/[0.05] px-2 py-1 rounded-md">{col}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
