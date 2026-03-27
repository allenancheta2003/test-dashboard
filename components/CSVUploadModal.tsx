"use client";
import { useState, useRef } from "react";

const FIELD_MAPS: Record<string, Record<string, string>> = {
  "youtube-shorts": {
    "Content":                            "id",
    "Video title":                        "title",
    "Video publish time":                 "publishedAt",
    "Duration":                           "duration",
    "Views":                              "views",
    "Watch time (hours)":                 "watchTimeHours",
    "Subscribers":                        "subscribers",
    "Impressions":                        "impressions",
    "Impressions click-through rate (%)": "ctr",
    "Likes":                              "likes",
    "Comments added":                     "comments",
  },
  "youtube-longform": {
    "Content":                            "id",
    "Video title":                        "title",
    "Video publish time":                 "publishedAt",
    "Duration":                           "duration",
    "Views":                              "views",
    "Watch time (hours)":                 "watchTimeHours",
    "Average view duration":              "avgViewDuration",
    "Average percentage viewed":          "avgPctViewed",
    "Subscribers":                        "subscribers",
    "Impressions":                        "impressions",
    "Impressions click-through rate (%)": "ctr",
    "Likes":                              "likes",
    "Comments added":                     "comments",
  },
  "tiktok": {
    "Video Title":                        "title",
    "Date":                               "publishedAt",
    "Views":                              "views",
    "Likes":                              "likes",
    "Comments":                           "comments",
    "Shares":                             "shares",
    "Saves":                              "saves",
    "Average watch time (sec)":           "avgWatchTime",
    "Total play time (sec)":              "duration",
    "Retention Rate (%)":                 "retention",
    "Total Engagements":                  "totalEngagement",
  },
  "instagram": {
    "Reel title":                         "title",
    "Date":                               "publishedAt",
    "Plays":                              "views",
    "Likes":                              "likes",
    "Comments":                           "comments",
    "Shares":                             "shares",
    "Saves":                              "saves",
    "Reposts":                            "reposts",
    "Average watch time (sec)":           "avgWatchTime",
    "Duration (sec)":                     "duration",
    "3s view rate (%)":                   "viewRatePast3s",
    "Retention (%)":                      "retention",
    "Total Interactions":                 "totalEngagement",
  },
  "facebook": {
    "Post Title":                         "title",
    "Date Published":                     "publishedAt",
    "Reach":                              "reach",
    "Impressions":                        "impressions",
    "Likes":                              "likes",
    "Comments":                           "comments",
    "Shares":                             "shares",
    "Link Clicks":                        "clicks",
  },
};

const TYPE_LABELS: Record<string, string> = {
  "youtube-shorts":  "YouTube Shorts",
  "youtube-longform":"YouTube Long-form",
  "tiktok":          "TikTok",
  "instagram":       "Instagram",
  "facebook":        "Facebook",
};

