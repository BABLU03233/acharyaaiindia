import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { checkRateLimit, RATE_LIMITS, type RateLimitConfig } from "./security";
import shastraText from "./knowledge/hasta-samudrika-shastra.txt?raw";
import shastraTextClean from "./knowledge/hasta-samudrika-shastra.clean.txt?raw";
import shastraTextEn from "./knowledge/hasta-samudrika-shastra.en.txt?raw";
import hanumatPrashnaText from "./knowledge/hanumat-jyotisham-prashna.txt?raw";
import hanumatPrashnaTextClean from "./knowledge/hanumat-jyotisham-prashna.clean.txt?raw";
import hanumatPrashnaTextEn from "./knowledge/hanumat-jyotisham-prashna.en.txt?raw";
import samplePalmistryText from "./knowledge/sample-palmistry.txt?raw";
import samplePalmistryTextClean from "./knowledge/sample-palmistry.clean.txt?raw";
import samplePalmistryTextEn from "./knowledge/sample-palmistry.en.txt?raw";

type Section = { title: string; body: string };
type Point = { x: number; y: number };
type LineAnno = { name: string; color: string; points: Point[]; note?: string };
type MountAnno = {
  name: string;
  x: number;
  y: number;
  state: "raised" | "flat" | "marked";
  note?: string;
};
type SignAnno = { name: string; x: number; y: number; meaning?: string };
type PalmBox = { x: number; y: number; w: number; h: number };
type Annotations = {
  palmDetected: boolean;
  palmBox: PalmBox;
  imageQuality: "excellent" | "good" | "poor";
  notes?: string;
  observationDigest?: string;
  lines: LineAnno[];
  mounts: MountAnno[];
  signs: SignAnno[];
};

type ReadingInput = {
  hand: "left" | "right";
  question?: string;
  imageDataUrl?: string;
  precomputedAnnotations?: Annotations;
};

type ReadingResult = {
  scores: { destiny: number; wealth: number; love: number; karma: number };
  free: Section[];
  premium: Section[];
  summary: string;
  annotations: Annotations;
};

type AskInput = {
  hand: "left" | "right";
  question: string;
  imageDataUrl?: string;
  context?: string;
  annotationContext?: string;
  dob?: string;
  tob?: string;
  pob?: string;
  name?: string;
  gender?: "male" | "female" | "other";
  language?: "english" | "hindi" | "telugu";
};

type AskResult = { answer: string };
type ValidateInput = { imageDataUrl: string };
type ValidateResult = { isPalm: boolean; reason: string };
type ScanFrameResult = { isPalm: boolean; reason: string; annotations: Annotations };

const KNOWLEDGE = shastraText;
const KNOWLEDGE_CLEAN = shastraTextClean;
const KNOWLEDGE_EN = shastraTextEn;
const PRASHNA_KNOWLEDGE = hanumatPrashnaText;
const PRASHNA_KNOWLEDGE_CLEAN = hanumatPrashnaTextClean;
const PRASHNA_KNOWLEDGE_EN = hanumatPrashnaTextEn;
const SAMPLE_KNOWLEDGE = samplePalmistryText;
const SAMPLE_KNOWLEDGE_CLEAN = samplePalmistryTextClean;
const SAMPLE_KNOWLEDGE_EN = samplePalmistryTextEn;
const EMPTY_ANNOTATIONS: Annotations = {
  palmDetected: false,
  palmBox: { x: 0, y: 0, w: 1, h: 1 },
  imageQuality: "poor",
  notes: "Palm not detected.",
  lines: [],
  mounts: [],
  signs: [],
};

