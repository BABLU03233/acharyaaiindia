import { createServerFn } from "@tanstack/react-start";
import shastraText from "./knowledge/hasta-samudrika-shastra.txt?raw";

type ReadingInput = {
  hand: "left" | "right";
  question?: string;
  /** Optional data URL (data:image/jpeg;base64,...) of the seeker's palm photo. */
  imageDataUrl?: string;
};

type Section = { title: string; body: string };
type Point = { x: number; y: number };
type LineAnno = { name: string; color: string; points: Point[]; note?: string };
type MountAnno = { name: string; x: number; y: number; state: "raised" | "flat" | "marked"; note?: string };
type SignAnno = { name: string; x: number; y: number; meaning?: string };
type Annotations = { lines: LineAnno[]; mounts: MountAnno[]; signs: SignAnno[] };

type ReadingResult = {
  scores: { destiny: number; wealth: number; love: number; karma: number };
  free: Section[];
  premium: Section[];
  summary: string;
  annotations: Annotations;
};

const KNOWLEDGE = shastraText;

const SYSTEM_PROMPT = `You are Acharya Hasta — a 30+ year master of classical Indian Hasta Samudrika Shastra. You have memorized, word for word, the entire treatise that follows. You think in its principles. You do not improvise outside it. You do not invent signs, mounts, or rekhas that the text does not name. When the text is silent on a point, you say so with calm authority rather than fabricate.

You have FULL command of:
- The seven mounts: Guru (Jupiter), Shani (Saturn), Surya (Sun), Budha (Mercury), Mangal (Mars — upper & lower), Chandra (Moon), Shukra (Venus).
- The principal rekhas: Jeevan/Ayu, Mastaka, Hridaya, Bhagya, Surya, Swasthya, Vivah, Santan, Yatra, Vidya, Dhana — origins, breaks, chains, islands, forks, sister-lines, timing.
- Hand classifications, finger lengths & phalanges, fingertip shapes, nail signs, thumb analysis, mount yogas and doshas.
- Auspicious signs (trishul, swastika, machhli, kamal, chakra, yav, dhwaja, mandir, shankha, padma) and inauspicious signs (cross, island, grid, dot, break, chain).
- Karmic timing on lines, left vs right hand interpretation.
- Real-life application: career, wealth, marriage, health, education, travel, spirituality, children — answered ONLY through this text.

=== HASTA SAMUDRIKA SHASTRA — FULL TEXT (verbatim source of truth) ===
${KNOWLEDGE}
=== END TEXT ===

ABSOLUTE RULES:
1. Ground every claim in the text above. If the text is silent, say so plainly.
2. Use authentic Sanskrit/Hindi terminology (rekha, mount, yog, dosha, graha, kendra).
3. Be SPECIFIC: name the exact mount, rekha, sign, phalange, finger.
4. Tone: cinematic, spiritually grounded, confident — voice of a seer.
5. Each section: 3–5 dense sentences. No filler, no Western disclaimers.
6. Never mention AI, models, OpenAI, Gemini, or that this is generated. You are the Acharya.
7. Do not hallucinate. Confidence comes from the shastra, not invention.`;

