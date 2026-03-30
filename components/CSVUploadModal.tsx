"use client";
import { useState, useRef } from "react";

const FIELD_MAPS: Record<string, Record<string, string>> = {
  "youtube-shorts": {
    "Content":                            "videoId",
    "Video title":                        "title",
    "Video publish time":                 "publishedAt",
    "Duration":                           "duration",
    "Average view duration":              "avgViewDuration",
    "Stayed to watch (%)":                "stayedToWatch",
    "Likes":                              "likes",
    "Likes (vs. dislikes) (%)":           "likesPct",
    "Comments added":                     "comments",
    "Views":                              "views",
    "Watch time (hours)":                 "watchTimeHours",
    "Impressions click-through rate (%)": "ctr",
    "Subscribers":                        "subscribers",
  },
  "youtube-longform": {
    "Content":                            "videoId",
    "Video title":                        "title",
    "Video publish time":                 "publishedAt",
    "Duration":                           "duration",
    "Average view duration":              "avgViewDuration",
    "Average percentage viewed (%)":      "avgPctViewed",
    "Likes":                              "likes",
    "Likes (vs. dislikes) (%)":           "likesPct",
    "Comments added":                     "comments",
    "Views":                              "views",
    "Watch time (hours)":                 "watchTimeHours",
    "Impressions":                        "impressions",
    "Impressions click-through rate (%)": "ctr",
    "Subscribers":                        "subscribers",
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
  // ─── Instagram — exact columns from Meta Content export ───────────────────
  "instagram": {
    "Post ID":        "postId",
    "Description":    "title",
    "Duration (sec)": "duration",
    "Publish time":   "publishedAt",   // format: "04/04/2025 16:09"
    "Permalink":      "permalink",
    "Post type":      "format",
    "Views":          "views",
    "Reach":          "reach",
    "Likes":          "likes",
    "Shares":         "shares",
    "Follows":        "follows",
    "Comments":       "comments",
    "Saves":          "saves",
  },
  // ─── Facebook — exact columns from Meta Content export ────────────────────
  "facebook": {
    "Post ID":                        "postId",
    "Title":                          "title",
    "Description":                    "description",
    "Duration (sec)":                 "duration",
    "Publish time":                   "publishedAt",  // format: "03/28/2026 18:16"
    "Permalink":                      "permalink",
    "Post type":                      "format",
    "Views":                          "views",
    "Reach":                          "reach",
    "Reactions, Comments and Shares": "totalEngagement",
    "Reactions":                      "reactions",
    "Comments":                       "comments",
    "Shares":                         "shares",
    "Total clicks":                   "clicks",
    "3-second video views":           "views3s",
    "Seconds viewed":                 "secondsViewed",
    "Average Seconds viewed":         "avgSecondsViewed",
  },
};

const TYPE_LABELS: Record<string, string> = {
  "youtube-shorts":   "YouTube Shorts",
  "youtube-longform": "YouTube Long-form",
  "tiktok":           "TikTok",
  "instagram":        "Instagram",
  "facebook":         "Facebook",
};

function detectType(filename: string): string | null {
  const f = filename.toLowerCase().replace(/\s+/g, "-");
  if (f.includes("youtube-shorts") || f.includes("yt-shorts"))     return "youtube-shorts";
  if (f.includes("youtube-longform") || f.includes("yt-longform")) return "youtube-longform";
  if (f.includes("tiktok"))                                         return "tiktok";
  if (f.includes("instagram"))                                      return "instagram";
  if (f.includes("facebook"))                                       return "facebook";
  return null;
}

// Robust CSV parser — handles quoted fields containing commas and newlines
// (Meta exports have descriptions with newlines inside quoted fields)
function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let cur = "", inQ = false, row: string[] = [];
  // Strip BOM if present
  const t = text.startsWith("\uFEFF") ? text.slice(1) : text;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i], nx = t[i + 1];
    if (ch === '"') {
      if (inQ && nx === '"') { cur += '"'; i++; } // escaped quote
      else inQ = !inQ;
    } else if (ch === ',' && !inQ) {
      row.push(cur.trim()); cur = "";
    } else if ((ch === '\n' || ch === '\r') && !inQ) {
      if (ch === '\r' && nx === '\n') i++;
      row.push(cur.trim()); cur = "";
      if (row.some(c => c !== "")) rows.push(row);
      row = [];
    } else {
      cur += ch;
    }
  }
  if (cur || row.length) { row.push(cur.trim()); if (row.some(c => c !== "")) rows.push(row); }
  if (rows.length < 2) return [];
  const headers = rows[0].map(h => h.replace(/^\uFEFF/, "").trim());
  return rows.slice(1).map(vals => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ""; });
    return obj;
  });
}

