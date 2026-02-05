"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef, useEffect } from "react";
import { ChatSidebar } from "./ChatSidebar";
import { useConversations } from "@/app/hooks/useConversations";
import { ChatInterface } from "./ChatInterface";

export function Chat() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

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

  const handleNewChat = () => {
    setMessages([]);
    createNewConversation();
  };

  const handleSelectConversation = (id: string) => {
    selectConversation(id);
  };

  return (
    <div className='flex h-screen bg-muted/30'>
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
      <div className='flex-1 flex justify-center p-2 md:p-4'>
        <ChatInterface
          messages={messages}
          sendMessage={sendMessage}
          status={status}
          error={error}
          searchContainerClassName='max-w-2xl mx-auto pl-12 md:pl-0'
        />
      </div>
    </div>
  );
}
