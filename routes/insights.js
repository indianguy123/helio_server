import { Router } from "express";
import auth from "../middleware/auth.js";
import Insight from "../models/Insight.js";

const router = Router();
router.use(auth);

router.get("/:brandId", async (req, res) => {
  const insight = await Insight.findOne({ brandId: req.params.brandId })
    .sort({ generatedAt: -1 })
    .populate("jobId", "status progress completedAt")
    .lean();
  if (!insight) return res.status(404).json({ error: "No insight found" });
  return res.json(insight);
});

router.get("/:brandId/history", async (req, res) => {
  const history = await Insight.find({ brandId: req.params.brandId })
    .select("-rawBatchResults")
    .sort({ generatedAt: -1 })
    .limit(10)
    .lean();
  return res.json(history);
});

router.get("/:brandId/compare", async (req, res) => {
  const latestByBrand = await Insight.aggregate([
    { $sort: { generatedAt: -1 } },
    {
      $group: {
        _id: "$brandId",
        doc: { $first: "$$ROOT" },
      },
    },
    { $replaceRoot: { newRoot: "$doc" } },
  ]);

  const comparison = latestByBrand.map((item) => ({
    brandId: item.brandId,
    resolutionRate: Number(item.summary?.resolutionRate || 0),
    sentimentScore:
      item.summary?.overallSentiment === "positive"
        ? 1
        : item.summary?.overallSentiment === "neutral"
          ? 0.5
          : 0,
    issueCount: Array.isArray(item.issues) ? item.issues.reduce((acc, i) => acc + (i.count || 0), 0) : 0,
    lowIssueCount:
      1 -
      Math.min(
        1,
        (Array.isArray(item.issues) ? item.issues.reduce((acc, i) => acc + (i.count || 0), 0) : 0) / 20
      ),
    topicCoverage:
      (item.topicAnalysis?.wellHandled?.length || 0) /
      Math.max(
        1,
        (item.topicAnalysis?.wellHandled?.length || 0) + (item.topicAnalysis?.poorlyHandled?.length || 0)
      ),
  }));

  return res.json(comparison);
});

export default router;
