/**
 * One-time migration: copy existing Admin docs → User table (role: "admin")
 * Run: node seed/migrateAdminToUser.js
 * 
 * Safe to run multiple times (skips if already exists)
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env") });

await mongoose.connect(process.env.MONGO_URI);
console.log("✅ Connected");

const Admin = mongoose.model("Admin", new mongoose.Schema({
  name: String, email: String, passwordHash: String,
  mobile: String, image: String, fcmToken: String, role: String
}, { collection: "admins" }));

const User = mongoose.model("User", new mongoose.Schema({
  name: String, email: String, passwordHash: String,
  contactNumber: String, role: String, created_by: String,
  created_by_id: mongoose.Schema.Types.ObjectId, unique_id: String,
  fcmToken: String
}, { collection: "users" }));

const admins = await Admin.find({});
console.log(`Found ${admins.length} admin(s) in Admin table`);

for (const a of admins) {
  const exists = await User.findOne({ email: a.email, role: "admin" });
  if (exists) {
    console.log(`  ⏭  ${a.email} already in User table — skipping`);
    continue;
  }
  await User.create({
    name: a.name, email: a.email, passwordHash: a.passwordHash,
    contactNumber: a.mobile || "", role: "admin",
    created_by: "migration", fcmToken: a.fcmToken || null,
    unique_id: Math.floor(10000000 + Math.random() * 90000000).toString()
  });
  console.log(`  ✅ Migrated: ${a.email}`);
}

await mongoose.disconnect();
console.log("\n✅ Migration complete!");
console.log("Now login with same email/password on Admin panel.");
