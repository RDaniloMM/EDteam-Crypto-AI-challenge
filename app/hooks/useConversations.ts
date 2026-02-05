"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { UIMessage } from "ai";
import type { ChatConversation, StoredMessage } from "@/app/lib/redis";

const USER_ID_KEY = "crypto-chat-user-id";

/**
 * Genera un ID único
 */
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Obtiene o crea un userId persistente
 */
function getOrCreateUserId(): string {
  if (typeof window === "undefined") {
    return generateId();
  }

  let userId = localStorage.getItem(USER_ID_KEY);

  if (!userId) {
    userId = `user_${generateId()}`;
    localStorage.setItem(USER_ID_KEY, userId);
  }

  return userId;
}

/**
 * Convierte UIMessage a StoredMessage
 * En AI SDK v6, UIMessage usa parts[] en lugar de content
 */
function toStoredMessage(msg: UIMessage): StoredMessage {
  return {
    id: msg.id,
    role: msg.role as "user" | "assistant" | "system",
    parts: msg.parts || [],
    createdAt: new Date().toISOString(),
  };
}

/**
 * Convierte StoredMessage a UIMessage
 * En AI SDK v6, UIMessage usa parts[] en lugar de content
 */
function fromStoredMessage(msg: StoredMessage): UIMessage {
  return {
    id: msg.id,
    role: msg.role,
    parts: msg.parts || [],
  } as UIMessage;
}

/**
 * Hook para manejar múltiples conversaciones con Redis
 */
export function useConversations() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const userIdRef = useRef<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Obtener userId
  useEffect(() => {
    userIdRef.current = getOrCreateUserId();
  }, []);

  // Cargar conversaciones al inicio
  useEffect(() => {
    async function loadConversations() {
      try {
        const userId = getOrCreateUserId();
        userIdRef.current = userId;

        const response = await fetch(`/api/conversations?userId=${userId}`);

        if (response.ok) {
          const data = await response.json();
          setConversations(data.conversations || []);

          // Selecciona la primera conversación si existe
          // if (data.conversations && data.conversations.length > 0) {
          //   setCurrentConversationId(data.conversations[0].id);
          // }
        }
      } catch (error) {
        console.error("Error loading conversations:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadConversations();
  }, []);

  // Obtener mensajes de la conversación actual (memoizado)
  const currentMessages: UIMessage[] = useMemo(() => {
    if (!currentConversationId) return [];
    const conv = conversations.find((c) => c.id === currentConversationId);
    return conv ? conv.messages.map(fromStoredMessage) : [];
  }, [currentConversationId, conversations]);

  // Guardar mensajes (con debounce)
  const saveMessages = useCallback(
    (messages: UIMessage[]) => {
      const userId = userIdRef.current;
      if (!userId) return;

      // Cancelar timeout anterior
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Si no hay conversación actual, crear una nueva
      let convId = currentConversationId;
      if (!convId && messages.length > 0) {
        convId = `conv_${generateId()}`;
        setCurrentConversationId(convId);
      }

      if (!convId) return;

      // Actualizar estado local inmediatamente
      setConversations((prev) => {
        const existing = prev.find((c) => c.id === convId);
        const now = new Date().toISOString();

        // Obtener el contenido del primer mensaje del usuario
        const firstUserMessage = messages.find((m) => m.role === "user");
        let titleText = "Nueva conversación";

        if (firstUserMessage && firstUserMessage.parts) {
          // En AI SDK v6, el contenido está en parts[].text
          const textPart = firstUserMessage.parts.find(
            (p): p is { type: "text"; text: string } =>
              typeof p === "object" &&
              p !== null &&
              "type" in p &&
              p.type === "text",
          );
          const content = textPart?.text || "";
          if (content) {
            titleText =
              content.slice(0, 40) + (content.length > 40 ? "..." : "");
          }
        }

        const updated: ChatConversation = {
          id: convId!,
          title: existing?.title || titleText,
          messages: messages.map(toStoredMessage),
          createdAt: existing?.createdAt || now,
          lastUpdated: now,
        };

        // Mover al inicio si existe, o agregar
        const filtered = prev.filter((c) => c.id !== convId);
        return [updated, ...filtered];
      });

      // Debounce de 500ms para guardar en Redis
      saveTimeoutRef.current = setTimeout(async () => {
        setIsSaving(true);

        try {
          await fetch("/api/conversations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              conversationId: convId,
              messages: messages.map(toStoredMessage),
            }),
          });
        } catch (error) {
          console.error("Error saving conversation:", error);
        } finally {
          setIsSaving(false);
        }
      }, 500);
    },
    [currentConversationId],
  );

  // Crear nueva conversación
  const createNewConversation = useCallback(() => {
    setCurrentConversationId(null);
  }, []);

  // Seleccionar conversación
  const selectConversation = useCallback((id: string) => {
    setCurrentConversationId(id);
  }, []);

  // Eliminar conversación
  const deleteConversation = useCallback(
    async (id: string) => {
      const userId = userIdRef.current;
      if (!userId) return;

      try {
        await fetch(
          `/api/conversations?userId=${userId}&conversationId=${id}`,
          {
            method: "DELETE",
          },
        );

        setConversations((prev) => prev.filter((c) => c.id !== id));

        // Si era la conversación actual, limpiar
        if (currentConversationId === id) {
          const remaining = conversations.filter((c) => c.id !== id);
          setCurrentConversationId(
            remaining.length > 0 ? remaining[0].id : null,
          );
        }
      } catch (error) {
        console.error("Error deleting conversation:", error);
      }
    },
    [currentConversationId, conversations],
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    conversations,
    currentConversationId,
    currentMessages,
    isLoading,
    isSaving,
    saveMessages,
    createNewConversation,
    selectConversation,
    deleteConversation,
  };
}
