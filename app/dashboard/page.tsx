"use client";
import { useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import DateRangePicker from "@/components/DateRangePicker";
import YouTubeView from "@/components/views/YouTubeView";
import TikTokView from "@/components/views/TikTokView";
import InstagramView from "@/components/views/InstagramView";
import FacebookView from "@/components/views/FacebookView";
import CSVUploadModal from "@/components/CSVUploadModal";
import { Platform, DateRange } from "@/lib/data";

export default function DashboardPage() {
  const [platform, setPlatform] = useState<Platform>("youtube");
  const [dateRange, setDateRange] = useState<DateRange>("28d");
  const [showUpload, setShowUpload] = useState(false);
  const [csvData, setCsvData] = useState<Record<string, any[]>>({});

const handleCSVImport = useCallback((p: string, subType: string, rows: any[]) => {
  setCsvData(prev => ({ ...prev, [subType]: rows }));
    setShowUpload(false);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#080810]">
      <Sidebar active={platform} onChange={setPlatform} onUpload={() => setShowUpload(true)} />

      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 border-b border-white/[0.07] bg-[#080810]/90 backdrop-blur-sm">
          <div>
            <h1 className="text-white font-semibold text-lg tracking-tight">
              {platform === "youtube" && "YouTube Analytics"}
              {platform === "tiktok" && "TikTok Analytics"}
              {platform === "instagram" && "Instagram Analytics"}
              {platform === "facebook" && "Facebook Analytics"}
            </h1>
            <p className="text-white/30 text-xs mt-0.5">Content performance dashboard</p>
          </div>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </header>

        <div className="p-8">
          {platform === "youtube" && <YouTubeView dateRange={dateRange} shortsCsvData={csvData["youtube-shorts"]} longCsvData={csvData["youtube-longform"]} />}
          {platform === "tiktok"     && <TikTokView    dateRange={dateRange} csvData={csvData.tiktok} />}
          {platform === "instagram"  && <InstagramView dateRange={dateRange} csvData={csvData.instagram} />}
          {platform === "facebook"   && <FacebookView  dateRange={dateRange} csvData={csvData.facebook} />}
        </div>
      </main>

      {showUpload && (
        <CSVUploadModal platform={platform} onImport={handleCSVImport} onClose={() => setShowUpload(false)} />      )}
    </div>
  );
}
