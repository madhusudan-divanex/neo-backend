import HospitalBasic from "../../models/Hospital/HospitalBasic.js";
import HospitalImages from "../../models/Hospital/HospitalImage.js";
import HospitalAddress from "../../models/Hospital/HospitalAddress.js";
import HospitalContact from "../../models/Hospital/HospitalContact.js";
import HospitalCertificate from "../../models/Hospital/HospitalCertificate.js";
import Kyc from "../../models/Hospital/KycLog.js";
import EditRequest from "../../models/Hospital/HospitalEditRequest.js";
import User from "../../models/Hospital/User.js";
import bcrypt from "bcryptjs";
import Rating from "../../models/Rating.js";
import Doctor from "../../models/Doctor/doctor.model.js";
import DoctorAbout from "../../models/Doctor/addressAbout.model.js";

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
          ? `${process.env.BACKEND_URL}://${req.get("host")}/api/file/${rawContact.profilePhotoId}`
          : null
      };
    }

    const certificates = await HospitalCertificate.find({ hospitalId });
    const kyc = await Kyc.findOne({ hospitalId });

    // Images
    const allImages = await HospitalImages.find({ hospitalId });
    const baseUrl = `${process.env.BACKEND_URL}://${req.get("host")}/api/file/`;

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

export const getHospitals = async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;

  try {
    // 1️⃣ Fetch lab users
    const users = await HospitalBasic.find()
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();
    const hospitalIds = users.map(item => item._id)
    const address = await HospitalAddress.find({ hospitalId: { $in: hospitalIds } })
    const addressMap = {};
    address.forEach(addr => {
      addressMap[addr.hospitalId.toString()] = addr;
    });
    // 3️⃣ Fetch rating stats (AVG + COUNT)
    const ratingStats = await Rating.aggregate([
      {
        $match: {
          hospitalId: { $in: hospitalIds }
        }
      },
      {
        $group: {
          _id: "$hospitalId",
          avgRating: { $avg: "$star" },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    const ratingMap = {};
    ratingStats.forEach(r => {
      ratingMap[r._id.toString()] = {
        avgRating: Number(r.avgRating.toFixed(1)),
        totalReviews: r.totalReviews
      };
    });

    // 4️⃣ Merge everything
    const finalData = users.map(user => ({
      ...user,
      address: addressMap[user._id.toString()] || null,
      avgRating: ratingMap[user._id.toString()]?.avgRating || 0,
      totalReviews: ratingMap[user._id.toString()]?.totalReviews || 0
    }));


    const total = await HospitalBasic.countDocuments();

    return res.status(200).json({
      success: true,
      data: finalData,
      pagination: {
        total,
        totalPage: Math.ceil(total / limit),
        currentPage: page
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
export const getHospitalList = async (req, res) => {

  try {
    const users = await HospitalBasic.find()
      .lean();

    return res.status(200).json({
      success: true,
      data: users,

    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
export const getHospitalProfile = async (req, res) => {
  try {
    const hospitalId = req.params.id;

    if (!hospitalId) {
      return res.status(400).json({ message: "Hospital ID missing" });
    }
    const basic = await HospitalBasic.findById(hospitalId);
    const address = await HospitalAddress.findOne({ hospitalId });
    const rawContact = await HospitalContact.findOne({ hospitalId });
    let contact = null;

    if (rawContact) {
      contact = {
        ...rawContact._doc,
        profilePhotoUrl: rawContact.profilePhotoId
          ? `${process.env.BACKEND_URL}://${req.get("host")}/api/file/${rawContact.profilePhotoId}`
          : null
      };
    }
    const certificates = await HospitalCertificate.find({ hospitalId });
    // Images
    const allImages = await HospitalImages.find({ hospitalId });
    const baseUrl = `${process.env.BACKEND_URL}://${req.get("host")}/api/file/`;
    const thumbnail = allImages
      .filter(img => img.type === "thumbnail")
      .map(img => ({
        ...img._doc,
        url: baseUrl + img.fileId
      }));
    return res.json({
      message: "Hospital profile fetched",
      success: true,
      profile: {
        basic,
        images: {
          thumbnail,
        },
        address,
        contact,
        certificates: certificates.map(c => ({
          ...c._doc,
          url: baseUrl + c.fileId
        })),
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server Error" });
  }
};
export const getHospitalDoctors = async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const hospitalId = req.params.id
  try {
    // 1️⃣ Fetch lab users
    const doctors = await DoctorAbout.find({ hospitalName: hospitalId })
      .populate('countryId stateId cityId', 'name')
      .populate({ path: 'hospitalName' })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();
    const doctorIds = doctors.map(u => u.userId);
    // 2️⃣ Fetch addresses
    const users = await Doctor.find({
      userId: { $in: doctorIds }
    }).lean();
    const usersMap = {};
    users.forEach(user => {
      usersMap[user.userId.toString()] = user;
    });
    console.log("map", usersMap)

    // 3️⃣ Fetch rating stats (AVG + COUNT)
    const ratingStats = await Rating.aggregate([
      {
        $match: {
          doctorId: { $in: doctorIds }
        }
      },
      {
        $group: {
          _id: "$doctorId",
          avgRating: { $avg: "$star" },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    const ratingMap = {};
    ratingStats.forEach(r => {
      ratingMap[r._id.toString()] = {
        avgRating: Number(r.avgRating.toFixed(1)),
        totalReviews: r.totalReviews
      };
    });

    // 4️⃣ Merge everything
    const finalData = doctors.map(address => ({
      ...address,
      user: usersMap[address.userId.toString()] || null,
      avgRating: ratingMap[address.userId.toString()]?.avgRating || 0,
      totalReviews: ratingMap[address.userId.toString()]?.totalReviews || 0
    }));

    const total = await User.countDocuments({ role: 'doctor' });


    return res.status(200).json({
      success: true,
      data: finalData,
      pagination: {
        total,
        totalPage: Math.ceil(total / limit),
        currentPage: page
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};