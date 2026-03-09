// app/api/funds/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://api.mfapi.in/mf", {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch funds" },
      { status: 500 },
    );
  }
}
