// app/api/youtube/route.ts
import { NextRequest, NextResponse } from "next/server";

function parseISO8601Duration(dur: string): number {
  const m = dur.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1]||"0")*3600)+(parseInt(m[2]||"0")*60)+parseInt(m[3]||"0");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const channelId = searchParams.get("channelId") || process.env.YOUTUBE_CHANNEL_ID;
  const startDate = searchParams.get("startDate") || "";
  const endDate   = searchParams.get("endDate")   || "";
  const apiKey    = process.env.YOUTUBE_API_KEY;

  if (!channelId || !apiKey)
    return NextResponse.json({ error: "Missing YOUTUBE_CHANNEL_ID or YOUTUBE_API_KEY" }, { status: 500 });

  try {
    // 1. Fetch video list
    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=50&order=date&type=video${startDate ? `&publishedAfter=${startDate}T00:00:00Z` : ""}${endDate ? `&publishedBefore=${endDate}T23:59:59Z` : ""}&key=${apiKey}`
    );
    const { items } = await searchRes.json();
    if (!items?.length) return NextResponse.json({ shorts: [], longform: [] });

    // 2. Get stats + duration for all videos
    const ids = items.map((v: any) => v.id.videoId).join(",");
    const videoRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${ids}&key=${apiKey}`
    );
    const { items: videos } = await videoRes.json();

    const result = videos.map((v: any) => {
      const dur = parseISO8601Duration(v.contentDetails.duration);
      return {
        id:          v.id,
        title:       v.snippet.title,
        publishedAt: v.snippet.publishedAt.slice(0, 10),
        thumb:       v.snippet.thumbnails?.medium?.url || "",
        views:       parseInt(v.statistics.viewCount   || "0"),
        likes:       parseInt(v.statistics.likeCount   || "0"),
        dislikes:    parseInt(v.statistics.dislikeCount|| "0"),
        comments:    parseInt(v.statistics.commentCount|| "0"),
        duration:    dur,
        isShort:     dur <= 60,
        // avgViewDuration, ctr, seoScore, subscribers, discovery, stayedToWatch:
        // these require the YouTube Analytics API (OAuth) — see below
      };
    });

    // 3. YouTube Analytics API (requires OAuth access token)
    // For each video, call:
    // GET https://youtubeanalytics.googleapis.com/v2/reports
    //   ?ids=channel==MINE
    //   &startDate=2026-02-26
    //   &endDate=2026-03-26
    //   &metrics=views,averageViewDuration,averageViewPercentage,annotationClickThroughRate,subscribersGained
    //   &dimensions=video
    //   &filters=video=={videoId}
    //   &access_token={OAUTH_TOKEN}
    //
    // For discovery sources (trafficSourceType):
    //   &dimensions=video,insightTrafficSourceType
    //   &metrics=views

    return NextResponse.json({
      shorts:   result.filter((v: any) => v.isShort),
      longform: result.filter((v: any) => !v.isShort),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
