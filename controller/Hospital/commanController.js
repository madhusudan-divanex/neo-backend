import User from "../../models/Hospital/User.js";
import HospitalDoctor from "../../models/Hospital/HospitalDoctor.js";
import Notification from "../../models/Notifications.js";
import Permission from "../../models/Permission.js";

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

export const getAllPermission = async (req, res) => {
  const ownerId = req.params.id; // doctorId / labId / hospitalId / pharmacyId
  let { page = 1, limit = 10, name, type } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);

  try {
    // 🔒 Validate panel owner
    const user = await User.findById(ownerId);
    if (!user) {
      return res.status(200).json({
        message: "Panel owner not found",
        success: false
      });
    }

    // 🧠 Permission filter
    const filter = {
      ownerId,
      type // 'doctor' | 'lab' | 'hospital' | 'pharmacy'
    };

    if (name && name !== "null") {
      filter.name = { $regex: name, $options: "i" };
    }

    const total = await Permission.countDocuments(filter);

    const permissions = await Permission.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Permissions fetched successfully",
      data: permissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      success: true
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Server Error",
      success: false
    });
  }
};


export const addPermission = async (req, res) => {
  try {
    if (!req.user.isOwner) {
      return res.status(403).json({ success: false, message: "Only owner allowed" });
    }
    console.log(req.user)

    const { name, ...permissions } = req.body;
    const ownerId = req.user.userId || req.user.id;
    const type = req.user.type;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "name is required"
      });
    }

    const existing = await Permission.findOne({ name, ownerId, type });

    if (existing) {
      const updated = await Permission.findByIdAndUpdate(
        existing._id,
        { ...permissions },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        message: "Permission updated successfully",
        data: updated
      });
    }

    const created = await Permission.create({
      name,
      ownerId,
      type,
      ...permissions
    });

    return res.status(200).json({
      success: true,
      message: "Permission created successfully",
      data: created
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const updatePermission = async (req, res) => {
  try {
    if (!req.user.isOwner) {
      return res.status(403).json({ success: false, message: "Only owner allowed" });
    }

    const { permissionId, name, ...permissions } = req.body;
    const ownerId = req.user.userId || req.user.id;
    const type = req.user.type;

    if (!permissionId || !name) {
      return res.status(400).json({
        success: false,
        message: "permissionId and name are required"
      });
    }

    const permission = await Permission.findOne({
      _id: permissionId,
      ownerId,
      type
    });

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: "Permission not found"
      });
    }

    const updated = await Permission.findByIdAndUpdate(
      permissionId,
      { name, ...permissions },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Permission updated successfully",
      data: updated
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const deletePermission = async (req, res) => {
  try {
    if (!req.user.isOwner) {
      return res.status(403).json({ success: false, message: "Only owner allowed" });
    }

    const { permissionId } = req.body;
    const ownerId = req.user.userId || req.user.id;
    const type = req.user.type;

    if (!permissionId) {
      return res.status(400).json({
        success: false,
        message: "permissionId is required"
      });
    }

    const permission = await Permission.findOne({
      _id: permissionId,
      ownerId,
      type
    });

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: "Permission not found"
      });
    }

    await Permission.findByIdAndDelete(permissionId);

    return res.status(200).json({
      success: true,
      message: "Permission deleted successfully"
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
