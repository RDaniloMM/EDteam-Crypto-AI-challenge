import { Redis } from "@upstash/redis";

// Cliente de Redis usando variables de entorno
// Se inicializa de forma lazy para evitar errores en build time
let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    // Verificar que las variables de entorno existan
    if (
      !process.env.UPSTASH_REDIS_REST_URL ||
      !process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      throw new Error(
        "Missing Upstash Redis environment variables. " +
          "Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN",
      );
    }

    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  return redis;
}

// Tipos para el historial de chat
// En AI SDK v6, UIMessage usa parts[] en lugar de content
export interface StoredMessage {
  id: string;
  role: "user" | "assistant" | "system";
  parts: unknown[];
  createdAt?: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: StoredMessage[];
  createdAt: string;
  lastUpdated: string;
}

export interface ChatHistoryData {
  messages: StoredMessage[];
  lastUpdated: string;
}

// Keys de Redis
const CHAT_HISTORY_KEY = "crypto-chat:history";
const CHAT_LIST_KEY = "crypto-chat:conversations";

// ==================== FUNCIONES PARA MÚLTIPLES CHATS ====================

/**
 * Obtiene la lista de conversaciones de un usuario
 */
export async function getConversationsList(
  userId: string,
): Promise<ChatConversation[]> {
  const redis = getRedis();
  const key = `${CHAT_LIST_KEY}:${userId}`;

  const data = await redis.get<string>(key);

  if (!data) {
    return [];
  }

  if (typeof data === "object" && Array.isArray(data)) {
    return data as ChatConversation[];
  }

  return JSON.parse(data) as ChatConversation[];
}

/**
 * Guarda una conversación
 */
export async function saveConversation(
  userId: string,
  conversation: ChatConversation,
): Promise<void> {
  const redis = getRedis();
  const listKey = `${CHAT_LIST_KEY}:${userId}`;

  // Obtener lista actual
  const conversations = await getConversationsList(userId);

  // Buscar si ya existe
  const existingIndex = conversations.findIndex(
    (c) => c.id === conversation.id,
  );

  if (existingIndex >= 0) {
    // Actualizar existente
    conversations[existingIndex] = conversation;
  } else {
    // Agregar nueva al inicio
    conversations.unshift(conversation);
  }

  // Limitar a 50 conversaciones
  const limitedConversations = conversations.slice(0, 50);

  // Guardar con TTL de 30 días
  await redis.set(listKey, JSON.stringify(limitedConversations), {
    ex: 2592000,
  });
}

/**
 * Obtiene una conversación específica
 */
export async function getConversation(
  userId: string,
  conversationId: string,
): Promise<ChatConversation | null> {
  const conversations = await getConversationsList(userId);
  return conversations.find((c) => c.id === conversationId) || null;
}

/**
 * Elimina una conversación
 */
export async function deleteConversation(
  userId: string,
  conversationId: string,
): Promise<void> {
  const redis = getRedis();
  const listKey = `${CHAT_LIST_KEY}:${userId}`;

  const conversations = await getConversationsList(userId);
  const filtered = conversations.filter((c) => c.id !== conversationId);

  await redis.set(listKey, JSON.stringify(filtered), { ex: 2592000 });
}

/**
 * Genera un título para la conversación basado en el primer mensaje
 */
export function generateChatTitle(firstMessage: string): string {
  // Limitar a 40 caracteres
  const title = firstMessage.slice(0, 40);
  return title.length < firstMessage.length ? `${title}...` : title;
}

/**
 * Extrae el texto de un StoredMessage que usa parts[] (AI SDK v6)
 */
export function getTextFromMessage(message: StoredMessage): string {
  if (!message.parts || !Array.isArray(message.parts)) {
    return "";
  }

  // Buscar la primera parte de tipo texto
  const textPart = message.parts.find(
    (part: unknown) =>
      typeof part === "object" &&
      part !== null &&
      (part as { type?: string }).type === "text",
  ) as { type: string; text: string } | undefined;

  return textPart?.text || "";
}

// ==================== FUNCIONES LEGACY (compatibilidad) ====================

/**
 * Guarda el historial de chat en Redis
 * TTL: 7 días (604800 segundos)
 */
export async function saveChatHistory(
  sessionId: string,
  messages: StoredMessage[],
): Promise<void> {
  const redis = getRedis();
  const key = `${CHAT_HISTORY_KEY}:${sessionId}`;

  const data: ChatHistoryData = {
    messages,
    lastUpdated: new Date().toISOString(),
  };

  // Guardar con TTL de 7 días
  await redis.set(key, JSON.stringify(data), { ex: 604800 });
}

/**
 * Obtiene el historial de chat de Redis
 */
export async function getChatHistory(
  sessionId: string,
): Promise<ChatHistoryData | null> {
  const redis = getRedis();
  const key = `${CHAT_HISTORY_KEY}:${sessionId}`;

  const data = await redis.get<string>(key);

  if (!data) {
    return null;
  }

  // Si ya es un objeto, retornarlo directamente
  if (typeof data === "object") {
    return data as unknown as ChatHistoryData;
  }

  // Si es un string, parsearlo
  return JSON.parse(data) as ChatHistoryData;
}

/**
 * Elimina el historial de chat de Redis
 */
export async function deleteChatHistory(sessionId: string): Promise<void> {
  const redis = getRedis();
  const key = `${CHAT_HISTORY_KEY}:${sessionId}`;

  await redis.del(key);
}

/**
 * Extiende el TTL del historial (refresh)
 */
export async function refreshChatHistoryTTL(sessionId: string): Promise<void> {
  const redis = getRedis();
  const key = `${CHAT_HISTORY_KEY}:${sessionId}`;

  await redis.expire(key, 604800); // 7 días
}
