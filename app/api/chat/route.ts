import { createOpenAI } from "@ai-sdk/openai";
import { streamText, UIMessage, tool, convertToModelMessages } from "ai";
import { z } from "zod";
import { getTop10Cryptos, getCryptoByQuery } from "@/app/lib/coingecko";

// Crear cliente OpenAI apuntando al Vercel AI Gateway
const openai = createOpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: "https://ai-gateway.vercel.sh/v1",
});

// Permitir respuestas de streaming de hasta 30 segundos
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  // Convertir mensajes
  const convertedMessages = await convertToModelMessages(messages);

  // Detectar si hay tool-results en el historial (causan problemas con Gemini via gateway)
  const hasToolResults = convertedMessages.some((msg) => msg.role === "tool");

  let finalMessages: typeof convertedMessages;

  if (hasToolResults) {
    // Si hay tools en el historial, solo enviar el último mensaje del usuario
    // para evitar incompatibilidades con el formato de tool-results
    const lastUserMsg = [...convertedMessages]
      .reverse()
      .find((m) => m.role === "user");
    finalMessages = lastUserMsg ? [lastUserMsg] : convertedMessages;
  } else {
    // Sin tools, fusionar users consecutivos si los hay
    finalMessages = [];
    for (const msg of convertedMessages) {
      const lastAdded = finalMessages[finalMessages.length - 1];

      if (msg.role === "user" && lastAdded?.role === "user") {
        const getTexts = (content: unknown): string[] => {
          if (Array.isArray(content)) {
            return content
              .filter(
                (c): c is { type: "text"; text: string } =>
                  typeof c === "object" &&
                  c !== null &&
                  (c as Record<string, unknown>).type === "text",
              )
              .map((c) => c.text);
          }
          return [String(content)];
        };

        const combinedText = [
          ...getTexts(lastAdded.content),
          ...getTexts(msg.content),
        ].join("\n\n");
        lastAdded.content = [{ type: "text" as const, text: combinedText }];
        continue;
      }

      finalMessages.push(msg);
    }
  }

  const result = streamText({
      model: openai("google/gemini-3-flash-preview"),
      system: `Eres un asistente experto en criptomonedas. Tu trabajo es ayudar a los usuarios a obtener información sobre criptomonedas usando datos reales de Coingecko.

REGLAS IMPORTANTES:
1. NUNCA inventes precios o datos de criptomonedas. SIEMPRE usa las tools disponibles para obtener datos reales.
2. Si el usuario pregunta por precios, market cap, o cualquier dato de criptos, DEBES usar una tool.
3. Si el usuario pregunta por el top 10, las más valiosas, o criptos más importantes, usa getTop10Cryptos.
4. Si el usuario pregunta por una cripto específica (bitcoin, eth, solana, etc.), usa getCryptoByQuery.
5. Puedes responder preguntas generales sobre criptomonedas sin usar tools (conceptos, qué es blockchain, etc.)
6. Siempre indica que los datos provienen de Coingecko cuando muestres precios.
7. Sé conciso en tus respuestas.`,
      messages: finalMessages,
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
      },
  });

  return result.toUIMessageStreamResponse();
}
