import HospitalBasic from "../../models/Hospital/HospitalBasic.js";
import HospitalImages from "../../models/Hospital/HospitalImage.js";
import HospitalAddress from "../../models/Hospital/HospitalAddress.js";
import HospitalContact from "../../models/Hospital/HospitalContact.js";
import HospitalCertificate from "../../models/Hospital/HospitalCertificate.js";
import Kyc from "../../models/Hospital/KycLog.js";
import EditRequest from "../../models/Hospital/HospitalEditRequest.js";
import User from "../../models/Hospital/User.js";
import bcrypt from "bcryptjs";

// ================= CHANGE PASSWORD =================
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );

    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET PROFILE =================
export const getProfile = async (req, res) => {
  try {
    const hospitalId = req.user.created_by_id;

    if (!hospitalId) {
      return res.status(400).json({ message: "Hospital ID missing" });
    }

    const basic = await HospitalBasic.findById(hospitalId);
    const address = await HospitalAddress.findOne({ hospitalId });

    // CONTACT (with image URL)
    const rawContact = await HospitalContact.findOne({ hospitalId });
    let contact = null;

    if (rawContact) {
      contact = {
        ...rawContact._doc,
        profilePhotoUrl: rawContact.profilePhotoId
          ? `${req.protocol}://${req.get("host")}/api/file/${rawContact.profilePhotoId}`
          : null
      };
    }

    const certificates = await HospitalCertificate.find({ hospitalId });
    const kyc = await Kyc.findOne({ hospitalId });

    // Images
    const allImages = await HospitalImages.find({ hospitalId });
    const baseUrl = `${req.protocol}://${req.get("host")}/api/file/`;

    const thumbnail = allImages
      .filter(img => img.type === "thumbnail")
      .map(img => ({
        ...img._doc,
        url: baseUrl + img.fileId
      }));

    const gallery = allImages
      .filter(img => img.type === "gallery")
      .map(img => ({
        ...img._doc,
        url: baseUrl + img.fileId
      }));

    const lastEditRequest = await EditRequest
      .findOne({ hospitalId })
      .sort({ createdAt: -1 });

    return res.json({
      message: "Hospital profile fetched",
      profile: {
        basic,
        images: {
          thumbnail,
          gallery
        },
        address,
        contact,
        certificates: certificates.map(c => ({
          ...c._doc,
          url: baseUrl + c.fileId
        })),
        kyc,
        editRequestStatus: lastEditRequest
          ? lastEditRequest.status
          : "none"
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server Error" });
  }
};

// ================= UPDATE PROFILE =================
export const updateProfile = async (req, res) => {
  try {
    const hospitalId = req.user.created_by_id;
    const payload = req.body;

    if (!hospitalId) {
      return res.status(400).json({ message: "Hospital ID missing" });
    }

    if (payload.basic) {
      await HospitalBasic.findByIdAndUpdate(
        hospitalId,
        payload.basic,
        { new: true }
      );
    }

    if (payload.address) {
      await HospitalAddress.findOneAndUpdate(
        { hospitalId },
        payload.address,
        { upsert: true, new: true }
      );
    }

    if (payload.contact) {
      await HospitalContact.findOneAndUpdate(
        { hospitalId },
        payload.contact,
        { upsert: true, new: true }
      );
    }

    res.json({ message: "Profile updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= SEND EDIT REQUEST =================
export const sendEditRequest = async (req, res) => {
  try {
    const hospitalId = req.user.created_by_id;
    const userId = req.user._id;
    const { note } = req.body;

    const reqDoc = await EditRequest.create({
      hospitalId,
      userId,
      note
    });

    res.json({
      message: "Edit request submitted",
      request: reqDoc
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= APPROVE EDIT REQUEST (ADMIN) =================
export const approveEditRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const reqDoc = await EditRequest.findByIdAndUpdate(
      requestId,
      { status: "approved" },
      { new: true }
    );

    if (!reqDoc) {
      return res.status(404).json({ message: "Request not found" });
    }

    await HospitalBasic.findByIdAndUpdate(
      reqDoc.hospitalId,
      { kycStatus: "approved" }
    );

    res.json({ message: "Edit request approved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
