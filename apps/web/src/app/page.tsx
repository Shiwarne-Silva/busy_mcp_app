"use client";

import { useState } from "react";

type Snippet = {
  text: string;
  score?: number;
};

type AskResponse = {
  snippets: Snippet[];
};

type Evidence = {
  title?: string;
  company?: string;
  dates?: string;
  idx?: number;
};

type AnswerResponse = {
  answer: string;
  evidence?: Evidence;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ||
  "http://localhost:8080";

export default function HomePage() {
  const [question, setQuestion] = useState<string>("");
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [answer, setAnswer] = useState<string>("");
  const [loadingAsk, setLoadingAsk] = useState<boolean>(false);
  const [loadingAnswer, setLoadingAnswer] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  async function handleAsk() {
    setError("");
    setAnswer("");
    setLoadingAsk(true);
    try {
      const res = await fetch(`${API_BASE}/ask`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const json: AskResponse = await res.json();
      setSnippets(Array.isArray(json.snippets) ? json.snippets : []);
    } catch (e) {
      setError("Failed to fetch snippets.");
    } finally {
      setLoadingAsk(false);
    }
  }

  async function handleAnswer() {
    setError("");
    setLoadingAnswer(true);
    try {
      const res = await fetch(`${API_BASE}/answer`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const json: AnswerResponse = await res.json();
      setAnswer(json.answer || "");
    } catch (e) {
      setError("Failed to fetch answer.");
    } finally {
      setLoadingAnswer(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">
          Busy MCP — Resume Q&amp;A
        </h1>

        <div className="mt-8 rounded-2xl border bg-white p-5 shadow-sm">
          <label className="block text-sm font-medium">Ask a question</label>
          <textarea
            className="mt-2 w-full rounded-xl border p-3 outline-none focus:ring"
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What was my latest job title?"
          />
          <div className="mt-3 flex gap-2">
            <button
              className="rounded-xl bg-indigo-600 px-4 py-2 text-white disabled:opacity-50"
              onClick={handleAsk}
              disabled={loadingAsk || !question.trim()}
            >
              {loadingAsk ? "Searching…" : "Search Snippets"}
            </button>
            <button
              className="rounded-xl bg-emerald-600 px-4 py-2 text-white disabled:opacity-50"
              onClick={handleAnswer}
              disabled={loadingAnswer || !question.trim()}
            >
              {loadingAnswer ? "Answering…" : "Get Final Answer"}
            </button>
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>

        {answer && (
          <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Answer</h2>
            <p className="mt-2 leading-relaxed">{answer}</p>
          </div>
        )}

        {snippets.length > 0 && (
          <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Evidence Snippets</h2>
            <ul className="mt-3 space-y-3">
              {snippets.map((s, i) => (
                <li key={i} className="rounded-xl bg-indigo-50 p-3">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {s.text}
                  </p>
                  {typeof s.score === "number" && (
                    <p className="mt-1 text-xs text-indigo-700">
                      score: {s.score}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
