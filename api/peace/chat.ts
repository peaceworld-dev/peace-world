import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";

let ai: GoogleGenAI | null = null;
if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function generateContentWithFallback(params: {
  contents: any;
  systemInstruction?: string;
  temperature?: number;
}) {
  if (!ai) {
    throw new Error("Gemini AI is not initialized");
  }

  const models = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
  ];
  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const config: any = {};
        if (params.systemInstruction) {
          config.systemInstruction = params.systemInstruction;
        }
        if (params.temperature !== undefined) {
          config.temperature = params.temperature;
        }

        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config,
        });

        if (response && response.text) {
          return response;
        }
      } catch (err: any) {
        lastError = err;
        console.log(`[Gemini Fallback] Attempt ${attempt} with model ${model} failed:`, err.message || err);
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
        }
      }
    }
  }

  throw lastError || new Error("All model attempts failed");
}

const LANGUAGE_NAMES: Record<string, string> = {
  pt: "portuguese",
  en: "english",
  es: "spanish",
  fr: "french",
  ar: "arabic",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, history, lang } = req.body || {};
  const langName = LANGUAGE_NAMES[lang] || "portuguese";

  if (!message) {
    return res.status(400).json({ error: "Mensagem é necessária." });
  }

  if (!ai) {
    const quietAnswers = [
      "Sinta o ar que entra pelos seus pulmões neste instante... Perceba como o mundo continua girando enquanto você escolhe respirar.",
      "Compreendo o seu momento. Deite-se mentalmente e apenas observe esse sentimento sem julgá-lo.",
      "Você está seguro aqui na Peace World. O mundo lá fora pode esperar um pouco. O que mais te traria calma agora?",
      "Imagine as suas preocupações como folhas sendo levadas por um riacho límpido. Elas fluem para longe, sem esforço.",
      "Respire fundo comigo... Segure... E solte lentamente. Cada respiração é uma nova oportunidade de recomeçar em paz."
    ];
    const randomAnswer = quietAnswers[Math.floor(Math.random() * quietAnswers.length)];
    return res.json({ response: randomAnswer });
  }

  try {
    const systemInstruction = `You are the "Host of Peace" (Peace World Guide), a calm and affectionate meditation companion and empathetic listener.
    The user is seeking to relax and feel at home, welcomed, calm and safe.
    Response rules:
    1. Reply ONLY in ${langName}, in an extremely calm, poetic, subtle and peaceful way.
    2. Your replies must be short (max 3-4 short paragraphs) with plenty of white space for calm reading.
    3. Never use a professorial, technical or alarmist tone. Treat the user with immense tenderness, inviting them to breathe and accept the present moment.
    4. If they bring up anxiety or stress, offer a small physical relaxation suggestion (e.g. lowering shoulders, unclenching jaw, a long breath).
    5. Keep the text clean, no emojis or heavy formatting. Use elegant line breaks at most to give the reading "room to breathe".`;

    const formattedContents: any[] = [];

    if (history && Array.isArray(history)) {
      history.slice(-6).forEach((h: any) => {
        formattedContents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }]
        });
      });
    }

    formattedContents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await generateContentWithFallback({
      contents: formattedContents,
      systemInstruction,
      temperature: 0.8,
    });

    const reply = response.text || "Sinto a sua presença. Respire fundo e sinta-se em casa.";
    res.json({ response: reply });
  } catch (error) {
    console.error("Error in companion chat:", error);
    res.status(500).json({ error: "O Guia está em meditação profunda. Respire e tente falar novamente em breve." });
  }
}
