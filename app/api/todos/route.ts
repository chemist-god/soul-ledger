import { NextResponse } from "next/server";
import { addTodo, deleteTodo, getTodos, toggleTodo, updateTodoMeta } from "@/lib/todo";

function getUserId(headers: Headers): string {
    // For MVP, use wallet address or fid passed as header; fallback to demo id
    return headers.get("x-user-id") ?? "demo-user";
}

export async function GET(request: Request) {
    const userId = getUserId(request.headers);
    const todos = await getTodos(userId);
    return NextResponse.json({ todos });
}

export async function POST(request: Request) {
    const userId = getUserId(request.headers);
    const body = await request.json();
    const { text } = body ?? {};
    if (!text || typeof text !== "string") {
        return NextResponse.json({ error: "Invalid text" }, { status: 400 });
    }
    const todo = await addTodo(userId, text.trim());
    return NextResponse.json({ todo });
}

export async function PUT(request: Request) {
    const userId = getUserId(request.headers);
    const body = await request.json();
    const { id, completed, impact, urgency } = body ?? {};
    if (!id) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    let updated = null;
    if (typeof completed === "boolean") {
        updated = await toggleTodo(userId, id, completed);
    }
    if (typeof impact === "number" || typeof urgency === "number") {
        updated = await updateTodoMeta(userId, id, { impact, urgency });
    }
    return NextResponse.json({ todo: updated });
}

export async function DELETE(request: Request) {
    const userId = getUserId(request.headers);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await deleteTodo(userId, id);
    return NextResponse.json({ ok: true });
}


