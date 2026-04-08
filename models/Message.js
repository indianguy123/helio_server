import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
    },
    role: { type: String, enum: ["user", "assistant"] },
    content: { type: String },
    timestamp: { type: Date },
    sequence: { type: Number },
  },
  { collection: "messages" }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
