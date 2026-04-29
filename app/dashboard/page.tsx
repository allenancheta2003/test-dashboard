"use client";
import { useState, useCallback, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import DateRangePicker from "@/components/DateRangePicker";
import YouTubeView from "@/components/views/YouTubeView";
import TikTokView from "@/components/views/TikTokView";
import InstagramView from "@/components/views/InstagramView";
import FacebookView from "@/components/views/FacebookView";
import CSVUploadModal from "@/components/CSVUploadModal";

export default function DashboardPage() {
  const [platform, setPlatform]     = useState("youtube");
  const [dateRange, setDateRange]   = useState<string>("all");
  const [showUpload, setShowUpload] = useState(false);
  const [csvData, setCsvData]       = useState<Record<string, any[]>>({});
  const [loading, setLoading]       = useState(true);

  // Load all data from Supabase on mount
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/csv");
        if (res.ok) {
          const data = await res.json();
          setCsvData(data);
        }
      } catch (e) {
        console.error("Failed to load data:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCSVImport = useCallback(async (subType: string, rows: any[]) => {
    const merge = subType === "tiktok";
    try {
      const res = await fetch("/api/csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: subType, rows, merge }),
      });
      if (res.ok) {
        const all = await fetch("/api/csv");
        if (all.ok) setCsvData(await all.json());
      }
    } catch (e) {
      console.error("Failed to save data:", e);
    }
  }, []);

  const handleClearData = useCallback(async () => {
    const platforms = ["youtube-shorts", "youtube-longform", "tiktok", "instagram", "facebook"];
    await Promise.all(platforms.map(p => fetch(`/api/csv?platform=${p}`, { method: "DELETE" })));
    setCsvData({});
  }, []);

  const titles: Record<string, string> = {
    youtube:   "YouTube Analytics",
    tiktok:    "TikTok Analytics",
    instagram: "Instagram Analytics",
    facebook:  "Facebook Analytics",
  };

  const importedTypes = Object.keys(csvData);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#080810", color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
        Loading dashboard data...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#080810", color: "white", fontFamily: "system-ui, sans-serif" }}>
      <Sidebar
        active={platform}
        onChange={p => { setPlatform(p); setDateRange("all"); }}
        onUpload={() => setShowUpload(true)}
        importedTypes={importedTypes}
      />

      <main style={{ flex: 1, overflow: "auto" }}>
        <header style={{ position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 32px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(8,8,16,0.9)" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "white" }}>{titles[platform]}</h1>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
              Content performance dashboard
              {importedTypes.length > 0 && (
                <span style={{ marginLeft: 10, fontSize: 11, color: "#22c55e" }}>
                  ● Live data ({importedTypes.length} platform{importedTypes.length > 1 ? "s" : ""} imported)
                </span>
              )}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {importedTypes.length > 0 && (
              <button
                onClick={handleClearData}
                style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}
              >
                Clear all data
              </button>
            )}
            <DateRangePicker value={dateRange} onChange={setDateRange} platform={platform} />
          </div>
        </header>

        <div style={{ padding: 32 }}>
          {platform === "youtube" && (
            <YouTubeView
  dateRange={dateRange}
  shortsCsvData={csvData["youtube-shorts"]}
  longCsvData={csvData["youtube-longform"]}
  glendoraShortsData={csvData["glendora-shorts"]}
  glendoraLongData={csvData["glendora-longform"]}
/>
          )}
          {platform === "tiktok"    && <TikTokView    dateRange={dateRange} csvData={csvData["tiktok"]} />}
          {platform === "instagram" && <InstagramView dateRange={dateRange} csvData={csvData["instagram"]} />}
          {platform === "facebook"  && <FacebookView  dateRange={dateRange} csvData={csvData["facebook"]} />}
        </div>
      </main>

      {showUpload && (
        <CSVUploadModal
          platform={platform}
          importedTypes={importedTypes}
          onImport={handleCSVImport}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  );
}
