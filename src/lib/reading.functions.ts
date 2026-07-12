import { createServerFn } from "@tanstack/react-start";
import shastraText from "./knowledge/hasta-samudrika-shastra.txt?raw";
import hanumatPrashnaText from "./knowledge/hanumat-jyotisham-prashna.txt?raw";
import samplePalmistryText from "./knowledge/sample-palmistry.txt?raw";

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
const PRASHNA_KNOWLEDGE = hanumatPrashnaText;
const SAMPLE_KNOWLEDGE = samplePalmistryText;
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

=== TEXT 1 — HASTA SAMUDRIKA SHASTRA (full 426-page treatise, verbatim OCR) ===
${KNOWLEDGE}
=== END TEXT 1 ===

=== TEXT 2 — HANUMAT JYOTISHAM / LAKOTA PRASHNALU (Padmavati, full 70-page verbatim OCR) ===
${PRASHNA_KNOWLEDGE}
=== END TEXT 2 ===

=== TEXT 3 — SAMPLE PALMISTRY TREATISE (supplementary, verbatim OCR, page 1 ignored as instructed) ===
${SAMPLE_KNOWLEDGE}
=== END TEXT 3 ===

VOICE RULES:
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
  return error instanceof Error && /LOCAL_FALLBACK|ANTHROPIC_API_KEY|Claude|401|429|402|fetch/i.test(error.message);
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
          { x: 0.32, y: 0.48 },
          { x: 0.38, y: 0.64 },
        ],
        note: "A steady life-line path in preview mode.",
      },
      {
        name: "Hridaya Rekha",
        color: "#ef4444",
        points: [
          { x: 0.44, y: 0.29 },
          { x: 0.46, y: 0.45 },
          { x: 0.48, y: 0.6 },
        ],
        note: "A balanced emotional line in preview mode.",
      },
      {
        name: "Bhagya Rekha",
        color: "#a855f7",
        points: [
          { x: 0.54, y: 0.28 },
          { x: 0.58, y: 0.42 },
          { x: 0.61, y: 0.57 },
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

function buildFallbackReadingResult(
  hand: "left" | "right",
  annotations: Annotations,
  question?: string,
): ReadingResult {
  const base = hand === "right" ? 7.4 : 6.9;
  const questionHint = question?.trim() ? ` around your question about “${question.trim()}”` : "";
  return {
    scores: {
      destiny: Number((base + 0.2).toFixed(1)),
      wealth: Number((base - 0.4).toFixed(1)),
      love: Number((base - 0.2).toFixed(1)),
      karma: Number((base + 0.1).toFixed(1)),
    },
    free: [
      {
        title: "Local Preview — A Gentle Reading",
        body: `In local preview mode, the ${hand} palm suggests a thoughtful path${questionHint}. The shastra is not yet fully activated, so the guidance is intentionally calm, grounded, and open to refinement.`,
      },
      {
        title: "How to Strengthen the Reading",
        body: "Use a bright, centered palm photo with the full palm visible and no clutter. A clearer image helps the reading become more specific, precise, and spiritually sharper.",
      },
    ],
    premium: [
      {
        title: "Bhagya Rekha — Fortune & Pivot Points",
        body: "The path shows steady movement with a few key turning points. A clearer scan will sharpen the timing and the direction of growth.",
      },
      {
        title: "Vivah Rekha — Marriage & Soul-Bond",
        body: "The emotional line suggests a meaningful connection in time, but the exact window needs a stronger scan to reveal the full pattern.",
      },
      {
        title: "Surya Rekha — Career & Recognition",
        body: "Professional visibility appears promising. The reading is optimistic but still benefits from a more detailed palm image.",
      },
      {
        title: "Karmic Lessons of This Lifetime",
        body: "The palm asks for patience, steadiness, and disciplined action. The lesson is not punishment — it is refinement.",
      },
      {
        title: "Hidden Talent & Spiritual Gift",
        body: "There is a quiet gift for perception, guidance, or expression. It becomes clearer when the palm lines are captured with more precision.",
      },
      {
        title: "Ayu Rekha — Vitality, Health & Longevity",
        body: "The energy flow is balanced and adaptable. A calm routine and consistent care will support long-term vitality.",
      },
    ],
    summary: `A grounded local-preview reading for your ${hand} palm, tuned for clarity and reflection.`,
    annotations,
  };
}

function buildFallbackChatAnswer(question: string, language: "english" | "hindi" | "telugu") {
  const normalized = question.trim() || "your question";
  if (language === "hindi") {
    return `यह स्थानीय पूर्वावलोकन मोड में है। आपके प्रश्न “${normalized}” के लिए शास्त्र की बात बहुत शांत और सावधानीपूर्ण तरीके से आगे बढ़ रही है। clearer palm scan से जवाब और सटीक हो जाता है।`;
  }
  if (language === "telugu") {
    return `ఇది స్థానిక ప్రివ్యూ మోడ్‌లో ఉంది. మీ ప్రశ్న “${normalized}” కోసం శాస్త్రం చాలా మృదువైన మరియు జాగ్రత్తగా మాట్లాడుతోంది. clearer palm scan తో సమాధానం మరింత ఖచ్చితంగా అర్థమవుతుంది.`;
  }
  return `This is a calm local-preview response. Your question, “${normalized}”, is being answered gently and cautiously, and a clearer palm scan will make the guidance more precise.`;
}

async function callClaude(messages: unknown[], json: boolean, model = "claude-3-5-sonnet-20241022") {
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
      messages: messages as any,
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
    choices: [{ message: { content } }]
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
        { role: "user", content: [
          {
            type: "image",
            source: { type: "base64", media_type: "image/jpeg", data: base64Image },
          } as any,
          {
            type: "text",
            text: `${EXTRACTION_SYSTEM}\n\nRespond ONLY with valid JSON (no markdown): {"annotations":{"palmDetected":boolean,"palmBox":{"x":number,"y":number,"w":number,"h":number},"imageQuality":"excellent"|"good"|"poor","notes":"string","lines":[],"mounts":[],"signs":[]}}`,
          },
        ] },
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
  const isPalm = annotations.palmDetected && annotations.imageQuality !== "poor" && lineCount >= 2;
  const reason = isPalm
    ? annotations.notes || "Palm detected and traced."
    : annotations.notes ||
      "Show only one open palm in a plain background with the center of the palm clearly visible.";
  return { isPalm, reason };
}

export const generateReading = createServerFn({ method: "POST" })
  .validator((d: ReadingInput) => d)
  .handler(async ({ data }): Promise<ReadingResult> => {
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
              data: data.imageDataUrl!.split(",")[1] 
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

    const lang = data.language === "hindi" || data.language === "telugu" ? data.language : "english";
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
              data: data.imageDataUrl!.split(",")[1] 
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
        json.choices?.[0]?.message?.content ?? "The shastra is silent on this query at this moment.",
      );
      return { answer: answer || "The shastra is silent on this query at this moment." };
    } catch (error) {
      if (isFallbackModeError(error)) {
        return { answer: buildFallbackChatAnswer(data.question, lang) };
      }
      throw error;
    }
  });

