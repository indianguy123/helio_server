import mongoose from "mongoose";

const brandSchema = new mongoose.Schema({
  brandId: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  totalConversations: { type: Number, default: 0 },
  lastAnalyzedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

const Brand = mongoose.model("Brand", brandSchema);

export default Brand;
