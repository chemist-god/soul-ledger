import { NextResponse } from "next/server";
import { canClaimToday, claimDaily, getClaimState, hasCompletedTaskToday } from "@/lib/todo";

function getUserId(headers: Headers): string {
    return headers.get("x-user-id") ?? "demo-user";
}

export async function GET(request: Request) {
    const userId = getUserId(request.headers);
    const [state, canClaim, hasDone] = await Promise.all([
        getClaimState(userId),
        canClaimToday(userId),
        hasCompletedTaskToday(userId),
    ]);
    return NextResponse.json({ state, canClaim, hasCompletedTaskToday: hasDone });
}

export async function POST(request: Request) {
    const userId = getUserId(request.headers);
    const hasDone = await hasCompletedTaskToday(userId);
    if (!hasDone) {
        return NextResponse.json(
            { error: "Complete at least one task today to claim" },
            { status: 400 },
        );
    }
    const canClaim = await canClaimToday(userId);
    if (!canClaim) {
        const state = await getClaimState(userId);
        return NextResponse.json({ state, error: "Already claimed" }, { status: 400 });
    }
    const state = await claimDaily(userId);
    return NextResponse.json({ state });
}


