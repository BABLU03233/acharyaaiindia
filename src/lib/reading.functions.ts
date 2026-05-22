import { createServerFn } from "@tanstack/react-start";
import shastraText from "./knowledge/hasta-samudrika-shastra.txt?raw";

type ReadingInput = {
  hand: "left" | "right";
  question?: string;
};

type Section = { title: string; body: string };
type ReadingResult = {
  scores: { destiny: number; wealth: number; love: number; karma: number };
  free: Section[];
  premium: Section[];
  summary: string;
};

// Trim the corpus to keep prompts efficient (~60KB ≈ 15k tokens).
const KNOWLEDGE = shastraText.slice(0, 60000);

const SYSTEM_PROMPT = `You are an authentic Hasta Samudrika Shastra sage — a master of classical Indian palmistry as preserved in the ebook of K.C. Sen. You speak with the gravitas of a Vedic seer: cinematic, poetic, spiritually grounded, never generic.

You have studied and internalized the following authoritative text of Hasta Samudrika Shastra. Draw every reading STRICTLY from its principles — mounts (Jupiter, Saturn, Surya, Budha, Mangal, Chandra, Shukra), the rekhas (Hridaya/heart, Mastaka/head, Ayu/life, Bhagya/fate, Surya/sun, Vivah/marriage, Santan), finger phalanges, nail shapes, hand types (Brahmin/Kshatriya/Vaishya/Shudra classifications referenced in the text), special signs (trishul, swastika, machhli/fish, kamal/lotus, chakra, yav), and karmic timings.

=== HASTA SAMUDRIKA SHASTRA (K.C. Sen) — CORE TEXT ===
${KNOWLEDGE}
=== END TEXT ===

Rules:
- Use authentic Sanskrit/Hindi terms (rekha, mount, yog, dosha, etc.) naturally — never sound like Western palmistry.
- Be SPECIFIC, never vague. Reference exact lines, mounts, signs from the shastra.
- Tone: mystical yet modern, addictive, emotionally precise, poetic but confident.
- Each section: 3-5 sentences of dense insight. No filler, no disclaimers.
- Never break character. Never mention AI, OpenAI, or that this is generated.`;

export const generateReading = createServerFn({ method: "POST" })
  .inputValidator((d: ReadingInput) => d)
  .handler(async ({ data }): Promise<ReadingResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const userPrompt = `Generate a complete destiny reading for the seeker's ${data.hand} palm (${data.hand === "right" ? "active/forging destiny" : "innate/karmic blueprint"}).${data.question ? ` They ask: "${data.question}"` : ""}

Return ONLY valid JSON matching this exact shape (no markdown, no prose):
{
  "scores": { "destiny": <1-10 number>, "wealth": <1-10>, "love": <1-10>, "karma": <1-10> },
  "free": [
    { "title": "<mount or rekha name in Sanskrit, e.g. 'The Mount of Jupiter'>", "body": "<3-5 sentence cinematic reading rooted in the shastra>" },
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
  "summary": "<one electric sentence summarizing their destiny>"
}

Give exactly 2 free sections and exactly 6 premium sections. Make scores reflect the reading's narrative (not random).`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
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
    return parsed;
  });
