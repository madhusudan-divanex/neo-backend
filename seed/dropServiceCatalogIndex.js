/**
 * Run this ONCE to drop the duplicate-causing unique index.
 * Usage: node seed/dropServiceCatalogIndex.js
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env") });

await mongoose.connect(process.env.MONGO_URI);
console.log("✅ Connected");

try {
  await mongoose.connection.collection("servicecatalogs").dropIndex("hospitalId_1_code_1");
  console.log("✅ Dropped unique index: hospitalId_1_code_1");
} catch (e) {
  if (e.codeName === "IndexNotFound") console.log("ℹ️  Index not found — already dropped or never created");
  else console.error("❌ Error:", e.message);
}

await mongoose.disconnect();
console.log("Done.");
