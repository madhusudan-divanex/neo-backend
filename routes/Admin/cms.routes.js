import express from "express";
import adminAuth from "../../middleware/adminAuth.js";
import { getCMSPage, saveCMSPage, getCMSPageList, deleteCMSPage } from "../../controller/Admin/cms.controller.js";

const router = express.Router();

router.get("/",           adminAuth, getCMSPageList);
router.get("/:slug/:panel",      adminAuth, getCMSPage);
router.post("/:slug",     adminAuth, saveCMSPage);
router.delete("/:id",     adminAuth, deleteCMSPage);

export default router;
