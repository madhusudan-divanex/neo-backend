import express from "express";
import {
  getEditRequests,
  getMedicineRequests,
  updateRequestStatus,
} from "../../controller/Admin/editRequest.controller.js";

const router = express.Router();

/* GET ALL */
router.get("/", getEditRequests);

/* UPDATE STATUS */
router.patch("/:id/status", updateRequestStatus);

export default router;