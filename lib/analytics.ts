// lib/analytics.ts

export function fmt(n: number | undefined | null): string {
  if (n === undefined || n === null || isNaN(Number(n))) return "—";
  const num = Number(n);
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return Math.round(num * 10) / 10 + "";
}

export function fmtPct(n: number | undefined | null, decimals = 1): string {
  if (n === undefined || n === null || isNaN(Number(n))) return "—";
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

// Parse any date string → "YYYY-MM"
// Handles: "04/04/2025 16:09", "Apr 25, 2024", "2024-04-25"
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

export function getYM(v: any): string {
  return v.publishedYM || parseYM(v.publishedAt || "");
}

export function filterByDate(videos: any[], dateRange: string): any[] {
  if (dateRange === "all") return videos;
  if (dateRange === "unpublished") return videos.filter(v => !getYM(v));
  return videos.filter(v => getYM(v) === dateRange);
}

export function getMonthsFromVideos(videos: any[]): { val: string; label: string }[] {
  const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const seen = new Set<string>();
  videos.forEach(v => { const ym = getYM(v); if (ym) seen.add(ym); });
  return Array.from(seen)
    .sort((a, b) => b.localeCompare(a))
    .map(ym => {
      const [year, mo] = ym.split("-");
      return { val: ym, label: `${MONTH_NAMES[parseInt(mo) - 1]} ${year}` };
    });
}

export function monthLabel(ym: string): string {
  if (!ym) return "Unknown";
  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const [year, mo] = ym.split("-");
  return `${MONTH_NAMES[parseInt(mo) - 1]} ${year}`;
}

export function getTopVideo(videos: any[], metric: string): any | null {
  if (!videos.length) return null;
  return [...videos].sort((a, b) => (Number(b[metric]) || 0) - (Number(a[metric]) || 0))[0];
}

export function sumMetric(videos: any[], key: string): number {
  return videos.reduce((a, v) => a + (Number(v[key]) || 0), 0);
}

export function avgMetric(videos: any[], key: string): number {
  if (!videos.length) return 0;
  return sumMetric(videos, key) / videos.length;
}

export function pctChange(current: number, previous: number): number | null {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export function generateInsight(video: any, allVideos: any[], platform: string): string {
  if (!video || !allVideos.length) return "No data available.";
  const totalViews = sumMetric(allVideos, "views");
  const share = totalViews > 0 ? Math.round((Number(video.views) || 0) / totalViews * 100) : 0;
  const parts: string[] = [];
  if (share >= 30) parts.push(`drove ${share}% of all views this period`);
  if (Number(video.stayedToWatch) >= 80) parts.push(`${video.stayedToWatch}% stayed to watch (exceptional retention)`);
  if (Number(video.retention) >= 70) parts.push(`${video.retention}% retention rate`);
  if (Number(video.ctr) >= 5) parts.push(`strong ${Number(video.ctr).toFixed(1)}% click-through rate`);
  if (platform === "instagram" || platform === "tiktok") {
    const avgSaves = avgMetric(allVideos, "saves");
    if (avgSaves > 0 && Number(video.saves) > avgSaves * 2) parts.push(`saves were ${Math.round(Number(video.saves) / avgSaves)}x the average`);
    const avgShares = avgMetric(allVideos, "shares");
    if (avgShares > 0 && Number(video.shares) > avgShares * 2) parts.push(`shares were ${Math.round(Number(video.shares) / avgShares)}x the average`);
  }
  if (platform === "youtube" && Number(video.duration) <= 60) parts.push("short duration likely triggered the Shorts loop");
  if (parts.length === 0) parts.push("led this period by total views");
  return "This post " + parts.join(" and ") + ".";
}
