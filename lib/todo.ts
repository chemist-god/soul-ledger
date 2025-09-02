import { redis } from "./redis";

export type TodoItem = {
    id: string;
    text: string;
    completed: boolean;
    createdAt: number;
    completedAt?: number | null;
    // Simple prioritization metadata (1-5)
    impact?: number;
    urgency?: number;
};

function getTodosKey(userId: string): string {
    return `todos:user:${userId}`;
}

// In-memory fallback for local dev without Redis
const memoryStore = new Map<string, TodoItem[]>();

export async function getTodos(userId: string): Promise<TodoItem[]> {
    if (!userId) return [];
    if (redis) {
        const list = await redis.get<TodoItem[]>(getTodosKey(userId));
        return Array.isArray(list) ? list : [];
    }
    return memoryStore.get(userId) ?? [];
}

export async function setTodos(userId: string, todos: TodoItem[]): Promise<void> {
    if (!userId) return;
    if (redis) {
        await redis.set(getTodosKey(userId), todos);
        return;
    }
    memoryStore.set(userId, todos);
}

export async function addTodo(userId: string, text: string): Promise<TodoItem> {
    const todos = await getTodos(userId);
    const newItem: TodoItem = {
        id: crypto.randomUUID(),
        text,
        completed: false,
        createdAt: Date.now(),
        impact: 3,
        urgency: 3,
    };
    const next = [...todos, newItem];
    await setTodos(userId, next);
    return newItem;
}

export async function toggleTodo(
    userId: string,
    id: string,
    completed: boolean,
): Promise<TodoItem | null> {
    const todos = await getTodos(userId);
    const next = todos.map((t) =>
        t.id === id
            ? { ...t, completed, completedAt: completed ? Date.now() : null }
            : t,
    );
    await setTodos(userId, next);
    return next.find((t) => t.id === id) ?? null;
}

export async function updateTodoMeta(
    userId: string,
    id: string,
    meta: { impact?: number; urgency?: number },
): Promise<TodoItem | null> {
    const todos = await getTodos(userId);
    const next = todos.map((t) => (t.id === id ? { ...t, ...meta } : t));
    await setTodos(userId, next);
    return next.find((t) => t.id === id) ?? null;
}

export async function deleteTodo(userId: string, id: string): Promise<void> {
    const todos = await getTodos(userId);
    await setTodos(
        userId,
        todos.filter((t) => t.id !== id),
    );
}

// Simple daily claim + streak tracking
type ClaimState = {
    lastClaimDate: string | null; // YYYY-MM-DD
    streak: number;
    points: number;
};

function getClaimKey(userId: string): string {
    return `claim:user:${userId}`;
}

const memoryClaim = new Map<string, ClaimState>();

export async function getClaimState(userId: string): Promise<ClaimState> {
    if (redis) {
        const state = await redis.get<ClaimState>(getClaimKey(userId));
        return state ?? { lastClaimDate: null, streak: 0, points: 0 };
    }
    return memoryClaim.get(userId) ?? { lastClaimDate: null, streak: 0, points: 0 };
}

export async function setClaimState(
    userId: string,
    state: ClaimState,
): Promise<void> {
    if (redis) {
        await redis.set(getClaimKey(userId), state);
        return;
    }
    memoryClaim.set(userId, state);
}

function todayYmd(): string {
    const d = new Date();
    return d.toISOString().slice(0, 10);
}

export async function canClaimToday(userId: string): Promise<boolean> {
    const state = await getClaimState(userId);
    return state.lastClaimDate !== todayYmd();
}

export async function claimDaily(userId: string): Promise<ClaimState> {
    const state = await getClaimState(userId);
    const today = todayYmd();
    if (state.lastClaimDate === today) return state;

    // Basic streak logic
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const ymdYesterday = yesterday.toISOString().slice(0, 10);
    const nextStreak = state.lastClaimDate === ymdYesterday ? state.streak + 1 : 1;

    const nextState: ClaimState = {
        lastClaimDate: today,
        streak: nextStreak,
        points: state.points + 10, // base daily points
    };
    await setClaimState(userId, nextState);
    return nextState;
}

export async function hasCompletedTaskToday(userId: string): Promise<boolean> {
    const todos = await getTodos(userId);
    const today = todayYmd();
    return todos.some((t) => !!t.completedAt && new Date(t.completedAt).toISOString().slice(0, 10) === today);
}

// Daily "One Big Thing" (focus) selection
type DailyFocus = {
    date: string; // YYYY-MM-DD
    todoId: string;
};

function getFocusKey(userId: string): string {
    return `focus:user:${userId}`;
}

const memoryFocus = new Map<string, DailyFocus>();

export async function getTodayFocus(userId: string): Promise<DailyFocus | null> {
    const today = todayYmd();
    const current = await getFocus(userId);
    if (current && current.date === today) return current;
    return null;
}

export async function getFocus(userId: string): Promise<DailyFocus | null> {
    if (redis) {
        return (await redis.get<DailyFocus>(getFocusKey(userId))) ?? null;
    }
    return memoryFocus.get(userId) ?? null;
}

export async function setTodayFocus(userId: string, todoId: string): Promise<DailyFocus> {
    const value: DailyFocus = { date: todayYmd(), todoId };
    if (redis) {
        await redis.set(getFocusKey(userId), value);
    } else {
        memoryFocus.set(userId, value);
    }
    return value;
}

function scoreTodo(todo: TodoItem): number {
    const impact = Math.min(Math.max(todo.impact ?? 3, 1), 5);
    const urgency = Math.min(Math.max(todo.urgency ?? 3, 1), 5);
    // 80/20-ish weighting: impact is heavier
    return impact * 2 + urgency * 1.5;
}

export async function suggestFocus(userId: string): Promise<DailyFocus | null> {
    const todos = await getTodos(userId);
    const candidates = todos.filter((t) => !t.completed);
    if (candidates.length === 0) return null;
    const best = candidates.sort((a, b) => scoreTodo(b) - scoreTodo(a))[0];
    return { date: todayYmd(), todoId: best.id };
}

