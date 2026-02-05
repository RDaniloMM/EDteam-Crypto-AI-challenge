"use client";

import { useState } from "react";
import {
  MessageSquarePlus,
  Trash2,
  MessageSquare,
  Menu,
  X,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import Image from "next/image";
import type { ChatConversation } from "@/app/lib/redis";

interface ChatSidebarProps {
  conversations: ChatConversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  isLoading?: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function ChatSidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  isLoading = false,
  isCollapsed,
  onToggleCollapse,
}: ChatSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);
    await onDeleteConversation(id);
    setDeletingId(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Hoy";
    } else if (diffDays === 1) {
      return "Ayer";
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    } else {
      return date.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
      });
    }
  };

  const sidebarContent = (
    <>
      {/* Header */}
      <div className='p-3 border-b border-border'>
        <div className='flex items-center justify-between mb-3'>
          <div className='flex items-center gap-2'>
            <Image
              src='/logo.png'
              alt='Crypto Chat'
              width={28}
              height={28}
              className='rounded-lg'
            />
            <span className='font-semibold text-sm text-foreground'>
              Crypto Chat
            </span>
          </div>
          {/* Botón colapsar - solo desktop */}
          <button
            onClick={onToggleCollapse}
            className='hidden md:flex p-1.5 hover:bg-muted rounded-md transition-colors'
            title='Ocultar sidebar'
          >
            <PanelLeftClose className='w-4 h-4 text-muted-foreground' />
          </button>
        </div>
        <button
          onClick={() => {
            onNewChat();
            setIsOpen(false);
          }}
          className='w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors'
        >
          <MessageSquarePlus className='w-4 h-4' />
          Nuevo chat
        </button>
      </div>

      {/* Conversations List */}
      <div className='flex-1 overflow-y-auto p-2'>
        {isLoading ? (
          <div className='space-y-2 p-2'>
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className='flex items-start gap-3 p-3 rounded-lg'
              >
                <div className='w-4 h-4 mt-0.5 bg-muted rounded animate-pulse' />
                <div className='flex-1 space-y-2'>
                  <div className='h-4 bg-muted rounded animate-pulse' style={{ width: `${70 - i * 10}%` }} />
                  <div className='h-3 w-16 bg-muted/70 rounded animate-pulse' />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className='text-center text-muted-foreground text-sm py-8 px-4'>
            <MessageSquare className='w-8 h-8 mx-auto mb-2 opacity-50' />
            <p>No hay conversaciones</p>
            <p className='text-xs mt-1'>Inicia una nueva conversación</p>
          </div>
        ) : (
          <div className='space-y-1'>
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => {
                  onSelectConversation(conv.id);
                  setIsOpen(false);
                }}
                className={`
                  group flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors
                  ${
                    currentConversationId === conv.id
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted/50"
                  }
                `}
              >
                <MessageSquare className='w-4 h-4 mt-0.5 shrink-0 opacity-70' />
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-medium truncate'>{conv.title}</p>
                  <p className='text-xs text-muted-foreground'>
                    {formatDate(conv.lastUpdated)}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDelete(e, conv.id)}
                  disabled={deletingId === conv.id}
                  className={`
                    shrink-0 p-1.5 rounded-md opacity-0 group-hover:opacity-100 
                    hover:bg-destructive/10 hover:text-destructive transition-all
                    ${deletingId === conv.id ? "opacity-100" : ""}
                  `}
                  title='Eliminar conversación'
                >
                  {deletingId === conv.id ? (
                    <div className='w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin' />
                  ) : (
                    <Trash2 className='w-4 h-4' />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='md:hidden fixed top-4 left-4 z-50 p-2 bg-background border border-border rounded-lg shadow-lg'
        aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
      >
        {isOpen ? <X className='w-5 h-5' /> : <Menu className='w-5 h-5' />}
      </button>

      {/* Desktop Toggle Button - cuando está colapsado */}
      {isCollapsed && (
        <button
          onClick={onToggleCollapse}
          className='hidden md:flex fixed top-4 left-4 z-50 p-2 bg-background border border-border rounded-lg shadow-lg hover:bg-muted transition-colors'
          aria-label='Mostrar menú'
          title='Mostrar menú'
        >
          <PanelLeft className='w-5 h-5' />
        </button>
      )}

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className='md:hidden fixed inset-0 bg-black/50 z-40'
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - Desktop collapsible, Mobile slides in */}
      <aside
        className={`
          fixed md:relative inset-y-0 left-0 z-40
          w-64 bg-background border-r border-border
          flex flex-col h-full overflow-hidden
          transition-all duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          ${isCollapsed ? "md:-translate-x-full md:w-0 md:border-0 md:opacity-0" : "md:translate-x-0 md:opacity-100"}
        `}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
