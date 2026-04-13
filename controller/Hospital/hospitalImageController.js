import HospitalImage from "../../models/Hospital/HospitalImage.js";
import LabImage from "../../models/Laboratory/labImages.model.js";
import { saveToGrid } from "../../services/gridfsService.js";

export const uploadImages = async (req, res) => {
  try {
    const userId = req.user.id
    const baseUrl = `api/file/`;
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
      await LabImage.findOneAndUpdate({userId:userId},{        
        thumbnail: `/api/file/${fileDoc._id}`,
      },{new:true});
      created.push(img);
    }

    // 2️⃣ Upload Gallery Images
    const galleryImg=[]
    for (const f of gallery) {

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
      galleryImg.push(img.fileId)

      created.push(img);
    }
    if(galleryImg?.length>0){

      await LabImage.findOneAndUpdate({userId:userId},{        
        labImg: galleryImg,
      },{new:true});
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
