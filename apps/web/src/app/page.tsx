"use client";

import { useState } from "react";

type Snippet = { text: string; score?: number };
type AskResponse = { snippets: Snippet[] };
type AnswerResponse = { answer: string; evidence?: any };

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
        <span className="badge">API {API_BASE.split("//")[1]}</span>
      </header>

      <section className="card p-5">
        <p className="text-sm text-slate-300">
          Ask natural questions about your resume. I’ll search snippets and then
          produce a final answer.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <textarea
            className="input md:col-span-1 min-h-12"
            rows={2}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question…"
          />
          <button
            onClick={doSearch}
            disabled={busy}
            className="btn btn-soft md:w-36"
          >
            Search Snippets
          </button>
          <button
            onClick={doAnswer}
            disabled={busy}
            className="btn btn-primary md:w-36"
          >
            Get Final Answer
          </button>
        </div>
      </section>

      {answer && (
        <section className="card p-5">
          <h2 className="mb-3 text-lg font-semibold">Final answer</h2>
          <p className="leading-relaxed text-slate-100">{answer}</p>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Top snippets</h2>
        {snippets.length === 0 ? (
          <div className="card p-5 text-sm text-slate-300">
            No snippets yet. Try “What was my latest job title?”
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {snippets.map((s, i) => (
              <article key={i} className="card p-4">
                <div className="prose prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap leading-relaxed">
                    {s.text}
                  </pre>
                </div>
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
