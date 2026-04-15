const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");
const { createClient } = require("@supabase/supabase-js");

require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const execFileAsync = promisify(execFile);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function embed(text) {
  const cleaned = text.replace(/[^\x00-\x7F]/g, " ").trim();
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.VOYAGE_GEOLENS_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "voyage-3",
      input: [cleaned],
    }),
  });
  const data = await res.json();
  if (!data.data) {
    console.error("Voyage error:", JSON.stringify(data));
    throw new Error("Voyage returned no data");
  }
  return data.data[0].embedding;
}

function cleanText(text) {
  return (text || "").replace(/\s+/g, " ").trim();
}

function chunkText(text, chunkSize = 150, overlap = 30) {
  if (chunkSize <= overlap) throw new Error("chunkSize must be greater than overlap");
  const words = cleanText(text).split(" ");
  const chunks = [];
  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(" ").trim();
    if (chunk) chunks.push(chunk);
  }
  return chunks;
}

async function extractWithPdfToText(filePath) {
  const { stdout } = await execFileAsync("pdftotext", [filePath, "-"]);
  return cleanText(stdout);
}

async function extractText(filePath) {
  const strategies = [
    async () => {
      const text = await extractWithPdfToText(filePath);
      if (text) { console.log("Extracted with pdftotext"); return text; }
    },
    async () => {
      const repairedPath = `${filePath}.repaired.pdf`;
      await execFileAsync("qpdf", ["--linearize", filePath, repairedPath]);
      const text = await extractWithPdfToText(repairedPath);
      if (text) { console.log("Extracted after qpdf repair"); return text; }
    },
    async () => {
      const ocrPath = `${filePath}.ocr.pdf`;
      await execFileAsync("ocrmypdf", ["-q", filePath, ocrPath]);
      const text = await extractWithPdfToText(ocrPath);
      if (text) { console.log("Extracted after OCR"); return text; }
    },
  ];

  for (const strategy of strategies) {
    try {
      const result = await strategy();
      if (result) return result;
    } catch (err) {
      console.warn(`Strategy failed: ${err.message}`);
    }
  }
  return "";
}

async function ingestPDF(filePath) {
  const filename = path.basename(filePath);

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const text = await extractText(filePath);
  if (!text) { console.log(`No extractable text in ${filename}`); return; }

  const chunks = chunkText(text);
  if (!chunks.length) { console.log(`No valid chunks in ${filename}`); return; }

  console.log(`Processing ${filename}: ${chunks.length} chunks`);

  for (const chunk of chunks) {
  try {
    const embedding = await embed(chunk);
    const { error } = await supabase.from("documents").insert({
      content: chunk,
      metadata: { source: filename },
      embedding,
    });
    if (error) console.error(`Insert error:`, error.message);
    else console.log(`Stored chunk from ${filename}`);
  } catch (err) {
    console.warn(`Skipping chunk: ${err.message}`);
  }
  await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log("Done");
}

const pdfPath = process.argv[2];
if (!pdfPath) {
  console.error("Usage: node scripts/indexDocuments.js <pdfPath>");
  process.exit(1);
}

ingestPDF(pdfPath).catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});