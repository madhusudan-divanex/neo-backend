// routes/fileRoute.js
import express from 'express'
const fileRoutes = express.Router();
import mongoose from 'mongoose';
import { ObjectId } from "mongodb";

fileRoutes.get("/file/:id", async (req, res) => {
  try {
    const fileId = new ObjectId(req.params.id);

    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: "uploads"
    });

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

export default fileRoutes;