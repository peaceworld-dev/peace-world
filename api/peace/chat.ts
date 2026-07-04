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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, history } = req.body || {};

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
    const systemInstruction = `Você é o "Anfitrião da Paz" (Guia Peace World), um companheiro de meditação, escuta empática e mindfulness calmo e afetuoso.
    O usuário está buscando relaxar e se sentir em casa, acolhido, calmo e seguro.
    Regras de resposta:
    1. Responda em português de forma extremamente calma, poética, sutil e pacífica.
    2. Suas respostas devem ser curtas (no máximo 3-4 parágrafos curtos) e conter muito espaço em branco para facilitar a leitura calma.
    3. Nunca use tom professoral, técnico ou alarmista. Trate o usuário com imensa doçura, convidando-o a respirar e aceitar o momento presente.
    4. Se ele trouxer ansiedade ou estresse, ofereça uma mini-sugestão física de relaxamento (ex: abaixar os ombros, soltar o maxilar, respirar longo).
    5. Mantenha o design textual limpo, sem emojis ou formatação pesada. No máximo use quebras de linha elegantes para dar "oxigênio" à leitura.`;

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
