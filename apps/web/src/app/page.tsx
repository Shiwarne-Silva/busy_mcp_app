"use client";

import { useMemo, useState } from "react";

type Snippet = { text: string; score?: number };
type AskResponse = { snippets: Snippet[] };
type AnswerResponse = { answer: string; evidence?: Record<string, unknown> };

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ||
  "http://localhost:8080";

export default function Page() {
  const [question, setQuestion] = useState("What was my latest job title?");
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [answer, setAnswer] = useState<string>("");
  const [loading, setLoading] = useState<null | "search" | "answer">(null);

  const apiHost = useMemo(() => {
    try {
      const u = new URL(API_BASE);
      return u.host;
    } catch {
      return API_BASE;
    }
  }, []);

  const hasResults = snippets.length > 0 || !!answer;

  async function doSearch() {
    setLoading("search");
    setAnswer("");
    try {
      const r = await fetch(`${API_BASE}/ask`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const json: AskResponse = await r.json();
      setSnippets(json.snippets ?? []);
    } finally {
      setLoading(null);
    }
  }

  async function doAnswer() {
    setLoading("answer");
    try {
      const r = await fetch(`${API_BASE}/answer`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const json: AnswerResponse = await r.json();
      setAnswer(json.answer ?? "");
    } finally {
      setLoading(null);
    }
  }

  function clearAll() {
    setSnippets([]);
    setAnswer("");
  }

  return (
    <main className="space-y-10">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Busy MCP —{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              Resume Q&A
            </span>
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Ask natural questions about your resume. I’ll fetch top snippets and
            craft a final answer.
          </p>
        </div>

        <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium ring-1 ring-white/10 shadow-sm">
          <span className="size-2 rounded-full bg-emerald-400/90 shadow-[0_0_0_2px] shadow-emerald-400/20" />
          API {apiHost}
        </span>
      </header>

      {/* Query box */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/20 backdrop-blur">
        <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-400">
          Ask a question
        </label>
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
          <textarea
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g., What technologies have I used most recently?"
            className="min-h-12 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/50 md:col-span-1"
          />
          <Button
            onClick={doSearch}
            disabled={!!loading}
            variant="secondary"
            className="md:w-40"
          >
            {loading === "search" ? <Dots /> : "Search Snippets"}
          </Button>
          <Button
            onClick={doAnswer}
            disabled={!!loading}
            variant="primary"
            className="md:w-40"
          >
            {loading === "answer" ? <Dots /> : "Get Final Answer"}
          </Button>

          {/* NEW: Clear Results button (shows after a search) */}
          {hasResults && (
            <Button
              onClick={clearAll}
              disabled={!!loading}
              variant="secondary"
              className="md:w-36"
            >
              Clear Results
            </Button>
          )}
        </div>
      </section>

      {/* Final answer */}
      {answer && (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/20 backdrop-blur">
          <h2 className="mb-3 text-lg font-semibold">Final answer</h2>
          <p className="leading-relaxed text-slate-100">{answer}</p>
        </section>
      )}

      {/* Snippets */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Top snippets</h2>
          <span className="text-xs text-slate-400">
            {snippets.length} result(s)
          </span>
        </div>

        {snippets.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {snippets.map((s, i) => (
              <article
                key={i}
                className="group rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl shadow-black/20 backdrop-blur transition-transform duration-200 hover:-translate-y-0.5 hover:bg-white/[0.06]"
              >
                <pre className="whitespace-pre-wrap leading-relaxed text-slate-100">
                  {s.text}
                </pre>
                {typeof s.score === "number" && (
                  <div className="mt-3 text-xs text-slate-400">
                    score: {s.score.toFixed(2)}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="pt-4 text-center text-xs text-slate-400">
        Shiwarne Silva
      </footer>
    </main>
  );
}

/* ---------- UI helpers ---------- */

function Button({
  children,
  onClick,
  disabled,
  variant = "primary",
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition will-change-transform disabled:opacity-60 disabled:cursor-not-allowed";
  const primary =
    "bg-gradient-to-tr from-indigo-600 via-fuchsia-600 to-pink-600 text-white shadow-lg shadow-fuchsia-600/20 ring-1 ring-white/10 hover:scale-[1.02] active:scale-100";
  const secondary =
    "bg-white/8 text-slate-100 ring-1 ring-white/10 hover:bg-white/12 hover:scale-[1.02] active:scale-100";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        base,
        variant === "primary" ? primary : secondary,
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Dots() {
  return (
    <span className="inline-flex items-center gap-1">
      <i className="inline-block size-1.5 animate-bounce rounded-full bg-white [animation-delay:-0.2s]" />
      <i className="inline-block size-1.5 animate-bounce rounded-full bg-white [animation-delay:-0.1s]" />
      <i className="inline-block size-1.5 animate-bounce rounded-full bg-white" />
    </span>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300 shadow-xl shadow-black/20 backdrop-blur">
      No snippets yet. Try asking{" "}
      <span className="font-semibold text-slate-100">
        “What was my latest job title?”
      </span>
      , then click{" "}
      <span className="font-semibold text-slate-100">Search Snippets</span>.
    </div>
  );
}
