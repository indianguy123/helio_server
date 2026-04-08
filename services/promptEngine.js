const asJson = (value) => JSON.stringify(value);

const promptEngine = {
  failures(conversations) {
    return `Analyze these e-commerce AI assistant conversations.
Find every instance where the assistant:
- Gave a wrong or unverifiable answer
- Failed to answer a question it should know
- Contradicted itself across turns
- Gave a vague non-answer when specifics were needed
Return ONLY this JSON (no markdown, no explanation):
{
  "failures": [
    {
      "sessionId": "...",
      "type": "wrong_answer|no_answer|contradiction|vague",
      "severity": "high|medium|low",
      "description": "...",
      "assistantQuote": "exact quote from assistant",
      "userQuestion": "what the user asked"
    }
  ],
  "patterns": [
    { "name": "...", "count": 0, "description": "..." }
  ]
}
Conversations: ${asJson(conversations)}`;
  },
  frustration(conversations) {
    return `Analyze these conversations for user frustration signals.
Look for: repeated questions, escalating language, short dismissive replies,
users saying they give up, users asking to speak to a human.
Return ONLY this JSON:
{
  "frustratedSessions": [
    {
      "sessionId": "...",
      "signals": ["list of specific signals found"],
      "severity": "high|medium|low",
      "dropOffPoint": "what was happening when user left or gave up",
      "triggerMessage": "the assistant message that seemed to cause frustration"
    }
  ],
  "overallFrustrationRate": 0.0
}
Conversations: ${asJson(conversations)}`;
  },
  hallucinations(conversations) {
    return `Check if the AI assistant made up or stated unverifiable information.
Look for: specific prices stated confidently, product specs that seem invented,
policy details that contradict themselves, delivery times stated as fact,
features claimed that weren't mentioned by the user.
Return ONLY this JSON:
{
  "suspectedHallucinations": [
    {
      "sessionId": "...",
      "assistantClaim": "exact quote of the suspicious claim",
      "reason": "why this seems hallucinated",
      "severity": "high|medium|low"
    }
  ]
}
Conversations: ${asJson(conversations)}`;
  },
  topics(conversations) {
    return `Categorize what topics users asked about and whether the assistant
handled each topic well or poorly.
Topics to consider: product info, sizing/fit, shipping, returns/refunds,
availability, pricing, comparisons, complaints, order tracking, recommendations.
Return ONLY this JSON:
{
  "wellHandled": [
    { "topic": "...", "count": 0, "reason": "why it went well", "exampleSessionId": "..." }
  ],
  "poorlyHandled": [
    { "topic": "...", "count": 0, "reason": "why it went poorly", "exampleSessionId": "..." }
  ]
}
Conversations: ${asJson(conversations)}`;
  },
  recommendations(conversations) {
    return `Based on these conversations, generate the 5 most impactful improvements
this brand should make to their AI assistant. Be specific — reference actual
patterns you see in the data. Prioritize by potential impact.
Return ONLY this JSON:
{
  "recommendations": [
    {
      "priority": 1,
      "action": "specific thing to change or add",
      "reason": "evidence from the conversations",
      "estimatedImpact": "what will improve and by how much approximately"
    }
  ]
}
Conversations: ${asJson(conversations)}`;
  },
};

export default promptEngine;
