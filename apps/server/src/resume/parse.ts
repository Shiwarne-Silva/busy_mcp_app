import fs from "node:fs";
import path from "node:path";
import PDFParser from "pdf2json";
import mammoth from "mammoth";
import { ParsedResume } from "../types";

const H = (s: string) => s.replace(/\s+/g, " ").trim();

async function readTextFile(p: string): Promise<string> {
  return fs.readFileSync(p, "utf8");
}

async function readDocx(p: string): Promise<string> {
  const { value } = await mammoth.extractRawText({ path: p });
  return value || "";
}

async function readPdf(p: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(p)) {
      return reject(new Error(`Resume not found at "${p}".`));
    }
    const pdfParser = new (PDFParser as any)();
    pdfParser.on("pdfParser_dataError", (err: any) => reject(err?.parserError || err));
    pdfParser.on("pdfParser_dataReady", () => {
      const raw: string = (pdfParser as any).getRawTextContent();
      resolve(raw || "");
    });
    pdfParser.loadPDF(p);
  });
}

async function extractText(resumePath: string): Promise<string> {
  const ext = path.extname(resumePath).toLowerCase();
  if (!fs.existsSync(resumePath)) {
    throw new Error(
      `Resume not found at "${resumePath}". Put your file in apps/server/data/resume.pdf (or .docx/.txt/.md) or set RESUME_PATH in .env.`
    );
  }

  if (ext === ".pdf") {
    const t = await readPdf(resumePath);
    if (H(t).length < 30) {
      // Likely scanned PDF (no embedded text). Tell the caller plainly.
      throw new Error(
        "Your PDF appears to have no extractable text (probably scanned). Export a text-based PDF or provide a .docx/.txt/.md instead."
      );
    }
    return t;
  }
  if (ext === ".docx") return await readDocx(resumePath);
  if (ext === ".txt" || ext === ".md") return await readTextFile(resumePath);

  throw new Error(
    `Unsupported resume type "${ext}". Use .pdf (text-based), .docx, .txt, or .md.`
  );
}

export async function parseResume(pdfPath: string): Promise<ParsedResume> {
  const text = await extractText(pdfPath);

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length);

  const markdown =
    "## Resume\n\n" +
    lines.map((l) => `- ${l}`).join("\n");

  // Simple sectionizer by common headings
  const sectionsRaw: { title: string; content: string[] }[] = [];
  const heading =
    /(experience|work|employment|education|skills|projects|summary|certifications|awards|publications)/i;

  let cur: { title: string; content: string[] } | null = null;
  for (const ln of lines) {
    if (heading.test(ln.toLowerCase())) {
      if (cur) sectionsRaw.push(cur);
      cur = { title: H(ln), content: [] };
    } else if (cur) {
      cur.content.push(ln);
    }
  }
  if (cur) sectionsRaw.push(cur);

  return {
    text: lines.join("\n"),
    markdown,
    sections: sectionsRaw.map((s) => ({
      title: s.title,
      content: H(s.content.join("\n")),
    })),
  };
}
