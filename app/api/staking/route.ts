import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({ status: "ok" });
}

export async function POST() {
    return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}