// Converts "0:01:23" or "0:00:50" → seconds
function parseDuration(val: string): number {
  if (!val) return 0;
  const parts = val.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return Number(val) || 0;
}

// Normalizes date strings to YYYY-MM for month filtering
// Handles: "04/04/2025 16:09", "Apr 25, 2024", "2024-04-25"
function normalizeDate(raw: string): string {
  if (!raw || raw.trim() === "") return "";
  const s = raw.trim();
  // MM/DD/YYYY HH:MM (Meta export format)
  const mmddyyyy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (mmddyyyy) return `${mmddyyyy[3]}-${mmddyyyy[1].padStart(2, "0")}`;
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}/.test(s)) return s.slice(0, 7);
  // Mon DD, YYYY (YouTube format)
  const months: Record<string, string> = {
    jan:"01",feb:"02",mar:"03",apr:"04",may:"05",jun:"06",
    jul:"07",aug:"08",sep:"09",oct:"10",nov:"11",dec:"12"
  };
  const mdy = s.match(/^([A-Za-z]{3})\s+\d+,\s*(\d{4})/);
  if (mdy) { const mo = months[mdy[1].toLowerCase()]; if (mo) return `${mdy[2]}-${mo}`; }
  const d = new Date(s);
  if (!isNaN(d.getTime())) return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
  return "";
}

function mapRow(row: Record<string, string>, fieldMap: Record<string, string>, idx: number): any {
  const out: any = { id: `csv_${idx}`, thumb: "🎬" };
  for (const [csvCol, key] of Object.entries(fieldMap)) {
    const raw = (row[csvCol] ?? "").trim();
    if (raw === "") continue;
    if (key === "publishedAt") {
      out[key] = raw;                        // keep original string for display
      out["publishedYM"] = normalizeDate(raw); // YYYY-MM for month filtering
    } else if (key === "avgViewDuration" && raw.includes(":")) {
      out[key] = parseDuration(raw);
    } else if (key === "title") {
      // Use first non-empty line (Meta descriptions can be multi-line)
      out[key] = raw.split(/\r?\n/)[0].trim().slice(0, 120) || `Post ${idx + 1}`;
    } else {
      const num = parseFloat(raw.replace(/,/g, ""));
      out[key] = isNaN(num) ? raw : num;
    }
  }
  if (!out.title) out.title = `Row ${idx + 1}`;
  return out;
}

