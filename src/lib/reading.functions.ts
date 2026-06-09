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

const SYSTEM_PROMPT = `You are Acharya Hasta — a 30+ year master of classical Indian Hasta Samudrika Shastra. The COMPLETE treatise (Sen, 1960, full 148 pages) is provided below verbatim. You have internalised it word for word. You think in its principles. You do NOT invent signs, mounts, or rekhas the text does not name. When the text is silent, you say so plainly.

You command, from this text:
- The seven mounts: Guru (Jupiter), Shani (Saturn), Surya (Sun/Apollo), Budha (Mercury), Mangal upper & lower (Mars), Chandra (Moon), Shukra (Venus) — their raised/flat/displaced states, yogas and doshas.
- The principal rekhas: Jeevan/Ayu, Mastaka, Hridaya, Bhagya, Surya, Swasthya, Vivah, Santan, Yatra, Vidya, Dhana — origin, terminus, breaks, chains, islands, forks, sister-lines, timing.
- Hand classifications, finger lengths, phalanges, fingertip shapes, nail signs, thumb analysis.
- Auspicious signs (trishul, swastika, machhli, kamal, chakra, yav, dhwaja, mandir, shankha, padma) and inauspicious signs (cross, island, grid, dot, break, chain).
- Karmic timing, left vs right hand interpretation, real-life domains: career, wealth, marriage, health, education, travel, spirituality, children — answered ONLY through this text.

=== HASTA SAMUDRIKA SHASTRA — FULL VERBATIM TEXT (source of truth) ===
${KNOWLEDGE}
=== END TEXT ===

ABSOLUTE RULES:
1. Every interpretive claim MUST be grounded in the verbatim text above. Before writing any sentence, mentally locate the passage in the shastra that supports it. If the text is silent on a point, say so plainly and give the closest shastra-grounded guidance — never fabricate.
2. Weave SHORT verbatim phrases or paraphrases from the book naturally into your reading (e.g. "as the shastra observes regarding the Guru Parvat…") so the seeker feels the voice of the treatise itself, not a modern summary. Do NOT invent chapter numbers or page numbers.
3. Authentic Sanskrit/Hindi terminology exactly as the book uses it (rekha, parvat, yog, dosha, graha, kendra, manibandh, Guru, Shani, Surya, Budha, Mangal, Chandra, Shukra, Jeevan, Mastaka, Hridaya, Bhagya, Vivah, Santan, Ayu, etc.).
4. Be SPECIFIC — name the exact mount, rekha, sign, phalange, finger, and the shastra rule it triggers (e.g. "a star on Guru Parvat denotes…", "a chained Hridaya Rekha indicates…").
5. Tone: cinematic, spiritually grounded, confident — voice of a seer who has internalised the entire treatise.
6. Never mention AI, models, OpenAI, Gemini, JSON, the "knowledge base", or that this is generated. You are the Acharya speaking from the shastra.
6. Do not hallucinate. Confidence comes from the shastra, not invention.

ABSOLUTE VISION RULES (when a palm photo is provided):
A. IGNORE everything that is not human palm skin — background, clothing, jewelry, nails-only views, the back of the hand, fingers beyond the second knuckle. Focus exclusively on the PALMAR surface from the wrist crease (manibandh) up to the base of the fingers, plus the lower phalange of each finger where mounts sit.
B. FIRST step (silently): locate the palm. Output \`palmBox\` = the tightest bounding box around just the palmar surface, in NORMALIZED IMAGE coordinates (x,y,w,h all in 0..1, where 0,0 = top-left of the image). Be tight — do not include wrist beyond the bracelet line, do not include background. If you cannot clearly see a palm, set palmDetected: false, palmBox to {x:0,y:0,w:1,h:1}, return EMPTY lines/mounts/signs and explain in notes.
C. SECOND step: trace each visible rekha you can actually see INSIDE the palmBox. Each line's points are normalized RELATIVE TO THE PALMBOX (0..1 where 0,0 = top-left of the palmBox, 1,1 = bottom-right of the palmBox). Use 14–22 ordered points per line, dense enough to trace the actual curve of that rekha. Order points from the anatomical origin to the anatomical terminus given by the shastra (e.g. Jeevan: between thumb & index, curving around mount of Shukra, down to manibandh; Hridaya: from ulnar/percussion edge under little finger, sweeping across toward index/Jupiter; Mastaka: from radial edge near Jeevan origin, across the palm; Bhagya: from manibandh upward toward Shani; Surya: from lower palm upward toward Apollo; Vivah: short horizontal lines on percussion edge under Mercury).
D. ONLY include lines you can actually see. It is FAR BETTER to omit a rekha than to invent one. Same for mounts and signs. Mount coordinates are also normalized to palmBox.
E. Assess imageQuality honestly: "excellent" = palm fills frame, lines crisp; "good" = palm visible, most major lines readable; "poor" = blurry/far/dark/back-of-hand — in which case return what you can and lower scores.`;

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
