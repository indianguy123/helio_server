import { Router } from "express";
import multer from "multer";
import csv from "csv-parser";
import { Readable } from "stream";
import mongoose from "mongoose";
import auth from "../middleware/auth.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import dataLoader from "../services/dataLoader.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(auth);

router.get("/:brandId", async (req, res) => {
  const { brandId } = req.params;
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.max(1, Math.min(100, Number(req.query.limit || 20)));
  const category = req.query.category;
  const resolved = req.query.resolved;

  const loaded = await dataLoader.getConversationsForBrand(brandId);
  const filtered = loaded
    .map((item) => item.conversation)
    .filter((c) => {
      if (category && c.metadata?.product_category !== category) return false;
      if (resolved !== undefined && Boolean(c.resolved) !== (resolved === "true")) return false;
      return true;
    })
    .sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));

  const totalCount = filtered.length;
  const conversations = filtered.slice((page - 1) * limit, page * limit);

  return res.json({
    conversations,
    totalCount,
    page,
    totalPages: Math.ceil(totalCount / limit) || 1,
  });
});

router.get("/session/:sessionId", async (req, res) => {
  const sessionId = req.params.sessionId;
  const orConditions = [{ session_id: sessionId }, { sessionId }];
  if (mongoose.Types.ObjectId.isValid(sessionId)) {
    orConditions.push({ _id: sessionId });
  }
  const conversation = await Conversation.findOne({
    $or: orConditions,
  }).lean();
  if (!conversation) return res.status(404).json({ error: "Conversation not found" });

  const messages = await Message.find({
    $or: [{ conversation_id: conversation._id }, { conversationId: String(conversation._id) }],
  })
    .sort({ sequence: 1, timestamp: 1 })
    .lean();
  return res.json({ conversation, messages });
});

router.post("/import/preview", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "File is required" });
  const filename = req.file.originalname.toLowerCase();

  if (filename.endsWith(".json")) {
    const text = req.file.buffer.toString("utf-8");
    const parsed = JSON.parse(text);
    const records = Array.isArray(parsed) ? parsed : parsed.records || [];
    return res.json({ type: "json", rows: records.slice(0, 50), totalRows: records.length });
  }

  if (!filename.endsWith(".csv")) {
    return res.status(400).json({ error: "Only CSV or JSON files are supported" });
  }

  const rows = [];
  await new Promise((resolve, reject) => {
    const readable = Readable.from(req.file.buffer.toString("utf-8"));
    readable
      .pipe(csv())
      .on("data", (row) => {
        if (rows.length < 50) rows.push(row);
      })
      .on("end", resolve)
      .on("error", reject);
  });

  return res.json({ type: "csv", rows, totalRows: rows.length });
});

export default router;
