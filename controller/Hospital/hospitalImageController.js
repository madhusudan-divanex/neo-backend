import HospitalImage from "../../models/Hospital/HospitalImage.js";
import { saveToGrid } from "../../services/gridfsService.js";

export const uploadImages = async (req, res) => {
  try {
    console.log("REQ.FILES:", req.files);

    const thumbnail = req.files?.thumbnail
      ? req.files.thumbnail[0]
      : null;

    const gallery = req.files?.gallery || [];

    if (!thumbnail && gallery.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const created = [];

    // 1️⃣ Upload Thumbnail (if exists)
    if (thumbnail) {
      console.log("UPLOAD THUMBNAIL:", thumbnail.originalname);

      const fileDoc = await saveToGrid(
        thumbnail.buffer,
        thumbnail.originalname,
        thumbnail.mimetype
      );

      const img = await HospitalImage.create({
        hospitalId: req.user.created_by_id,
        fileId: fileDoc._id.toString(),
        fileUrl: `/api/file/${fileDoc._id}`, // frontend friendly
        type: "thumbnail"
      });

      created.push(img);
    }

    // 2️⃣ Upload Gallery Images
    for (const f of gallery) {
      console.log("UPLOAD GALLERY FILE:", f.originalname);

      const fileDoc = await saveToGrid(
        f.buffer,
        f.originalname,
        f.mimetype
      );

      if (!fileDoc || !fileDoc._id) {
        throw new Error("GridFS upload failed");
      }

      const img = await HospitalImage.create({
        hospitalId: req.user.created_by_id,
        fileId: fileDoc._id.toString(),
        type: "gallery"
      });

      created.push(img);
    }

    res.json({
      message: "Uploaded successfully",
      created
    });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
};
