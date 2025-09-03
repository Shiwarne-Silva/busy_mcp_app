# Busy CV MCP Server

An MCP server (TypeScript/Node) that:
- parses my résumé,
- answers questions about it (`search_resume` tool and `/ask`, `/answer` REST),
- can send emails (`send_email` tool and `/mcp-email-proxy` REST).

## Stack
- Node 18+ (local) / Node 20 (Docker)
- Express
- MCP (Streamable HTTP)
- Résumé parsing: pdf2json (+ optional Poppler fallback), Mammoth (.docx), plain .md/.txt
- Optional semantic ranking via OpenAI embeddings (fallback = keyword overlap)

## Endpoints
- `GET /health` → `{ ok: true }`
- `ALL /mcp` → MCP Streamable HTTP endpoint (initialize + messages)
- `POST /ask` → `{ snippets: [...] }` (evidence chunks)
- `POST /answer` → `{ answer, evidence }` for questions like “latest job title”
- `POST /mcp-email-proxy` → `{ ok, messageId }` (SMTP proxy)
  - Body: `{ "to": "...", "subject": "...", "body": "..." }`

## MCP Tools/Resources
- Tool: `search_resume(question, k?)`
- Tool: `send_email(to, subject, body)`
- Resource: `resume://me` (markdown résumé)

## Setup (local)
```bash
cd apps/server
cp .env.example .env
# Set RESUME_PATH to your file:
#   ./data/resume.pdf  OR  ./data/resume.docx  OR  ./data/resume.md
# Optional: OPENAI_API_KEY=sk-...
npm install
npm run dev