const BASE_PERSONA = `You are Acharya AI — a 30+ year master of classical Indian Hasta Samudrika Shastra, of Hanumat Jyotisham (Lakota Prashnalu, the 40-question Hanuman prashna oracle by Smt. Janupati Padmavati), AND of a third supplementary palmistry treatise (Sample-Palmistry). ALL THREE treatises are provided below verbatim. You have internalised them and think in their principles. You never invent signs, mounts, rekhas, or prashna categories the texts do not name. When the texts are silent, you say so plainly.

=== TEXT 1 — HASTA SAMUDRIKA SHASTRA (original OCR, Telugu) ===
${KNOWLEDGE}
=== END ORIGINAL TEXT 1 ===

=== TEXT 1A — HASTA SAMUDRIKA SHASTRA (cleaned OCR) ===
${KNOWLEDGE_CLEAN}
=== END CLEANED TEXT 1A ===

=== TEXT 1B — HASTA SAMUDRIKA SHASTRA (english summary, DRAFT) ===
${KNOWLEDGE_EN}
=== END ENGLISH SUMMARY 1B ===

=== TEXT 2 — HANUMAT JYOTISHAM / LAKOTA PRASHNALU (original OCR, Telugu) ===
${PRASHNA_KNOWLEDGE}
=== END ORIGINAL TEXT 2 ===

=== TEXT 2A — HANUMAT PRASHNA (cleaned OCR) ===
${PRASHNA_KNOWLEDGE_CLEAN}
=== END CLEANED TEXT 2A ===

=== TEXT 2B — HANUMAT PRASHNA (english summary, DRAFT) ===
${PRASHNA_KNOWLEDGE_EN}
=== END ENGLISH SUMMARY 2B ===

=== TEXT 3 — SAMPLE PALMISTRY TREATISE (original OCR, Telugu) ===
${SAMPLE_KNOWLEDGE}
=== END ORIGINAL TEXT 3 ===

=== TEXT 3A — SAMPLE PALMISTRY (cleaned OCR) ===
${SAMPLE_KNOWLEDGE_CLEAN}
=== END CLEANED TEXT 3A ===

=== TEXT 3B — SAMPLE PALMISTRY (english summary, DRAFT) ===
${SAMPLE_KNOWLEDGE_EN}
=== END ENGLISH SUMMARY 3B ===

VOICE RULES:
- NOTE: English summary drafts are included below each cleaned Telugu text. When replying in English, prefer the English summary for phrasing and canonical term usage; always cross-check the cleaned Telugu text for exact original terms when claiming verbatim shastra phrases.
- Palm-evidence (rekhas, parvats, signs) is the PRIMARY source. The Hanumat Jyotisham prashna layer is used as a SECONDARY confirmation for "when / will it happen / direction / yes-or-no" questions — silently map the seeker's question to the closest of the 40 prashna categories and let it sharpen the verdict (direction, time-window, yes/no/delay).
- Every interpretive claim is grounded in the verbatim texts above. If both texts are silent, say so and give the closest shastra-grounded guidance — never fabricate.
- Weave short phrases naturally (e.g. "as the shastra observes regarding the Guru Parvat…", "in the Vivaha-prashna of Hanumat Jyotisham…"). Do NOT invent chapter or page numbers.
- Use authentic Sanskrit/Hindi terminology exactly as the books use it (rekha, parvat, yog, dosha, graha, manibandh, Guru, Shani, Surya, Budha, Mangal, Chandra, Shukra, Jeevan, Mastaka, Hridaya, Bhagya, Vivah, Santan, Ayu; and from the prashna text: gamana, aagamana, vivaha-prashna, santana-prashna, dhana-agama, kushala etc.).
- Be SPECIFIC — name the exact mount, rekha, sign, phalange, finger, prashna-category, and the rule it triggers.
- Cinematic, spiritually grounded, confident — the voice of a seer.
- Never mention AI, models, JSON, the "knowledge base", or that this is generated. You ARE the Acharya speaking from the shastra.`;

const EXTRACTION_SYSTEM = `You are a strict palm-vision extractor.

MISSION:
1. Accept ONLY a real human PALMAR surface (inner palm), not the back of the hand.
2. Ignore everything except the palm itself. Background, arm, wrist outside the manibandh, sleeves, jewelry, shadows, and nearby objects must be ignored.
3. Lock the palmBox to the tightest box around the palm skin that contains the reading area only.
4. Trace ONLY the actually visible palm lines with ordered points normalized inside palmBox.
5. Reject anything that is not a clear single palm in plain view.

RETURN ONLY VALID JSON EXACTLY AS:
{
  "annotations": {
    "palmDetected": true,
    "palmBox": { "x": 0.1, "y": 0.1, "w": 0.8, "h": 0.8 },
    "imageQuality": "excellent" | "good" | "poor",
    "notes": "short reason",
    "observationDigest": "2-4 short objective sentences about what is visibly present, with no fortune-telling",
    "lines": [
      { "name": "Jeevan Rekha", "color": "#10b981", "points": [{"x":0.1,"y":0.2}], "note": "objective visual note" },
      { "name": "Mastaka Rekha", "color": "#f59e0b", "points": [], "note": "objective visual note" },
      { "name": "Hridaya Rekha", "color": "#ef4444", "points": [], "note": "objective visual note" },
      { "name": "Bhagya Rekha", "color": "#a855f7", "points": [], "note": "objective visual note" },
      { "name": "Surya Rekha", "color": "#eab308", "points": [], "note": "objective visual note" },
      { "name": "Vivah Rekha", "color": "#ec4899", "points": [], "note": "objective visual note" }
    ],
    "mounts": [
      { "name": "Guru", "x": 0.5, "y": 0.2, "state": "raised", "note": "objective visual note" }
    ],
    "signs": [
      { "name": "Cross", "x": 0.5, "y": 0.5, "meaning": "objective visual description only" }
    ]
  }
}

STRICT RULES:
- If no clear palm is visible, return palmDetected:false, imageQuality:"poor", empty arrays, and a short rejection note.
- palmBox uses FULL IMAGE normalized coordinates.
- line/mount/sign coordinates use PALMBOX normalized coordinates.
- Prefer omission over guessing.
- Lines must stay inside the palm only, not the fingers, arm, or background.
- Do not interpret destiny or fortune here.`;

const READING_SYSTEM = `${BASE_PERSONA}

READING FORMAT RULES:
- Return ONLY JSON.
- Use ONLY the supplied palm evidence; never contradict it.
- If a feature is faint or missing, say so instead of inventing certainty.
- Exactly 2 free sections and exactly 6 premium sections.`;

