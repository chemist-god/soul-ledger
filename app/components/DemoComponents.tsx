"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import {
  Transaction,
  TransactionButton,
  TransactionToast,
  TransactionToastAction,
  TransactionToastIcon,
  TransactionToastLabel,
  TransactionError,
  TransactionResponse,
  TransactionStatusAction,
  TransactionStatusLabel,
  TransactionStatus,
} from "@coinbase/onchainkit/transaction";
import { useNotification } from "@coinbase/onchainkit/minikit";
import { createChallenge as createStakingChallenge, claimUnlocked as claimStake, finalizeChallenge, getChallengeData, formatUSDC } from "@/lib/stake";

type ButtonProps = {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  icon?: ReactNode;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  disabled = false,
  type = "button",
  icon,
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0052FF] disabled:opacity-50 disabled:pointer-events-none";

  const variantClasses = {
    primary:
      "bg-[var(--app-accent)] hover:bg-[var(--app-accent-hover)] text-[var(--app-background)]",
    secondary:
      "bg-[var(--app-gray)] hover:bg-[var(--app-gray-dark)] text-[var(--app-foreground)]",
    outline:
      "border border-[var(--app-accent)] hover:bg-[var(--app-accent-light)] text-[var(--app-accent)]",
    ghost:
      "hover:bg-[var(--app-accent-light)] text-[var(--app-foreground-muted)]",
  };

  const sizeClasses = {
    sm: "text-xs px-2.5 py-1.5 rounded-md",
    md: "text-sm px-4 py-2 rounded-lg",
    lg: "text-base px-6 py-3 rounded-lg",
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="flex items-center mr-2">{icon}</span>}
      {children}
    </button>
  );
}

