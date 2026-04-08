import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    brand_id: { type: String },
    session_id: { type: String },
    created_at: { type: Date },
    resolved: { type: Boolean },
    metadata: {
      product_category: { type: String },
      channel: { type: String },
      duration_seconds: { type: Number },
    },
  },
  { collection: "conversations" }
);

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
