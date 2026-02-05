import { NextRequest, NextResponse } from "next/server";
import {
  getConversationsList,
  saveConversation,
  deleteConversation,
  generateChatTitle,
  getTextFromMessage,
  type ChatConversation,
  type StoredMessage,
} from "@/app/lib/redis";

/**
 * GET /api/conversations?userId=xxx
 * Obtiene la lista de conversaciones
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    const conversations = await getConversationsList(userId);

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/conversations
 * Crea o actualiza una conversación
 * Body: { userId: string, conversation: ChatConversation } o
 *       { userId: string, conversationId: string, messages: StoredMessage[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, conversation, conversationId, messages } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    // Si se envía una conversación completa
    if (conversation) {
      await saveConversation(userId, conversation as ChatConversation);
      return NextResponse.json({ success: true, conversation });
    }

    // Si se envían mensajes para actualizar una conversación existente o crear una nueva
    if (conversationId && Array.isArray(messages)) {
      const existingConversations = await getConversationsList(userId);
      const existing = existingConversations.find(
        (c) => c.id === conversationId,
      );

      const now = new Date().toISOString();

      // Generar título del primer mensaje del usuario
      const firstUserMessage = messages.find(
        (m: StoredMessage) => m.role === "user",
      );
      const messageText = firstUserMessage
        ? getTextFromMessage(firstUserMessage)
        : "";
      const title = messageText
        ? generateChatTitle(messageText)
        : "Nueva conversación";

      const updatedConversation: ChatConversation = {
        id: conversationId,
        title: existing?.title || title,
        messages: messages as StoredMessage[],
        createdAt: existing?.createdAt || now,
        lastUpdated: now,
      };

      await saveConversation(userId, updatedConversation);
      return NextResponse.json({
        success: true,
        conversation: updatedConversation,
      });
    }

    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error saving conversation:", error);
    return NextResponse.json(
      { error: "Failed to save conversation" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/conversations?userId=xxx&conversationId=xxx
 * Elimina una conversación
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const conversationId = searchParams.get("conversationId");

    if (!userId || !conversationId) {
      return NextResponse.json(
        { error: "userId and conversationId are required" },
        { status: 400 },
      );
    }

    await deleteConversation(userId, conversationId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return NextResponse.json(
      { error: "Failed to delete conversation" },
      { status: 500 },
    );
  }
}
