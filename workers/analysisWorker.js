import getAgenda from "../config/agenda.js";
import AnalysisJob from "../models/AnalysisJob.js";
import Insight from "../models/Insight.js";
import Brand from "../models/Brand.js";
import dataLoader from "../services/dataLoader.js";
import openaiService from "../services/openaiService.js";
import aggregator from "../services/aggregator.js";

const agenda = getAgenda();

agenda.define("analyze-brand", { concurrency: 2 }, async (job) => {
  const { jobId, brandId } = job.attrs.data;

  try {
    await AnalysisJob.findByIdAndUpdate(jobId, { status: "running", startedAt: new Date(), progress: 5 });

    const rawConversations = await dataLoader.getConversationsForBrand(brandId);
    const formatted = await dataLoader.formatForAnalysis(rawConversations);

    const batches = dataLoader.chunkArray(formatted, 20);
    const totalBatches = batches.length || 1;

    await AnalysisJob.findByIdAndUpdate(jobId, {
      totalConversations: formatted.length,
      totalBatches,
      processedBatches: 0,
      progress: 10,
    });

    const allBatchResults = [];
    for (let i = 0; i < batches.length; i += 1) {
      const batchResult = await openaiService.runAllAnalyses(batches[i]);
      allBatchResults.push(batchResult);
      const progress = Math.round(((i + 1) / totalBatches) * 90);
      await AnalysisJob.findByIdAndUpdate(jobId, { progress, processedBatches: i + 1 });
    }

    const aggregated = aggregator.aggregateResults(
      allBatchResults,
      rawConversations.map((r) => r.conversation)
    );

    await Insight.create({
      brandId,
      jobId,
      generatedAt: new Date(),
      ...aggregated,
      rawBatchResults: allBatchResults,
    });

    await Brand.findOneAndUpdate(
      { brandId },
      {
        displayName: brandId,
        totalConversations: formatted.length,
        lastAnalyzedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await AnalysisJob.findByIdAndUpdate(jobId, {
      status: "done",
      progress: 100,
      completedAt: new Date(),
    });
  } catch (err) {
    await AnalysisJob.findByIdAndUpdate(jobId, {
      status: "failed",
      errorMessage: err.message,
      completedAt: new Date(),
    });
    throw err;
  }
});
