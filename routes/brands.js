import { Router } from "express";
import auth from "../middleware/auth.js";
import Conversation from "../models/Conversation.js";
import Insight from "../models/Insight.js";
import Brand from "../models/Brand.js";
import dataLoader from "../services/dataLoader.js";

const router = Router();

router.use(auth);

router.get("/", async (req, res) => {
  const brandIds = await dataLoader.getBrandsFromDB();

  const summaries = await Promise.all(
    brandIds.map(async (brandId) => {
      const [conversationCount, latestInsight, brandDoc] = await Promise.all([
        Conversation.countDocuments({ $or: [{ brand_id: brandId }, { widgetId: brandId }] }),
        Insight.findOne({ brandId }).sort({ generatedAt: -1 }).lean(),
        Brand.findOne({ brandId }).lean(),
      ]);
      return {
        brandId,
        displayName: brandDoc?.displayName || brandId,
        totalConversations: conversationCount,
        lastAnalyzedAt: latestInsight?.generatedAt || brandDoc?.lastAnalyzedAt || null,
        resolutionRate: latestInsight?.summary?.resolutionRate ?? null,
      };
    })
  );

  return res.json(summaries);
});

router.get("/:brandId", async (req, res) => {
  const { brandId } = req.params;

  const [rawConversations, latestInsight, brandDoc] = await Promise.all([
    dataLoader.getConversationsForBrand(brandId),
    Insight.findOne({ brandId }).sort({ generatedAt: -1 }).lean(),
    Brand.findOne({ brandId }).lean(),
  ]);
  const conversationCount = rawConversations.length;
  const categoryMap = rawConversations.reduce((acc, item) => {
    const category = item.conversation.metadata?.product_category || "unknown";
    acc.set(category, (acc.get(category) || 0) + 1);
    return acc;
  }, new Map());
  const categoryCounts = [...categoryMap.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  return res.json({
    brandId,
    displayName: brandDoc?.displayName || brandId,
    totalConversations: conversationCount,
    categoryCounts,
    latestInsightSummary: latestInsight?.summary || null,
    lastAnalyzedAt: latestInsight?.generatedAt || brandDoc?.lastAnalyzedAt || null,
  });
});

export default router;
