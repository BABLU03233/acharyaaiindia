const fs = require("fs").promises;
const path = require("path");

const files = [
  "src/lib/knowledge/hasta-samudrika-shastra.txt",
  "src/lib/knowledge/hanumat-jyotisham-prashna.txt",
  "src/lib/knowledge/sample-palmistry.txt",
];

function cleanText(s) {
  if (!s) return s;
  let out = s;
  out = out.replace(/\(.*?OKEN Scanner.*?\)/gi, "");
  out = out.replace(/\`/g, "");
  out = out.replace(/[\u200B-\u200F]/g, "");
  out = out.replace(/\s+\n/g, "\n");
  out = out.replace(/\n{3,}/g, "\n\n");
  out = out.replace(/[“”]/g, '"');
  out = out.replace(/[‘’]/g, "'");
  out = out.replace(/\s+$/gm, "");
  out = out.trim();
  return out;
}

async function run() {
  for (const f of files) {
    try {
      const p = path.join(__dirname, "..", f);
      const raw = await fs.readFile(p, "utf8");
      const cleaned = cleanText(raw);
      const outPath = p.replace(/\.txt$/i, ".clean.txt");
      await fs.writeFile(outPath, cleaned, "utf8");
      console.log(`Wrote cleaned: ${outPath}`);
    } catch (err) {
      console.error("Failed to clean", f, err.message || err);
    }
  }
}

run();
