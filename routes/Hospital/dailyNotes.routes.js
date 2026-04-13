import express from "express";

import auth from "../../middleware/auth.js";
import { createAssessment, createIPDHeader, createLabImaging, createObjective, createSignOff, createSubjective, createTodayPlan, deleteAssessment, deleteIPDHeader, deleteLabImaging, deleteObjective, deleteSignOff, deleteSubjective, deleteTodayPlan, getAssessmentById, getDailyNotesByHeader, getIpdFeesData, getIPDHeaderById, getLabImagingById, getLatestAllotmentNotes, getObjectiveById, getSignOffById, getSubjectiveById, getTodayPlanById, updateAssessment, updateIPDHeader, updateLabImaging, updateObjective, updateSignOff, updateSubjective, updateTodayPlan } from "../../controller/Hospital/ipdDailyNotes.js";
import { checkPermission } from "../../middleware/permissionCheck.js";
import authMiddleware from "../../middleware/authMiddleare.js";


const router = express.Router();

router.post("/header", authMiddleware, createIPDHeader);
router.get("/history/:bedId", authMiddleware, getIPDHeaderById);
router.put("/header/:id", authMiddleware, updateIPDHeader);
router.delete("/header/:id", authMiddleware, deleteIPDHeader);
router.get("/header-data/:id", authMiddleware, getDailyNotesByHeader);
router.get("/latest/:id", authMiddleware, getLatestAllotmentNotes);
router.get("/fees/:allotmentId/:patientId", authMiddleware, getIpdFeesData);
router.post("/subjective", authMiddleware, createSubjective);
router.get("/subjective/:id", authMiddleware, getSubjectiveById);
router.put("/subjective/:id", authMiddleware, updateSubjective);
router.delete("/subjective/:id", authMiddleware, deleteSubjective);


router.post("/objective", authMiddleware, createObjective);
router.get("/objective/:id", authMiddleware, getObjectiveById);
router.put("/objective/:id", authMiddleware, updateObjective);
router.delete("/objective/:id", authMiddleware, deleteObjective);


router.post("/lab-imaging", authMiddleware, createLabImaging);
router.get("/lab-imaging/:id", authMiddleware, getLabImagingById);
router.put("/lab-imaging/:id", authMiddleware, updateLabImaging);
router.delete("/lab-imaging/:id", authMiddleware, deleteLabImaging);

router.post("/assessment", authMiddleware, createAssessment);
router.get("/assessment/:id", authMiddleware, getAssessmentById);
router.put("/assessment/:id", authMiddleware, updateAssessment);
router.delete("/assessment/:id", authMiddleware, deleteAssessment);


router.post("/plan", authMiddleware, createTodayPlan);
router.get("/plan/:id", authMiddleware, getTodayPlanById);
router.put("/plan/:id", authMiddleware, updateTodayPlan);
router.delete("/plan/:id", authMiddleware, deleteTodayPlan);

router.post("/sign-off", authMiddleware, createSignOff);
router.get("/sign-off/:id", authMiddleware, getSignOffById);
router.put("/sign-off/:id", authMiddleware, updateSignOff);
router.delete("/sign-off/:id", authMiddleware, deleteSignOff);

export default router;
