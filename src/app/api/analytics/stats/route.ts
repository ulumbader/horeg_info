import { NextResponse } from "next/server";
import { getAnalyticsStats } from "@/server/dal/analytics";
import { getCurrentSession } from "@/server/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    // Admin-only endpoint
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await getAnalyticsStats();

    return NextResponse.json(stats, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
