// app/api/instagram/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const since = searchParams.get("startDate") || "";
  const until = searchParams.get("endDate")   || "";
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID!;
  const token     = process.env.INSTAGRAM_ACCESS_TOKEN!;

  if (!accountId || !token)
    return NextResponse.json({ error: "Missing Instagram env vars" }, { status: 500 });

  try {
    // 1. Get media list (Reels)
    const mediaRes = await fetch(
      `https://graph.instagram.com/${accountId}/media?fields=id,caption,media_type,timestamp,like_count,comments_count&media_type=REELS${since ? `&since=${since}` : ""}${until ? `&until=${until}` : ""}&limit=20&access_token=${token}`
    );
    const { data: media } = await mediaRes.json();
    if (!media?.length) return NextResponse.json({ videos: [] });

    // 2. For each reel, fetch insights
    const videos = await Promise.all(media.map(async (m: any, i: number) => {
      const insRes = await fetch(
        `https://graph.instagram.com/${m.id}/insights?metric=impressions,reach,saved,shares,plays,ig_reels_avg_watch_time,ig_reels_video_view_total_time,video_view_total_time,clips_replays_count,ig_reels_aggregated_all_plays_count&access_token=${token}`
      );
      const { data: ins } = await insRes.json();

      const getMetric = (name: string) => ins?.find((x: any) => x.name === name)?.values?.[0]?.value || 0;

      const plays      = getMetric("plays") || getMetric("ig_reels_aggregated_all_plays_count");
      const saves      = getMetric("saved");
      const shares     = getMetric("shares");
      const reposts    = getMetric("clips_replays_count");
      const avgWatch   = Math.round((getMetric("ig_reels_avg_watch_time") || 0) / 1000); // ms → s
      const likes      = m.like_count;
      const comments   = m.comments_count;
      const totalEng   = likes + comments + shares + saves + reposts;

      return {
        id:             m.id,
        title:          m.caption?.slice(0, 60) || `Reel ${i + 1}`,
        publishedAt:    m.timestamp?.slice(0, 10) || "",
        thumb:          "📸",
        format:         "reel",
        views:          plays,
        duration:       0,          // not available via Graph API directly
        avgWatchTime:   avgWatch,
        viewRatePast3s: 0,          // not available via Graph API
        retention:      0,          // compute from avgWatch/duration if known
        shares,
        saves,
        reposts,
        comments,
        likes,
        totalEngagement: totalEng,
      };
    }));

    return NextResponse.json({ videos });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// Note on unavailable metrics via Graph API:
// - "View rate past 3s" → only available in Instagram Insights UI, not the API
// - "Duration (seconds)" → available for your own content via media endpoint (video_duration field)
// - "Retention %" → derive: avgWatchTime / duration * 100
// - These can be added manually via CSV import (use the Import CSV button in the dashboard)
