const fs = require("fs").promises;
const path = require("path");

async function run() {
  const termsPath = path.join(__dirname, "..", "src", "lib", "knowledge", "terms.json");
  const termsRaw = await fs.readFile(termsPath, "utf8");
  const terms = JSON.parse(termsRaw).terms || [];

  const files = [
    path.join(__dirname, "..", "src", "lib", "knowledge", "hasta-samudrika-shastra.clean.txt"),
    path.join(__dirname, "..", "src", "lib", "knowledge", "hanumat-jyotisham-prashna.clean.txt"),
    path.join(__dirname, "..", "src", "lib", "knowledge", "sample-palmistry.clean.txt"),
    path.join(__dirname, "..", "src", "lib", "knowledge", "hasta-samudrika-shastra.en.txt"),
    path.join(__dirname, "..", "src", "lib", "knowledge", "hanumat-jyotisham-prashna.en.txt"),
    path.join(__dirname, "..", "src", "lib", "knowledge", "sample-palmistry.en.txt"),
  ];

  const contents = (await Promise.all(files.map((f) => fs.readFile(f, "utf8")))).join("\n\n");
  const lower = contents.toLowerCase();

  const missing = [];
  for (const t of terms) {
    if (!lower.includes(t.toLowerCase())) missing.push(t);
  }

  if (missing.length) {
    console.log("Missing canonical terms in knowledge files:", missing.join(", "));
  } else {
    console.log("All canonical terms present.");
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
