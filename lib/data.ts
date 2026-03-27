export type Platform = "youtube" | "tiktok" | "instagram" | "facebook";
export type YTFormat = "shorts" | "longform";
export type DateRange = "7d" | "28d" | "90d";

// ─── YouTube ──────────────────────────────────────────────────────────────────

export interface YTShortVideo {
  id: string; title: string; thumb: string; publishedAt: string;
  views: number; duration: number; avgViewDuration: number;
  stayedToWatch: number; // %
  discovery: { suggested: number; hashtag: number; following: number; search: number; other: number };
  comments: number; likes: number; dislikes: number; subscribers: number;
}

export interface YTLongVideo {
  id: string; title: string; thumb: string; publishedAt: string;
  views: number; duration: number; avgViewDuration: number;
  avgPctViewed: number; ctr: number; seoScore: number;
  comments: number; likes: number; dislikes: number; subscribers: number;
}

// ─── TikTok ───────────────────────────────────────────────────────────────────

export interface TTVideo {
  id: string; title: string; thumb: string; publishedAt: string;
  views: number; duration: number; avgWatchTime: number;
  retention: number; // %
  shares: number; saves: number; comments: number; likes: number;
  totalEngagement: number;
}

// ─── Instagram ────────────────────────────────────────────────────────────────

export interface IGVideo {
  id: string; title: string; thumb: string; publishedAt: string; format: "reel" | "story" | "post";
  views: number; duration: number; avgWatchTime: number;
  viewRatePast3s: number; // %
  retention: number; // %
  shares: number; saves: number; reposts: number; comments: number; likes: number;
  totalEngagement: number;
}

// ─── Facebook ─────────────────────────────────────────────────────────────────

