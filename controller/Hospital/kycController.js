import HospitalBasic from "../../models/Hospital/HospitalBasic.js";
import KycLog from "../../models/Hospital/KycLog.js";

export const submitKyc = async (req, res) => {
  try {
    const h = await HospitalBasic.findById(req.user.created_by_id);

    const prev = h.kycStatus;
    h.kycStatus = "pending";
    await h.save();

    await KycLog.create({
      hospitalId: h._id,
      changedBy: req.user._id,
      fromStatus: prev,
      toStatus: "pending"
    });

    res.json({ message: "KYC submitted", status: h.kycStatus });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
