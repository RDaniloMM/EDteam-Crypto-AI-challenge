import { createGroq } from "@ai-sdk/groq";
import { streamText, UIMessage, tool, convertToModelMessages } from "ai";
import { z } from "zod";
import { getTop10Cryptos, getCryptoByQuery } from "@/app/lib/coingecko";

// Crear cliente de Groq
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

// Permitir respuestas de streaming de hasta 30 segundos
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    // llama-3.3-70b-versatile es el modelo recomendado para tool use en Groq
    model: groq("llama-3.3-70b-versatile"),
    // maxSteps permite que el modelo continúe después de ejecutar una tool
    system: `Eres un asistente experto en criptomonedas. Tu trabajo es ayudar a los usuarios a obtener información sobre criptomonedas usando datos reales de Coingecko.

REGLAS IMPORTANTES:
1. NUNCA inventes precios o datos de criptomonedas. SIEMPRE usa las tools disponibles para obtener datos reales.
2. Si el usuario pregunta por precios, market cap, o cualquier dato de criptos, DEBES usar una tool.
3. Si el usuario pregunta por el top 10, las más valiosas, o criptos más importantes, usa getTop10Cryptos.
4. Si el usuario pregunta por una cripto específica (bitcoin, eth, solana, etc.), usa getCryptoByQuery.
5. Puedes responder preguntas generales sobre criptomonedas sin usar tools (conceptos, qué es blockchain, etc.)
6. Siempre indica que los datos provienen de Coingecko cuando muestres precios.
7. Sé conciso en tus respuestas.`,
    messages: await convertToModelMessages(messages),
    tools: {
      getTop10Cryptos: tool({
        description:
          "Obtiene la lista de las 10 criptomonedas con mayor capitalización de mercado (market cap). Incluye nombre, símbolo, precio, market cap, variación 24h e imagen. No requiere parámetros.",
        // Acepta objeto vacío o null/undefined que el modelo pueda enviar
        inputSchema: z.object({}).optional().nullable(),
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
              'El nombre, símbolo o ID de la criptomoneda a buscar. Ejemplos: "bitcoin", "btc", "ethereum", "eth", "solana", "sol"',
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
    },
  });

  return result.toUIMessageStreamResponse();
}
