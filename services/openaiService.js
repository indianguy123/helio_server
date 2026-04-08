import OpenAI from "openai";
import promptEngine from "./promptEngine.js";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);

const safeParse = (content) => {
  try {
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
};

const withDefaultShape = (key, value) => {
  if (!value || typeof value !== "object") {
    if (key === "failures") return { failures: [], patterns: [] };
    if (key === "frustration") return { frustratedSessions: [], overallFrustrationRate: 0 };
    if (key === "hallucinations") return { suspectedHallucinations: [] };
    if (key === "topics") return { wellHandled: [], poorlyHandled: [] };
    if (key === "recommendations") return { recommendations: [] };
  }
  return value;
};

const buildMockResults = (conversations) => {
  const first = conversations[0];
  const sessionId = first?.sessionId || "mock-session-1";
  const userQuestion =
    first?.messages?.find((m) => m.role === "user")?.content || "Can you help me choose a product?";
  const assistantReply =
    first?.messages?.find((m) => m.role === "assistant")?.content ||
    "Here is a general recommendation based on your needs.";

  return {
    failures: {
      failures: [
        {
          sessionId,
          type: "vague",
          severity: "medium",
          description: "Assistant response is generic and misses requested specifics.",
          assistantQuote: assistantReply,
          userQuestion,
        },
      ],
      patterns: [
        {
          name: "generic_assistant_replies",
          count: Math.max(1, Math.floor(conversations.length / 3)),
          description: "Assistant gives non-specific replies when users ask detailed questions.",
        },
      ],
    },
    frustration: {
      frustratedSessions: [
        {
          sessionId,
          signals: ["user repeated the ask", "assistant did not provide specifics"],
          severity: "medium",
          dropOffPoint: "After repeated question without precise details.",
          triggerMessage: assistantReply,
        },
      ],
      overallFrustrationRate: conversations.length ? 0.2 : 0,
    },
    hallucinations: {
      suspectedHallucinations: [],
    },
    topics: {
      wellHandled: [
        {
          topic: "product info",
          count: Math.max(1, Math.floor(conversations.length / 2)),
          reason: "Assistant usually responds with relevant catalog context.",
          exampleSessionId: sessionId,
        },
      ],
      poorlyHandled: [
        {
          topic: "recommendations",
          count: Math.max(1, Math.floor(conversations.length / 3)),
          reason: "Recommendations are often broad and not tailored.",
          exampleSessionId: sessionId,
        },
      ],
    },
    recommendations: {
      recommendations: [
        {
          priority: 1,
          action: "Add stricter product-grounded response templates",
          reason: "Several replies are generic instead of answering specific user queries.",
          estimatedImpact: "Could improve resolution by 10-15% and reduce user follow-ups.",
        },
        {
          priority: 2,
          action: "Introduce fallback clarifying questions before final answer",
          reason: "When context is incomplete, assistant should ask for missing details.",
          estimatedImpact: "Could reduce vague-answer rate by around 20%.",
        },
      ],
    },
  };
};

export async function callOpenAI(prompt) {
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 4000,
    });
    const content = response?.choices?.[0]?.message?.content || "{}";
    return safeParse(content);
  } catch (error) {
    console.error("OpenAI call failed:", error.message);
    return null;
  }
}

export async function runAllAnalyses(conversations) {
  if (!hasOpenAIKey) {
    console.warn("OPENAI_API_KEY not found. Using mock analysis results.");
    return buildMockResults(conversations);
  }

  const prompts = {
    failures: promptEngine.failures(conversations),
    frustration: promptEngine.frustration(conversations),
    hallucinations: promptEngine.hallucinations(conversations),
    topics: promptEngine.topics(conversations),
    recommendations: promptEngine.recommendations(conversations),
  };

  const entries = Object.entries(prompts);
  const settled = await Promise.allSettled(entries.map(([, prompt]) => callOpenAI(prompt)));

  const result = {};
  settled.forEach((item, index) => {
    const [key] = entries[index];
    if (item.status === "fulfilled") {
      result[key] = withDefaultShape(key, item.value);
    } else {
      console.error(`Analysis failed for ${key}:`, item.reason);
      result[key] = withDefaultShape(key, null);
    }
  });

  return result;
}

export default { callOpenAI, runAllAnalyses };
