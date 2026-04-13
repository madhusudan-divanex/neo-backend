import express from "express";
import {
  getPharmacies,
  togglePharmacyStatus,
  deletePharmacy,
  getPharmaciesDetail,
  approveRejectPharmacy
} from "../../controller/Admin/pharmacy.controller.js";

const router = express.Router();

router.get("/", getPharmacies);
router.get("/:id", getPharmaciesDetail);
router.patch("/:id/status", togglePharmacyStatus);
router.delete("/:id", deletePharmacy);

export default router;

router.patch("/:id/approve-reject", approveRejectPharmacy);
