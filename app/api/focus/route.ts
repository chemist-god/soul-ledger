import { NextResponse } from "next/server";
import { getTodayFocus, setTodayFocus, getTodos } from "@/lib/todo";

function getUserId(headers: Headers): string {
    return headers.get("x-user-id") ?? "demo-user";
}

export async function GET(request: Request) {
    const userId = getUserId(request.headers);
    const [focus, todos] = await Promise.all([getTodayFocus(userId), getTodos(userId)]);
    const focused = focus ? todos.find((t) => t.id === focus.todoId) ?? null : null;
    return NextResponse.json({ focus, focusedTodo: focused });
}

export async function POST(request: Request) {
    const userId = getUserId(request.headers);
    const body = await request.json();
    const { todoId } = body ?? {};
    if (!todoId) return NextResponse.json({ error: "Missing todoId" }, { status: 400 });
    const todos = await getTodos(userId);
    if (!todos.some((t) => t.id === todoId)) {
        return NextResponse.json({ error: "Invalid todoId" }, { status: 400 });
    }
    const focus = await setTodayFocus(userId, todoId);
    return NextResponse.json({ focus });
}