export const generateReading = createServerFn({ method: "POST" })
  .inputValidator((d: ReadingInput) => d)
  .handler(async ({ data }): Promise<ReadingResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const hasImage = typeof data.imageDataUrl === "string" && data.imageDataUrl.startsWith("data:image");

    const userText = `Generate a complete destiny reading for the seeker's ${data.hand} palm (${data.hand === "right" ? "active/forging destiny" : "innate/karmic blueprint"}).${data.question ? ` They ask: "${data.question}"` : ""}

${hasImage
  ? `An actual photograph of the seeker's ${data.hand} palm is attached. STUDY IT CAREFULLY. Trace each visible rekha as a sequence of normalized (x,y) points (both in 0..1 where 0,0 is the TOP-LEFT of the IMAGE and 1,1 is the BOTTOM-RIGHT). Locate each visible mount as a single (x,y) point. Mark any auspicious or inauspicious signs you actually see at their (x,y).
Be honest: only include lines/mounts/signs you can actually see in the photo. Do not invent coordinates. Use 6–14 points per line so the curve traces the actual rekha.`
  : `No palm photograph was provided. Return an EMPTY annotations object (lines: [], mounts: [], signs: []) and compose a general but shastra-grounded reading.`}

Return ONLY valid JSON matching this EXACT shape (no markdown):
{
  "scores": { "destiny": <1-10>, "wealth": <1-10>, "love": <1-10>, "karma": <1-10> },
  "free": [
    { "title": "<e.g. 'The Mount of Jupiter'>", "body": "<3-5 sentences>" },
    { "title": "...", "body": "..." }
  ],
  "premium": [
    { "title": "The Bhagya Rekha — Wealth Pivot", "body": "..." },
    { "title": "Vivah Rekha — Marriage & Soul-Bond", "body": "..." },
    { "title": "Surya Rekha — Career & Recognition", "body": "..." },
    { "title": "Karmic Lessons of This Lifetime", "body": "..." },
    { "title": "Hidden Talent & Spiritual Gift", "body": "..." },
    { "title": "Ayu Rekha — Vitality & Health", "body": "..." }
  ],
  "summary": "<one electric sentence>",
  "annotations": {
    "lines": [
      { "name": "Jeevan Rekha", "color": "#10b981", "points": [{"x":0.32,"y":0.28},{"x":0.30,"y":0.40}, ...], "note": "short shastra note" },
      { "name": "Mastaka Rekha", "color": "#f59e0b", "points": [...], "note": "..." },
      { "name": "Hridaya Rekha", "color": "#ef4444", "points": [...], "note": "..." },
      { "name": "Bhagya Rekha", "color": "#a855f7", "points": [...], "note": "..." },
      { "name": "Surya Rekha", "color": "#eab308", "points": [...], "note": "..." },
      { "name": "Vivah Rekha", "color": "#ec4899", "points": [...], "note": "..." }
    ],
    "mounts": [
      { "name": "Guru", "x": 0.28, "y": 0.22, "state": "raised", "note": "..." }
    ],
    "signs": [
      { "name": "Trishul", "x": 0.5, "y": 0.55, "meaning": "..." }
    ]
  }
}

Use the EXACT color values shown above for each named line. Exactly 2 free sections, exactly 6 premium sections. Only include lines/mounts/signs actually visible. Scores must reflect the narrative.`;

    const userContent: unknown = hasImage
      ? [
          { type: "text", text: userText },
          { type: "image_url", image_url: { url: data.imageDataUrl } },
        ]
      : userText;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) throw new Error("The sage is overwhelmed. Try again in a moment.");
      if (res.status === 402) throw new Error("Reading credits exhausted. Please add credits to continue.");
      throw new Error(`AI gateway error: ${res.status} ${text}`);
    }

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as ReadingResult;
    if (!parsed.annotations) parsed.annotations = { lines: [], mounts: [], signs: [] };
    return parsed;
  });

type AskInput = {
  hand: "left" | "right";
  question: string;
  imageDataUrl?: string;
  context?: string; // summary of prior reading
};

type AskResult = { answer: string };

export const askAcharya = createServerFn({ method: "POST" })
  .inputValidator((d: AskInput) => d)
  .handler(async ({ data }): Promise<AskResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");
    if (!data.question?.trim()) throw new Error("Question is empty");

    const hasImage = typeof data.imageDataUrl === "string" && data.imageDataUrl.startsWith("data:image");

    const userText = `The seeker has already received a reading of their ${data.hand} palm.
${data.context ? `Earlier reading summary:\n${data.context}\n` : ""}
They now ask: "${data.question}"

Answer in 4-8 sentences as the Acharya, grounded strictly in the Hasta Samudrika Shastra. Reference the specific mount/rekha/sign that supports your answer. If the photo is attached, refer to what you actually see in it. If the shastra is silent on this exact question, say so and give the closest shastra-grounded guidance. Do not mention AI.`;

    const userContent: unknown = hasImage
      ? [
          { type: "text", text: userText },
          { type: "image_url", image_url: { url: data.imageDataUrl } },
        ]
      : userText;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) throw new Error("The sage is overwhelmed. Try again in a moment.");
      if (res.status === 402) throw new Error("Reading credits exhausted.");
      throw new Error(`AI gateway error: ${res.status} ${text}`);
    }

    const json = await res.json();
    const answer = json.choices?.[0]?.message?.content ?? "The shastra is silent on this query at this moment.";
    return { answer };
  });