type CardProps = {
  title?: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

function Card({
  title,
  children,
  className = "",
  onClick,
}: CardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={`bg-[var(--app-card-bg)] glass-card rounded-xl border border-[var(--app-card-border)] overflow-hidden transition-all hover:shadow-xl hover:-translate-y-[1px] ${className} ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? "button" : undefined}
    >
      {title && (
        <div className="px-5 py-3 border-b border-[var(--app-card-border)]">
          <h3 className="text-lg font-medium text-[var(--app-foreground)]">
            {title}
          </h3>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

type FeaturesProps = {
  setActiveTab: (tab: string) => void;
};

export function Features({ setActiveTab }: FeaturesProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <Card title="Key Features">
        <ul className="space-y-3 mb-4">
          <li className="flex items-start">
            <Icon name="check" className="text-[var(--app-accent)] mt-1 mr-2" />
            <span className="text-[var(--app-foreground-muted)]">
              Minimalistic and beautiful UI design
            </span>
          </li>
          <li className="flex items-start">
            <Icon name="check" className="text-[var(--app-accent)] mt-1 mr-2" />
            <span className="text-[var(--app-foreground-muted)]">
              Responsive layout for all devices
            </span>
          </li>
          <li className="flex items-start">
            <Icon name="check" className="text-[var(--app-accent)] mt-1 mr-2" />
            <span className="text-[var(--app-foreground-muted)]">
              Dark mode support
            </span>
          </li>
          <li className="flex items-start">
            <Icon name="check" className="text-[var(--app-accent)] mt-1 mr-2" />
            <span className="text-[var(--app-foreground-muted)]">
              OnchainKit integration
            </span>
          </li>
        </ul>
        <Button variant="outline" onClick={() => setActiveTab("home")}>
          Back to Home
        </Button>
      </Card>
    </div>
  );
}

type HomeProps = {
  setActiveTab: (tab: string) => void;
};

export function Home({ setActiveTab }: HomeProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <DashboardCard onExplore={() => setActiveTab("features")} />

      <TodoList />

      <NotesCard />

      <TransactionCard />
    </div>
  );
}

type IconProps = {
  name: "heart" | "star" | "check" | "plus" | "arrow-right";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Icon({ name, size = "md", className = "" }: IconProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const icons = {
    heart: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Heart</title>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    star: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Star</title>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    check: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Check</title>
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    plus: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Plus</title>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
    "arrow-right": (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Arrow Right</title>
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    ),
  };

  return (
    <span className={`inline-block ${sizeClasses[size]} ${className}`}>
      {icons[name]}
    </span>
  );
}

type Todo = {
  id: string;
  text: string;
  completed: boolean;
}

function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");

  const refresh = useCallback(async () => {
    const res = await fetch("/api/todos", { headers: { "x-user-id": "demo-user" } });
    const json = await res.json();
    setTodos(json.todos ?? []);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addTodo = async () => {
    if (newTodo.trim() === "") return;
    await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": "demo-user" },
      body: JSON.stringify({ text: newTodo }),
    });
    setNewTodo("");
    refresh();
  };

  const toggleTodo = async (id: string) => {
    const item = todos.find((t) => t.id === id);
    if (!item) return;
    await fetch("/api/todos", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-user-id": "demo-user" },
      body: JSON.stringify({ id: item.id, completed: !item.completed }),
    });
    refresh();
  };

  const deleteTodo = async (id: string) => {
    await fetch(`/api/todos?id=${id}`, { method: "DELETE", headers: { "x-user-id": "demo-user" } });
    refresh();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addTodo();
    }
  };

  return (
    <Card title="Get started">
      <div className="space-y-4">
        <ClaimCard />
        <FocusCard />
        <StakeCard />
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a new task..."
            className="flex-1 px-3 py-2 bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)] placeholder-[var(--app-foreground-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--app-accent)]"
          />
          <Button
            variant="primary"
            size="md"
            onClick={addTodo}
            icon={<Icon name="plus" size="sm" />}
          >
            Add
          </Button>
        </div>

        <ul className="space-y-2">
          {todos.map((todo) => (
            <li key={todo.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  id={`todo-${todo.id}`}
                  onClick={() => toggleTodo(todo.id)}
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${todo.completed
                    ? "bg-[var(--app-accent)] border-[var(--app-accent)]"
                    : "border-[var(--app-foreground-muted)] bg-transparent"
                    }`}
                >
                  {todo.completed && (
                    <Icon
                      name="check"
                      size="sm"
                      className="text-[var(--app-background)]"
                    />
                  )}
                </button>
                <label
                  htmlFor={`todo-${todo.id}`}
                  className={`text-[var(--app-foreground-muted)] cursor-pointer ${todo.completed ? "line-through opacity-70" : ""}`}
                >
                  {todo.text}
                </label>
              </div>
              <button
                type="button"
                onClick={() => deleteTodo(todo.id)}
                className="text-[var(--app-foreground-muted)] hover:text-[var(--app-foreground)]"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}


function TransactionCard() {
  const { address } = useAccount();

  // Example transaction call - sending 0 ETH to self
  const calls = useMemo(() => address
    ? [
      {
        to: address,
        data: "0x" as `0x${string}`,
        value: BigInt(0),
      },
    ]
    : [], [address]);

  const sendNotification = useNotification();

  const handleSuccess = useCallback(async (response: TransactionResponse) => {
    const transactionHash = response.transactionReceipts[0].transactionHash;

    console.log(`Transaction successful: ${transactionHash}`);

    await sendNotification({
      title: "Congratulations!",
      body: `You sent your a transaction, ${transactionHash}!`,
    });
  }, [sendNotification]);

  return (
    <Card title="Make Your First Transaction">
      <div className="space-y-4">
        <p className="text-[var(--app-foreground-muted)] mb-4">
          Experience the power of seamless sponsored transactions with{" "}
          <a
            href="https://onchainkit.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#0052FF] hover:underline"
          >
            OnchainKit
          </a>
          .
        </p>

        <div className="flex flex-col items-center">
          {address ? (
            <Transaction
              calls={calls}
              onSuccess={handleSuccess}
              onError={(error: TransactionError) =>
                console.error("Transaction failed:", error)
              }
            >
              <TransactionButton className="text-white text-md" />
              <TransactionStatus>
                <TransactionStatusAction />
                <TransactionStatusLabel />
              </TransactionStatus>
              <TransactionToast className="mb-4">
                <TransactionToastIcon />
                <TransactionToastLabel />
                <TransactionToastAction />
              </TransactionToast>
            </Transaction>
          ) : (
            <p className="text-yellow-400 text-sm text-center mt-2">
              Connect your wallet to send a transaction
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

function ClaimCard() {
  const [loading, setLoading] = useState(false);
  const [canClaim, setCanClaim] = useState(false);
  const [streak, setStreak] = useState(0);
  const [points, setPoints] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/claim", { headers: { "x-user-id": "demo-user" } });
    const json = await res.json();
    setCanClaim(Boolean(json.canClaim && json.hasCompletedTaskToday));
    setStreak(json.state?.streak ?? 0);
    setPoints(json.state?.points ?? 0);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleClaim = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/claim", { method: "POST", headers: { "x-user-id": "demo-user" } });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Claim failed");
      }
    } finally {
      setLoading(false);
      refresh();
    }
  }, [refresh]);

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg border-[var(--app-card-border)]">
      <div className="text-sm text-[var(--app-foreground-muted)]">
        <div>Daily streak: <span className="text-[var(--app-foreground)] font-medium">{streak}</span></div>
        <div>Total points: <span className="text-[var(--app-foreground)] font-medium">{points}</span></div>
        {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
      </div>
      <Button disabled={!canClaim || loading} onClick={handleClaim}>
        {loading ? "Claiming..." : canClaim ? "Claim Daily" : "Claim Locked"}
      </Button>
    </div>
  );
}

