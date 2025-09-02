import { NextResponse } from "next/server";
import { addNote, deleteNote, getNotes, updateNote } from "@/lib/notes";

function getUserId(headers: Headers): string {
    return headers.get("x-user-id") ?? "demo-user";
}

export async function GET(request: Request) {
    const userId = getUserId(request.headers);
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").toLowerCase();
    const notes = await getNotes(userId);
    const filtered = q
        ? notes.filter((n) =>
            n.title.toLowerCase().includes(q) ||
            n.content.toLowerCase().includes(q) ||
            (n.tags || []).some((t) => t.toLowerCase().includes(q)),
        )
        : notes;
    return NextResponse.json({ notes: filtered });
}

export async function POST(request: Request) {
    const userId = getUserId(request.headers);
    const body = await request.json();
    const { title, content, category, tags } = body ?? {};
    if (!title || !content) {
        return NextResponse.json({ error: "Missing title or content" }, { status: 400 });
    }
    const note = await addNote(userId, { title, content, category, tags });
    return NextResponse.json({ note });
}

export async function PUT(request: Request) {
    const userId = getUserId(request.headers);
    const body = await request.json();
    const { id, ...updates } = body ?? {};
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const note = await updateNote(userId, id, updates);
    return NextResponse.json({ note });
}

export async function DELETE(request: Request) {
    const userId = getUserId(request.headers);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await deleteNote(userId, id);
    return NextResponse.json({ ok: true });
}


