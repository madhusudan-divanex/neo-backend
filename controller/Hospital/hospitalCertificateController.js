import HospitalCertificate from "../../models/Hospital/HospitalCertificate.js";
import { saveToGrid } from "../../services/gridfsService.js";

export const uploadCertificate = async (req, res) => {
  try {
    const { certificateType, licenseNumber } = req.body;

    // 1️⃣ VALIDATION
    if (!certificateType) {
      return res.status(400).json({ message: "certificateType is required" });
    }

    if (!licenseNumber) {
      return res.status(400).json({ message: "licenseNumber is required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Certificate file is required" });
    }

    // 2️⃣ UPLOAD TO GRIDFS
    const fileDoc = await saveToGrid(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    if (!fileDoc || !fileDoc._id) {
      return res.status(500).json({ message: "Failed to upload file" });
    }

    // 3️⃣ SAVE IN DB
    const cert = await HospitalCertificate.create({
      hospitalId: req.user.created_by_id,
      certificateType,
      licenseNumber,
      fileId: fileDoc._id.toString()
    });

    // 4️⃣ RESPONSE
    res.json({
      message: "Certificate uploaded successfully",
      certificate: cert
    });
  } catch (err) {
    console.error("UPLOAD CERTIFICATE ERROR:", err);
    res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
};
