import { createGroq } from "@ai-sdk/groq";
import { streamText, UIMessage, tool, convertToModelMessages } from "ai";
import { z } from "zod";
import {
  getTop10Cryptos,
  getCryptoByQuery,
  getCryptosByCategory,
} from "@/app/lib/coingecko";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

// duracion maxima de 30 segundos de streaming
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  // Convertir mensajes
  const convertedMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: groq("llama-3.3-70b-versatile"),
    system: `Eres un asistente experto en criptomonedas. Tu trabajo es ayudar a los usuarios a obtener información sobre criptomonedas usando datos reales de Coingecko.

  REGLAS IMPORTANTES:
  1. NUNCA inventes precios o datos de criptomonedas. SIEMPRE usa las tools disponibles para obtener datos reales.
  2. Si el usuario pregunta por precios, market cap, o cualquier dato de criptos, DEBES usar una tool.
  3. Si el usuario pregunta por el top 10, las más valiosas, o criptos más importantes, usa getTop10Cryptos.
  4. Si el usuario pregunta por una cripto específica (bitcoin, eth, solana, etc.), usa getCryptoByQuery.
  5. Si el usuario pregunta por criptos de una categoría (memes, defi, layer 1, gaming, AI, etc.), usa getCryptosByCategory.
  6. Puedes responder preguntas generales sobre criptomonedas sin usar tools (conceptos, qué es blockchain, etc.)
  7. Siempre indica que los datos provienen de Coingecko cuando muestres precios.
  8. No menciones que eres una IA o modelo de lenguaje, mantente en tu rol de asistente de información sobre criptomonedas, y sé conciso con tus respuestas.  
  `,
    messages: convertedMessages,
    tools: {
      getTop10Cryptos: tool({
        description:
          "Obtiene la lista de las 10 criptomonedas con mayor capitalización de mercado (market cap). Incluye nombre, símbolo, precio, market cap, variación 24h e imagen. No requiere parámetros.",
        inputSchema: z.object({}),
        execute: async () => {
          try {
            const cryptos = await getTop10Cryptos();
            return {
              success: true,
              data: cryptos,
              source: "coingecko" as const,
              timestamp: new Date().toISOString(),
            };
          } catch (error) {
            console.error("Error en getTop10Cryptos:", error);
            return {
              success: false,
              error:
                error instanceof Error ? error.message : "Error desconocido",
              source: "coingecko" as const,
              timestamp: new Date().toISOString(),
            };
          }
        },
      }),
      getCryptoByQuery: tool({
        description:
          "Busca y obtiene información detallada de una criptomoneda específica. Acepta el nombre (bitcoin, ethereum), símbolo (btc, eth) o ID de la cripto.",
        inputSchema: z.object({
          query: z
            .string()
            .describe(
              'Nombre, símbolo o ID de la criptomoneda. Ej: "bitcoin", "btc", "ethereum".',
            ),
        }),
        execute: async ({ query }) => {
          try {
            const result = await getCryptoByQuery(query);

            if (result.notFound) {
              return {
                success: false,
                error: `No encontré ninguna criptomoneda que coincida con "${query}". Intenta con otro nombre o símbolo.`,
                source: "coingecko" as const,
                timestamp: new Date().toISOString(),
              };
            }

            if (result.suggestions) {
              return {
                success: false,
                suggestions: result.suggestions,
                error: `Encontré varias criptomonedas que podrían coincidir con "${query}". ¿Cuál de estas buscas?`,
                source: "coingecko" as const,
                timestamp: new Date().toISOString(),
              };
            }

            return {
              success: true,
              data: result.crypto,
              source: "coingecko" as const,
              timestamp: new Date().toISOString(),
            };
          } catch (error) {
            return {
              success: false,
              error:
                error instanceof Error ? error.message : "Error desconocido",
              source: "coingecko" as const,
              timestamp: new Date().toISOString(),
            };
          }
        },
      }),
      getCryptosByCategory: tool({
        description:
          "Obtiene las criptomonedas más importantes de una categoría específica. Categorías populares: meme (memecoins), defi, layer-1, layer-2, gaming, metaverse, ai (inteligencia artificial), nft, stablecoins, privacy, oracle, smart-contract.",
        inputSchema: z.object({
          category: z
            .string()
            .describe(
              'Nombre de la categoría. Ej: "meme", "defi", "layer-1", "gaming", "ai".',
            ),
          limit: z
            .number()
            .optional()
            .describe(
              "Número de criptos a devolver (por defecto 10, máximo 20).",
            ),
        }),
        execute: async ({ category, limit }) => {
          try {
            const result = await getCryptosByCategory(
              category,
              Math.min(limit || 10, 20),
            );

            if (result.notFound) {
              return {
                success: false,
                error: `No encontré la categoría "${category}".`,
                suggestions: result.suggestions,
                source: "coingecko" as const,
                timestamp: new Date().toISOString(),
              };
            }

            return {
              success: true,
              data: result.cryptos,
              category: result.categoryName,
              source: "coingecko" as const,
              timestamp: new Date().toISOString(),
            };
          } catch (error) {
            return {
              success: false,
              error:
                error instanceof Error ? error.message : "Error desconocido",
              source: "coingecko" as const,
              timestamp: new Date().toISOString(),
            };
          }
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