export interface FBPost {
  id: string; title: string; thumb: string; publishedAt: string;
  reach: number; impressions: number; likes: number;
  comments: number; shares: number; clicks: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

export const ytShorts: YTShortVideo[] = [
  { id:"s1", title:"Morning routine that changed my life", thumb:"🌅", publishedAt:"2026-03-20",
    views:842000, duration:58, avgViewDuration:42, stayedToWatch:78,
    discovery:{suggested:42,hashtag:28,following:18,search:8,other:4},
    comments:3200, likes:61000, dislikes:800, subscribers:4200 },
  { id:"s2", title:"3 foods you should never eat at night", thumb:"🍕", publishedAt:"2026-03-15",
    views:1240000, duration:45, avgViewDuration:38, stayedToWatch:84,
    discovery:{suggested:55,hashtag:20,following:12,search:9,other:4},
    comments:8100, likes:92000, dislikes:3100, subscribers:7800 },
  { id:"s3", title:"Gym hack that saves 30 minutes", thumb:"💪", publishedAt:"2026-03-10",
    views:390000, duration:52, avgViewDuration:29, stayedToWatch:56,
    discovery:{suggested:38,hashtag:31,following:16,search:10,other:5},
    comments:1400, likes:28000, dislikes:900, subscribers:1900 },
  { id:"s4", title:"The only morning stretch you need", thumb:"🧘", publishedAt:"2026-03-05",
    views:620000, duration:60, avgViewDuration:51, stayedToWatch:85,
    discovery:{suggested:48,hashtag:22,following:15,search:11,other:4},
    comments:2800, likes:49000, dislikes:600, subscribers:3400 },
];

export const ytLongform: YTLongVideo[] = [
  { id:"l1", title:"Full Day of Eating — What I actually eat to stay lean", thumb:"🥗", publishedAt:"2026-03-18",
    views:218000, duration:1842, avgViewDuration:712, avgPctViewed:38.6, ctr:6.2, seoScore:82,
    comments:2100, likes:14200, dislikes:420, subscribers:3100 },
  { id:"l2", title:"I tried every productivity method for 30 days", thumb:"📅", publishedAt:"2026-03-12",
    views:540000, duration:2280, avgViewDuration:1140, avgPctViewed:50.0, ctr:8.7, seoScore:91,
    comments:6800, likes:38000, dislikes:1100, subscribers:8400 },
  { id:"l3", title:"The truth about intermittent fasting (science-based)", thumb:"⏱", publishedAt:"2026-03-06",
    views:92000, duration:1560, avgViewDuration:468, avgPctViewed:30.0, ctr:4.1, seoScore:74,
    comments:980, likes:7200, dislikes:310, subscribers:1200 },
  { id:"l4", title:"How I built a 6-figure audience from zero", thumb:"📈", publishedAt:"2026-02-28",
    views:310000, duration:3120, avgViewDuration:1248, avgPctViewed:40.0, ctr:7.3, seoScore:88,
    comments:4100, likes:24000, dislikes:680, subscribers:5600 },
];

export const ttVideos: TTVideo[] = [
  { id:"t1", title:"Watch me cook a 5-min meal", thumb:"🍳", publishedAt:"2026-03-22",
    views:2100000, duration:62, avgWatchTime:18, retention:72,
    shares:28000, saves:41000, comments:4200, likes:182000, totalEngagement:255200 },
  { id:"t2", title:"POV: first day at the gym", thumb:"🏋", publishedAt:"2026-03-18",
    views:880000, duration:54, avgWatchTime:22, retention:88,
    shares:9100, saves:18000, comments:2800, likes:74000, totalEngagement:103900 },
  { id:"t3", title:"This is why you're always tired", thumb:"😴", publishedAt:"2026-03-14",
    views:3400000, duration:48, avgWatchTime:15, retention:60,
    shares:64000, saves:92000, comments:11000, likes:290000, totalEngagement:457000 },
  { id:"t4", title:"The habit that 10x'd my productivity", thumb:"🧠", publishedAt:"2026-03-10",
    views:1600000, duration:55, avgWatchTime:20, retention:78,
    shares:32000, saves:56000, comments:6400, likes:140000, totalEngagement:234400 },
];

export const igVideos: IGVideo[] = [
  { id:"ig1", title:"My morning skin routine 🌿", thumb:"✨", publishedAt:"2026-03-21", format:"reel",
    views:480000, duration:38, avgWatchTime:14, viewRatePast3s:68, retention:64,
    shares:3200, saves:8900, reposts:1100, comments:1840, likes:42000, totalEngagement:57040 },
  { id:"ig2", title:"How I edit my photos in 60 seconds", thumb:"📸", publishedAt:"2026-03-17", format:"reel",
    views:920000, duration:55, avgWatchTime:28, viewRatePast3s:82, retention:76,
    shares:7800, saves:22000, reposts:2400, comments:3200, likes:88000, totalEngagement:123400 },
  { id:"ig3", title:"Behind the scenes — brand shoot day", thumb:"🎬", publishedAt:"2026-03-13", format:"reel",
    views:210000, duration:42, avgWatchTime:19, viewRatePast3s:55, retention:52,
    shares:1400, saves:4200, reposts:610, comments:980, likes:18000, totalEngagement:25190 },
  { id:"ig4", title:"Outfit of the week ☀️", thumb:"👗", publishedAt:"2026-03-09", format:"reel",
    views:340000, duration:30, avgWatchTime:18, viewRatePast3s:74, retention:70,
    shares:2100, saves:9400, reposts:880, comments:1600, likes:31000, totalEngagement:44980 },
];

export const fbPosts: FBPost[] = [
  { id:"f1", title:"Our biggest giveaway ever — join now!", thumb:"🎁", publishedAt:"2026-03-20",
    reach:142000, impressions:198000, likes:8200, comments:3100, shares:4400, clicks:9800 },
  { id:"f2", title:"Behind the scenes of our new product launch", thumb:"🎬", publishedAt:"2026-03-15",
    reach:61000, impressions:89000, likes:2900, comments:980, shares:1200, clicks:3400 },
  { id:"f3", title:"5 questions you asked us — answered", thumb:"❓", publishedAt:"2026-03-10",
    reach:38000, impressions:54000, likes:1400, comments:2200, shares:640, clicks:1900 },
  { id:"f4", title:"New feature drop — here's everything you need to know", thumb:"🚀", publishedAt:"2026-03-05",
    reach:94000, impressions:131000, likes:5600, comments:1800, shares:2900, clicks:6100 },
];

// ─── Real API fetch stubs (replace mock data with these in production) ────────

// GET /api/youtube?channelId=UC...&startDate=2026-02-28&endDate=2026-03-26
export async function fetchYTAnalytics(channelId: string, startDate: string, endDate: string) {
  // 1. Get video list
  const videosRes = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=50&order=date&type=video&publishedAfter=${startDate}T00:00:00Z&publishedBefore=${endDate}T23:59:59Z&key=${process.env.YOUTUBE_API_KEY}`
  );
  const { items } = await videosRes.json();

  // 2. Get stats for each video
  const ids = items.map((v: any) => v.id.videoId).join(",");
  const statsRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${ids}&key=${process.env.YOUTUBE_API_KEY}`
  );
  const { items: statsItems } = await statsRes.json();

