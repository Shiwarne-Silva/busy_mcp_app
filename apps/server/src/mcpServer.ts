import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { parseResume } from "./resume/parse";
import { buildIndex } from "./resume/search";
import { sendEmail } from "./email/send";

export async function createMcpServer() {
  const server = new McpServer({ name: "busy-cv-mcp", version: "1.0.0" });

  // Load + index resume once on boot
  const resumePath = process.env.RESUME_PATH || "./data/resume.pdf";
  const parsed = await parseResume(resumePath);
  const chunks = [parsed.markdown, ...parsed.sections.map(s => `${s.title}\n${s.content}`)];
  const index = await buildIndex(chunks);

  // Resource: résumé markdown
  server.resource({
    uri: "resume://me",
    name: "Resume (markdown)",
    mimeType: "text/markdown",
    description: "Parsed résumé as markdown",
    read: async () => ({
      contents: [{ uri: "resume://me", text: parsed.markdown, mimeType: "text/markdown" }]
    })
  });

  // Tool: search_resume
  server.tool(
    {
      name: "search_resume",
      description: "Return top-K relevant snippets from the résumé for a question.",
      inputSchema: z.object({ question: z.string(), k: z.number().int().optional() })
    },
    async ({ question, k = 5 }) => {
      const hits = await index.query(question, k);
      return { content: [{ type: "text", text: JSON.stringify(hits, null, 2) }] };
    }
  );

  // Tool: send_email
  server.tool(
    {
      name: "send_email",
      description: "Send an email via SMTP.",
      inputSchema: z.object({ to: z.string().email(), subject: z.string(), body: z.string() })
    },
    async ({ to, subject, body }) => {
      const info = await sendEmail(to, subject, body);
      return { content: [{ type: "text", text: `Email queued: ${info.messageId}` }] };
    }
  );

  return server;
}
