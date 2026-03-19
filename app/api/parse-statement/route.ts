import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { message: "Parser currently offline for maintenance" },
    { status: 503 },
  );
}
