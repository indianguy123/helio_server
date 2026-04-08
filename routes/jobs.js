import { Router } from "express";
import { z } from "zod";
import auth from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import AnalysisJob from "../models/AnalysisJob.js";
import getAgenda from "../config/agenda.js";
import dataLoader from "../services/dataLoader.js";

const router = Router();
router.use(auth);

const startSchema = z.object({
  body: z.object({
    brandId: z.string().min(1),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

router.post("/start", validate(startSchema), async (req, res) => {
  const { brandId } = req.validated.body;

  const brands = await dataLoader.getBrandsFromDB();
  if (!brands.includes(brandId)) return res.status(404).json({ error: "Brand not found in conversations" });

  const runningJob = await AnalysisJob.findOne({
    brandId,
    status: { $in: ["pending", "running"] },
  }).lean();
  if (runningJob) return res.status(409).json({ error: "A job is already running for this brand" });

  const job = await AnalysisJob.create({
    brandId,
    status: "pending",
    progress: 0,
    totalConversations: 0,
    processedBatches: 0,
    totalBatches: 0,
  });

  await getAgenda().now("analyze-brand", { jobId: job._id.toString(), brandId });
  return res.status(201).json({ jobId: job._id });
});

router.get("/:jobId", async (req, res) => {
  const job = await AnalysisJob.findById(req.params.jobId).lean();
  if (!job) return res.status(404).json({ error: "Job not found" });

  return res.json({
    _id: job._id,
    status: job.status,
    progress: job.progress,
    totalConversations: job.totalConversations,
    processedBatches: job.processedBatches,
    totalBatches: job.totalBatches,
    errorMessage: job.errorMessage || "",
    startedAt: job.startedAt || null,
    completedAt: job.completedAt || null,
  });
});

export default router;
