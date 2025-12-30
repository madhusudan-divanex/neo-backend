import express from "express";

import auth from "../../middleware/auth.js";
import admin from "../../middleware/admin.js";
import HospitalBasic from "../../models/Hospital/HospitalBasic.js";
import KycLog from "../../models/Hospital/KycLog.js";

const router = express.Router();

// list pending
router.get("/pending", auth, admin, async (req, res) => {
  const list = await HospitalBasic.find({ kycStatus: "pending" });
  res.json(list);
});

// review (approve / reject)
router.post("/review/:id", auth, admin, async (req, res) => {
  const hospital = await HospitalBasic.findById(req.params.id);
  const { status, comment } = req.body;

  const prev = hospital.kycStatus;
  hospital.kycStatus = status;
  await hospital.save();

  await KycLog.create({
    hospitalId: hospital._id,
    changedBy: req.user._id,
    fromStatus: prev,
    toStatus: status,
    comment
  });

  res.json({ message: "KYC updated", hospital });
});

export default router;
