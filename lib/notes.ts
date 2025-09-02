import { redis } from "./redis";

export type NoteCategory = "reflection" | "quote" | "meeting" | "song" | "bible" | "general";

export type NoteItem = {
    id: string;
    title: string;
    content: string;
    category: NoteCategory;
    tags?: string[];
    pinned?: boolean;
    createdAt: number;
    updatedAt: number;
};

function getNotesKey(userId: string): string {
    return `notes:user:${userId}`;
}

const memory = new Map<string, NoteItem[]>();

export async function getNotes(userId: string): Promise<NoteItem[]> {
    if (!userId) return [];
    if (redis) {
        const list = await redis.get<NoteItem[]>(getNotesKey(userId));
        return Array.isArray(list) ? list : [];
    }
    return memory.get(userId) ?? [];
}

async function setNotes(userId: string, notes: NoteItem[]): Promise<void> {
    if (!userId) return;
    if (redis) {
        await redis.set(getNotesKey(userId), notes);
        return;
    }
    memory.set(userId, notes);
}

export async function addNote(
    userId: string,
    input: { title: string; content: string; category?: NoteCategory; tags?: string[] },
): Promise<NoteItem> {
    const notes = await getNotes(userId);
    const now = Date.now();
    const item: NoteItem = {
        id: crypto.randomUUID(),
        title: input.title,
        content: input.content,
        category: input.category ?? "general",
        tags: input.tags ?? [],
        pinned: false,
        createdAt: now,
        updatedAt: now,
    };
    const next = [item, ...notes];
    await setNotes(userId, next);
    return item;
}

export async function updateNote(
    userId: string,
    id: string,
    updates: Partial<Pick<NoteItem, "title" | "content" | "category" | "tags" | "pinned">>,
): Promise<NoteItem | null> {
    const notes = await getNotes(userId);
    const next = notes.map((n) => (n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n));
    await setNotes(userId, next);
    return next.find((n) => n.id === id) ?? null;
}

export async function deleteNote(userId: string, id: string): Promise<void> {
    const notes = await getNotes(userId);
    await setNotes(userId, notes.filter((n) => n.id !== id));
}