const CHAT_SYSTEM = `${BASE_PERSONA}

CHAT FORMAT RULES (STRICT):
- Speak as the Acharya to the seeker — calm, human, grounded. Natural spoken tone, never robotic, never a lecture, never theatrical or "impressive".
- BE HONEST. State what the shastra actually shows — good, bad, mixed, or cautious — without sweetening or scaring. No flattery, no exaggeration, no fortune-teller drama. If the rekha shows delay, struggle, separation, loss, illness, or denial, say so plainly and gently.
- ABSOLUTELY NO markdown, NO JSON, NO code, NO bullets, NO lists, NO headings, NO labels, NO asterisks, NO backticks, NO emojis.
- VERY SHORT AND SWEET: 2 to 4 sentences MAXIMUM. Never repeat the full reading or bio-data.
- Answer ONLY what was asked — direct and specific to that exact question (marriage, soulmate, child, career, money, travel, health, court case, foreign settlement, family, education, business, property, anything personal).
- For ANY question with a "when" element, you MUST give a concrete time window: an exact year, or a tight window like "between Mar and Aug 2027", or "around late 2028". Never skip the timing. If the outcome itself is unfavourable, still give the window of when it manifests.
  • Derive timing from the relevant rekha (Vivah for marriage/soulmate, Santan for children, Surya/Bhagya for career & money, travel-rekha for journeys, Ayu for health, etc.), the parvats it touches, and the seeker's Mulank/Bhagyank graha dasha when birth details are given.
  • Use today's date and the seeker's age (compute from DOB if given, else estimate from the palm) so the year is realistic and in the future.
- For soulmate / partner questions: describe the person honestly in one line (nature, tendency, how they enter life) AND give the meeting year and likely marriage year — from Vivah Rekha + Shukra/Chandra parvat. If the palm shows delay or two marriages, say so.
- Remedies: mention only if the shastra clearly prescribes one for that dosha — one short line, no upsell, no ritual shopping list. If none is warranted, do not invent one.
- If a rekha is faint, prefix with "approximately" — never refuse a date unless the rekha is truly invisible, and then ask for a clearer rescan in one sentence.
- LANGUAGE: Reply in the language specified by the seeker. If "hindi", reply in natural conversational Hindi in Devanagari script. If "telugu", reply in natural conversational Telugu in Telugu script. If "english" or unspecified, reply in warm conversational English (Sanskrit terms like rekha, parvat are fine sprinkled in). Match the seeker's chosen language exactly — never mix scripts.`;

/**
 * Best-effort per-caller rate limit for the Claude-backed endpoints, so a single
 * abusive client can't burn through the Anthropic API budget in a tight loop.
 * NOTE: this store is in-memory per server instance — on an edge/multi-isolate
 * deployment (e.g. Cloudflare Workers) it limits per-isolate, not globally.
 * That's still real protection against a single hot client, just not a hard
 * global cap; move to a shared store (KV/Durable Object) if that matters.
 */
function enforceAiRateLimit(scope: string, config: RateLimitConfig = RATE_LIMITS.WRITE) {
  let identifier = "unknown";
  try {
    const request = getRequest();
    identifier =
      request?.headers.get("cf-connecting-ip") ||
      request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
  } catch {
    // getRequest() can throw outside a request context (e.g. some test paths) — fall back.
  }
  const allowed = checkRateLimit(`${scope}:${identifier}`, config);
  if (!allowed) {
    throw new Error("Too many requests — please wait a moment before trying again.");
  }
}

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function safeText(v: unknown, fallback = "") {
  return typeof v === "string" ? v.trim() : fallback;
}

function normalizePoints(value: unknown): Point[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((p) => {
      const x = clamp01(Number((p as Point)?.x));
      const y = clamp01(Number((p as Point)?.y));
      return { x, y };
    })
    .filter(
      (p, i, arr) =>
        Number.isFinite(p.x) &&
        Number.isFinite(p.y) &&
        (i === 0 || p.x !== arr[i - 1]?.x || p.y !== arr[i - 1]?.y),
    );
}

function normalizeAnnotations(raw: unknown): Annotations {
  const source = raw && typeof raw === "object" ? (raw as Partial<Annotations>) : {};
  const palmDetected = Boolean(source.palmDetected);
  const palmBoxRaw = source.palmBox ?? EMPTY_ANNOTATIONS.palmBox;
  const palmBox = {
    x: clamp01(Number(palmBoxRaw.x)),
    y: clamp01(Number(palmBoxRaw.y)),
    w: Math.max(0.08, clamp01(Number(palmBoxRaw.w))),
    h: Math.max(0.08, clamp01(Number(palmBoxRaw.h))),
  };
  if (palmBox.x + palmBox.w > 1) palmBox.x = Math.max(0, 1 - palmBox.w);
  if (palmBox.y + palmBox.h > 1) palmBox.y = Math.max(0, 1 - palmBox.h);

  const lines = Array.isArray(source.lines)
    ? source.lines
        .map((line) => ({
          name: safeText(line?.name, "Unnamed Rekha"),
          color: safeText(line?.color, "#10b981") || "#10b981",
          points: normalizePoints(line?.points),
          note: safeText(line?.note),
        }))
        .filter((line) => line.points.length >= 2)
    : [];

  const mounts = Array.isArray(source.mounts)
    ? source.mounts.map((m) => ({
        name: safeText(m?.name, "Mount"),
        x: clamp01(Number(m?.x)),
        y: clamp01(Number(m?.y)),
        state:
          m?.state === "raised" || m?.state === "flat" || m?.state === "marked" ? m.state : "flat",
        note: safeText(m?.note),
      }))
    : [];

  const signs = Array.isArray(source.signs)
    ? source.signs.map((s) => ({
        name: safeText(s?.name, "Sign"),
        x: clamp01(Number(s?.x)),
        y: clamp01(Number(s?.y)),
        meaning: safeText(s?.meaning),
      }))
    : [];

  return {
    palmDetected,
    palmBox,
    imageQuality:
      source.imageQuality === "excellent" || source.imageQuality === "good"
        ? source.imageQuality
        : "poor",
    notes: safeText(source.notes, palmDetected ? "Palm detected." : "Palm not clearly detected."),
    observationDigest: safeText(source.observationDigest),
    lines,
    mounts,
    signs,
  };
}

