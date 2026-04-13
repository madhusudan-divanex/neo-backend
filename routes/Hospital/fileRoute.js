// routes/fileRoute.js
import express from "express";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import SocialLinks from "../../models/Admin/socialLinks.model.js";

const router = express.Router();

router.get("/file/:id", async (req, res) => {
  try {
    const fileId = new ObjectId(req.params.id);

    const bucket = new mongoose.mongo.GridFSBucket(
      mongoose.connection.db,
      {
        bucketName: "uploads"
      }
    );

    const downloadStream = bucket.openDownloadStream(fileId);

    downloadStream.on("error", () => {
      return res.status(404).json({ message: "File not found" });
    });

    downloadStream.pipe(res);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});
router.get('/social-links',async(req,res)=>{
  try {
    const data=await SocialLinks.findOne();
    return res.status(200).json({message:"Social links fetched",success:true,data})
  } catch (error) {
    return res.status(200).json({message:"Server error",success:false})
  }
})
export default router;
