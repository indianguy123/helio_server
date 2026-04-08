import mongoose from "mongoose";

const analysisJobSchema = new mongoose.Schema({
  brandId: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "running", "done", "failed"],
    default: "pending",
  },
  progress: { type: Number, default: 0 },
  totalConversations: { type: Number, default: 0 },
  processedBatches: { type: Number, default: 0 },
  totalBatches: { type: Number, default: 0 },
  errorMessage: { type: String, default: "" },
  startedAt: { type: Date },
  completedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

const AnalysisJob = mongoose.model("AnalysisJob", analysisJobSchema);

export default AnalysisJob;