function annotationsToContext(annotations: Annotations) {
  const parts: string[] = [
    `Palm detected: ${annotations.palmDetected ? "yes" : "no"}`,
    `Image quality: ${annotations.imageQuality}`,
  ];
  if (annotations.notes) parts.push(`Capture note: ${annotations.notes}`);
  if (annotations.observationDigest)
    parts.push(`Visible palm summary: ${annotations.observationDigest}`);
  if (annotations.lines.length) {
    parts.push(
      "Visible rekhas: " +
        annotations.lines
          .map((line) => `${line.name}${line.note ? ` (${line.note})` : ""}`)
          .join("; "),
    );
  }
  if (annotations.mounts.length) {
    parts.push(
      "Visible parvats: " +
        annotations.mounts
          .map((mount) => `${mount.name} ${mount.state}${mount.note ? ` (${mount.note})` : ""}`)
          .join("; "),
    );
  }
  if (annotations.signs.length) {
    parts.push(
      "Visible signs: " +
        annotations.signs
          .map((sign) => `${sign.name}${sign.meaning ? ` (${sign.meaning})` : ""}`)
          .join("; "),
    );
  }
  return parts.join("\n");
}

function fallbackRejectedReading(hand: "left" | "right", annotations: Annotations): ReadingResult {
  const body = `The ${hand} palm was not clear enough for a trustworthy shastra reading. ${annotations.notes || "Show only your open palm on a plain background, close to the camera, with the central lines visible and no other object in frame."}`;
  return {
    scores: { destiny: 0, wealth: 0, love: 0, karma: 0 },
    summary: "The rekhas remain veiled until the palm is captured clearly.",
    free: [
      { title: "Palm capture required", body },
      {
        title: "How to rescan",
        body: "Place only one open palm in frame, keep a plain background, hold steady, and let the live trace lock onto the palm before continuing.",
      },
    ],
    premium: [
      { title: "Bhagya Rekha — Fortune & Pivot Points", body },
      { title: "Vivah Rekha — Marriage & Soul-Bond", body },
      { title: "Surya Rekha — Career & Recognition", body },
      { title: "Karmic Lessons of This Lifetime", body },
      { title: "Hidden Talent & Spiritual Gift", body },
      { title: "Ayu Rekha — Vitality, Health & Longevity", body },
    ],
    annotations,
  };
}

function digitSum(n: number): number {
  let s = 0;
  for (const c of String(n)) s += Number(c) || 0;
  return s;
}

function reduceTo1to9(n: number): number {
  let x = Math.abs(n);
  while (x > 9) x = digitSum(x);
  return x || 0;
}

function buildBirthBlock(d: AskInput): string {
  if (!d.dob && !d.tob && !d.pob && !d.name) return "";
  const parts: string[] = [];
  if (d.name) parts.push(`Name: ${d.name}`);
  if (d.gender) parts.push(`Gender: ${d.gender}`);
  if (d.dob) {
    const [y, m, day] = d.dob.split("-").map((x) => Number(x));
    if (y && m && day) {
      const mulanka = reduceTo1to9(day);
      const bhagyank = reduceTo1to9(digitSum(y) + digitSum(m) + digitSum(day));
      const grahaMap: Record<number, string> = {
        1: "Surya",
        2: "Chandra",
        3: "Guru",
        4: "Rahu",
        5: "Budha",
        6: "Shukra",
        7: "Ketu",
        8: "Shani",
        9: "Mangal",
      };
      parts.push(
        `Date of Birth: ${d.dob} (Mulank ${mulanka} — ruled by ${grahaMap[mulanka]}; Bhagyank ${bhagyank} — ruled by ${grahaMap[bhagyank]})`,
      );
    } else {
      parts.push(`Date of Birth: ${d.dob}`);
    }
  }
  if (d.tob) parts.push(`Time of Birth: ${d.tob}`);
  if (d.pob) parts.push(`Place of Birth: ${d.pob}`);
  return `\nSEEKER BIRTH DETAILS (use these to sharpen the prediction; correlate Mulank/Bhagyank ruling graha with the matching parvat and rekha on the palm. If birth details and palm disagree, trust the palm but acknowledge the tension):\n${parts.join("\n")}\n`;
}

