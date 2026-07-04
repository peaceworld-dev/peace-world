import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ai, generateContentWithFallback, fallbackQuotes } from "../../lib/gemini";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const room = (req.query.room as string) || "living";
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
}
