"use client";

import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";

type Snippet = { text: string; score?: number };

export default function Home() {
  const [q, setQ] = useState("What was my latest job title?");
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [answer, setAnswer] = useState<string>("");
  const [loading, setLoading] = useState<"search" | "answer" | null>(null);
  const [error, setError] = useState<string>("");

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
      const data = await r.json();
      setSnippets((data.snippets ?? []) as Snippet[]);
    } catch (e: any) {
      setError(e?.message || "Search failed");
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
      const data = await r.json();
      setAnswer(data.answer || JSON.stringify(data));
      // optional: also show evidence
      if (!snippets.length && data.evidence?.title) {
        setSnippets([
          {
            text: `${data.evidence.title} — ${data.evidence.company} (${data.evidence.dates})`,
          },
        ]);
      }
    } catch (e: any) {
      setError(e?.message || "Answer failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Busy MCP — <span className="text-indigo-300">Resume Q&A</span>
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Ask questions about your resume. Results come from your Render
            server.
          </p>
        </header>

        <section className="bg-slate-900/40 backdrop-blur rounded-xl border border-white/10 p-4 md:p-5 shadow-lg">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Ask a question
          </label>
          <textarea
            value={q}
            onChange={(e) => setQ(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-white/10 bg-slate-900/70 outline-none focus:ring-2 focus:ring-indigo-400 p-3 text-slate-100 placeholder:text-slate-500"
            placeholder="e.g., What was my latest job title?"
          />

          <div className="flex gap-3 mt-4">
            <button
              onClick={search}
              disabled={loading !== null}
              className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 transition"
            >
              {loading === "search" ? "Searching…" : "Search Snippets"}
            </button>
            <button
              onClick={getAnswer}
              disabled={loading !== null}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 transition"
            >
              {loading === "answer" ? "Getting…" : "Get Final Answer"}
            </button>
          </div>

          {error && (
            <div className="mt-4 text-sm text-rose-300 bg-rose-950/40 border border-rose-700/40 rounded-lg p-3">
              {error}
            </div>
          )}
        </section>

        {!!snippets.length && (
          <section className="mt-8">
            <h2 className="text-lg font-medium mb-3 text-indigo-200">
              Top snippets
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {snippets.map((s, i) => (
                <article
                  key={i}
                  className="rounded-xl border border-white/10 bg-slate-900/40 p-4 shadow"
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {s.text}
                  </p>
                  {typeof s.score === "number" && (
                    <div className="text-xs text-slate-400 mt-2">
                      score: {s.score.toFixed(2)}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {answer && (
          <section className="mt-8">
            <h2 className="text-lg font-medium mb-3 text-emerald-200">
              Final answer
            </h2>
            <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4 shadow">
              <p className="text-base leading-relaxed whitespace-pre-wrap">
                {answer}
              </p>
            </div>
          </section>
        )}

        <footer className="mt-10 text-xs text-slate-500">
          API: <code className="text-slate-300">{API_BASE}</code>
        </footer>
      </div>
    </main>
  );
}