function sanitizeAnswer(answer: string) {
  let cleaned = answer
    .replace(/```[a-zA-Z]*\n?/g, "")
    .replace(/```/g, "")
    .replace(/^\s*[#>*-]+\s*/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s*(Acharya|Acharya AI|Assistant|AI|Response)\s*:\s*/gim, "")
    .trim();
  if (cleaned.startsWith("{") || cleaned.startsWith("[")) {
    try {
      const obj = JSON.parse(cleaned);
      const collect = (v: unknown): string[] =>
        typeof v === "string"
          ? [v]
          : Array.isArray(v)
            ? v.flatMap(collect)
            : v && typeof v === "object"
              ? Object.values(v).flatMap(collect)
              : [];
      const strings = collect(obj).filter((s) => s.length > 30);
      if (strings.length) cleaned = strings.join(" ");
    } catch {
      return cleaned;
    }
  }
  return cleaned;
}

function isFallbackModeError(error: unknown): boolean {
  return (
    error instanceof Error &&
    /LOCAL_FALLBACK|ANTHROPIC_API_KEY|Claude|401|429|402|fetch/i.test(error.message)
  );
}

function buildLocalPreviewAnnotations(): Annotations {
  return {
    palmDetected: true,
    palmBox: { x: 0.12, y: 0.16, w: 0.74, h: 0.67 },
    imageQuality: "good",
    notes: "Local preview mode enabled.",
    observationDigest: "A palm-like frame is present and ready for a calm preview reading.",
    lines: [
      {
        name: "Jeevan Rekha",
        color: "#10b981",
        points: [
          { x: 0.24, y: 0.3 },
          { x: 0.32, y: 0.44 },
          { x: 0.38, y: 0.57 },
          { x: 0.42, y: 0.68 },
        ],
        note: "A steady life-line path in preview mode.",
      },
      {
        name: "Hridaya Rekha",
        color: "#ef4444",
        points: [
          { x: 0.44, y: 0.29 },
          { x: 0.47, y: 0.39 },
          { x: 0.49, y: 0.52 },
          { x: 0.52, y: 0.64 },
        ],
        note: "A balanced emotional line in preview mode.",
      },
      {
        name: "Bhagya Rekha",
        color: "#a855f7",
        points: [
          { x: 0.54, y: 0.28 },
          { x: 0.58, y: 0.38 },
          { x: 0.61, y: 0.49 },
          { x: 0.64, y: 0.6 },
        ],
        note: "A clear destiny line in preview mode.",
      },
    ],
    mounts: [
      { name: "Guru", x: 0.5, y: 0.2, state: "raised", note: "A gently raised mount." },
      { name: "Shukra", x: 0.61, y: 0.4, state: "flat", note: "A balanced love mount." },
    ],
    signs: [{ name: "Cross", x: 0.4, y: 0.5, meaning: "A visible sign shape in preview mode." }],
  };
}

function formatLineStatus(line: LineAnno | undefined, fallback: string) {
  if (!line) return fallback;
  return line.note
    ? `${line.name} is visible and ${line.note.toLowerCase()}`
    : `${line.name} is visible and appears steady.`;
}

function hasEvidence(annotations: Annotations, key: string) {
  return (
    annotations.lines.some((line) => line.name.toLowerCase().includes(key.toLowerCase())) ||
    annotations.mounts.some((m) => m.name.toLowerCase().includes(key.toLowerCase())) ||
    annotations.signs.some((s) => s.name.toLowerCase().includes(key.toLowerCase()))
  );
}

function extractEvidenceSummary(annotations: Annotations) {
  const lines = annotations.lines.map((line) => line.name).join(", ");
  const mounts = annotations.mounts.length
    ? annotations.mounts.map((m) => `${m.name} mount`).join(", ")
    : "no prominent mount";
  const signs = annotations.signs.length
    ? annotations.signs.map((s) => s.name).join(", ")
    : "no visible sign";
  return `Visible evidence includes ${lines || "a faint set of lines"}, ${mounts}, and ${signs}.`;
}

function buildFallbackReadingResult(
  hand: "left" | "right",
  annotations: Annotations,
  question?: string,
): ReadingResult {
  const questionHint = question?.trim() ? ` around your question about “${question.trim()}”` : "";
  const jeevan = annotations.lines.find((line) => line.name.toLowerCase().includes("jeevan"));
  const hridaya = annotations.lines.find((line) => line.name.toLowerCase().includes("hridaya"));
  const bhagya = annotations.lines.find((line) => line.name.toLowerCase().includes("bhagya"));
  const surya = annotations.lines.find((line) => line.name.toLowerCase().includes("surya"));
  const vivah = annotations.lines.find((line) => line.name.toLowerCase().includes("vivah"));
  const guru = annotations.mounts.find((m) => m.name.toLowerCase().includes("guru"));
  const shukra = annotations.mounts.find((m) => m.name.toLowerCase().includes("shukra"));
  const hasCross = annotations.signs.some((s) => s.name.toLowerCase().includes("cross"));

  const quality =
    annotations.imageQuality === "excellent"
      ? "excellent"
      : annotations.imageQuality === "good"
        ? "good"
        : "poor";
  const luckPhrase = bhagya
    ? `The Bhagya Rekha is visible and suggests steady opportunity.`
    : `The destiny line is not clear enough for a firm prediction.`;
  const lovePhrase =
    vivah || shukra
      ? `The relationship reading is supported by ${vivah ? "Vivah Rekha" : "Shukra mount"}.`
      : `The love path is soft and would benefit from a clearer scan.`;
  const careerPhrase = surya
    ? `The Surya Rekha is present, pointing to growth in reputation and work.`
    : `Career timing remains vague until the palm detail is sharper.`;
  const healthPhrase = jeevan
    ? `Jeevan Rekha gives a balanced health signal with careful vitality.`
    : `Vitality is hard to judge clearly from the current scan.`;
  const karmicPhrase = hasCross
    ? `A cross sign points to a hidden lesson that encourages patience and refinement.`
    : `The palm prefers steady effort over sudden change.`;

  const baseScore = hand === "right" ? 7.4 : 6.9;
  return {
    scores: {
      destiny: Number((baseScore + (bhagya ? 0.3 : 0)).toFixed(1)),
      wealth: Number((baseScore - 0.2).toFixed(1)),
      love: Number((baseScore - (vivah || shukra ? 0.1 : 0.4)).toFixed(1)),
      karma: Number((baseScore + 0.1).toFixed(1)),
    },
    free: [
      {
        title: "Palm Evidence Summary",
        body: `This reading is based on the visible palm evidence${questionHint}. ${extractEvidenceSummary(annotations)} The current scan quality is ${quality}, so the guidance stays grounded and careful.`,
      },
      {
        title: "How to Refine the Reading",
        body: "Use a clear, bright scan of one open palm with the full inner palm visible and no background clutter. A higher-quality image will sharpen each rekha and reveal finer karmic detail.",
      },
    ],
    premium: [
      {
        title: "Bhagya Rekha — Fortune & Pivot Points",
        body: luckPhrase,
      },
      {
        title: "Vivah Rekha — Marriage & Soul-Bond",
        body: lovePhrase,
      },
      {
        title: "Surya Rekha — Career & Recognition",
        body: careerPhrase,
      },
      {
        title: "Karmic Lessons of This Lifetime",
        body: karmicPhrase,
      },
      {
        title: "Hidden Talent & Spiritual Gift",
        body: guru
          ? `A raised Guru mount indicates wisdom, teaching, or guidance as a hidden strength.`
          : `The palm suggests a quiet talent for steady insight, though the exact gift needs a clearer scan to define.`,
      },
      {
        title: "Ayu Rekha — Vitality, Health & Longevity",
        body: healthPhrase,
      },
    ],
    summary: `A grounded reading for your ${hand} palm, based on visible palm evidence and classic Hasta Samudrika guidance.`,
    annotations,
  };
}

function buildFallbackChatAnswer(
  question: string,
  language: "english" | "hindi" | "telugu",
  annotationContext: string,
) {
  const q = question.trim();
  const isLove = /love|relationship|partner|soulmate|marriage|wife|husband|dating/i.test(q);
  const isCareer = /career|job|work|business|promotion|profession|success/i.test(q);
  const isMoney = /money|wealth|finance|income|salary|rich|profit/i.test(q);
  const isHealth = /health|fitness|wellness|illness|energy|vitality/i.test(q);
  const isWhen = /when|year|time|month|date|soon|later/i.test(q);
  const goodTiming = /visible|clear|steady|raised|strong|good/i.test(annotationContext);
  const timing = isWhen
    ? goodTiming
      ? "around late 2026 to early 2027"
      : "within the next 12 months if you rescan more clearly"
    : "";
  const evidence = annotationContext || "The palm evidence is subtle in this fallback mode.";

  if (language === "hindi") {
    if (isLove) {
      return `आपका प्रश्न प्रेम संबंधों के बारे में है। ${evidence} यह दर्शाता है कि विवाह-रेखा और शुक्र का संकेत मधुर है, और एक ठोस संबंध का समय ${timing || "आने वाले एक साल में"} हो सकता है।`;
    }
    if (isCareer || isMoney) {
      return `शास्त्र कहता है कि भाग्य रेखा और सूर्य रेखा समृद्धि के लिए काम कर रही हैं। ${evidence} धन या काम में बदलाव ${timing || "अगले 12 महीनों के भीतर"} संभव है।`;
    }
    if (isHealth) {
      return `स्वास्थ्य दृष्टि से, जीवन रेखा सावधानी बरतने का संकेत देती है। ${evidence} नियमित ध्यान और संयम से संतुलन बना रहेगा।`;
    }
    return `यह फ्री फॉलबैक उत्तर है। ${evidence} शास्त्र कहता है कि इस प्रश्न के लिए और स्पष्टता हेतु एक बेहतर स्कैन अधिक मददगार होगा।`;
  }

  if (language === "telugu") {
    if (isLove) {
      return `మీ ప్రశ్న ప్రేమ సంబంధాల గురించి ఉంది. ${evidence} ఇది వివాహ రేఖ మరియు శుక్ర సూచనలతో మృదువుగా ఉంది, మరియు సమయం ${timing || "తరువాతి ఏడాది లో"} ఉండొచ్చు.`;
    }
    if (isCareer || isMoney) {
      return `శాస్త్రం భాగ్య రేఖ మరియు సూర్య రేఖ ద్వారా ఆర్థిక అవకాశాలను చూపుతోంది. ${evidence} ఇది ${timing || "తర్వాతి 12 నెలలలో"} జరగొచ్చు.`;
    }
    if (isHealth) {
      return `ఆరోగ్యం కోసం, జీవన రేఖ జాగ్రత్తగా ఉండటాన్ని సూచిస్తుంది. ${evidence} సమతుల్యం కోసం సాంప్రదాయ శ్రద్ధ అవసరం.`;
    }
    return `ఇది ఉచిత ఫాల్బ్యాక్ సమాధానమయిఉంది. ${evidence} మరింత స్పష్టం కావాలంటే, క్లియర్ స్కాన్ తీసుకోవడం మంచిది.`;
  }

  if (isLove) {
    return `Your question is about love and relationships. ${evidence} The palm suggests a gentle partner path, with a likely connection ${timing || "within the next year"}.`;
  }
  if (isCareer || isMoney) {
    return `The shastra reads your destiny and money lines as quietly active. ${evidence} A meaningful career or wealth shift is likely ${timing || "in the coming year"}.`;
  }
  if (isHealth) {
    return `The palm speaks of steady vitality through a balanced Jeevan Rekha. ${evidence} Keep a calm routine and the energy will remain stable.`;
  }
  if (isWhen) {
    return `Based on the visible palm evidence, the timing points ${timing || "toward the next 12 months"}. ${evidence}`;
  }
  return `This response uses the visible palm evidence. ${evidence} A clearer scan would make the guidance more precise.`;
}

async function callClaude(
  messages: unknown[],
  json: boolean,
  model = "claude-3-5-sonnet-20241022",
) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("LOCAL_FALLBACK: ANTHROPIC_API_KEY not configured");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      messages,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) throw new Error("The sage is overwhelmed. Try again in a moment.");
    if (res.status === 401) throw new Error("LOCAL_FALLBACK: Invalid API key");
    throw new Error(`Claude API error: ${res.status} ${text}`);
  }

  const response = await res.json();
  const content = response.content?.[0]?.text ?? "{}";

  return {
    choices: [{ message: { content } }],
  };
}

