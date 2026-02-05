"use client";

import type { UIMessage } from "ai";
import { CryptoTable } from "./CryptoTable";
import { CryptoCard } from "./CryptoCard";
import { SourceBadge } from "./SourceBadge";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { Tool, ToolHeader, ToolContent } from "@/components/ai-elements/tool";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type {
  CryptoData,
  Top10Result,
  CryptoQueryResult,
  CryptosByCategoryResult,
} from "@/app/types/crypto";

function SkeletonLine({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className}`} />;
}

interface ChatMessageProps {
  message: UIMessage;
}

// Interfaz para las partes de tool con formato tool-{toolName}
interface ToolPart {
  type: string;
  toolCallId: string;
  state: "input-streaming" | "output-available";
  input?: Record<string, unknown>;
  output?: Top10Result | CryptoQueryResult | CryptosByCategoryResult;
}

export function ChatMessage({ message }: ChatMessageProps) {
  return (
    <Message from={message.role}>
      <MessageContent>
        {message.parts?.map((part, index) => {
          // Debug temporal
          if (part.type.startsWith("tool-")) {
            console.log("Tool part:", part.type, JSON.stringify(part, null, 2));
          }

          // Parte de texto
          if (part.type === "text" && part.text) {
            return <MessageResponse key={index}>{part.text}</MessageResponse>;
          }

          // Tool getTop10Cryptos (formato: tool-getTop10Cryptos)
          if (part.type === "tool-getTop10Cryptos") {
            const toolPart = part as unknown as ToolPart;

            return (
              <Tool
                key={index}
                defaultOpen
              >
                <ToolHeader
                  title='Top 10 Criptomonedas'
                  type='tool-getTop10Cryptos'
                  state={
                    toolPart.state === "output-available"
                      ? "output-available"
                      : "input-streaming"
                  }
                />
                <ToolContent>
                  {toolPart.output ? (
                    renderToolResult("getTop10Cryptos", toolPart.output)
                  ) : (
                    <div className='p-4 space-y-2'>
                      <SkeletonLine className='h-4 w-3/4' />
                      <SkeletonLine className='h-4 w-1/2' />
                      <SkeletonLine className='h-4 w-2/3' />
                    </div>
                  )}
                </ToolContent>
              </Tool>
            );
          }

          // Tool getCryptosByCategory (formato: tool-getCryptosByCategory)
          if (part.type === "tool-getCryptosByCategory") {
            const toolPart = part as unknown as ToolPart;
            const category =
              (toolPart.input?.category as string) || "categoría";
            const categoryName = (toolPart.output as CryptosByCategoryResult)
              ?.category;

            return (
              <Tool
                key={index}
                defaultOpen
              >
                <ToolHeader
                  title={
                    categoryName
                      ? `Categoría: ${categoryName}`
                      : `Buscando: ${category}`
                  }
                  type='tool-getCryptosByCategory'
                  state={
                    toolPart.state === "output-available"
                      ? "output-available"
                      : "input-streaming"
                  }
                />
                <ToolContent>
                  {toolPart.output ? (
                    renderToolResult("getCryptosByCategory", toolPart.output)
                  ) : (
                    <div className='p-4 space-y-2'>
                      <SkeletonLine className='h-4 w-3/4' />
                      <SkeletonLine className='h-4 w-1/2' />
                      <SkeletonLine className='h-4 w-2/3' />
                    </div>
                  )}
                </ToolContent>
              </Tool>
            );
          }

          // Tool getCryptoByQuery (formato: tool-getCryptoByQuery)
          if (part.type === "tool-getCryptoByQuery") {
            const toolPart = part as unknown as ToolPart;
            const query = (toolPart.input?.query as string) || "cripto";
            const cryptoName = (toolPart.output as CryptoQueryResult)?.data
              ?.name;

            return (
              <Tool
                key={index}
                defaultOpen
              >
                <ToolHeader
                  title={
                    cryptoName ? `Info: ${cryptoName}` : `Consulta: ${query}`
                  }
                  type='tool-getCryptoByQuery'
                  state={
                    toolPart.state === "output-available"
                      ? "output-available"
                      : "input-streaming"
                  }
                />
                <ToolContent>
                  {toolPart.output ? (
                    renderToolResult("getCryptoByQuery", toolPart.output)
                  ) : (
                    <div className='p-4 space-y-2'>
                      <SkeletonLine className='h-4 w-3/4' />
                      <SkeletonLine className='h-4 w-1/2' />
                      <SkeletonLine className='h-4 w-2/3' />
                    </div>
                  )}
                </ToolContent>
              </Tool>
            );
          }

          return null;
        })}
      </MessageContent>
    </Message>
  );
}

function renderToolResult(
  toolName: string,
  result: Top10Result | CryptoQueryResult | CryptosByCategoryResult,
) {
  if (!result.success) {
    // Mostrar sugerencias si las hay
    if ("suggestions" in result && result.suggestions) {
      return (
        <div className='space-y-2'>
          <Alert>
            <AlertDescription>{result.error}</AlertDescription>
          </Alert>
          <ul className='text-sm text-muted-foreground space-y-1 pl-4'>
            {result.suggestions.map((s) => (
              <li key={s.id}>
                • {s.name} ({s.symbol})
              </li>
            ))}
          </ul>
          <SourceBadge
            source={result.source}
            timestamp={result.timestamp}
          />
        </div>
      );
    }

    return (
      <div className='space-y-2'>
        <Alert variant='destructive'>
          <AlertDescription>{result.error}</AlertDescription>
        </Alert>
        <SourceBadge
          source={result.source}
          timestamp={result.timestamp}
        />
      </div>
    );
  }

  // Top 10 cryptos
  if (
    toolName === "getTop10Cryptos" &&
    "data" in result &&
    Array.isArray(result.data)
  ) {
    return (
      <div className='space-y-2'>
        <CryptoTable cryptos={result.data as CryptoData[]} />
        <SourceBadge
          source={result.source}
          timestamp={result.timestamp}
        />
      </div>
    );
  }

  // Single crypto detail
  if (
    toolName === "getCryptoByQuery" &&
    "data" in result &&
    result.data &&
    !Array.isArray(result.data)
  ) {
    return (
      <div className='space-y-2'>
        <CryptoCard crypto={result.data as CryptoData} />
        <SourceBadge
          source={result.source}
          timestamp={result.timestamp}
        />
      </div>
    );
  }

  // Cryptos by category
  if (
    toolName === "getCryptosByCategory" &&
    "data" in result &&
    Array.isArray(result.data)
  ) {
    return (
      <div className='space-y-2'>
        <CryptoTable cryptos={result.data as CryptoData[]} />
        <SourceBadge
          source={result.source}
          timestamp={result.timestamp}
        />
      </div>
    );
  }

  return null;
}
