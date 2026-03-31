import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/csv?platform=youtube-shorts
export async function GET(req: NextRequest) {
  const platform = req.nextUrl.searchParams.get("platform");

  if (platform) {
    // Get one platform
    const { data, error } = await supabase
      .from("csv_data")
      .select("rows")
      .eq("platform", platform)
      .single();

    if (error || !data) return NextResponse.json({ rows: [] });
    return NextResponse.json({ rows: data.rows });
  } else {
    // Get all platforms
    const { data, error } = await supabase
      .from("csv_data")
      .select("platform, rows");

    if (error || !data) return NextResponse.json({});
    const result: Record<string, any[]> = {};
    data.forEach(d => { result[d.platform] = d.rows; });
    return NextResponse.json(result);
  }
}

// POST /api/csv
// Body: { platform: string, rows: any[], merge?: boolean }
export async function POST(req: NextRequest) {
  const { platform, rows, merge } = await req.json();

  if (!platform || !rows) {
    return NextResponse.json({ error: "Missing platform or rows" }, { status: 400 });
  }

  let finalRows = rows;

  // For TikTok, merge with existing data and deduplicate by title + publishedAt
  if (merge) {
    const { data: existing } = await supabase
      .from("csv_data")
      .select("rows")
      .eq("platform", platform)
      .single();

    if (existing?.rows?.length) {
      const existingRows: any[] = existing.rows;
      const existingKeys = new Set(
        existingRows.map((r: any) => `${r.title}__${r.publishedAt}`)
      );
      const newRows = rows.filter(
        (r: any) => !existingKeys.has(`${r.title}__${r.publishedAt}`)
      );
      finalRows = [...existingRows, ...newRows];
    }
  }

  const { error } = await supabase
    .from("csv_data")
    .upsert({ platform, rows: finalRows, updated_at: new Date().toISOString() });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, count: finalRows.length });
}

// DELETE /api/csv?platform=youtube-shorts
export async function DELETE(req: NextRequest) {
  const platform = req.nextUrl.searchParams.get("platform");
  if (!platform) return NextResponse.json({ error: "Missing platform" }, { status: 400 });

  const { error } = await supabase
    .from("csv_data")
    .delete()
    .eq("platform", platform);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