export default function CSVUploadModal({ platform, importedTypes, onImport, onClose }: {
  platform: string;
  importedTypes: string[];
  onImport: (subType: string, rows: any[]) => void;
  onClose: () => void;
}) {
  const [dragging, setDragging]         = useState(false);
  const [preview, setPreview]           = useState<any[] | null>(null);
  const [detectedType, setDetectedType] = useState<string | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const [fileName, setFileName]         = useState("");
  const [fullData, setFullData]         = useState<any[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setError(null); setPreview(null); setDetectedType(null); setFullData(null);
    setFileName(file.name);
    if (!file.name.endsWith(".csv")) { setError("Please upload a .csv file"); return; }
    const type = detectType(file.name);
    if (!type) {
      setError(`Can't detect type from "${file.name}". Rename to include: youtube-shorts, youtube-longform, tiktok, instagram, or facebook.`);
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
        .filter(r => {
          // Skip summary/total rows that Meta adds
          const date = r["Date"] || r["Publish time"] || "";
          if (date === "Lifetime" || date === "Total") return false;
          // Must have some identifiable content
          const title = r["Video title"] || r["Video Title"] || r["Reel title"] ||
                        r["Post Title"] || r["Description"] || r["Title"] || "";
          const id    = r["Post ID"] || r["Content"] || "";
          return title.trim() !== "" || id.trim() !== "";
        })
        .map((r, i) => mapRow(r, fieldMap, i));
      setPreview(mapped.slice(0, 3));
      setFullData(mapped);
    };
    reader.readAsText(file);
  };

  const handleConfirm = () => {
    if (fullData && detectedType) {
      onImport(detectedType, fullData);
      setPreview(null); setDetectedType(null); setFullData(null); setFileName("");
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.75)" }}>
      <div style={{ width: "100%", maxWidth: 580, margin: "0 16px", background: "#0f0f1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, overflow: "hidden", maxHeight: "90vh", overflowY: "auto" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)", position: "sticky", top: 0, background: "#0f0f1a", zIndex: 1 }}>
          <div>
            <h2 style={{ margin: 0, color: "white", fontSize: 16, fontWeight: 600 }}>Import CSV Data</h2>
            <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.35)", fontSize: 12 }}>
              You can import multiple files — modal stays open after each import
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 20, padding: "4px 8px" }}>✕</button>
        </div>

        <div style={{ padding: 24 }}>

          {importedTypes.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>Already imported this session:</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {importedTypes.map(t => (
                  <span key={t} style={{ fontSize: 12, padding: "3px 10px", borderRadius: 99, background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" }}>
                    ✓ {TYPE_LABELS[t] || t}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Rename your file before uploading
            </p>
            {Object.entries(TYPE_LABELS).map(([key, label]) => {
              const done = importedTypes.includes(key);
              return (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <code style={{ background: "rgba(255,255,255,0.08)", padding: "2px 8px", borderRadius: 6, fontSize: 12, color: done ? "#22c55e" : "rgba(255,255,255,0.7)" }}>
                    {key}.csv
                  </code>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>→ {label}</span>
                  {done && <span style={{ fontSize: 11, color: "#22c55e", marginLeft: "auto" }}>✓ imported</span>}
                </div>
              );
            })}
          </div>

          {detectedType && !preview && (
            <div style={{ marginBottom: 16, padding: "8px 14px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, fontSize: 13, color: "#22c55e" }}>
              ✓ Detected: <strong>{TYPE_LABELS[detectedType]}</strong>
            </div>
          )}

          {!preview && (
            <>
              <div
                style={{ border: `2px dashed ${dragging ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.1)"}`, borderRadius: 12, padding: 40, textAlign: "center", cursor: "pointer", background: dragging ? "rgba(255,255,255,0.04)" : "transparent", transition: "all 0.2s" }}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]); }}
                onClick={() => fileRef.current?.click()}
              >
                <div style={{ fontSize: 32, marginBottom: 12 }}>📂</div>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, margin: "0 0 4px", fontWeight: 500 }}>Drop CSV here or click to browse</p>
                <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, margin: 0 }}>File must be renamed to include platform name</p>
                <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) processFile(e.target.files[0]); e.target.value = ""; }} />
              </div>
              {error && (
                <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, fontSize: 13, color: "#ef4444" }}>
                  {error}
                </div>
              )}
            </>
          )}

          {preview && detectedType && (
            <div>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 12 }}>
                Preview — first 3 rows of <strong style={{ color: "white" }}>{fileName}</strong> ({fullData?.length} total rows)
              </p>
              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 16, overflowX: "auto", marginBottom: 16 }}>
                <table style={{ fontSize: 11, width: "100%", borderCollapse: "collapse", minWidth: 400 }}>
                  <thead>
                    <tr>
                      {["title","publishedAt","views","likes","duration"].map(k => (
                        <th key={k} style={{ color: "rgba(255,255,255,0.3)", fontWeight: 500, textAlign: "left", paddingBottom: 8, paddingRight: 12, whiteSpace: "nowrap" }}>{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                        {["title","publishedAt","views","likes","duration"].map(k => (
                          <td key={k} style={{ color: "rgba(255,255,255,0.6)", padding: "6px 12px 6px 0", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {row[k] !== undefined ? String(row[k]) : "—"}
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
                  style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "none", cursor: "pointer", background: "#FF4444", color: "white", fontSize: 14, fontWeight: 600 }}
                >
                  ✓ Import {fullData?.length} rows into {TYPE_LABELS[detectedType]}
                </button>
                <button
                  onClick={() => { setPreview(null); setDetectedType(null); setFullData(null); setError(null); }}
                  style={{ padding: "11px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", background: "transparent", color: "rgba(255,255,255,0.4)", fontSize: 14 }}
                >
                  Cancel
                </button>
              </div>

              <p style={{ marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center" }}>
                After importing, the modal stays open so you can import more files
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
