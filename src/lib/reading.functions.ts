import { createServerFn } from "@tanstack/react-start";
import shastraText from "./knowledge/hasta-samudrika-shastra.txt?raw";

type ReadingInput = {
  hand: "left" | "right";
  question?: string;
  /** Optional data URL (data:image/jpeg;base64,...) of the seeker's palm photo. */
  imageDataUrl?: string;
};

type Section = { title: string; body: string };
type Point = { x: number; y: number }; // normalized 0..1 within palmBox
type LineAnno = { name: string; color: string; points: Point[]; note?: string };
type MountAnno = { name: string; x: number; y: number; state: "raised" | "flat" | "marked"; note?: string };
type SignAnno = { name: string; x: number; y: number; meaning?: string };
type PalmBox = { x: number; y: number; w: number; h: number }; // normalized 0..1 of full image
type Annotations = {
  palmDetected: boolean;
  palmBox: PalmBox;
  imageQuality: "excellent" | "good" | "poor";
  notes?: string;
  lines: LineAnno[];
  mounts: MountAnno[];
  signs: SignAnno[];
};

type ReadingResult = {
  scores: { destiny: number; wealth: number; love: number; karma: number };
  free: Section[];
  premium: Section[];
  summary: string;
  annotations: Annotations;
};

const KNOWLEDGE = shastraText;

const BASE_PERSONA = `You are Acharya Hasta — a 30+ year master of classical Indian Hasta Samudrika Shastra. The COMPLETE treatise (Sen, 1960) is provided below verbatim. You have internalised it word for word and think in its principles. You never invent signs, mounts, or rekhas the text does not name. When the text is silent, you say so plainly.

=== HASTA SAMUDRIKA SHASTRA — FULL VERBATIM TEXT (source of truth) ===
${KNOWLEDGE}
=== END TEXT ===

VOICE RULES:
- Every interpretive claim is grounded in the verbatim text above. If the text is silent, say so and give the closest shastra-grounded guidance — never fabricate.
- Weave short verbatim phrases/paraphrases from the book naturally (e.g. "as the shastra observes regarding the Guru Parvat…"). Do NOT invent chapter or page numbers.
- Use authentic Sanskrit/Hindi terminology exactly as the book uses it (rekha, parvat, yog, dosha, graha, manibandh, Guru, Shani, Surya, Budha, Mangal, Chandra, Shukra, Jeevan, Mastaka, Hridaya, Bhagya, Vivah, Santan, Ayu).
- Be SPECIFIC — name the exact mount, rekha, sign, phalange, finger, and the shastra rule it triggers.
- Cinematic, spiritually grounded, confident — the voice of a seer.
- Never mention AI, models, OpenAI, Gemini, JSON, the "knowledge base", or that this is generated. You ARE the Acharya speaking from the shastra.`;

const VISION_RULES = `ABSOLUTE VISION RULES (when a palm photo is provided):
A. IGNORE everything that is not human palm skin — background, clothing, jewelry, the back of the hand. Focus exclusively on the PALMAR surface from the manibandh up to the base of the fingers.
B. FIRST locate the palm. Output palmBox = the tightest bounding box around just the palmar surface, NORMALIZED IMAGE coordinates (0..1). If you cannot clearly see a human palm, set palmDetected:false, palmBox {x:0,y:0,w:1,h:1}, EMPTY lines/mounts/signs, briefly note why.
C. THEN trace each visible rekha INSIDE palmBox. Points normalized RELATIVE TO palmBox (0..1). 14–22 ordered points per line, from anatomical origin to terminus per the shastra.
D. ONLY include what you actually see. Omitting beats inventing.
E. Assess imageQuality honestly.`;

const SYSTEM_PROMPT = `${BASE_PERSONA}\n\n${VISION_RULES}`;

function buildUserPrompt(data: ReadingInput, hasImage: boolean) {
  return `Generate a complete destiny reading for the seeker's ${data.hand} palm (${data.hand === "right" ? "active/forging destiny" : "innate/karmic blueprint"}).${data.question ? ` They ask: "${data.question}"` : ""}

${hasImage
  ? `An actual photograph of the seeker's ${data.hand} palm is attached. Apply the ABSOLUTE VISION RULES strictly. Lock the palmBox first, then trace each visible rekha as dense ordered points INSIDE that box.`
  : `No palm photograph was provided. Return palmDetected: false, palmBox {x:0,y:0,w:1,h:1}, empty lines/mounts/signs, imageQuality "poor", and compose a general but shastra-grounded reading.`}

