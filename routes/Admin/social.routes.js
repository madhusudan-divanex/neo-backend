import express from "express";
import adminAuth from "../../middleware/adminAuth.js";
import { getSocialLinks, saveSocialLinks } from "../../controller/Admin/social.controller.js";

const router = express.Router();

router.get("/",getSocialLinks);
router.put("/", saveSocialLinks);

export default router;
