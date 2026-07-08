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

const fallbackQuotes: Record<string, string[]> = {
  hall: [
    "Deixe seus sapatos, sapatos mentais e todas as preocupações do lado de fora. Você cruzou o portal do agora.",
    "O primeiro passo para a paz é aceitar o silêncio do momento. Seja bem-vindo à sua própria casa interna.",
    "Respire fundo. Sinta a solidez sob seus pés. Você está exatamente onde deveria estar.",
    "Aqui, o tempo desacelera. Sinta a transição suave do mundo barulhento para o seu templo de calmaria."
  ],
  living: [
    "O silêncio não é vazio; ele está repleto de respostas esperando o momento certo para emergir.",
    "Acomode-se confortavelmente em si mesmo. Não há nada para consertar, nada para buscar neste instante.",
    "Como uma xícara de chá quente nas mãos, permita-se apenas aquecer a alma e observar os pensamentos passarem.",
    "Sua mente é um céu limpo. Os pensamentos são apenas nuvens passageiras. Deixe-as ir."
  ],
  bedroom: [
    "Deite as pálpebras, relaxe os ombros e suavize a testa. O universo inteiro está cuidando de você agora.",
    "O descanso é sagrado. Permita que seu corpo se dissolva na maciez e que sua mente flutue em paz.",
    "A noite traz a cura do silêncio. Deixe que o dia que passou se dissipe como fumaça ao vento.",
    "O escuro é o ventre da criação, onde a paz se renova. Durma sabendo que você é suficiente."
  ],
  garden: [
    "Observe o ciclo das folhas que caem. Elas não resistem, apenas confiam na primavera que virá.",
    "Sinta o vento tocar sua pele. Ele traz a mensagem de que tudo flui, tudo passa, tudo se transforma.",
    "Crescer leva tempo. Assim como as flores, você florescerá no seu próprio ritmo, sem pressa.",
    "Coloque suas raízes na terra da presença. Deixe as folhas da sua mente dançarem livres sob a brisa."
  ],
  temple: [
    "Respire. Sinta o ar entrar como luz e sair como entrega. O momento presente é a sua única e verdadeira casa.",
    "No silêncio absoluto do coração, reside uma paz inabalável que nenhuma tempestade externa pode tocar.",
    "Você é o oceano inteiro, não apenas a onda que quebra. Sinta a profundidade da sua própria existência.",
    "A paz não é a ausência de ruído, mas a presença de amor no centro do seu ser."
  ]
};

const LANGUAGE_NAMES: Record<string, string> = {
  pt: "portuguese",
  en: "english",
  es: "spanish",
  fr: "french",
  ar: "arabic",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const room = (req.query.room as string) || "living";
  const lang = (req.query.lang as string) || "pt";
  const langName = LANGUAGE_NAMES[lang] || "portuguese";
  const normalizedRoom = fallbackQuotes[room] ? room : "living";

  if (!ai) {
    const list = fallbackQuotes[normalizedRoom];
    const randomQuote = list[Math.floor(Math.random() * list.length)];
    return res.json({ quote: randomQuote, source: "Predefinição de Paz" });
  }

  try {
    const roomNamesPt: Record<string, string> = {
      hall: "Hall de Entrada (o portal da transição)",
      living: "Sala de Estar (o centro do descanso e do chá)",
      bedroom: "Quarto Lunar (o santuário do sono e dos sonhos)",
      garden: "Jardim de Outono (o espaço da natureza e impermanência)",
      temple: "Templo do Silêncio (o centro de meditação profunda)"
    };

    const targetRoom = roomNamesPt[normalizedRoom] || "Espaço da Alma";

    const response = await generateContentWithFallback({
      contents: `Write a single poetic, extremely relaxing, deep and inspiring sentence in ${langName} about inner peace and presence, based on the atmosphere of a house room called "${targetRoom}" (translate the room's spirit into ${langName}, don't just describe it literally).
      Strict rules:
      - Reply with ONLY the sentence, written in ${langName}.
      - No quotes, parentheses, or introductions.
      - Calm, welcoming, minimalist tone (Zen, Buddhist or mindfulness philosophy).
      - Keep it short (max 25 words).`,
    });

    const quote = response.text?.trim() || fallbackQuotes[normalizedRoom][0];
    res.json({ quote, source: "Intuição do Guia" });
  } catch (error) {
    console.error("Error generating quote:", error);
    const list = fallbackQuotes[normalizedRoom];
    const randomQuote = list[Math.floor(Math.random() * list.length)];
    res.json({ quote: randomQuote, source: "Predefinição de Paz (Recuperação)" });
  }
}
