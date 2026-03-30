"use client";
import { useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import DateRangePicker from "@/components/DateRangePicker";
import YouTubeView from "@/components/views/YouTubeView";
import TikTokView from "@/components/views/TikTokView";
import InstagramView from "@/components/views/InstagramView";
import FacebookView from "@/components/views/FacebookView";
import CSVUploadModal from "@/components/CSVUploadModal";

export default function DashboardPage() {
  const [platform, setPlatform] = useState("youtube");
  const [dateRange, setDateRange] = useState("28d");
  const [showUpload, setShowUpload] = useState(false);
  const [csvData, setCsvData] = useState<Record<string, any[]>>({});

  const handleCSVImport = useCallback((p: string, subType: string, rows: any[]) => {
    setCsvData(prev => ({ ...prev, [subType]: rows }));
    setShowUpload(false);
  }, []);

  const titles: Record<string, string> = {
    youtube:   "YouTube Analytics",
    tiktok:    "TikTok Analytics",
    instagram: "Instagram Analytics",
    facebook:  "Facebook Analytics",
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#080810", color: "white", fontFamily: "system-ui, sans-serif" }}>
      <Sidebar active={platform} onChange={setPlatform} onUpload={() => setShowUpload(true)} />

      <main style={{ flex: 1, overflow: "auto" }}>
        <header style={{ position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 32px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(8,8,16,0.9)" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "white" }}>{titles[platform]}</h1>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Content performance dashboard</p>
          </div>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </header>

        <div style={{ padding: 32 }}>
          {platform === "youtube" && (
            <YouTubeView
              dateRange={dateRange}
              shortsCsvData={csvData["youtube-shorts"]}
              longCsvData={csvData["youtube-longform"]}
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
          onImport={handleCSVImport}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  );
}
