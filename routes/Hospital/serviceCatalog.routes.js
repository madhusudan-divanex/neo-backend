import express from "express";
import auth from "../../middleware/auth.js";
import { createService, getServices, updateService, deleteService, getServicePrice } from "../../controller/Hospital/serviceCatalog.controller.js";

const router = express.Router();

router.get("/price-lookup", auth, getServicePrice);
router.get("/",             auth, getServices);
router.post("/",            auth, createService);
router.put("/:id",          auth, updateService);
router.delete("/:id",       auth, deleteService);

export default router;
