import express from "express";
import {
  getPharmacies,
  togglePharmacyStatus,
  deletePharmacy,
  getPharmaciesDetail,
  approveRejectPharmacy,
  getH1MedicineReqeusts,
  updateMedicineReqeustStatus,
  getSellH1Medicines,
  getSellH1MedicineDetails,
  getPharmacyRequests
} from "../../controller/Admin/pharmacy.controller.js";

const router = express.Router();

router.get("/", getPharmacies);
router.get("/requests", getPharmacyRequests);
router.get("/:id", getPharmaciesDetail);
router.patch("/:id/status/:status", togglePharmacyStatus);
router.delete("/:id", deletePharmacy);
router.get("/:id/medicine-requests", getH1MedicineReqeusts);
router.patch("/medicine-requests/status/:id", updateMedicineReqeustStatus);
router.get("/sell/h1-medicines/:id", getSellH1Medicines)
router.get("/sell-details/:id", getSellH1MedicineDetails)
export default router;

router.patch("/:id/approve-reject", approveRejectPharmacy);
