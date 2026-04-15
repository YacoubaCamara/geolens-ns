const fs = require("fs");
const path = require("path");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const { createClient } = require("@supabase/supabase-js");

require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});

const execFileAsync = promisify(execFile);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function getEmbedder() {
  const { pipeline } = await import("@xenova/transformers");
  return pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
}

async function embed(embedder, text) {
  const output = await embedder(text, {
    pooling: "mean",
    normalize: true,
  });
  return Array.from(output.data);
}

function cleanText(text) {
  return (text || "").replace(/\s+/g, " ").trim();
}

function chunkText(text, chunkSize = 500, overlap = 100) {
  const cleaned = cleanText(text);
  if (!cleaned) return [];

  const words = cleaned.split(" ");
  const chunks = [];

  let i = 0;
  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(" ").trim();
    if (chunk) chunks.push(chunk);

    if (chunkSize <= overlap) {
      throw new Error("chunkSize must be greater than overlap");
    }

    i += chunkSize - overlap;
  }

  return chunks;
}

async function extractWithPdfToText(filePath) {
  const { stdout } = await execFileAsync("pdftotext", [filePath, "-"]);
  return cleanText(stdout);
}

async function repairPdf(filePath) {
  const repairedPath = `${filePath}.repaired.pdf`;
  await execFileAsync("qpdf", ["--linearize", filePath, repairedPath]);
  return repairedPath;
}

async function ocrPdf(filePath) {
  const ocrPath = `${filePath}.ocr.pdf`;
  await execFileAsync("ocrmypdf", ["-q", filePath, ocrPath]);
  return ocrPath;
}

async function extractText(filePath) {
  try {
    const text = await extractWithPdfToText(filePath);
    if (text) {
      console.log("Text extracted with pdftotext");
      return text;
    }
  } catch (error) {
    console.warn(`pdftotext failed: ${error.message}`);
  }

  try {
    const repairedPath = await repairPdf(filePath);
    const text = await extractWithPdfToText(repairedPath);
    if (text) {
      console.log("Text extracted after qpdf repair");
      return text;
    }
  } catch (error) {
    console.warn(`qpdf repair failed: ${error.message}`);
  }

  try {
    const ocrPath = await ocrPdf(filePath);
    const text = await extractWithPdfToText(ocrPath);
    if (text) {
      console.log("Text extracted after OCR");
      return text;
    }
  } catch (error) {
    console.warn(`OCR failed: ${error.message}`);
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

  if (!text) {
    console.log(`No extractable text found in ${filename}`);
    return;
  }

  const chunks = chunkText(text);

  if (chunks.length === 0) {
    console.log(`No valid chunks found in ${filename}`);
    return;
  }

  console.log(`Processing ${filename}: ${chunks.length} chunks`);

  const embedder = await getEmbedder();

  for (const chunk of chunks) {
    const embedding = await embed(embedder, chunk);

    const { error } = await supabase.from("documents").insert({
      content: chunk,
      metadata: { source: filename },
      embedding,
    });

    if (error) {
      console.error(`Insert error for ${filename}:`, error.message);
    } else {
      console.log(`Stored chunk from ${filename}`);
    }
  }

  console.log("Done");
}

const pdfPath = process.argv[2];

if (!pdfPath) {
  console.error("Usage: node scripts/indexDocuments.js <pdfPath>");
  process.exit(1);
}

ingestPDF(pdfPath).catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});