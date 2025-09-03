"use client";

import { useState } from "react";

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
  const [busy, setBusy] = useState(false);

  async function doSearch() {
    setBusy(true);
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
      setBusy(false);
    }
  }

  async function doAnswer() {
    setBusy(true);
    try {
      const r = await fetch(`${API_BASE}/answer`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const json: AnswerResponse = await r.json();
      setAnswer(json.answer ?? "");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">
          Busy MCP — <span className="text-indigo-400">Resume Q&A</span>
        </h1>
        <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-slate-200 ring-1 ring-white/10">
          API {API_BASE.split("//")[1]}
        </span>
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/20 backdrop-blur">
        <p className="text-sm text-slate-300">
          Ask natural questions about your resume. I’ll search snippets and then
          produce a final answer.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <textarea
            className="min-h-12 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/50 md:col-span-1"
            rows={2}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question…"
          />
          <button
            onClick={doSearch}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-slate-100 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/15 hover:shadow-lg hover:shadow-black/30 active:translate-y-0 md:w-36"
          >
            Search Snippets
          </button>
          <button
            onClick={doAnswer}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-lg hover:shadow-black/30 active:translate-y-0 md:w-36"
          >
            Get Final Answer
          </button>
        </div>
      </section>

      {answer && (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/20 backdrop-blur">
          <h2 className="mb-3 text-lg font-semibold">Final answer</h2>
          <p className="leading-relaxed text-slate-100">{answer}</p>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Top snippets</h2>
        {snippets.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300 shadow-xl shadow-black/20 backdrop-blur">
            No snippets yet. Try “What was my latest job title?”
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {snippets.map((s, i) => (
              <article
                key={i}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl shadow-black/20 backdrop-blur"
              >
                <pre className="whitespace-pre-wrap leading-relaxed">
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
    </main>
  );
}
