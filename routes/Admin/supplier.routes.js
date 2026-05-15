import express from "express";
import {
  getSuppliers,
  addSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplier,
} from "../../controller/Admin/supplier.controller.js";

const router = express.Router();

/* ===== SUPPLIERS ===== */

router.get("/", getSuppliers);
router.post("/", addSupplier);

router.get("/:id", getSupplier);
router.put("/:id", updateSupplier);
router.delete("/:id", deleteSupplier);

export default router;