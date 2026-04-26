// lib/analytics.ts — shared utilities for all platform views

export function fmt(n: number | undefined | null): string {
  if (n === undefined || n === null || isNaN(n)) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return Math.round(n * 10) / 10 + "";
}

export function fmtPct(n: number | undefined | null, decimals = 1): string {
  if (n === undefined || n === null || isNaN(n)) return "—";
  return Number(n).toFixed(decimals) + "%";
}

export function fmtSec(s: number): string {
  if (!s || isNaN(s)) return "—";
  if (s >= 3600) {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return `${h}h ${m}m`;
  }
  if (s >= 60) { const m = Math.floor(s / 60), sec = s % 60; return `${m}m${sec > 0 ? ` ${sec}s` : ""}`; }
  return `${Math.round(s)}s`;
}

// Parse "04/04/2025 16:09", "Apr 25, 2024", "2024-04-25" → "2024-04"
export function parseYM(raw: string): string {
  if (!raw || raw.trim() === "") return "";
  const s = raw.trim();
  const mmddyyyy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (mmddyyyy) return `${mmddyyyy[3]}-${mmddyyyy[1].padStart(2, "0")}`;
  if (/^\d{4}-\d{2}/.test(s)) return s.slice(0, 7);
  const months: Record<string, string> = {
    jan:"01",feb:"02",mar:"03",apr:"04",may:"05",jun:"06",
    jul:"07",aug:"08",sep:"09",oct:"10",nov:"11",dec:"12"
  };
  const mdy = s.match(/^([A-Za-z]{3})\s+\d+,\s*(\d{4})/);
  if (mdy) { const mo = months[mdy[1].toLowerCase()]; if (mo) return `${mdy[2]}-${mo}`; }
  const d = new Date(s);
  if (!isNaN(d.getTime())) return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  return "";
}

// Get YYYY-MM from a video object (uses precomputed publishedYM if available)
export function getYM(v: any): string {
  return v.publishedYM || parseYM(v.publishedAt || "");
}

// Filter videos by selected month/range
export function filterByDate(videos: any[], dateRange: string): any[] {
  if (dateRange === "all") return videos;
  if (dateRange === "unpublished") return videos.filter(v => !getYM(v));
  return videos.filter(v => getYM(v) === dateRange);
}

// Get unique months from a list of videos, sorted descending
export function getMonthsFromVideos(videos: any[]): { val: string; label: string }[] {
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const seen = new Set<string>();
  videos.forEach(v => { const ym = getYM(v); if (ym) seen.add(ym); });
  return Array.from(seen)
    .sort((a, b) => b.localeCompare(a))
    .map(ym => {
      const [year, mo] = ym.split("-");
      return { val: ym, label: `${monthNames[parseInt(mo) - 1]} ${year}` };
    });
}

// Get month label from YYYY-MM
export function monthLabel(ym: string): string {
  if (!ym) return "";
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const [year, mo] = ym.split("-");
  return `${monthNames[parseInt(mo) - 1]} ${year}`;
}

// Find the top video by a given metric
export function getTopVideo(videos: any[], metric: string): any {
  if (!videos.length) return null;
  return [...videos].sort((a, b) => (Number(b[metric]) || 0) - (Number(a[metric]) || 0))[0];
}

// Compute % change between two values
export function pctChange(current: number, previous: number): number {
  if (!previous) return 0;
  return Math.round(((current - previous) / previous) * 100);
}

// Aggregate a metric across all videos
export function sumMetric(videos: any[], key: string): number {
  return videos.reduce((a, v) => a + (Number(v[key]) || 0), 0);
}

export function avgMetric(videos: any[], key: string): number {
  if (!videos.length) return 0;
  return sumMetric(videos, key) / videos.length;
}

// Generate "why it stood out" insight text
export function generateInsight(video: any, allVideos: any[], platform: string): string {
  if (!video || !allVideos.length) return "";
  const totalViews = sumMetric(allVideos, "views");
  const share = totalViews > 0 ? Math.round((Number(video.views) || 0) / totalViews * 100) : 0;
  const insights: string[] = [];

  if (share > 40) insights.push(`drove ${share}% of all views this period`);
  if (Number(video.stayedToWatch) >= 80) insights.push(`${video.stayedToWatch}% of viewers stayed to watch`);
  if (Number(video.retention) >= 75) insights.push(`${video.retention}% retention rate (well above average)`);
  if (Number(video.ctr) >= 6) insights.push(`strong ${video.ctr}% click-through rate`);
  if (Number(video.saves) > 0 && platform === "instagram") {
    const avgSaves = avgMetric(allVideos, "saves");
    if (Number(video.saves) > avgSaves * 2) insights.push(`saves were ${Math.round(Number(video.saves) / avgSaves)}x the average`);
  }
  if (Number(video.shares) > 0) {
    const avgShares = avgMetric(allVideos, "shares");
    if (Number(video.shares) > avgShares * 2) insights.push(`shares were ${Math.round(Number(video.shares) / avgShares)}x higher than average`);
  }
  if (platform === "youtube" && Number(video.duration) <= 60) insights.push("short duration likely triggered the Shorts loop feature");
  if (insights.length === 0) insights.push("led all content this period by total views");
  return "This video " + insights.join(", ") + ".";
}
