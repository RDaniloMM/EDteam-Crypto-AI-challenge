"use client";

import Image from "next/image";
import { ConversationEmptyState } from "@/components/ai-elements/conversation";
import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion";

interface ChatEmptyStateProps {
  onSuggestionClick: (suggestion: string) => void;
}

export function ChatEmptyState({ onSuggestionClick }: ChatEmptyStateProps) {
  return (
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
      description='Pregúntame sobre criptomonedas.'
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
          <h3 className='font-semibold text-lg'>Asistente Crypto</h3>
          <p className='text-muted-foreground text-sm max-w-md'>
            Pregúntame sobre criptomonedas.
          </p>
        </div>

        <p className='text-sm font-medium mb-4 text-primary animate-in fade-in slide-in-from-bottom-2 duration-500'>
          ¿Por dónde comenzamos?
        </p>

        <Suggestions className='justify-center flex-wrap'>
          <Suggestion
            suggestion='¿Cuáles son las criptos más valuadas?'
            onClick={() =>
              onSuggestionClick("¿Cuáles son las criptos más valuadas?")
            }
          />
          <Suggestion
            suggestion='¿A cuánto está Bitcoin?'
            onClick={() => onSuggestionClick("¿A cuánto está Bitcoin?")}
          />
          <Suggestion
            suggestion='Precio de ETH'
            onClick={() => onSuggestionClick("Precio de ETH")}
          />
          <Suggestion
            suggestion='Dame las memecoins más importantes'
            onClick={() =>
              onSuggestionClick("Dame las memecoins más importantes")
            }
          />
        </Suggestions>
      </div>
    </ConversationEmptyState>
  );
}
