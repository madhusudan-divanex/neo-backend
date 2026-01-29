import HospitalCertificate from "../../models/Hospital/HospitalCertificate.js";
import LabLicense from "../../models/Laboratory/labLicense.model.js";
import { saveToGrid } from "../../services/gridfsService.js";

export const uploadCertificate = async (req, res) => {
  try {
    const { certificateType, licenseNumber } = req.body;
    const userId = req.user.id
    const baseUrl = `api/file/`;

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

    let labLicenseNumber = "";
    let licenseFile = "";
    const labCert = [];
    const certificates = await HospitalCertificate.find({ hospitalId: req.user.created_by_id });

    certificates.forEach(cert => {
      if (cert.certificateType === "registration") {
        labLicenseNumber = cert.licenseNumber;
        licenseFile = cert.fileId;
      } else {
        labCert.push({
          certName: cert.certificateType,
          certFile: cert.fileId
        });
      }
    });

    if (labLicenseNumber && licenseFile) {
      await LabLicense.findOneAndUpdate({ userId: userId }, {
        labLicenseNumber,
        licenseFile,
        labCert
      }, { new: true });
    }

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
