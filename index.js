import dotenv from "dotenv";
import "express-async-errors";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import { startAgenda } from "./config/agenda.js";
import errorHandler from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.js";
import brandRoutes from "./routes/brands.js";
import jobRoutes from "./routes/jobs.js";
import insightRoutes from "./routes/insights.js";
import conversationRoutes from "./routes/conversations.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/insights", insightRoutes);
app.use("/api/conversations", conversationRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  await connectDB();
  await startAgenda();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

bootstrap();
