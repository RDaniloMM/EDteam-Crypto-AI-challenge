"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChatMessage } from "./ChatMessage";
import { CryptoAutocomplete } from "./CryptoAutocomplete";
import { useChatHistory } from "@/app/hooks/useChatHistory";

function SkeletonLine({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className}`} />;
}

export function Chat() {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { savedMessages, saveMessages, clearHistory, isLoaded } =
    useChatHistory();

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  const isLoading = status === "streaming" || status === "submitted";

  // Restaurar mensajes guardados al cargar
  useEffect(() => {
    if (isLoaded && savedMessages.length > 0 && messages.length === 0) {
      setMessages(savedMessages);
    }
  }, [isLoaded, savedMessages, messages.length, setMessages]);

  // Guardar mensajes cuando cambian (solo si no está cargando y hay mensajes)
  useEffect(() => {
    if (isLoaded && messages.length > 0 && status === "ready") {
      saveMessages(messages);
    }
  }, [messages, status, isLoaded, saveMessages]);

  // Auto-scroll al final cuando hay nuevos mensajes o está cargando
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage({ text: suggestion });
  };

  // Manejar selección del autocomplete
  const handleCryptoSelect = (crypto: {
    id: string;
    name: string;
    symbol: string;
  }) => {
    const query = `Dame información sobre ${crypto.name} (${crypto.symbol.toUpperCase()})`;
    sendMessage({ text: query });
  };

  // Limpiar chat
  const handleClearChat = () => {
    setMessages([]);
    clearHistory();
  };

  return (
    <div className='flex flex-col h-full'>
      {/* Barra de búsqueda */}
      <div className='border-b p-3 bg-muted/30'>
        <div className='max-w-2xl mx-auto flex items-center gap-3'>
          <div className='flex-1'>
            <CryptoAutocomplete
              onSelect={handleCryptoSelect}
              placeholder='Buscar criptomoneda por nombre o símbolo...'
            />
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className='flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors'
              title='Limpiar historial'
              aria-label='Limpiar historial de chat'
            >
              <Trash2 className='w-4 h-4' />
              <span className='hidden sm:inline'>Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {/* Área de mensajes */}
      <Conversation className='flex-1'>
        <ConversationContent className='px-4'>
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={
                <Image
                  src='/logo.png'
                  alt='Asistente Crypto'
                  width={64}
                  height={64}
                  className='rounded-full'
                />
              }
              title='Asistente Crypto'
              description='Pregúntame sobre criptomonedas. Puedo mostrarte el top 10 por market cap o darte información detallada de cualquier criptomoneda'
            >
              <Image
                src='/logo.png'
                alt='Asistente Crypto'
                width={64}
                height={64}
                className='rounded-full mb-4'
              />
              <div className='space-y-1 mb-6'>
                <h3 className='font-semibold text-lg'>Crypto Assistant</h3>
                <p className='text-muted-foreground text-sm max-w-md'>
                  Pregúntame sobre criptomonedas. Puedo mostrarte el top 10 por
                  market cap o darte información detallada de cualquier cripto.
                </p>
              </div>
              <Suggestions className='justify-center'>
                <Suggestion
                  suggestion='¿Cuáles son las criptos más valuadas?'
                  onClick={handleSuggestionClick}
                />
                <Suggestion
                  suggestion='¿A cuánto está Bitcoin?'
                  onClick={handleSuggestionClick}
                />
                <Suggestion
                  suggestion='Precio de ETH'
                  onClick={handleSuggestionClick}
                />
                <Suggestion
                  suggestion='Dame info de Solana'
                  onClick={handleSuggestionClick}
                />
              </Suggestions>
            </ConversationEmptyState>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                />
              ))}

              {isLoading && (
                <div className='space-y-2'>
                  <SkeletonLine className='h-4 w-3/4' />
                  <SkeletonLine className='h-4 w-1/2' />
                </div>
              )}

              {error && (
                <Alert variant='destructive'>
                  <AlertDescription>Error: {error.message}</AlertDescription>
                </Alert>
              )}

              {/* Elemento invisible para auto-scroll */}
              <div ref={messagesEndRef} />
            </>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Input */}
      <div className='border-t p-4 bg-background'>
        <PromptInput
          onSubmit={({ text }) => {
            sendMessage({ text });
            setInput("");
          }}
          className='max-w-3xl mx-auto'
        >
          <PromptInputTextarea
            placeholder='Pregunta sobre criptomonedas...'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <PromptInputSubmit disabled={isLoading || !input.trim()} />
        </PromptInput>
      </div>
    </div>
  );
}
