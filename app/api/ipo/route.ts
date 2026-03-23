import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function GET() {
  try {
    const db = getRequestContext().env.DB;

    // Selecting all columns from your ipo_tracker table
    const { results } = await db
      .prepare("SELECT * FROM ipo_tracker ORDER BY open_date DESC")
      .all();

    // Map your DB columns to the frontend object structure
    const formattedIpos = results.map((ipo: any) => ({
      id: ipo.id.toString(),
      company: ipo.company_name,
      status: ipo.status.toLowerCase(), // Ensure it matches "ongoing" | "upcoming" | "listed"
      priceRange: ipo.price_range,
      lotSize: ipo.lot_size,
      opens: ipo.open_date,
      closes: ipo.close_date,
      issue: `₹${ipo.issue_size_cr} Cr`,
      listing: ipo.listing_at,
      // Default UI fields if not in your table
      logo: ipo.company_name.substring(0, 2).toUpperCase(),
      accent: "#38bdf8",
      gradient: "from-sky-900 to-blue-950",
    }));

    return NextResponse.json(formattedIpos);
  } catch (error) {
    console.error("D1 Fetch Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch IPOs" },
      { status: 500 },
    );
  }
}