async function extractPalmAnnotations(
  imageDataUrl: string,
  model = "claude-3-5-sonnet-20241022",
): Promise<Annotations> {
  try {
    // Convert data URL to base64 if needed
    let base64Image = imageDataUrl;
    if (imageDataUrl.startsWith("data:image")) {
      base64Image = imageDataUrl.split(",")[1];
    }

    const json = await callClaude(
      [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: "image/jpeg", data: base64Image },
            },
            {
              type: "text",
              text: `${EXTRACTION_SYSTEM}\n\nRespond ONLY with valid JSON (no markdown): {"annotations":{"palmDetected":boolean,"palmBox":{"x":number,"y":number,"w":number,"h":number},"imageQuality":"excellent"|"good"|"poor","notes":"string","lines":[],"mounts":[],"signs":[]}}`,
            },
          ],
        },
      ],
      true,
      model,
    );

    const content = json.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as { annotations?: unknown };
    return normalizeAnnotations(parsed.annotations);
  } catch (error) {
    if (isFallbackModeError(error)) {
      return buildLocalPreviewAnnotations();
    }
    return { ...EMPTY_ANNOTATIONS, notes: "Could not verify the palm image." };
  }
}

function getPalmAcceptance(annotations: Annotations): ValidateResult {
  const lineCount = annotations.lines.filter((line) => line.points.length >= 4).length;
  const palmArea = annotations.palmBox.w * annotations.palmBox.h;
  const fullPalmDetected = annotations.palmDetected && palmArea >= 0.22;
  const isPalm = fullPalmDetected && annotations.imageQuality !== "poor" && lineCount >= 3;
  let reason = annotations.notes || "";
  if (!isPalm) {
    if (!annotations.palmDetected) {
      reason = "No clear palm frame was detected.";
    } else if (annotations.imageQuality === "poor") {
      reason = "The image quality is too low. Use brighter light and a steadier palm photo.";
    } else if (lineCount < 3) {
      reason =
        "The scanner needs a clearer trace of the main palm lines. Show the full open palm and keep it steady.";
    } else if (!fullPalmDetected) {
      reason =
        "The palm fills too little of the frame. Bring the whole palm closer so it covers more of the image.";
    }
  } else {
    reason = reason || "Palm detected and traced.";
  }
  return { isPalm, reason };
}