export const scanPalmFrame = createServerFn({ method: "POST" })
  .validator((d: ValidateInput) => d)
  .handler(async ({ data }): Promise<ScanFrameResult> => {
    if (!data.imageDataUrl?.startsWith("data:image")) {
      return {
        isPalm: false,
        reason: "No image provided.",
        annotations: { ...EMPTY_ANNOTATIONS, notes: "No image provided." },
      };
    }
    try {
      const annotations = await extractPalmAnnotations(data.imageDataUrl, "claude-3-5-sonnet-20241022");
      const result = getPalmAcceptance(annotations);
      return { ...result, annotations };
    } catch (error) {
      if (isFallbackModeError(error)) {
        const annotations = buildLocalPreviewAnnotations();
        return { isPalm: true, reason: "Local preview mode — using a safe example palm analysis.", annotations };
      }
      throw error;
    }
  });

export const validatePalm = createServerFn({ method: "POST" })
  .validator((d: ValidateInput) => d)
  .handler(async ({ data }): Promise<ValidateResult> => {
    if (!data.imageDataUrl?.startsWith("data:image")) {
      return { isPalm: false, reason: "No image provided." };
    }
    try {
      const annotations = await extractPalmAnnotations(data.imageDataUrl, "claude-3-5-sonnet-20241022");
      return getPalmAcceptance(annotations);
    } catch (error) {
      if (isFallbackModeError(error)) {
        const annotations = buildLocalPreviewAnnotations();
        return { isPalm: true, reason: "Local preview mode — using a safe example palm analysis." };
      }
      throw error;
    }
  });
