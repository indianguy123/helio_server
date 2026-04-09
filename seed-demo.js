import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User.js";

dotenv.config();

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const email = "demo@helio.com";
  const password = "demo1234";

  const existing = await User.findOne({ email });
  if (existing) {
    console.log("Demo user already exists — skipping.");
  } else {
    const passwordHash = await bcrypt.hash(password, 10);
    await User.create({ email, passwordHash });
    console.log(`Demo user created: ${email} / ${password}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
