function dedupeBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    map.set(keyFn(item), item);
  }
  return [...map.values()];
}

function aggregateTopicCounts(topicArrays) {
  const merged = new Map();
  for (const topic of topicArrays) {
    const key = topic.topic || "unknown";
    const current = merged.get(key) || {
      topic: key,
      count: 0,
      reason: topic.reason || "",
      exampleSessionId: topic.exampleSessionId || "",
    };
    current.count += Number(topic.count || 0);
    if (!current.reason && topic.reason) current.reason = topic.reason;
    if (!current.exampleSessionId && topic.exampleSessionId) current.exampleSessionId = topic.exampleSessionId;
    merged.set(key, current);
  }
  return [...merged.values()].sort((a, b) => b.count - a.count).slice(0, 5);
}

export function aggregateResults(allBatchResults, conversations) {
  const totalConversations = conversations.length;
  const resolvedCount = conversations.filter((c) => c.resolved).length;
  const resolutionRate = totalConversations ? resolvedCount / totalConversations : 0;

  const avgDurationSeconds = totalConversations
    ? conversations.reduce((sum, c) => sum + Number(c.metadata?.duration_seconds || 0), 0) / totalConversations
    : 0;

  const categoryCount = conversations.reduce((acc, c) => {
    const category = c.metadata?.product_category || "unknown";
    acc.set(category, (acc.get(category) || 0) + 1);
    return acc;
  }, new Map());
  const topCategory =
    [...categoryCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "unknown";

  const failures = dedupeBy(
    allBatchResults.flatMap((b) => b?.failures?.failures || []),
    (f) => `${f.sessionId || ""}::${f.assistantQuote || ""}`
  );
  const frustratedSessions = dedupeBy(
    allBatchResults.flatMap((b) => b?.frustration?.frustratedSessions || []),
    (f) => `${f.sessionId || ""}`
  );
  const hallucinations = dedupeBy(
    allBatchResults.flatMap((b) => b?.hallucinations?.suspectedHallucinations || []),
    (h) => `${h.sessionId || ""}::${h.assistantClaim || ""}`
  );

  const frustrationRate = totalConversations ? frustratedSessions.length / totalConversations : 0;
  const overallSentiment =
    resolutionRate > 0.75 && frustrationRate < 0.15
      ? "positive"
      : resolutionRate < 0.45 || frustrationRate > 0.35
        ? "negative"
        : "neutral";

  const wellHandled = aggregateTopicCounts(
    allBatchResults.flatMap((b) => b?.topics?.wellHandled || [])
  );
  const poorlyHandled = aggregateTopicCounts(
    allBatchResults.flatMap((b) => b?.topics?.poorlyHandled || [])
  );

  const actionFrequency = new Map();
  const recommendationDetails = new Map();
  for (const rec of allBatchResults.flatMap((b) => b?.recommendations?.recommendations || [])) {
    if (!rec?.action) continue;
    actionFrequency.set(rec.action, (actionFrequency.get(rec.action) || 0) + 1);
    if (!recommendationDetails.has(rec.action)) recommendationDetails.set(rec.action, rec);
  }
  const recommendations = [...actionFrequency.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([action], index) => ({
      priority: index + 1,
      action,
      reason: recommendationDetails.get(action)?.reason || "",
      estimatedImpact: recommendationDetails.get(action)?.estimatedImpact || "",
    }));

  const issueMap = new Map();
  for (const f of failures) {
    const key = f.type || "no_answer";
    const current = issueMap.get(key) || {
      type: key,
      severity: f.severity || "medium",
      count: 0,
      description: f.description || "",
      examples: [],
      quotes: [],
    };
    current.count += 1;
    if (f.sessionId) current.examples.push(f.sessionId);
    if (f.assistantQuote) current.quotes.push(f.assistantQuote);
    issueMap.set(key, current);
  }
  for (const h of hallucinations) {
    const key = "hallucination";
    const current = issueMap.get(key) || {
      type: key,
      severity: h.severity || "high",
      count: 0,
      description: "Assistant made suspicious or unverifiable claims.",
      examples: [],
      quotes: [],
    };
    current.count += 1;
    if (h.sessionId) current.examples.push(h.sessionId);
    if (h.assistantClaim) current.quotes.push(h.assistantClaim);
    issueMap.set(key, current);
  }
  const issues = [...issueMap.values()].map((issue) => ({
    ...issue,
    examples: [...new Set(issue.examples)].slice(0, 10),
    quotes: [...new Set(issue.quotes)].slice(0, 10),
  }));

  return {
    summary: {
      totalConversations,
      resolvedCount,
      resolutionRate,
      avgDurationSeconds,
      overallSentiment,
      topCategory,
    },
    issues,
    topicAnalysis: {
      wellHandled,
      poorlyHandled,
    },
    frustrationSignals: frustratedSessions.map((f) => ({
      sessionId: f.sessionId || "",
      signals: f.signals || [],
      dropOffPoint: f.dropOffPoint || "",
    })),
    recommendations,
    brandComparison: {
      resolutionRatePercentile: Math.round(resolutionRate * 100),
      sentimentPercentile:
        overallSentiment === "positive" ? 85 : overallSentiment === "neutral" ? 55 : 25,
      issueCountVsAvg: issues.length > 5 ? "above average" : issues.length < 2 ? "below average" : "at average",
    },
  };
}

export default { aggregateResults };
