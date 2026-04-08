import mongoose from "mongoose";

const issueSchema = new mongoose.Schema(
  {
    type: { type: String },
    severity: { type: String },
    count: { type: Number, default: 0 },
    description: { type: String },
    examples: [{ type: String }],
    quotes: [{ type: String }],
  },
  { _id: false }
);

const topicSchema = new mongoose.Schema(
  {
    topic: { type: String },
    count: { type: Number, default: 0 },
    reason: { type: String },
    exampleSessionId: { type: String },
  },
  { _id: false }
);

const recommendationSchema = new mongoose.Schema(
  {
    priority: { type: Number },
    action: { type: String },
    reason: { type: String },
    estimatedImpact: { type: String },
  },
  { _id: false }
);

const insightSchema = new mongoose.Schema({
  brandId: { type: String, required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "AnalysisJob", required: true },
  generatedAt: { type: Date, default: Date.now },
  summary: {
    totalConversations: { type: Number, default: 0 },
    resolvedCount: { type: Number, default: 0 },
    resolutionRate: { type: Number, default: 0 },
    avgDurationSeconds: { type: Number, default: 0 },
    overallSentiment: { type: String },
    topCategory: { type: String },
  },
  issues: [issueSchema],
  topicAnalysis: {
    wellHandled: [topicSchema],
    poorlyHandled: [topicSchema],
  },
  frustrationSignals: [
    {
      sessionId: { type: String },
      signals: [{ type: String }],
      dropOffPoint: { type: String },
    },
  ],
  recommendations: [recommendationSchema],
  brandComparison: {
    resolutionRatePercentile: { type: Number, default: 0 },
    sentimentPercentile: { type: Number, default: 0 },
    issueCountVsAvg: { type: String, default: "at average" },
  },
  rawBatchResults: [mongoose.Schema.Types.Mixed],
});

const Insight = mongoose.model("Insight", insightSchema);

export default Insight;
