"use client";

import { useState, useRef, useEffect } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChatMessage } from "./ChatMessage";
import { CryptoAutocomplete } from "./CryptoAutocomplete";
import { ChatEmptyState } from "./ChatEmptyState";
import { ChatSkeleton } from "./ChatSkeleton";
import { Message } from "ai";

interface ChatInterfaceProps {
  messages: Message[];
  sendMessage: (args: { text: string }) => void;
  status: string;
  error?: Error | null;
  actions?: React.ReactNode;
  searchContainerClassName?: string;
}

export function ChatInterface({
  messages,
  sendMessage,
  status,
  error,
  actions,
  searchContainerClassName = "max-w-2xl mx-auto flex items-center gap-3",
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage({ text: suggestion });
  };

  const handleCryptoSelect = (crypto: {
    id: string;
    name: string;
    symbol: string;
  }) => {
    const query = `Dame información sobre ${crypto.name} (${crypto.symbol.toUpperCase()})`;
    sendMessage({ text: query });
  };

  return (
    <main className='w-full max-w-4xl flex flex-col h-full overflow-hidden rounded-lg bg-background'>
      {/* Search Bar */}
      <div className='border-b p-3 bg-muted/30'>
        <div className={searchContainerClassName}>
          <div className='flex-1'>
            <CryptoAutocomplete
              onSelect={handleCryptoSelect}
              placeholder='Buscar criptomoneda por nombre o símbolo...'
            />
          </div>
          {actions}
        </div>
      </div>

      {/* Messages Area */}
      <Conversation className='flex-1'>
        <ConversationContent className='px-4'>
          {messages.length === 0 ? (
            <ChatEmptyState onSuggestionClick={handleSuggestionClick} />
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                />
              ))}

              {isLoading && <ChatSkeleton />}

              {error && (
                <Alert variant='destructive'>
                  <AlertDescription>Error: {error.message}</AlertDescription>
                </Alert>
              )}

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
    </main>
  );
}
