import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header
const apiKey = process.env.GEMINI_API_KEY || "";
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// Helper function to generate content with retries and fallback models
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
    "gemini-3.1-flash-lite"
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
        // Wait a small amount of time before retrying
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
        }
      }
    }
  }

  throw lastError || new Error("All model attempts failed");
}

// In-memory predefined peaceful quotes in Portuguese as fallback or for instant loading
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

// API: Generate unique peace quotes using Gemini
app.get("/api/peace/quote", async (req, res) => {
  const room = (req.query.room as string) || "living";
  const normalizedRoom = fallbackQuotes[room] ? room : "living";
  
  if (!ai) {
    // If Gemini is not configured, return a beautiful random fallback quote
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
      contents: `Escreva uma única frase poética, extremamente relaxante, profunda e inspiradora em português sobre paz interior e presença, baseada no ambiente de uma casa chamado "${targetRoom}".
      Regras estritas:
      - Responda APENAS com a frase.
      - Não use aspas, parênteses ou introduções.
      - Use um tom calmo, acolhedor e minimalista (filosofia Zen, budista ou de mindfulness).
      - Mantenha curto (no máximo 25 palavras).`,
    });

    const quote = response.text?.trim() || fallbackQuotes[normalizedRoom][0];
    res.json({ quote, source: "Intuição do Guia" });
  } catch (error) {
    console.error("Error generating quote:", error);
    const list = fallbackQuotes[normalizedRoom];
    const randomQuote = list[Math.floor(Math.random() * list.length)];
    res.json({ quote: randomQuote, source: "Predefinição de Paz (Recuperação)" });
  }
});

// API: Peace Companion Chat using Gemini
app.post("/api/peace/chat", async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Mensagem é necessária." });
  }

  if (!ai) {
    // Elegant fallback chat responses if AI is not configured
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
    
    // Convert history for Gemini
    if (history && Array.isArray(history)) {
      history.slice(-6).forEach((h: any) => {
        formattedContents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }]
        });
      });
    }

    // Add current user message
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
});

// Configure Vite and static assets serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with Vite...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Peace World Server is active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
