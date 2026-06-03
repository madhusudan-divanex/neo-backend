import mongoose from "mongoose";
import HospitalCertificate from "../../models/Hospital/HospitalCertificate.js";
import User from "../../models/Hospital/User.js";
import LabLicense from "../../models/Laboratory/labLicense.model.js";
import { saveToGrid } from "../../services/gridfsService.js";
import { sendWelcomeEmail } from "../../utils/globalFunction.js";

export const uploadCertificate = async (req, res) => {
  try {
    const { certificateType, licenseNumber, certificateId } = req.body;
    const userId = req.user.id
    const baseUrl = `api/file/`;

    // 1️⃣ VALIDATION
    if (!certificateType) {
      return res.status(400).json({ message: "certificateType is required" });
    }

    if (!licenseNumber) {
      return res.status(400).json({ message: "licenseNumber is required" });
    }

    let existingCert = null;
    if (certificateType === "extra_certificate") {
      if (certificateId && mongoose.Types.ObjectId.isValid(certificateId)) {
        existingCert = await HospitalCertificate.findOne({
          _id: certificateId,
          hospitalId: req.user.created_by_id
        });
      }
    } else {
      existingCert = await HospitalCertificate.findOne({
        hospitalId: req.user.created_by_id,
        certificateType
      });
    }

    if (existingCert) {
      existingCert.licenseNumber = licenseNumber;

      if (req.file) {
        const fileDoc = await saveToGrid(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );

        existingCert.fileId = fileDoc._id.toString();
      }

      await existingCert.save();
      await syncLabLicense(
        req.user.created_by_id,
        userId
      );

      return res.json({
        message: "Certificate updated successfully",
        certificate: existingCert
      });
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

    await syncLabLicense(req.user.created_by_id, userId);

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
export const deleteHospitalCertificate = async (req, res) => {
  const hospitalId = req.user.created_by_id
  try {
    const { fileId } = req.params
    const cert = await HospitalCertificate.findOne({ hospitalId: hospitalId, _id: fileId })
    if (!cert) {
      return res.status(404).json({ message: "Image not found" })
    }
    await LabLicense.findOneAndUpdate(
      { userId: req.user.id },
      {
        $pull: {
          labCert: { certFile: `api/file/${cert.fileId}` },
        },
      },
      { new: true }
    );
    await cert.deleteOne()

    res.json({ message: "Deleted successfully", success: true })
  } catch (error) {
    return res.status(500).json({ message: error?.message })
  }
}

const syncLabLicense = async (hospitalId, userId) => {
  const isLab = await User.findById(userId)
  if (!isLab?.labId) {
    return
  }
  let labLicenseNumber = "";
  let licenseFile = "";
  const labCert = [];

  const certificates = await HospitalCertificate.find({ hospitalId });

  certificates.forEach(cert => {
    if (cert.certificateType === "registration") {
      labLicenseNumber = cert.licenseNumber;
      licenseFile = 'api/file/' + cert.fileId;
    } else {
      labCert.push({
        certName: cert.licenseNumber,
        certFile: 'api/file/' + cert.fileId
      });
    }
  });

  await LabLicense.findOneAndUpdate(
    { userId },
    {
      labLicenseNumber,
      licenseFile,
      labCert
    },
    {
      new: true,
      upsert: true
    }
  );
};