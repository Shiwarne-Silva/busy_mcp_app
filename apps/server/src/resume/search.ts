import { OpenAI } from "openai";
import similarity from "cosine-similarity";
import { Snippet } from "../types";

type Embedder = (t: string) => Promise<number[]>;

async function makeEmbedder(): Promise<Embedder> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return async (_:string)=>[]; // no-embed fallback
  const client = new OpenAI({ apiKey: key });
  return async (t: string) => {
    const r = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: t.slice(0, 8000)
    });
    return r.data[0].embedding as number[];
  };
}

export async function buildIndex(chunks: string[]) {
  const embed = await makeEmbedder();
  const vecs: number[][] = [];
  for (const c of chunks) vecs.push(await embed(c));

  return {
    query: async (q: string, k = 5): Promise<Snippet[]> => {
      const qvec = await embed(q);

      // If we have embeddings, use them
      if (qvec.length) {
        const scored = chunks.map((c, i) => ({
          text: c,
          score: vecs[i].length ? similarity(qvec, vecs[i]) : 0
        }));
        return scored.sort((a,b)=>b.score-a.score).slice(0, k);
      }

      // --- Improved keyword fallback: token overlap ---
      const toks = q.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
      const setQ = new Set(toks);
      const scored = chunks.map(c => {
        const ctoks = c.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
        const setC = new Set(ctoks);
        let overlap = 0;
        for (const t of setQ) if (setC.has(t)) overlap++;
        const denom = Math.max(1, setQ.size);
        return { text: c, score: overlap / denom };
      });
      return scored.sort((a,b)=>b.score-a.score).slice(0, k);
    }
  };
}
