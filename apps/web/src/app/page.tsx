"use client";
import { useEffect, useState } from "react";

const SERVER = process.env.NEXT_PUBLIC_SERVER_URL!;

type Snippet = { text: string; score: number };

export default function Home() {
  // Q&A
  const [q, setQ] = useState("What was my latest job title?");
  const [answer, setAnswer] = useState<string | null>(null);
  const [snippets, setSnippets] = useState<Snippet[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Email
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("MCP hello");
  const [body, setBody] = useState("This came from my MCP server.");
  const [emailOk, setEmailOk] = useState<string | null>(null);

  // UX: auto-hide toast
  useEffect(() => {
    if (!emailOk) return;
    const t = setTimeout(() => setEmailOk(null), 2800);
    return () => clearTimeout(t);
  }, [emailOk]);

  async function ask() {
    setLoading(true);
    setErr(null);
    setAnswer(null);
    setSnippets(null);
    try {
      const r = await fetch(`${SERVER}/answer`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || `Status ${r.status}`);
      if (data.answer) setAnswer(data.answer);
      else setSnippets((data.snippets || []) as Snippet[]);
    } catch (e: any) {
      setErr(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  async function sendMail() {
    setErr(null);
    setEmailOk(null);
    try {
      const r = await fetch(`${SERVER}/mcp-email-proxy`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ to, subject, body }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || `Status ${r.status}`);
      setEmailOk("Email sent ✔︎");
    } catch (e: any) {
      setErr(e.message ?? String(e));
    }
  }

  return (
    <>
      <div className="bg-halo" />
      <div className="container">
        {/* Header */}
        <div className="brand">
          <div className="logo" />
          Busy MCP Playground
          <span style={{ flex: 1 }} />
          <span className="pill">
            Server: {SERVER.replace(/^https?:\/\//, "")}
          </span>
        </div>

        <h1 className="h1">Ask about my CV & send emails</h1>
        <p className="subtitle">
          Streamable HTTP MCP server + a minimal, colorful UI. Try a question or
          send yourself a test email.
        </p>

        {/* Content grid */}
        <div className="grid">
          {/* Q&A card */}
          <section className="card">
            <h2>Ask about my résumé</h2>
            <textarea
              className="textarea"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Type your question..."
            />
            <div className="row" style={{ marginTop: 12 }}>
              <button className="btn" onClick={ask} disabled={loading}>
                {loading ? "Asking…" : "Ask"}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setQ("Summarize my most recent experience in one sentence.");
                  setAnswer(null);
                  setSnippets(null);
                }}
              >
                Try another prompt
              </button>
            </div>

            {err && (
              <p style={{ color: "salmon", marginTop: 12 }}>
                <b>Error:</b> {err}
              </p>
            )}

            {answer && (
              <div style={{ marginTop: 16, lineHeight: 1.6 }}>
                <b>Answer:</b> {answer}
              </div>
            )}

            {!answer && snippets && (
              <div style={{ marginTop: 14 }}>
                <b>Top snippets</b>
                <ul>
                  {snippets.map((s, i) => (
                    <li key={i} style={{ marginTop: 8 }}>
                      <code
                        style={{ display: "block", whiteSpace: "pre-wrap" }}
                      >
                        {s.text}
                      </code>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Email card */}
          <section className="card">
            <h2>Send a test email</h2>
            <input
              className="input"
              placeholder="to@example.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              style={{ marginBottom: 10 }}
            />
            <input
              className="input"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={{ marginBottom: 10 }}
            />
            <textarea
              className="textarea"
              placeholder="Body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <div className="row" style={{ marginTop: 12 }}>
              <button className="btn" onClick={sendMail}>
                Send email
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setTo("");
                  setSubject("MCP hello");
                  setBody("This came from my MCP server.");
                }}
              >
                Reset
              </button>
            </div>
          </section>
        </div>
      </div>

      {emailOk && <div className="toast">{emailOk}</div>}
    </>
  );
}
