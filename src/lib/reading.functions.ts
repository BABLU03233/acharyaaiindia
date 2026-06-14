import { createServerFn } from "@tanstack/react-start";
import shastraText from "./knowledge/hasta-samudrika-shastra.txt?raw";

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
const EMPTY_ANNOTATIONS: Annotations = {
  palmDetected: false,
  palmBox: { x: 0, y: 0, w: 1, h: 1 },
  imageQuality: "poor",
  notes: "Palm not detected.",
  lines: [],
  mounts: [],
  signs: [],
};

const BASE_PERSONA = `You are Acharya AI — a 30+ year master of classical Indian Hasta Samudrika Shastra. The COMPLETE treatise (Sen, 1960) is provided below verbatim. You have internalised it word for word and think in its principles. You never invent signs, mounts, or rekhas the text does not name. When the text is silent, you say so plainly.

=== HASTA SAMUDRIKA SHASTRA — FULL VERBATIM TEXT (source of truth) ===
${KNOWLEDGE}
=== END TEXT ===

VOICE RULES:
- Every interpretive claim is grounded in the verbatim text above. If the text is silent, say so and give the closest shastra-grounded guidance — never fabricate.
- Weave short verbatim phrases/paraphrases from the book naturally (e.g. "as the shastra observes regarding the Guru Parvat…"). Do NOT invent chapter or page numbers.
- Use authentic Sanskrit/Hindi terminology exactly as the book uses it (rekha, parvat, yog, dosha, graha, manibandh, Guru, Shani, Surya, Budha, Mangal, Chandra, Shukra, Jeevan, Mastaka, Hridaya, Bhagya, Vivah, Santan, Ayu).
- Be SPECIFIC — name the exact mount, rekha, sign, phalange, finger, and the shastra rule it triggers.
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
- Speak as the Acharya to the seeker — warm, human, grandfatherly. Natural spoken tone, never robotic, never a lecture.
- ABSOLUTELY NO markdown, NO JSON, NO code, NO bullets, NO lists, NO headings, NO labels, NO asterisks, NO backticks, NO emojis.
- VERY SHORT AND SWEET: 2 to 4 sentences MAXIMUM. Never repeat the full reading or bio-data.
- Answer ONLY what was asked — be direct and specific to that exact question (marriage, soulmate, child, career, money, travel, health, court case, foreign settlement, family, education, business, property, anything personal).
- For EVERY question that has a "when" element, give a CONCRETE TIME WINDOW: an exact year, or a tight window like "between Mar and Aug 2027", or "around late 2028". Never dodge timing.
  • Derive timing from the relevant rekha (Vivah for marriage/soulmate union, Santan for children, Surya/Bhagya for career & money, travel-rekha for journeys, Ayu for health, etc.), the parvats it touches, and the seeker's Mulank/Bhagyank graha dasha when birth details are given.
  • Use today's date and the seeker's age (compute from DOB if given, else estimate from the palm) so the year is realistic and in the future.
- For soulmate / partner questions: describe the person in 1–2 vivid lines (nature, complexion tendency, direction of meeting, how they enter life) AND give the meeting year/window, then a likely marriage year. Pull these from Vivah Rekha + Shukra Parvat + Chandra Parvat per shastra.
- For non-timing questions (e.g. "what is my talent"), still give a sharp specific answer — name the exact rekha or parvat in a short phrase.
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

async function callGateway(messages: unknown[], json: boolean, model = "google/gemini-2.5-pro") {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) throw new Error("The sage is overwhelmed. Try again in a moment.");
    if (res.status === 402)
      throw new Error("Reading credits exhausted. Please add credits to continue.");
    throw new Error(`AI gateway error: ${res.status} ${text}`);
  }
  return res.json();
}

async function extractPalmAnnotations(
  imageDataUrl: string,
  model = "google/gemini-2.5-flash",
): Promise<Annotations> {
  const json = await callGateway(
    [
      { role: "system", content: EXTRACTION_SYSTEM },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Inspect this image. Reject it unless it is a single real human palm shown from the inner side. If accepted, trace only visible palm lines inside the palm itself and ignore all non-palm regions.",
          },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ],
      },
    ],
    true,
    model,
  );

  try {
    const content = json.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as { annotations?: unknown };
    return normalizeAnnotations(parsed.annotations);
  } catch {
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
  .inputValidator((d: ReadingInput) => d)
  .handler(async ({ data }): Promise<ReadingResult> => {
    const hasImage =
      typeof data.imageDataUrl === "string" && data.imageDataUrl.startsWith("data:image");
    const annotations = hasImage
      ? normalizeAnnotations(
          data.precomputedAnnotations?.palmDetected
            ? data.precomputedAnnotations
            : await extractPalmAnnotations(data.imageDataUrl!, "google/gemini-2.5-pro"),
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
          { type: "image_url", image_url: { url: data.imageDataUrl } },
        ]
      : userText;

    const json = await callGateway(
      [
        { role: "system", content: READING_SYSTEM },
        { role: "user", content: userContent },
      ],
      true,
      "google/gemini-2.5-pro",
    );

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
  .inputValidator((d: AskInput) => d)
  .handler(async ({ data }): Promise<AskResult> => {
    if (!data.question?.trim()) throw new Error("Question is empty");
    const hasImage =
      typeof data.imageDataUrl === "string" && data.imageDataUrl.startsWith("data:image");
    const birthBlock = buildBirthBlock(data);
    const annotationContext =
      data.annotationContext ||
      (hasImage
        ? annotationsToContext(
            await extractPalmAnnotations(data.imageDataUrl!, "google/gemini-2.5-flash"),
          )
        : "");

    const userText = `The seeker has already received a reading of their ${data.hand} palm.
