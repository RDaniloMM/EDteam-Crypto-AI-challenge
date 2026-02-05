"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { UIMessage } from "ai";
import type { StoredMessage } from "@/app/lib/redis";

// Key para localStorage (solo para el sessionId)
const SESSION_KEY = "crypto-chat-session-id";

/**
 * Genera un ID de sesión único
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Obtiene o crea un sessionId persistente en localStorage
 */
function getOrCreateSessionId(): string {
  if (typeof window === "undefined") {
    return generateSessionId();
  }

  let sessionId = localStorage.getItem(SESSION_KEY);

  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem(SESSION_KEY, sessionId);
  }

  return sessionId;
}

/**
 * Convierte UIMessage a StoredMessage para Redis
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
 * Convierte StoredMessage de Redis a UIMessage
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
 * Hook para persistir el historial de chat en Upstash Redis
 */
export function useChatHistory() {
  const [savedMessages, setSavedMessages] = useState<UIMessage[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const sessionIdRef = useRef<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Obtener sessionId en cliente
  useEffect(() => {
    sessionIdRef.current = getOrCreateSessionId();
  }, []);

  // Cargar historial al montar
  useEffect(() => {
    async function loadHistory() {
      try {
        const sessionId = getOrCreateSessionId();
        sessionIdRef.current = sessionId;

        const response = await fetch(`/api/history?sessionId=${sessionId}`);

        if (response.ok) {
          const data = await response.json();
          if (data.messages && data.messages.length > 0) {
            const messages = data.messages.map(fromStoredMessage);
            setSavedMessages(messages);
          }
        }
      } catch (error) {
        console.error("Error loading chat history from Redis:", error);
      } finally {
        setIsLoaded(true);
      }
    }

    loadHistory();
  }, []);

  // Guardar mensajes en Redis (con debounce)
  const saveMessages = useCallback((messages: UIMessage[]) => {
    // Actualizar estado local inmediatamente
    setSavedMessages(messages);

    // Cancelar timeout anterior
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce de 500ms para evitar muchas llamadas
    saveTimeoutRef.current = setTimeout(async () => {
      const sessionId = sessionIdRef.current;
      if (!sessionId) return;

      setIsSaving(true);

      try {
        const storedMessages = messages.map(toStoredMessage);

        await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            messages: storedMessages,
          }),
        });
      } catch (error) {
        console.error("Error saving chat history to Redis:", error);
      } finally {
        setIsSaving(false);
      }
    }, 500);
  }, []);

  // Limpiar historial
  const clearHistory = useCallback(async () => {
    const sessionId = sessionIdRef.current;
    if (!sessionId) return;

    try {
      await fetch(`/api/history?sessionId=${sessionId}`, {
        method: "DELETE",
      });
      setSavedMessages([]);
    } catch (error) {
      console.error("Error clearing chat history from Redis:", error);
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    savedMessages,
    saveMessages,
    clearHistory,
    isLoaded,
    isSaving,
  };
}
