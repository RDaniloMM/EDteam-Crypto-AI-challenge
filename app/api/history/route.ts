import { NextRequest, NextResponse } from "next/server";
import {
  getChatHistory,
  saveChatHistory,
  deleteChatHistory,
  type StoredMessage,
} from "@/app/lib/redis";

/**
 * GET /api/history?sessionId=xxx
 * Obtiene el historial de chat para una sesión
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 },
      );
    }

    const history = await getChatHistory(sessionId);

    if (!history) {
      return NextResponse.json({
        messages: [],
        lastUpdated: null,
      });
    }

    return NextResponse.json(history);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat history" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/history
 * Guarda el historial de chat
 * Body: { sessionId: string, messages: StoredMessage[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, messages } = body as {
      sessionId: string;
      messages: StoredMessage[];
    };

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 },
      );
    }

    if (!Array.isArray(messages)) {
      return NextResponse.json(
        { error: "messages must be an array" },
        { status: 400 },
      );
    }

    await saveChatHistory(sessionId, messages);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving chat history:", error);
    return NextResponse.json(
      { error: "Failed to save chat history" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/history?sessionId=xxx
 * Elimina el historial de chat
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 },
      );
    }

    await deleteChatHistory(sessionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting chat history:", error);
    return NextResponse.json(
      { error: "Failed to delete chat history" },
      { status: 500 },
    );
  }
}