export const generateReading = createServerFn({ method: "POST" })
  .validator((d: ReadingInput) => d)
  .handler(async ({ data }): Promise<ReadingResult> => {
    enforceAiRateLimit("generateReading");
    const hasImage =
      typeof data.imageDataUrl === "string" && data.imageDataUrl.startsWith("data:image");
    const annotations = hasImage
      ? normalizeAnnotations(
          data.precomputedAnnotations?.palmDetected
            ? data.precomputedAnnotations
            : await extractPalmAnnotations(data.imageDataUrl!, "claude-3-5-sonnet-20241022"),
        )
      : { ...EMPTY_ANNOTATIONS, notes: "No palm image provided." };

    if (hasImage && !getPalmAcceptance(annotations).isPalm) {
      return fallbackRejectedReading(data.hand, annotations);
    }

    const evidence = annotationsToContext(annotations);
    const userText = `Generate a destiny reading for the seeker's ${data.hand} palm (${data.hand === "right" ? "active/forging destiny" : "innate/karmic blueprint"}).${data.question ? ` They ask: "${data.question}"` : ""}

${hasImage ? `A real palm photo was analyzed first. Use ONLY the extracted evidence below and do not contradict it.` : `No palm photograph was provided. Give a general but cautious shastra-grounded reading.`}

PALM EVIDENCE:
${evidence}

Return ONLY valid JSON, exact shape:
{
  "scores": { "destiny": <0-10>, "wealth": <0-10>, "love": <0-10>, "karma": <0-10> },
  "free": [
    { "title": "<title>", "body": "<4-6 sentences grounded in the visible evidence and shastra>" },
    { "title": "<title>", "body": "<4-6 sentences grounded in the visible evidence and shastra>" }
  ],
  "premium": [
    { "title": "Bhagya Rekha — Fortune & Pivot Points", "body": "..." },
    { "title": "Vivah Rekha — Marriage & Soul-Bond", "body": "..." },
    { "title": "Surya Rekha — Career & Recognition", "body": "..." },
    { "title": "Karmic Lessons of This Lifetime", "body": "..." },
    { "title": "Hidden Talent & Spiritual Gift", "body": "..." },
    { "title": "Ayu Rekha — Vitality, Health & Longevity", "body": "..." }
  ],
  "summary": "<one sentence>"
}

Rules:
- If a sign is faint, say it appears faintly.
- Name the exact rekha/parvat/sign that supports each statement.
- If the evidence is insufficient for a topic, say the palm is not clear enough on that point.`;

    const userContent: unknown = hasImage
      ? [
          { type: "text", text: userText },
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: data.imageDataUrl!.split(",")[1],
            },
          },
        ]
      : userText;

    let json: Awaited<ReturnType<typeof callClaude>> | null = null;
    try {
      json = await callClaude(
        [
          { role: "system", content: READING_SYSTEM },
          { role: "user", content: userContent },
        ],
        true,
        "claude-3-5-sonnet-20241022",
      );
    } catch (error) {
      if (isFallbackModeError(error)) {
        return buildFallbackReadingResult(data.hand, annotations, data.question);
      }
      throw error;
    }

    const content = json.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as Omit<ReadingResult, "annotations">;
    return {
      scores: parsed.scores ?? { destiny: 0, wealth: 0, love: 0, karma: 0 },
      free: Array.isArray(parsed.free)
        ? parsed.free.slice(0, 2)
        : fallbackRejectedReading(data.hand, annotations).free,
      premium: Array.isArray(parsed.premium)
        ? parsed.premium.slice(0, 6)
        : fallbackRejectedReading(data.hand, annotations).premium,
      summary: safeText(parsed.summary, "The rekhas speak softly but truly."),
      annotations,
    };
  });