function FocusCard() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [suggestionId, setSuggestionId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [todoRes, focusRes] = await Promise.all([
      fetch("/api/todos", { headers: { "x-user-id": "demo-user" } }),
      fetch("/api/focus", { headers: { "x-user-id": "demo-user" } }),
    ]);
    const todoJson = await todoRes.json();
    const focusJson = await focusRes.json();
    setTodos(todoJson.todos ?? []);
    setFocusId(focusJson.focus?.todoId ?? null);
    setSuggestionId(focusJson.suggestion?.todoId ?? null);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const setFocus = useCallback(async (id: string) => {
    await fetch("/api/focus", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": "demo-user" },
      body: JSON.stringify({ todoId: id }),
    });
    refresh();
  }, [refresh]);

  if (todos.length === 0) return null;

  return (
    <div className="p-3 border rounded-lg border-[var(--app-card-border)]">
      <div className="text-sm font-medium mb-2">One Big Thing (today)</div>
      {suggestionId && (
        <div className="mb-3 text-xs text-[var(--app-foreground-muted)]">
          Suggested focus: <span className="font-medium text-[var(--app-foreground)]">{todos.find((t) => t.id === suggestionId)?.text}</span>
          <Button className="ml-2" size="sm" variant="secondary" onClick={() => setFocus(suggestionId!)}>Use Suggestion</Button>
        </div>
      )}
      <div className="space-y-2">
        {todos.map((t) => (
          <div key={t.id} className="flex items-center justify-between">
            <div className={`text-sm ${focusId === t.id ? "font-semibold" : ""}`}>{t.text}</div>
            <Button variant={focusId === t.id ? "secondary" : "outline"} size="sm" onClick={() => setFocus(t.id)}>
              {focusId === t.id ? "Focused" : "Set Focus"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function StakeCard() {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState("20");
  const [days, setDays] = useState(7);
  const [beneficiary, setBeneficiary] = useState("0x5B9AFe590174Cddd1C99374DEC490A87f4D04776");
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [challengeId, setChallengeId] = useState<bigint | null>(null);
  const [busy, setBusy] = useState(false);
  const [challengeData, setChallengeData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshChallengeData = useCallback(async () => {
    if (!challengeId) return;
    try {
      const data = await getChallengeData(challengeId);
      setChallengeData(data);
    } catch (e) {
      console.error("Failed to fetch challenge data:", e);
    }
  }, [challengeId]);

  useEffect(() => {
    refreshChallengeData();
  }, [refreshChallengeData]);

  const create = async () => {
    if (!isConnected) {
      setError("Please connect your wallet first");
      return;
    }
    try {
      setBusy(true);
      setError(null);
      const date = new Date(startDate + "T00:00:00Z");
      const txHash = await createStakingChallenge({
        beneficiary: beneficiary as any,
        amount,
        startDate: date,
        days
      });
      // For MVP, we'll use a simulated ID based on timestamp
      // In production, you'd parse the tx receipt to get the actual challenge ID
      setChallengeId(BigInt(Date.now()));
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to create challenge");
    } finally {
      setBusy(false);
    }
  };

  const claim = async () => {
    if (!challengeId || !isConnected) return;
    try {
      setBusy(true);
      setError(null);
      await claimStake(challengeId);
      await refreshChallengeData();
    } catch (e: any) {
      setError(e.message || "Failed to claim");
    } finally {
      setBusy(false);
    }
  };

  const finalize = async () => {
    if (!challengeId || !isConnected) return;
    try {
      setBusy(true);
      setError(null);
      await finalizeChallenge(challengeId);
      await refreshChallengeData();
    } catch (e: any) {
      setError(e.message || "Failed to finalize");
    } finally {
      setBusy(false);
    }
  };

  const canFinalize = challengeData &&
    new Date(Number(challengeData.startTime) * 1000 + Number(challengeData.durationDays) * 24 * 60 * 60 * 1000) <= new Date() &&
    !challengeData.finalized;

  const hasClaimable = challengeData && challengeData.released > 0;

  if (!isConnected) {
    return (
      <Card title="Self-Stake Challenge">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🔐</div>
          <div className="text-lg font-medium mb-2">Connect Your Wallet</div>
          <div className="text-sm text-[var(--app-foreground-muted)] mb-4">
            Connect your wallet to create self-stake challenges and bet on yourself
          </div>
          <div className="text-xs text-[var(--app-foreground-muted)]">
            Lock USDC for N days, unlock portions as you complete daily tasks
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Self-Stake Challenge">
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {!challengeId ? (
          <div className="space-y-3">
            <div className="text-sm text-[var(--app-foreground-muted)] mb-3">
              Lock your USDC and unlock portions as you complete daily tasks. Missed days go to your chosen beneficiary.
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-xs text-[var(--app-foreground-muted)] mb-1">Amount (USDC)</label>
                <input
                  className="w-full px-3 py-2 bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)]"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="20"
                  type="number"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--app-foreground-muted)] mb-1">Duration (Days)</label>
                <input
                  className="w-full px-3 py-2 bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)]"
                  type="number"
                  value={days}
                  onChange={(e) => setDays(parseInt(e.target.value || "1"))}
                  placeholder="7"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--app-foreground-muted)] mb-1">Beneficiary Address</label>
                <input
                  className="w-full px-3 py-2 bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)]"
                  value={beneficiary}
                  onChange={(e) => setBeneficiary(e.target.value)}
                  placeholder="0x..."
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--app-foreground-muted)] mb-1">Start Date</label>
                <input
                  className="w-full px-3 py-2 bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)]"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>
            <Button
              onClick={create}
              disabled={busy || !amount || !days || !beneficiary}
              className="w-full"
            >
              {busy ? "Creating..." : `Create Challenge (${amount} USDC for ${days} days)`}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-[var(--app-accent-light)] border border-[var(--app-card-border)] rounded-lg">
              <div className="text-sm font-medium mb-2">Active Challenge #{challengeId.toString()}</div>
              {challengeData && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Principal: {formatUSDC(challengeData.principal)} USDC</div>
                  <div>Released: {formatUSDC(challengeData.released)} USDC</div>
                  <div>Duration: {challengeData.durationDays} days</div>
                  <div>Daily Slice: {formatUSDC(challengeData.dailySlice)} USDC</div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={claim}
                variant="secondary"
                disabled={!hasClaimable || busy}
                className="flex-1"
              >
                {busy ? "Claiming..." : `Claim ${challengeData ? formatUSDC(challengeData.released) : "0"} USDC`}
              </Button>
              <Button
                onClick={finalize}
                variant="outline"
                disabled={!canFinalize || busy}
                className="flex-1"
              >
                {busy ? "Finalizing..." : "Finalize"}
              </Button>
            </div>

            <div className="text-xs text-[var(--app-foreground-muted)]">
              <div>• Complete daily tasks to unlock your USDC</div>
              <div>• Missed days go to beneficiary: {beneficiary.slice(0, 6)}...{beneficiary.slice(-4)}</div>
              <div>• Finalize after challenge ends to claim remaining funds</div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function DashboardCard({ onExplore }: { onExplore: () => void }) {
  const [streak, setStreak] = useState(0);
  const [tasksDone, setTasksDone] = useState(0);
  const [tasksTotal, setTasksTotal] = useState(0);
  const [recentNotes, setRecentNotes] = useState<string[]>([]);
  const [highlight, setHighlight] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [claimRes, todoRes, focusRes] = await Promise.all([
      fetch("/api/claim", { headers: { "x-user-id": "demo-user" } }),
      fetch("/api/todos", { headers: { "x-user-id": "demo-user" } }),
      fetch("/api/focus", { headers: { "x-user-id": "demo-user" } }),
    ]);
    const claim = await claimRes.json();
    const todos = await todoRes.json();
    const focus = await focusRes.json();
    setStreak(claim?.state?.streak ?? 0);
    const list: { id: string; text: string; completed: boolean }[] = todos?.todos ?? [];
    setTasksTotal(list.length);
    setTasksDone(list.filter((t) => t.completed).length);
    const suggestedId: string | null = focus?.focus?.todoId ?? focus?.suggestion?.todoId ?? null;
    setHighlight(suggestedId ? list.find((t) => t.id === suggestedId)?.text ?? null : null);
    setRecentNotes(["God spoke to me about...", "Lyrics for new worship song", "Conference takeaways - Acts"]);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <Card>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">SoulLedger</div>
          <Button variant="ghost" size="sm" onClick={onExplore}>
            Explore
          </Button>
        </div>
        <div className="text-sm text-[var(--app-foreground-muted)]">
          You&apos;re on a <span className="font-medium text-[var(--app-foreground)]">{streak}-day streak</span> 🎯
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-[var(--app-card-bg)] border border-[var(--app-card-border)]">
            <div className="text-xs text-[var(--app-foreground-muted)]">Tasks</div>
            <div className="text-sm font-medium">{tasksDone} / {tasksTotal}</div>
          </div>
          <div className="p-2 rounded-lg bg-[var(--app-card-bg)] border border-[var(--app-card-border)]">
            <div className="text-xs text-[var(--app-foreground-muted)]">Reflections</div>
            <div className="text-sm font-medium">1</div>
          </div>
          <div className="p-2 rounded-lg bg-[var(--app-card-bg)] border border-[var(--app-card-border)]">
            <div className="text-xs text-[var(--app-foreground-muted)]">Songs</div>
            <div className="text-sm font-medium">1</div>
          </div>
        </div>
        {highlight && (
          <div className="p-3 rounded-lg bg-[var(--app-accent-light)] border border-[var(--app-card-border)]">
            <div className="text-xs text-[var(--app-foreground-muted)] mb-1">High-Impact Task (80/20)</div>
            <div className="text-sm font-medium">{highlight}</div>
          </div>
        )}
        <div>
          <div className="text-sm font-medium mb-2">Recent Notes</div>
          <ul className="text-sm text-[var(--app-foreground-muted)] space-y-1">
            {recentNotes.map((n, i) => (
              <li key={i}>» {n}</li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}

function NotesCard() {
  const [notes, setNotes] = useState<{ id: string; title: string; content: string; category: string }[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("reflection");
  const [query, setQuery] = useState("");

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/notes${query ? `?q=${encodeURIComponent(query)}` : ""}`, { headers: { "x-user-id": "demo-user" } });
    const json = await res.json();
    setNotes(json.notes ?? []);
  }, [query]);

  useEffect(() => { refresh(); }, [refresh]);

  const add = useCallback(async () => {
    if (!title.trim() || !content.trim()) return;
    await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": "demo-user" },
      body: JSON.stringify({ title, content, category }),
    });
    setTitle("");
    setContent("");
    refresh();
  }, [title, content, category, refresh]);

  const remove = useCallback(async (id: string) => {
    await fetch(`/api/notes?id=${id}`, { method: "DELETE", headers: { "x-user-id": "demo-user" } });
    refresh();
  }, [refresh]);

  return (
    <Card title="Notes & Reflections">
      <div className="space-y-3">
        <div className="flex gap-2">
          <input className="flex-1 px-3 py-2 bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)] placeholder-[var(--app-foreground-muted)]" placeholder="Search notes..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <input className="px-3 py-2 bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-lg" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <select className="px-3 py-2 bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-lg" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="reflection">Reflection</option>
            <option value="quote">Quote</option>
            <option value="meeting">Meeting</option>
            <option value="song">Song</option>
            <option value="bible">Bible</option>
            <option value="general">General</option>
          </select>
        </div>
        <textarea className="w-full min-h-24 px-3 py-2 bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-lg" placeholder="Write here..." value={content} onChange={(e) => setContent(e.target.value)} />
        <div>
          <Button onClick={add} icon={<Icon name="plus" size="sm" />}>Add Note</Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {notes.map((n) => (
            <div key={n.id} className="p-3 rounded-lg border border-[var(--app-card-border)]">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm font-medium">{n.title}</div>
                <button className="text-[var(--app-foreground-muted)] hover:text-[var(--app-foreground)]" onClick={() => remove(n.id)}>×</button>
              </div>
              <div className="text-xs text-[var(--app-foreground-muted)] mb-1">{n.category}</div>
              <div className="text-sm whitespace-pre-wrap">{n.content}</div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