  // 3. For each video, get analytics (requires OAuth)
  // Shorts detection: duration <= 60s AND aspect ratio portrait
  return statsItems.map((v: any) => ({
    id: v.id,
    views: parseInt(v.statistics.viewCount),
    likes: parseInt(v.statistics.likeCount),
    comments: parseInt(v.statistics.commentCount),
    duration: parseISO8601Duration(v.contentDetails.duration), // seconds
    isShort: parseISO8601Duration(v.contentDetails.duration) <= 60,
  }));
}

// GET /api/tiktok — uses TikTok Research API
export async function fetchTikTokAnalytics(startDate: string, endDate: string) {
  const res = await fetch("https://open.tiktokapis.com/v2/research/video/query/", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.TIKTOK_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: { and: [{ operation: "IN", field_name: "video_type", field_values: ["video"] }] },
      start_date: startDate, end_date: endDate,
      fields: ["id","title","view_count","like_count","comment_count","share_count","play_count","duration"],
      max_count: 20,
    }),
  });
  return res.json();
  // Note: avgWatchTime & retention require TikTok Business API (creator account)
}

// GET /api/instagram — uses Instagram Graph API
export async function fetchIGInsights(accountId: string, startDate: string, endDate: string) {
  // 1. Get recent media
  const mediaRes = await fetch(
    `https://graph.instagram.com/${accountId}/media?fields=id,caption,media_type,timestamp,like_count,comments_count&since=${startDate}&until=${endDate}&access_token=${process.env.INSTAGRAM_ACCESS_TOKEN}`
  );
  const { data: media } = await mediaRes.json();

  // 2. Get insights per media item
  const insights = await Promise.all(media.map(async (m: any) => {
    const insRes = await fetch(
      `https://graph.instagram.com/${m.id}/insights?metric=impressions,reach,saved,shares,plays,ig_reels_avg_watch_time,ig_reels_video_view_total_time&access_token=${process.env.INSTAGRAM_ACCESS_TOKEN}`
    );
    return insRes.json();
  }));
  return { media, insights };
}

// GET /api/facebook — uses Meta Graph API
export async function fetchFBInsights(pageId: string, startDate: string, endDate: string) {
  const res = await fetch(
    `https://graph.facebook.com/${pageId}/insights?metric=page_impressions,page_reach,page_post_engagements&period=day&since=${startDate}&until=${endDate}&access_token=${process.env.FACEBOOK_PAGE_TOKEN}`
  );
  return res.json();
}

function parseISO8601Duration(dur: string): number {
  const match = dur.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (parseInt(match[1] || "0") * 3600) + (parseInt(match[2] || "0") * 60) + parseInt(match[3] || "0");
}