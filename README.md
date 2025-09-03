# Busy MCP — Resume Q&A (Mini README)

Ask questions about your resume via a tiny **Express API** (`apps/server`) and a **Next.js UI** (`apps/web`).

---

## Quick Start

**Prereqs:** Node 20+, npm 9/10+

**1) Install**
```bash
git clone https://github.com/Shiwarne-Silva/busy_mcp_app.git
cd busy_mcp_app
cd apps/server && npm i && cd ../web && npm i && cd ../..
```

**2) Put your resume**
```
apps/server/data/Resume.docx   # or .pdf/.txt/.md (case sensitive)
```

**3) Env files**

`apps/server/.env`
```env
PORT=8080
RESUME_PATH=./data/Resume.docx
WEB_ORIGIN=http://localhost:3000
```

`apps/web/.env.local`
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_DEFAULT_K=12
```

**4) Run**
```bash
# terminal A
cd apps/server && npm run dev

# terminal B
cd apps/web && npm run dev
# -> http://localhost:3000
```

---

## API (brief)

Base: `http://localhost:8080`

- `GET /health` → `{ "ok": true }`
- `POST /ask`  
  Body: `{ "question":"...", "k":12 }` → `{ "snippets":[{text, score}] }`
- `POST /answer`  
  Body: `{ "question":"...", "k":12 }` → `{ "answer":"...", "evidence":{snippets} }`
- `POST /mcp-email-proxy` *(optional; needs SMTP envs)*  
  `{ "to":"a@b.com","subject":"...","body":"..." }` → `{ "ok": true }`

**Smoke test**
```bash
curl -sS http://localhost:8080/health
curl -sS -X POST http://localhost:8080/ask -H "content-type: application/json"   -d '{"question":"What was my latest job title?","k":12}'
curl -sS -X POST http://localhost:8080/answer -H "content-type: application/json"   -d '{"question":"What was my latest job title?","k":12}'
```

---

## Deploy (super short)

**Server (Render)**
- Root: `apps/server`
- Dockerfile: `apps/server/Dockerfile`
- Env: set `RESUME_PATH=./data/Resume.docx`, `WEB_ORIGIN=https://<your-web-domain>`

**Web (Vercel)**
- Root: `apps/web`
- Env: `NEXT_PUBLIC_API_BASE_URL=https://<your-render-service>`  
  (and `NEXT_PUBLIC_DEFAULT_K=12`)

---

## Troubleshooting

- **Resume not found**: file path & **case**; `RESUME_PATH=./data/Resume.docx`.
- **Node errors** (e.g., `Promise.withResolvers`): use **Node 20+**.
- **CORS**: set `WEB_ORIGIN` to your web URL on the server.
- **Tailwind on Vercel**: keep `postcss.config.js` (uses `@tailwindcss/postcss`).

---

## Structure (tiny)

```
apps/
  server/  # Express API: /health /ask /answer (/mcp-email-proxy)
  web/     # Next.js UI: calls server; clean, modern UI
```

MIT
