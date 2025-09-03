import "dotenv/config";
import express from "express";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createMcpServer } from "./mcpServer";
import cors from "cors";

// Direct imports for REST routes (avoid re-registering MCP tools)
import { parseResume } from "./resume/parse";
import { buildIndex } from "./resume/search";
import { sendEmail } from "./email/send";

const PORT = Number(process.env.PORT || 8080);

(async function main() {
  const app = express();
  app.use(
  cors({
    origin: process.env.WEB_ORIGIN || "http://localhost:3000",
  })
);

app.use(express.json());
  app.use(express.json());

  // ---- Load resume + build index ONCE at boot for REST endpoints ----
  const resumePath = process.env.RESUME_PATH || "./data/resume.pdf";
  const parsed = await parseResume(resumePath);
  const chunks = [parsed.markdown, ...parsed.sections.map(s => `${s.title}\n${s.content}`)];
  const index = await buildIndex(chunks);

  app.get("/health", (_req, res) => res.json({ ok: true, name: "busy-cv-mcp" }));

  // ---- Streamable HTTP MCP endpoint with session handling ----
  const transports: Record<string, StreamableHTTPServerTransport> = {};

  app.all("/mcp", async (req, res) => {
    try {
      const sessionId =
        (req.headers["mcp-session-id"] as string | undefined) ||
        (req.query["mcp-session-id"] as string | undefined);

      let transport: StreamableHTTPServerTransport | undefined =
        sessionId ? transports[sessionId] : undefined;

      if (!transport) {
        if (!isInitializeRequest(req.body)) {
          res.status(400).json({
            jsonrpc: "2.0",
            error: { code: -32000, message: "Bad Request: initialize required" },
            id: null
          });
          return;
        }

        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (newId) => { transports[newId] = transport!; }
        });

        const mcp = await createMcpServer();
        await mcp.connect(transport);

        transport.onclose = () => {
          if (transport?.sessionId) delete transports[transport.sessionId];
        };
      }

      await transport.handleRequest(req, res, req.body);
    } catch (e: any) {
      console.error("MCP /mcp error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // ---- Helper: extract latest job role (robust for your resume format) ----
  function extractLatestRole(text: string) {
    const rawLines = text.split(/\r?\n/).map((s) => s.trim());
    const lines = rawLines.filter(Boolean);

    const stripBullets = (s: string) => s.replace(/^[-•\u2022]\s*/, "").trim();

    // 1) Find start of "Experience" section
    let expIdx = lines.findIndex((l) => /^experience$/i.test(stripBullets(l)));
    if (expIdx === -1) {
      expIdx = lines.findIndex((l) => /experience/i.test(l));
    }

    // Date-range patterns like "Sep 2023 - Sep 2024" / "Jun 2021 - Present" / "2022 - 2024"
    const month = "(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t|tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)";
    const dateRange =
      new RegExp(
        `(?:${month}\\s*\\d{4}\\s*-\\s*(?:${month}\\s*)?(?:\\d{4}|Present)|\\b\\d{4}\\s*-\\s*(?:\\d{4}|Present))`,
        "i"
      );

    const nextNonEmpty = (i: number) => {
      for (let k = i; k < lines.length; k++) {
        const s = stripBullets(lines[k]);
        if (s) return { idx: k, text: s };
      }
      return null;
    };

    // 2) Search for the first date-range line after Experience
    let start = Math.max(0, expIdx + 1);
    let dateLineIdx = -1;
    for (let i = start; i < lines.length; i++) {
      if (dateRange.test(lines[i])) {
        dateLineIdx = i;
        break;
      }
      // Stop if we clearly left the Experience block (encounter another major heading)
      if (/^(education|skills|projects|certificates?|awards|summary|languages|references)\b/i.test(stripBullets(lines[i]))) {
        break;
      }
    }
    // Fallback: scan whole doc if not found
    if (dateLineIdx === -1) {
      dateLineIdx = lines.findIndex((l) => dateRange.test(l));
      if (dateLineIdx === -1) return null;
    }

    const dates = stripBullets(lines[dateLineIdx]);

    // 3) The next two non-empty lines should be Title then Company
    const titleLine = nextNonEmpty(dateLineIdx + 1);
    const companyLine = titleLine ? nextNonEmpty(titleLine.idx + 1) : null;

    const title = titleLine?.text || "";
    const company = companyLine?.text || "";

    if (!title || !company) return null;

    return {
      sentence: `Your latest job title is ${title} at ${company} (${dates}).`,
      raw: { title, company, dates, idx: dateLineIdx }
    };
  }

  // ---- REST: Ask (snippets) ----
  app.post("/ask", async (req, res) => {
    try {
      const q = String(req.body?.question || "");
      if (!q) return res.status(400).json({ error: "question required" });

      const hits = await index.query(q, 5);
      res.json({ snippets: hits });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ---- REST: Answer synthesis ----
  app.post("/answer", async (req, res) => {
    try {
      const q = String(req.body?.question || "");
      if (/latest.*(role|job|title)/i.test(q)) {
        const ans = extractLatestRole(parsed.text);
        if (ans) return res.json({ answer: ans.sentence, evidence: ans.raw });
      }
      const hits = await index.query(q, 5);
      res.json({ answer: null, snippets: hits });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ---- REST: Email proxy ----
  app.post("/mcp-email-proxy", async (req, res) => {
    try {
      const { to, subject, body } = req.body || {};
      if (!to || !subject || !body) {
        return res.status(400).json({ error: "to, subject, body are required" });
      }
      const info = await sendEmail(to, subject, body);
      res.json({ ok: true, messageId: info.messageId });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.listen(PORT, () => {
    console.log(`HTTP :${PORT} — /health, /mcp (Streamable HTTP), /ask, /answer, /mcp-email-proxy`);
  });
})();
