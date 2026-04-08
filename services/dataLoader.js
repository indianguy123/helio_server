import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import mongoose from "mongoose";

export function getBrandFromConversation(conversation) {
  return (
    conversation.brand_id ||
    conversation.brandId ||
    conversation.widgetId ||
    conversation.widget_id ||
    conversation.metadata?.brand_id ||
    null
  );
}

export function getSessionIdFromConversation(conversation) {
  return conversation.session_id || conversation.sessionId || String(conversation._id);
}

function normalizeConversation(conversation) {
  const createdAt = conversation.created_at || conversation.createdAt;
  const updatedAt = conversation.updated_at || conversation.updatedAt;
  const durationSecondsFromDates =
    createdAt && updatedAt
      ? Math.max(0, Math.round((new Date(updatedAt).getTime() - new Date(createdAt).getTime()) / 1000))
      : 0;

  return {
    ...conversation,
    brand_id: getBrandFromConversation(conversation),
    session_id: getSessionIdFromConversation(conversation),
    resolved: typeof conversation.resolved === "boolean" ? conversation.resolved : false,
    metadata: {
      product_category:
        conversation.metadata?.product_category || conversation.metadata?.category || "unknown",
      channel: conversation.metadata?.channel || "web",
      duration_seconds:
        conversation.metadata?.duration_seconds || conversation.duration_seconds || durationSecondsFromDates,
    },
  };
}

async function getRawConversations() {
  let conversations = await Conversation.find({}).lean();
  if (conversations.length > 0) return conversations;

  // Fallback for legacy dataset stored in "collections".
  const fallback = await mongoose.connection.collection("collections").find({}).toArray();
  return fallback || [];
}

export async function getBrandsFromDB() {
  const conversations = await getRawConversations();
  const brands = new Set(conversations.map((c) => getBrandFromConversation(c)).filter(Boolean));
  return [...brands];
}

export async function getConversationsForBrand(brandId) {
  const allConversations = await getRawConversations();
  const conversations = allConversations
    .filter((c) => getBrandFromConversation(c) === brandId)
    .map((c) => normalizeConversation(c));
  const conversationIds = conversations.map((c) => c._id);

  const messages = await Message.find({
    $or: [{ conversation_id: { $in: conversationIds } }, { conversationId: { $in: conversationIds.map((id) => String(id)) } }],
  })
    .sort({ sequence: 1, timestamp: 1 })
    .lean();

  const byConversationId = new Map();
  for (const msg of messages) {
    const key = String(msg.conversation_id || msg.conversationId);
    if (!byConversationId.has(key)) {
      byConversationId.set(key, []);
    }
    byConversationId.get(key).push(msg);
  }

  return conversations.map((conversation) => ({
    conversation,
    messages: byConversationId.get(String(conversation._id)) || [],
  }));
}

export async function formatForAnalysis(conversationsWithMessages) {
  return conversationsWithMessages.map(({ conversation, messages }) => ({
    sessionId: getSessionIdFromConversation(conversation),
    resolved: Boolean(conversation.resolved),
    category: conversation.metadata?.product_category || "unknown",
    duration: Number(conversation.metadata?.duration_seconds || 0),
    messages: messages.map((m) => ({
      role: m.role || (m.sender === "agent" ? "assistant" : m.sender),
      content: m.content || m.text || "",
    })),
  }));
}

export function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

const dataLoader = {
  getBrandsFromDB,
  getConversationsForBrand,
  formatForAnalysis,
  chunkArray,
  getBrandFromConversation,
  getSessionIdFromConversation,
};

export default dataLoader;
