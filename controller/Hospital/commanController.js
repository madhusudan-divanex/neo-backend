import User from "../../models/Hospital/User.js";
import HospitalDoctor from "../../models/Hospital/HospitalDoctor.js";
import Notification from "../../models/Notifications.js";

// ================= SAVE FCM TOKEN =================
export const saveFcmToken = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { fcmToken } = req.body;

    await User.findByIdAndUpdate(userId, { fcmToken });

    res.json({ success: true });
  } catch (err) {
    console.log("errr", err)
    res.status(500).json({ success: false });
  }
};

// ================= SEARCH USERS =================
export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    const myId = req.user.id;

    if (!q) return res.json({ success: true, data: [] });

    const users = await User.find({
      _id: { $ne: myId },
      name: { $regex: q, $options: "i" }
    }).select("_id name email");

    res.json({ success: true, data: users });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================= GET DOCTOR BY UNIQUE ID =================
export const GetDoctor = async (req, res) => {
  try {
    const { unique_id } = req.params;

    const user = await User.findOne({ unique_id, role: 'doctor' });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Doctor ID not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// ================= ADD EXISTING DOCTOR =================
export const addExistingDoctorToHospital = async (req, res) => {
  try {
    const { userId } = req.body; // doctor userId
    const hospitalId = req.user.id;

    // 1️⃣ Check doctor exists
    const doctor = await User.findOne({
      _id: userId,
      role: "doctor"
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    // 2️⃣ Check already added
    const exists = await HospitalDoctor.findOne({
      userId,
      hospitalId
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Doctor already added to this hospital"
      });
    }

    const record = await HospitalDoctor.findOne({ userId });
    const user = await User.findOne({ _id: userId });

    // 3️⃣ Create hospital-doctor mapping
    const staff = await HospitalDoctor.create({
      hospitalId: req.user.id,
      userId: user._id,
      status: record?.status || "active",

      personalInfo: record?.personalInfo || {
        name: user.name
      },

      professionalInfo: record?.professionalInfo || {},

      accessInfo: {
        userId: user._id,
        accessEmail: user.email,
        permissionType: record?.accessInfo?.permissionType || "limited"
      },

      created_by: "migration",
      created_by_id: record?.hospitalId
    });

    return res.json({
      success: true,
      message: "Doctor added successfully",
      data: staff
    });
  } catch (err) {
    console.error("addExistingDoctorToHospital error:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ================= SEARCH USERS =================
export const getNotification = async (req, res) => {
  try {
    const myId = req.user.id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find({ userId: myId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ userId: myId })
    ]);

    return res.json({
      success: true,
      data: notifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const myId = req.user.id;
    await Notification.deleteMany({ userId: myId });

    return res.json({
      success: true,
      message:"Notification deleted"
    });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
export const deleteOneNotification = async (req, res) => {
  try {
    const myId = req.user.id;
    const notifyId=req.params.id;
    const deleteNotification=await Notification.findOneAndDelete({ userId: myId,_id:notifyId });
    if(!deleteNotification){
      return res.json({
      success: false,
      message:"Notification not found"
    });
    }
    return res.json({
      success: true,
      message:"Notification deleted"
    });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};