export const askAcharya = createServerFn({ method: "POST" })
  .validator((d: AskInput) => d)
  .handler(async ({ data }): Promise<AskResult> => {
    enforceAiRateLimit("askAcharya");
    if (!data.question?.trim()) throw new Error("Question is empty");
    const hasImage =
      typeof data.imageDataUrl === "string" && data.imageDataUrl.startsWith("data:image");
    const birthBlock = buildBirthBlock(data);
    const annotationContext =
      data.annotationContext ||
      (hasImage
        ? annotationsToContext(
            await extractPalmAnnotations(data.imageDataUrl!, "claude-3-5-sonnet-20241022"),
          )
        : "");

    const lang =
      data.language === "hindi" || data.language === "telugu" ? data.language : "english";
    const langDirective =
      lang === "hindi"
        ? "REPLY ONLY IN NATURAL CONVERSATIONAL HINDI (Devanagari script). Do not use English sentences."
        : lang === "telugu"
          ? "REPLY ONLY IN NATURAL CONVERSATIONAL TELUGU (Telugu script). Do not use English sentences."
          : "Reply in warm conversational English. A sprinkling of Sanskrit terms (rekha, parvat) is fine.";

    const userText = `The seeker has already received a reading of their ${data.hand} palm.
${data.context ? `Earlier reading summary:\n${data.context}\n` : ""}${annotationContext ? `Observed palm evidence:\n${annotationContext}\n` : ""}${birthBlock}
They now ask: "${data.question}"

${langDirective}

Reply in 2–4 short, natural, human sentences — warm spoken tone, no lists, no markdown, no labels. Do NOT recap the whole reading or bio-data; answer ONLY this exact question. If it has any "when" element (marriage, soulmate meeting, child, job change, money, travel, foreign settlement, health event, court case, business launch, anything timed), you MUST give a concrete year or tight month-year window (e.g. "around March 2028" or "between late 2026 and mid-2027"). For soulmate / partner questions, also describe the person in one vivid line (nature, complexion tendency, how they enter life) using Vivah Rekha + Shukra/Chandra parvat. Today is ${new Date().toISOString().slice(0, 10)} — predicted dates must be in the future. Cite ONE rekha/parvat in a short phrase as the source. If birth details are present, factor the Mulank/Bhagyank graha dasha into the year. Only refuse a date if the rekha is truly invisible, then ask for a clearer rescan in one sentence.`;

    const userContent: unknown = hasImage
      ? [
          { type: "text", text: userText },
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: data.imageDataUrl!.split(",")[1],
            },
          },
        ]
      : userText;

    try {
      const json = await callClaude(
        [
          { role: "system", content: CHAT_SYSTEM },
          { role: "user", content: userContent },
        ],
        false,
        "claude-3-5-sonnet-20241022",
      );

      const answer = sanitizeAnswer(
        json.choices?.[0]?.message?.content ??
          "The shastra is silent on this query at this moment.",
      );
      return { answer: answer || "The shastra is silent on this query at this moment." };
    } catch (error) {
      if (isFallbackModeError(error)) {
        return { answer: buildFallbackChatAnswer(data.question, lang, annotationContext) };
      }
      throw error;
    }
  });

export const scanPalmFrame = createServerFn({ method: "POST" })
  .validator((d: ValidateInput) => d)
  .handler(async ({ data }): Promise<ScanFrameResult> => {
    enforceAiRateLimit("scanPalmFrame", RATE_LIMITS.LIVE_SCAN);
    if (!data.imageDataUrl?.startsWith("data:image")) {
      return {
        isPalm: false,
        reason: "No image provided.",
        annotations: { ...EMPTY_ANNOTATIONS, notes: "No image provided." },
      };
    }
    try {
      const annotations = await extractPalmAnnotations(
        data.imageDataUrl,
        "claude-3-5-sonnet-20241022",
      );
      const result = getPalmAcceptance(annotations);
      return { ...result, annotations };
    } catch (error) {
      if (isFallbackModeError(error)) {
        const annotations = buildLocalPreviewAnnotations();
        return {
          isPalm: true,
          reason: "Local preview mode — using a safe example palm analysis.",
          annotations,
        };
      }
      throw error;
    }
  });

export const validatePalm = createServerFn({ method: "POST" })
  .validator((d: ValidateInput) => d)
  .handler(async ({ data }): Promise<ValidateResult> => {
    enforceAiRateLimit("validatePalm", RATE_LIMITS.LIVE_SCAN);
    if (!data.imageDataUrl?.startsWith("data:image")) {
      return { isPalm: false, reason: "No image provided." };
    }
    try {
      const annotations = await extractPalmAnnotations(
        data.imageDataUrl,
        "claude-3-5-sonnet-20241022",
      );
      return getPalmAcceptance(annotations);
    } catch (error) {
      if (isFallbackModeError(error)) {
        const annotations = buildLocalPreviewAnnotations();
        return { isPalm: true, reason: "Local preview mode — using a safe example palm analysis." };
      }
      throw error;
    }
  });