${data.context ? `Earlier reading summary:\n${data.context}\n` : ""}${annotationContext ? `Observed palm evidence:\n${annotationContext}\n` : ""}${birthBlock}
They now ask: "${data.question}"

Answer in 3–4 sentences MAXIMUM, plain spoken prose, no lists or markdown. Do NOT recap the whole reading or bio-data — answer ONLY this question. If it concerns timing (marriage, child, job, money, travel, health, etc.), you MUST give a concrete year or tight month-year window (e.g. "around March 2028" or "between late 2026 and mid-2027"). Today is ${new Date().toISOString().slice(0, 10)} — predicted dates must be in the future. Cite ONE rekha/parvat in a short phrase as the source. If birth details are present, factor the Mulank/Bhagyank graha dasha into the year. Only refuse a date if the relevant rekha is genuinely invisible, and then ask for a clearer rescan in one sentence.`;

    const userContent: unknown = hasImage
      ? [
          { type: "text", text: userText },
          { type: "image_url", image_url: { url: data.imageDataUrl } },
        ]
      : userText;

    const json = await callGateway(
      [
        { role: "system", content: CHAT_SYSTEM },
        { role: "user", content: userContent },
      ],
      false,
      "google/gemini-2.5-pro",
    );

    const answer = sanitizeAnswer(
      json.choices?.[0]?.message?.content ?? "The shastra is silent on this query at this moment.",
    );
    return { answer: answer || "The shastra is silent on this query at this moment." };
  });

export const scanPalmFrame = createServerFn({ method: "POST" })
  .inputValidator((d: ValidateInput) => d)
  .handler(async ({ data }): Promise<ScanFrameResult> => {
    if (!data.imageDataUrl?.startsWith("data:image")) {
      return {
        isPalm: false,
        reason: "No image provided.",
        annotations: { ...EMPTY_ANNOTATIONS, notes: "No image provided." },
      };
    }
    const annotations = await extractPalmAnnotations(data.imageDataUrl, "google/gemini-2.5-flash");
    const result = getPalmAcceptance(annotations);
    return { ...result, annotations };
  });

export const validatePalm = createServerFn({ method: "POST" })
  .inputValidator((d: ValidateInput) => d)
  .handler(async ({ data }): Promise<ValidateResult> => {
    if (!data.imageDataUrl?.startsWith("data:image")) {
      return { isPalm: false, reason: "No image provided." };
    }
    const annotations = await extractPalmAnnotations(data.imageDataUrl, "google/gemini-2.5-flash");
    return getPalmAcceptance(annotations);
  });
