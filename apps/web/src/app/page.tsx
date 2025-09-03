"use client";

import { useEffect, useMemo, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ||
  "http://localhost:8080";

type Snippet = { text: string; score?: number };
type Evidence = { title?: string; company?: string; dates?: string };
type AskResponse = { snippets?: Snippet[] };
type AnswerResponse = { answer?: string; evidence?: Evidence };

function toMsg(err: unknown) {
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

export default function Home() {
  const [q, setQ] = useState("What was my latest job title?");
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState<"search" | "answer" | null>(null);
  const [error, setError] = useState("");
  const [server, setServer] = useState<{ ok?: boolean; name?: string } | null>(
    null
  );

  // Quick ping so we can show a green/amber status pill
  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/health`)
      .then((r) => r.json())
      .then((j) => !cancelled && setServer(j))
      .catch(() => !cancelled && setServer({ ok: false, name: "offline" }));
    return () => {
      cancelled = true;
    };
  }, []);

  const status = useMemo(() => {
    if (!server)
      return { label: "Checking…", cls: "bg-yellow-500/20 text-yellow-300" };
    if (server.ok)
      return {
        label: server.name ?? "online",
        cls: "bg-emerald-500/20 text-emerald-300",
      };
    return { label: "offline", cls: "bg-rose-500/20 text-rose-300" };
  }, [server]);

  async function search() {
    setError("");
    setAnswer("");
    setLoading("search");
    try {
      const r = await fetch(`${API_BASE}/ask`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      const data = (await r.json()) as AskResponse;
      setSnippets(data.snippets ?? []);
    } catch (err) {
      setError(toMsg(err) || "Search failed");
    } finally {
      setLoading(null);
    }
  }

  async function getAnswer() {
    setError("");
    setLoading("answer");
    try {
      const r = await fetch(`${API_BASE}/answer`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      const data = (await r.json()) as AnswerResponse;
      setAnswer(data.answer ?? "");
      if ((!snippets || snippets.length === 0) && data.evidence) {
        const e = data.evidence;
        setSnippets([
          { text: `${e.title ?? ""} — ${e.company ?? ""} (${e.dates ?? ""})` },
        ]);
      }
    } catch (err) {
      setError(toMsg(err) || "Answer failed");
    } finally {
      setLoading(null);
    }
  }

  const btn =
    "inline-flex items-center gap-2 rounded-xl px-4 py-2 font-medium border border-white/10 shadow-sm transition";
  const btnPrimary =
    "bg-indigo-500 hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed";
  const btnSuccess =
    "bg-emerald-500 hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed";

  return (
    <main className="min-h-screen bg-[radial-gradient(1200px_600px_at_20%_-10%,rgba(99,102,241,0.25),transparent),radial-gradient(1000px_600px_at_110%_0%,rgba(20,184,166,0.18),transparent),linear-gradient(180deg,#030712_0%,#0b1220_100%)] text-slate-100">
      <div className="mx-auto max-w-6xl px-5 py-10">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              Busy MCP — <span className="text-indigo-300">Resume Q&A</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Ask natural questions about your resume. I’ll search snippets and
              produce a final answer.
            </p>
          </div>

          <div
            className={`rounded-full px-3 py-1 text-xs font-medium border border-white/10 ${status.cls}`}
            title={`API: ${API_BASE}`}
          >
            API {status.label}
          </div>
        </header>

        {/* Query card */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur p-5 shadow-lg">
          <label htmlFor="q" className="block text-sm text-slate-300 mb-2">
            Ask a question
          </label>
          <textarea
            id="q"
            rows={3}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-xl bg-slate-900/70 border border-white/10 outline-none px-4 py-3 text-[15px] leading-relaxed placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-400"
            placeholder="e.g. What companies have I worked at?"
          />

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={loading ? undefined : search}
              disabled={loading !== null}
              className={`${btn} ${btnPrimary}`}
            >
              {loading === "search" ? (
                <>
                  <Spinner />
                  Searching…
                </>
              ) : (
                "Search Snippets"
              )}
            </button>

            <button
              onClick={loading ? undefined : getAnswer}
              disabled={loading !== null}
              className={`${btn} ${btnSuccess}`}
            >
              {loading === "answer" ? (
                <>
                  <Spinner />
                  Getting Answer…
                </>
              ) : (
                "Get Final Answer"
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-rose-600/30 bg-rose-950/40 px-4 py-3 text-rose-200 text-sm">
              {error}
            </div>
          )}
        </section>

        {/* Snippets */}
        {!!snippets.length && (
          <section className="mt-8">
            <h2 className="text-lg font-medium text-indigo-200 mb-3">
              Top snippets
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {snippets.map((s, i) => (
                <article
                  key={i}
                  className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 shadow-sm hover:shadow-md transition"
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {s.text}
                  </p>
                  {"score" in s && typeof s.score === "number" && (
                    <div className="text-xs text-slate-400 mt-2">
                      score: {s.score.toFixed(2)}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Final answer */}
        {answer && (
          <section className="mt-8">
            <h2 className="text-lg font-medium text-emerald-200 mb-3">
              Final answer
            </h2>
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 shadow">
              <p className="leading-relaxed whitespace-pre-wrap">{answer}</p>
            </div>
          </section>
        )}

        <footer className="mt-12 text-xs text-slate-500">
          API base:&nbsp;
          <code className="text-slate-300">{API_BASE}</code>
        </footer>
      </div>
    </main>
  );
}

/** minimal spinner (no extra deps) */
function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
    />
  );
}
