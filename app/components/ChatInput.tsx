"use client";

import type { FormEvent, ChangeEvent } from "react";

interface ChatInputProps {
  input: string;
  handleInputChange: (
    e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>,
  ) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}

export function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
}: ChatInputProps) {
  return (
    <form
      onSubmit={handleSubmit}
      className='border-t border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-950'
    >
      <div className='flex gap-2 items-end max-w-3xl mx-auto'>
        <div className='flex-1 relative'>
          <input
            type='text'
            value={input}
            onChange={handleInputChange}
            placeholder='Pregunta sobre criptomonedas...'
            disabled={isLoading}
            className='w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all'
            aria-label='Escribe tu mensaje'
          />
        </div>
        <button
          type='submit'
          disabled={isLoading || !input.trim()}
          className='p-3 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950'
          aria-label='Enviar mensaje'
        >
          {isLoading ? (
            <svg
              className='w-5 h-5 animate-spin'
              fill='none'
              viewBox='0 0 24 24'
            >
              <circle
                className='opacity-25'
                cx='12'
                cy='12'
                r='10'
                stroke='currentColor'
                strokeWidth='4'
              />
              <path
                className='opacity-75'
                fill='currentColor'
                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
              />
            </svg>
          ) : (
            <svg
              className='w-5 h-5'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 19l9 2-9-18-9 18 9-2zm0 0v-8'
              />
            </svg>
          )}
        </button>
      </div>
    </form>
  );
}