function detectType(filename: string): string | null {
  const f = filename.toLowerCase().replace(/\s+/g, "-");
  if (f.includes("youtube-shorts") || f.includes("yt-shorts"))   return "youtube-shorts";
  if (f.includes("youtube-longform") || f.includes("yt-longform") || f.includes("youtube-long")) return "youtube-longform";
  if (f.includes("tiktok"))     return "tiktok";
  if (f.includes("instagram"))  return "instagram";
  if (f.includes("facebook"))   return "facebook";
  return null;
}

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
  platform: string;
  onImport: (p: string, subType: string, rows: any[]) => void;
  onClose: () => void;
}) {
  const [dragging, setDragging]   = useState(false);
  const [preview, setPreview]     = useState<any[] | null>(null);
  const [detectedType, setDetectedType] = useState<string | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [fileName, setFileName]   = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setError(null);
    setFileName(file.name);
    if (!file.name.endsWith(".csv")) { setError("Please upload a .csv file"); return; }

    const type = detectType(file.name);
    if (!type) {
      setError(
        `Could not detect type from filename "${file.name}". ` +
        `Please rename your file to include: youtube-shorts, youtube-longform, tiktok, instagram, or facebook.`
      );
      return;
    }

    setDetectedType(type);
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      const rows = parseCSV(text);
      if (!rows.length) { setError("CSV appears to be empty"); return; }
      const fieldMap = FIELD_MAPS[type];
      const mapped = rows
        .filter((r: any) => r["Video title"] || r["Video Title"] || r["Reel title"] || r["Post Title"])
        .map((r, i) => mapRow(r, fieldMap, i));
      setPreview(mapped.slice(0, 3));
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
    if (full && detectedType) onImport(platform, detectedType, full);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)" }}>
      <div style={{ width: "100%", maxWidth: 560, margin: "0 16px", background: "#0f0f1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, overflow: "hidden" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div>
            <h2 style={{ margin: 0, color: "white", fontSize: 16, fontWeight: 600 }}>Import CSV</h2>
            <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.35)", fontSize: 12 }}>
              Rename your file before importing so we know what it contains
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>

        <div style={{ padding: 24 }}>

          {/* Naming guide */}
          {!preview && (
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Rename your file to one of these before uploading
              </p>
              {Object.entries(TYPE_LABELS).map(([key, label]) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                  <code style={{ background: "rgba(255,255,255,0.08)", padding: "2px 8px", borderRadius: 6, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                    {key}.csv
                  </code>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>→ {label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Detected type badge */}
          {detectedType && (
            <div style={{ marginBottom: 16, padding: "8px 14px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, fontSize: 13, color: "#22c55e" }}>
              ✓ Detected as: <strong>{TYPE_LABELS[detectedType]}</strong>
            </div>
          )}

          {/* Drop zone */}
          {!preview && (
            <>
              <div
                style={{ border: `2px dashed ${dragging ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.1)"}`, borderRadius: 12, padding: 40, textAlign: "center", cursor: "pointer", background: dragging ? "rgba(255,255,255,0.04)" : "transparent" }}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
              >
                <div style={{ fontSize: 32, marginBottom: 12 }}>📂</div>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, margin: "0 0 4px", fontWeight: 500 }}>
                  Drop your CSV here or click to browse
                </p>
                <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, margin: 0 }}>
                  Make sure filename includes: youtube-shorts, youtube-longform, tiktok, instagram, or facebook
                </p>
                <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) processFile(e.target.files[0]); }} />
              </div>
              {error && (
                <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, fontSize: 13, color: "#ef4444" }}>
                  {error}
                </div>
              )}
            </>
          )}

          {/* Preview */}
          {preview && detectedType && (
            <div>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 12 }}>
                Preview — first 3 rows of <strong style={{ color: "white" }}>{fileName}</strong>
              </p>
              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 16, overflowX: "auto", marginBottom: 16 }}>
                <table style={{ fontSize: 12, width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {Object.values(FIELD_MAPS[detectedType]).slice(0, 5).map(k => (
                        <th key={k} style={{ color: "rgba(255,255,255,0.3)", fontWeight: 500, textAlign: "left", paddingBottom: 8, paddingRight: 16 }}>{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                        {Object.values(FIELD_MAPS[detectedType]).slice(0, 5).map(k => (
                          <td key={k} style={{ color: "rgba(255,255,255,0.6)", padding: "6px 16px 6px 0" }}>
                            {row[k] !== undefined ? String(row[k]).slice(0, 18) : "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={handleConfirm}
                  style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer", background: "rgba(255,255,255,0.1)", color: "white", fontSize: 14, fontWeight: 600 }}
                >
                  Import {(window as any).__csvFull?.length} rows into {TYPE_LABELS[detectedType]}
                </button>
                <button
                  onClick={() => { setPreview(null); setDetectedType(null); setError(null); }}
                  style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", background: "transparent", color: "rgba(255,255,255,0.4)", fontSize: 14 }}
                >
                  Try another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
