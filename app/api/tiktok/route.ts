// app/api/tiktok/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate") || "";
  const endDate   = searchParams.get("endDate")   || "";

  // TikTok Business API — requires a Business/Creator account with analytics access
  // Docs: https://business-api.tiktok.com/portal/docs

  const res = await fetch("https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/", {
    method: "POST",
    headers: {
      "Access-Token": process.env.TIKTOK_ACCESS_TOKEN!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      advertiser_id: process.env.TIKTOK_ADVERTISER_ID,
      report_type: "BASIC",
      dimensions: ["video_id"],
      metrics: [
        "video_views",       // Views
        "average_video_play_per_user", // Avg watch time (seconds)
        "video_watched_2s",  // Proxy for retention
        "shares",            // Shares
        "comments",          // Comments
        "likes",             // Likes
        "follows",           // Subscribers gained
        // Note: "saves" requires Content Analytics API
      ],
      start_date: startDate,
      end_date:   endDate,
      page_size:  20,
    }),
  });

  const data = await res.json();

  // Map to our internal format
  const videos = (data?.data?.list || []).map((item: any, i: number) => ({
    id:             item.dimensions.video_id,
    title:          item.dimensions.video_name || `Video ${i+1}`,
    publishedAt:    item.dimensions.stat_time_day || "",
    thumb:          "🎵",
    views:          parseInt(item.metrics.video_views || "0"),
    avgWatchTime:   parseFloat(item.metrics.average_video_play_per_user || "0"),
    retention:      parseFloat(item.metrics.video_completion_rate || "0") * 100,
    shares:         parseInt(item.metrics.shares || "0"),
    saves:          0, // requires separate endpoint
    comments:       parseInt(item.metrics.comments || "0"),
    likes:          parseInt(item.metrics.likes || "0"),
    totalEngagement: 0, // compute after
    duration:       0,  // from video detail endpoint
  })).map((v: any) => ({
    ...v,
    totalEngagement: v.likes + v.comments + v.shares + v.saves,
  }));

  return NextResponse.json({ videos });
}