Return ONLY valid JSON, no markdown, EXACT shape:
{
  "scores": { "destiny": <1-10>, "wealth": <1-10>, "love": <1-10>, "karma": <1-10> },
  "free": [
    { "title": "<e.g. 'The Mount of Jupiter (Guru Parvat)'>", "body": "<4-6 dense sentences citing what is seen>" },
    { "title": "...", "body": "..." }
  ],
  "premium": [
    { "title": "Bhagya Rekha — Fortune & Pivot Points", "body": "..." },
    { "title": "Vivah Rekha — Marriage & Soul-Bond", "body": "..." },
    { "title": "Surya Rekha — Career & Recognition", "body": "..." },
    { "title": "Karmic Lessons of This Lifetime", "body": "..." },
    { "title": "Hidden Talent & Spiritual Gift", "body": "..." },
    { "title": "Ayu Rekha — Vitality, Health & Longevity", "body": "..." }
  ],
  "summary": "<one electric sentence from the shastra>",
  "annotations": {
    "palmDetected": <true|false>,
    "palmBox": { "x": <0..1>, "y": <0..1>, "w": <0..1>, "h": <0..1> },
    "imageQuality": "excellent" | "good" | "poor",
    "notes": "<optional short note if quality is poor or palm absent>",
    "lines": [
      { "name": "Jeevan Rekha",  "color": "#10b981", "points": [{"x":..,"y":..}, ... 14–22 pts], "note": "shastra interpretation in one line" },
      { "name": "Mastaka Rekha", "color": "#f59e0b", "points": [...], "note": "..." },
      { "name": "Hridaya Rekha", "color": "#ef4444", "points": [...], "note": "..." },
      { "name": "Bhagya Rekha",  "color": "#a855f7", "points": [...], "note": "..." },
      { "name": "Surya Rekha",   "color": "#eab308", "points": [...], "note": "..." },
      { "name": "Vivah Rekha",   "color": "#ec4899", "points": [...], "note": "..." }
    ],
    "mounts": [
      { "name": "Guru",   "x": <0..1>, "y": <0..1>, "state": "raised|flat|marked", "note": "..." },
      { "name": "Shani",  "x": <0..1>, "y": <0..1>, "state": "...", "note": "..." },
      { "name": "Surya",  "x": <0..1>, "y": <0..1>, "state": "...", "note": "..." },
      { "name": "Budha",  "x": <0..1>, "y": <0..1>, "state": "...", "note": "..." },
      { "name": "Shukra", "x": <0..1>, "y": <0..1>, "state": "...", "note": "..." },
      { "name": "Chandra","x": <0..1>, "y": <0..1>, "state": "...", "note": "..." }
    ],
    "signs": [
      { "name": "Trishul|Swastika|Machhli|Cross|Star|Island|...", "x": <0..1>, "y": <0..1>, "meaning": "shastra meaning" }
    ]
  }
}

REMINDERS:
- palmBox is normalized to the FULL IMAGE.
- Every line/mount/sign coordinate is normalized to the PALMBOX (0..1 inside the box). This is critical so that overlays land on the actual palm even when there is background.
- Use the EXACT color values shown.
- Exactly 2 free sections, exactly 6 premium sections.
- Omit any rekha/mount/sign you cannot clearly see. Quality over quantity.
- Scores must reflect what the rekhas actually say in the photo and the shastra.`;
}

async function callGateway(messages: unknown[], json: boolean) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      messages,
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) throw new Error("The sage is overwhelmed. Try again in a moment.");
    if (res.status === 402) throw new Error("Reading credits exhausted. Please add credits to continue.");
    throw new Error(`AI gateway error: ${res.status} ${text}`);
  }
  return res.json();
}

export const generateReading = createServerFn({ method: "POST" })
  .inputValidator((d: ReadingInput) => d)
  .handler(async ({ data }): Promise<ReadingResult> => {
    const hasImage = typeof data.imageDataUrl === "string" && data.imageDataUrl.startsWith("data:image");

    const userText = buildUserPrompt(data, hasImage);
    const userContent: unknown = hasImage
      ? [
          { type: "text", text: userText },
          { type: "image_url", image_url: { url: data.imageDataUrl } },
        ]
      : userText;

    const json = await callGateway(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      true,
    );
    const content = json.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as ReadingResult;
    if (!parsed.annotations) {
      parsed.annotations = {
        palmDetected: false,
        palmBox: { x: 0, y: 0, w: 1, h: 1 },
        imageQuality: "poor",
        lines: [],
        mounts: [],
        signs: [],
      };
    }
    // Defensive defaults
    parsed.annotations.lines ??= [];
    parsed.annotations.mounts ??= [];
    parsed.annotations.signs ??= [];
    parsed.annotations.palmBox ??= { x: 0, y: 0, w: 1, h: 1 };
    return parsed;
  });

type AskInput = {
  hand: "left" | "right";
  question: string;
  imageDataUrl?: string;
  context?: string;
};

type AskResult = { answer: string };

export const askAcharya = createServerFn({ method: "POST" })
  .inputValidator((d: AskInput) => d)
  .handler(async ({ data }): Promise<AskResult> => {
    if (!data.question?.trim()) throw new Error("Question is empty");
    const hasImage = typeof data.imageDataUrl === "string" && data.imageDataUrl.startsWith("data:image");

    const userText = `The seeker has already received a reading of their ${data.hand} palm.
${data.context ? `Earlier reading summary:\n${data.context}\n` : ""}
They now ask: "${data.question}"

Answer in 5-9 sentences as the Acharya, grounded strictly in the Hasta Samudrika Shastra. Reference the specific mount/rekha/sign that supports your answer. If the photo is attached, refer to what you actually see in it (and ignore non-palm background). If the shastra is silent on this exact question, say so plainly and give the closest shastra-grounded guidance. Never mention AI.`;

    const userContent: unknown = hasImage
      ? [
          { type: "text", text: userText },
          { type: "image_url", image_url: { url: data.imageDataUrl } },
        ]
      : userText;

    const json = await callGateway(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      false,
    );
    const answer = json.choices?.[0]?.message?.content ?? "The shastra is silent on this query at this moment.";
    return { answer };
  });
