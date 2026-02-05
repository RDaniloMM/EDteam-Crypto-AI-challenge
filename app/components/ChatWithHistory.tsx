"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
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
import { ChatSidebar } from "./ChatSidebar";
import { useConversations } from "@/app/hooks/useConversations";

function SkeletonLine({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className}`} />;
}

export function ChatWithHistory() {
  const [input, setInput] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    conversations,
    currentConversationId,
    currentMessages,
    isLoading: isLoadingConversations,
    saveMessages,
    createNewConversation,
    selectConversation,
    deleteConversation,
  } = useConversations();

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  const isLoading = status === "streaming" || status === "submitted";
  const lastConversationIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      !isLoadingConversations &&
      currentConversationId !== lastConversationIdRef.current
    ) {
      lastConversationIdRef.current = currentConversationId;

      if (currentMessages.length > 0) {
        setMessages(currentMessages);
      } else {
        setMessages([]);
      }
    }
  }, [
    currentConversationId,
    isLoadingConversations,
    currentMessages,
    setMessages,
  ]);

  useEffect(() => {
    if (!isLoadingConversations && messages.length > 0 && status === "ready") {
      saveMessages(messages);
    }
  }, [messages, status, isLoadingConversations, saveMessages]);

  // Auto-scroll
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

  const handleNewChat = () => {
    setMessages([]);
    createNewConversation();
  };

  const handleSelectConversation = (id: string) => {
    selectConversation(id);
  };

  return (
    <div className='flex h-screen bg-muted/30 p-2 md:p-4'>
      {/* Sidebar */}
      <ChatSidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={deleteConversation}
        isLoading={isLoadingConversations}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Chat Area - Centered with max width */}
      <div
        className={`flex-1 flex justify-center transition-all duration-300 ${isSidebarCollapsed ? "md:pl-14" : "md:pl-8"}`}
      >
        <main className='w-full max-w-4xl flex flex-col h-full overflow-hidden rounded-lg bg-background'>
          {/* Search Bar */}
          <div className='border-b p-3 bg-muted/30'>
            <div className='max-w-2xl mx-auto pl-12 md:pl-0'>
              <CryptoAutocomplete
                onSelect={handleCryptoSelect}
                placeholder='Buscar criptomoneda por nombre o símbolo...'
              />
            </div>
          </div>

          {/* Messages Area */}
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
                  description='Pregúntame sobre criptomonedas'
                >
                  <div className='flex flex-col items-center text-center'>
                    <Image
                      src='/logo.png'
                      alt='Asistente Crypto'
                      width={64}
                      height={64}
                      className='rounded-full mb-4'
                    />
                    <div className='space-y-1 mb-6'>
                      <h3 className='font-semibold text-lg'>
                        Asistente Crypto
                      </h3>
                      <p className='text-muted-foreground text-sm max-w-md'>
                        Pregúntame sobre criptomonedas. Puedo mostrarte el top
                        10 por market cap o darte información detallada de
                        cualquier cripto.
                      </p>
                    </div>
                    <Suggestions className='justify-center flex-wrap'>
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
                  </div>
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
                      <AlertDescription>
                        Error: {error.message}
                      </AlertDescription>
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
      </div>
    </div>
  );
}
