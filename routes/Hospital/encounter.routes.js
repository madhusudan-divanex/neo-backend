import express from "express";
import auth from "../../middleware/auth.js";
import {
  createEncounter, getEncounters, getEncounterById,
  updateEncounterStatus, getDischargeReadiness,
  postCharge, getChargeLedger, voidCharge
} from "../../controller/Hospital/encounter.controller.js";

const router = express.Router();

// Encounter CRUD
router.post("/",                     auth, createEncounter);
router.get("/",                      auth, getEncounters);
router.get("/:id",                   auth, getEncounterById);
router.put("/:id/status",            auth, updateEncounterStatus);
router.get("/:id/discharge-readiness", auth, getDischargeReadiness);

// Charge ledger
router.post("/charge",               auth, postCharge);
router.get("/:encounterId/charges",  auth, getChargeLedger);
router.put("/charge/:chargeId/void", auth, voidCharge);

export default router;
