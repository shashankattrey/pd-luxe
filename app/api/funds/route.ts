import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const sortBy = searchParams.get("sortBy") || "threeYear";
    const limit = parseInt(searchParams.get("limit") || "10");

    // 1. Map Frontend keys to Database category keywords
    // These keywords are derived from your MutualFund.json analysis
    const categoryMap: Record<string, string> = {
      smallCap: "Small Cap",
      midCap: "Mid Cap",
      largeCap: "Large Cap",
      flexiCap: "Flexi Cap",
      multiCap: "Multi Cap",
      focused: "Focused",
      value: "Value Fund",
      elss: "ELSS", // This will match both "ELSS" and "Equity Scheme - ELSS"
      index: "Index Funds",
      liquid: "Liquid Fund",
      hybrid: "Hybrid Fund",
    };

    const dbSearchTerm = category ? categoryMap[category] || category : null;

    // 2. Fetch data from Prisma
    const funds = await prisma.mutualFund.findMany({
      where: dbSearchTerm
        ? {
            category: {
              contains: dbSearchTerm,
              mode: "insensitive",
            },
          }
        : {},
      // We take a larger sample to calculate returns before sorting/slicing
      take: 200,
    });

    // 3. Calculation Helpers
    const calcAbs = (curr: number, old: number | null) =>
      old ? parseFloat((((curr - old) / old) * 100).toFixed(2)) : null;

    const calcCAGR = (curr: number, old: number | null, yrs: number) =>
      old && curr / old > 0
        ? parseFloat(((Math.pow(curr / old, 1 / yrs) - 1) * 100).toFixed(2))
        : null;

    // 4. Map and Calculate Returns
    const calculatedFunds = funds.map((fund) => {
      const returns = {
        oneYear: calcAbs(fund.nav, fund.nav1y),
        threeYear: calcCAGR(fund.nav, fund.nav3y, 3),
        fiveYear: calcCAGR(fund.nav, fund.nav5y, 5),
      };

      // Extract a clean display name (optional but recommended)
      // e.g., "Equity Scheme - Small Cap Fund" -> "Small Cap"
      const cleanCategory =
        fund.category.split("-").pop()?.trim() || fund.category;

      return {
        ...fund,
        displayCategory: cleanCategory,
        returns,
        // Use -999 for nulls so they sink to the bottom of a descending sort
        sortValue: returns[sortBy as keyof typeof returns] ?? -999,
      };
    });

    // 5. Sort and Slice
    const sortedFunds = calculatedFunds
      .sort((a, b) => (b.sortValue as number) - (a.sortValue as number))
      .slice(0, limit);

    return NextResponse.json(sortedFunds);
  } catch (error: any) {
    console.error("❌ API Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
