import User from "../../models/Hospital/User.js";
import HospitalDoctor from "../../models/Hospital/HospitalDoctor.js";
import Notification from "../../models/Notifications.js";
import Permission from "../../models/Permission.js";
import DoctorAppointment from "../../models/DoctorAppointment.js";
import Conversation from "../../models/Hospital/Conversation.js";
import safeUnlink, { buildFollowUpPrompt, buildPrompt, doctorPrompt, fetchFromGemini, labFollowUpPrompt, parseGeminiJSON, pharmacyFollowUpPrompt } from "../../utils/globalFunction.js";
import ChatSession from "../../models/ChatSession.js";
import HealthKnowledge from "../../models/AiChatResponse.js";
import UserAiChat from "../../models/UserAiChat.js";
import MedicalHistory from "../../models/Patient/medicalHistory.model.js";
import DoctorAiChat from "../../models/Doctor/doctoraichat.model.js";
import PharAiChat from "../../models/Pharmacy/PharAi.model.js";
import LabAiChat from "../../models/Laboratory/LabAi.model.js";
import HospitalCertificate from "../../models/Hospital/HospitalCertificate.js";
import HospitalContact from "../../models/Hospital/HospitalContact.js";
import HospitalAddress from "../../models/Hospital/HospitalAddress.js";
import HospitalImage from "../../models/Hospital/HospitalImage.js";
import PaymentInfo from "../../models/PaymentInfo.js";
import StaffEmployement from "../../models/Staff/StaffEmployement.js";
import DoctorAptPayment from "../../models/DoctoAptPayment.js";
import DoctorAbout from "../../models/Doctor/addressAbout.model.js";
import PatientDemographic from "../../models/Patient/demographic.model.js";
import Patient from "../../models/Patient/patient.model.js";
import Prescriptions from "../../models/Prescriptions.js";
import BedAllotment from "../../models/Hospital/BedAllotment.js";
import TestCategory from "../../models/TestCategory.js";
import SubTestCat from "../../models/SubTestCategory.js";
import Test from "../../models/Laboratory/test.model.js";

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
      $or: [
        { name: { $regex: q, $options: "i" } },
        { nh12: { $regex: q, $options: "i" } }
      ]
    })
      .select("_id name email nh12 doctorId hospitalId labId pharId patientId")
      .populate({ path: "doctorId", select: "profileImage" })
      .populate({ path: "hospitalId", select: "logoFileId" })
      .populate({ path: "labId", select: "logo" })
      .populate({ path: "pharId", select: "logo" })
      .populate({ path: "patientId", select: "profileImage" });

    // ✅ Organize Data
    const formattedUsers = users.map(user => {
      let image = null;

      if (user.doctorId?.profileImage) {
        image = user.doctorId.profileImage;
      } else if (user.hospitalId?.logoFileId) {
        image = user.hospitalId.logoFileId;
      } else if (user.labId?.logo) {
        image = user.labId.logo;
      } else if (user.pharId?.logo) {
        image = user.pharId.logo;
      } else if (user.patientId?.profileImage) {
        image = user.patientId.profileImage;
      }

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        nh12: user.nh12,
        image // 👈 frontend me item.image se access ho jayega
      };
    });

    res.json({ success: true, data: formattedUsers });

  } catch (e) {
    console.log(e)
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// ================= GET DOCTOR BY UNIQUE ID =================
export const GetDoctor = async (req, res) => {
  try {
    const { unique_id } = req.params;

    const user = await User.findOne({ nh12: unique_id, role: 'doctor' });

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
      message: "Notification deleted"
    });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
export const deleteOneNotification = async (req, res) => {
  try {
    const myId = req.user.id;
    const notifyId = req.params.id;
    const deleteNotification = await Notification.findOneAndDelete({ userId: myId, _id: notifyId });
    if (!deleteNotification) {
      return res.json({
        success: false,
        message: "Notification not found"
      });
    }
    return res.json({
      success: true,
      message: "Notification deleted"
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

    const filteredPermissions = permissions.map((perm) => ({
      _id: perm._id,
      name: perm.name,
      type: perm.type,
      staffEmp: perm.staffEmp,
      ownerId: perm.ownerId,
      permissions: perm[type] || {}, // only the section for the user's type
      createdAt: perm.createdAt,
      updatedAt: perm.updatedAt
    }));


    return res.status(200).json({
      message: "Permissions fetched successfully",
      data: filteredPermissions,
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
      return res.status(200).json({ success: false, message: "Only owner allowed" });
    }

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
        data: updated[type]
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
      return res.status(200).json({ success: false, message: "Only owner allowed" });
    }

    const { permissionId, staffEmp = [], name, ...permissions } = req.body;

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

    const oldStaff = permission.staffEmp.map(id => id.toString());
    const newStaff = staffEmp.map(id => id.toString());

    const removedStaff = oldStaff.filter(id => !newStaff.includes(id));
    const addedStaff = newStaff.filter(id => !oldStaff.includes(id));

    // 🔥 Handle newly added staff
    if (addedStaff.length > 0) {
      // Remove from other permissions
      await Permission.updateMany(
        {
          _id: { $ne: permissionId },
          staffEmp: { $in: addedStaff }
        },
        {
          $pull: { staffEmp: { $in: addedStaff } }
        }
      );

      // Assign new permission
      await StaffEmployement.updateMany(
        { _id: { $in: addedStaff } },
        { permissionId: permissionId }
      );
    }

    // ❌ Handle removed staff
    if (removedStaff.length > 0) {
      await StaffEmployement.updateMany(
        { _id: { $in: removedStaff } },
        { $unset: { permissionId: "" } }
      );
    }

    // ✏️ Update permission doc
    const updated = await Permission.findByIdAndUpdate(
      permissionId,
      { name, staffEmp, ...permissions },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Permission updated successfully",
      data: updated[type]
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
export const assignPermission = async (req, res) => {
  try {
    if (!req.user.isOwner) {
      return res.status(200).json({ success: false, message: "Only owner allowed" });
    }

    const { permissionId, staffEmp = [], } = req.body;

    const ownerId = req.user.userId || req.user.id;
    const type = req.user.type;

    if (!permissionId) {
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

    const oldStaff = permission.staffEmp.map(id => id.toString());
    const newStaff = staffEmp.map(id => id.toString());

    const removedStaff = oldStaff.filter(id => !newStaff.includes(id));
    const addedStaff = newStaff.filter(id => !oldStaff.includes(id));

    // 🔥 Handle newly added staff
    if (addedStaff.length > 0) {
      // Remove from other permissions
      await Permission.updateMany(
        {
          _id: { $ne: permissionId },
          staffEmp: { $in: addedStaff }
        },
        {
          $pull: { staffEmp: { $in: addedStaff } }
        }
      );

      // Assign new permission
      await StaffEmployement.updateMany(
        { _id: { $in: addedStaff } },
        { permissionId: permissionId }
      );
    }

    // ❌ Handle removed staff
    if (removedStaff.length > 0) {
      await StaffEmployement.updateMany(
        { _id: { $in: removedStaff } },
        { $unset: { permissionId: "" } }
      );
    }

    // ✏️ Update permission doc
    const updated = await Permission.findByIdAndUpdate(
      permissionId,
      { staffEmp, },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Permission assign successfully",
      data: updated[type]
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
      return res.status(200).json({ success: false, message: "Only owner allowed" });
    }
    const { permissionId } = req.body;
    const ownerId = req.user.userId || req.user.id;
    const type = req.user.type;
    if (!permissionId) {
      return res.status(200).json({
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
export const getProfile = async (req, res) => {
  const id = req.user.userId
  try {
    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.role == "hospital") {
      // const [images, address, person, license] = await Promise.all([
      //   HospitalImage.findOne({ hospitalId: user.hospitalId }),
      //   HospitalAddress.findOne({ hospitalId: user.hospitalId }),
      //   HospitalContact.findOne({ hospitalId: user.hospitalId }),
      //   HospitalCertificate.findOne({ hospitalId: user.hospitalId })
      // ])
      // let nextStep = null;

      // if (!images) {
      //   nextStep = "/create-account-image";
      // } else if (!address) {
      //   nextStep = "/create-account-address";
      // } else if (!person) {
      //   nextStep = "/create-account-person";
      // } else if (!license) {
      //   nextStep = "/create-account-upload";
      // }
      return res.status(200).json({
        success: true,
        data: user,
      });
    }
    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const allowedChat = async (req, res) => {
  const { doctorId, patientId } = req.params
  try {
    const patient = await User.findById(patientId);
    const doctor = await User.findById(doctorId);

    if (!patient || !doctor) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (doctor.role !== 'doctor') {
      return res.status(200).json({
        success: true,
        allowedChat: true
      });
    }
    const approvedAppointment = await DoctorAppointment.findOne({ patientId, doctorId, status: 'approved' })

    return res.status(200).json({
      success: true,
      allowedChat: !!approvedAppointment
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
export const createGroup = async (req, res) => {
  let { participants, name, createdBy } = req.body
  const image = req.file ? req.file.path : null
  try {
    if (participants) {
      participants = JSON.parse(participants);
    }
    const user = await Conversation.create({
      participants,
      name,
      createdBy,
      image,
      type: "group"
    })
    if (!user) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }
    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    safeUnlink(image)
    return res.status(500).json({ success: false, message: err.message });
  }
};
export const createChatSessionController = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    const newChat = await ChatSession.create({
      userId: user._id,
      audience: user.role,
      title: "New Chat"
    });

    return res.status(200).json({
      success: true,
      data: newChat
    });

  } catch (err) {
    res.status(500).json({ success: false });
  }
};
export const getChatSessionsController = async (req, res) => {
  try {
    const chats = await ChatSession.find({
      userId: req.user.userId
    }).sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: chats
    });

  } catch (err) {
    res.status(500).json({ success: false });
  }
};
export const askQuestionController = async (req, res) => {
  const { question, chatSessionId } = req.body;
  const userId = req.user.userId

  if (!question) {
    return res.status(400).json({
      success: false,
      message: "Question is required",
    });
  }

  try {
    const regex = new RegExp(question, "i");

    const isExist = await HealthKnowledge.findOne({
      $or: [
        { defination: regex },
        { medicalBoundaryNote: regex },          // ✅ FIX HERE
        // { answer_short: regex },
        // { answer_detailed: regex },
      ],
    }).lean();

    if (isExist) {
      const user = await User.findById(userId)
      const isBefore = await UserAiChat.findOne({ question, userId })
      if (!isBefore && user) {
        await UserAiChat.create({ question, userId, responseId: isExist?._id, audience: user?.role })
      }
      return res.status(200).json({
        success: true,
        source: "database",
        data: isExist,
      });
    }
    let prompt;
    const user = await User.findById(userId)
    if (user.role === 'patient') {
      const medicalHistory = await MedicalHistory.findOne({ userId }).sort({ createdAt: -1 })
      prompt = await buildPrompt(question, medicalHistory)
    } else if (user.role == "doctor") {
      prompt = await doctorPrompt(question)
    } else if (user.role == "pharmacy") {
      prompt = await pharmacyFollowUpPrompt(question)
    } else if (user.role == "lab") {
      prompt = await labFollowUpPrompt(question)
    }
    const aiRaw = await fetchFromGemini(prompt);

    let aiData;
    try {
      aiData = parseGeminiJSON(aiRaw); // ✅ clean + JSON.parse inside
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "AI response parsing failed",
      });
    }

    // object → string
    let aiString = JSON.stringify(aiData);
    aiString = aiString.replace(/userName/g, user.name);
    aiData = JSON.parse(aiString);

    // 4️⃣ Save in DB (STRICT MODEL MATCH)
    let saved;
    if (user.role === 'patient') {
      saved = await HealthKnowledge.create({
        defination: aiData.defination,
        commonCauses: aiData?.commonCauses,
        seriousCauses: aiData.seriousCauses,
        whenToSeekHelp: aiData.whenToSeekHelp,
        generalNextSteps: aiData.generalNextSteps,
        medicalBoundaryNote: aiData?.medicalBoundaryNote,
        openai_raw_response: aiData,
        followUpQuestions: aiData?.followUpQuestions,
        generatedFor: "detailAnswer"
      });
    }
    else if (user.role === 'doctor') {
      saved = await DoctorAiChat.create({
        clinicalSummary: aiData.clinicalSummary,
        redFlags: aiData?.redFlags,
        recommendedInvestigations: aiData?.recommendedInvestigations,
        possibleTreatmentClasses: aiData?.possibleTreatmentClasses,
        medicalBoundaryNote: aiData?.medicalBoundaryNote,
        specialistReferral: aiData?.specialistReferral,
        openai_raw_response: aiData,
        followUpQuestions: aiData?.followUpQuestions,
        generatedFor: "detailAnswer"
      })
    }
    else if (user.role === "pharmacy") {
      saved = await PharAiChat.create({
        summary: aiData.summary,
        openai_raw_response: aiData,
        followUpQuestions: aiData?.followUpQuestions,
        generatedFor: "detailAnswer"
      })
    }
    else if (user.role === "lab") {
      saved = await LabAiChat.create({
        summary: aiData.summary,
        openai_raw_response: aiData,
        followUpQuestions: aiData?.followUpQuestions,
        generatedFor: "detailAnswer"
      })
    }
    if (saved) {
      const user = await User.findById(userId)
      const isBefore = await UserAiChat.findOne({ question, userId })
      if (!isBefore && user.role == "patient") {
        await UserAiChat.create({ question, userId, chatSessionId, responseId: saved?._id, audience: user?.role, generatedFor: "detailAnswer" })
      } else if (!isBefore && user.role == "doctor") {
        await UserAiChat.create({ question, userId, chatSessionId, doctorResponseId: saved?._id, audience: user?.role, generatedFor: "detailAnswer" })
      }
      else if (!isBefore && user.role == "pharmacy") {
        await UserAiChat.create({ question, userId, chatSessionId, pharResponseId: saved?._id, audience: user?.role, generatedFor: "detailAnswer" })
      } else if (!isBefore && user.role == "lab") {
        await UserAiChat.create({ question, userId, chatSessionId, labResponseId: saved?._id, audience: user?.role, generatedFor: "detailAnswer" })
      }
    }
    // 5️⃣ Send response
    return res.status(200).json({
      success: true,
      source: "gemini",
      data: saved,
    });

  } catch (error) {
    console.error("Ask Question Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const getAskQuestionController = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 🔹 Pagination params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;
    const chatSessionId = req.query.chatSessionId
    // 🔹 Fetch paginated data
    const [data, totalRecords] = await Promise.all([
      UserAiChat.find({ userId: req.user.userId, chatSessionId })
        .populate("responseId")
        .populate("doctorResponseId")
        .populate("pharResponseId")
        .populate("labResponseId")
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      UserAiChat.countDocuments({ userId: req.user.userId }),
    ]);

    return res.status(200).json({
      success: true,
      page,
      limit,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      data,
    });

  } catch (error) {
    console.error("Get Ask Question Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const followUpQuestionController = async (req, res) => {
  const { userId, question, chatSessionId } = req.body
  const fileData = req.files?.file?.[0] || null;
  const audioData = req.files?.audio?.[0] || null;

  const filePath = fileData?.path;
  const fileMime = fileData?.mimetype;

  const audioPath = audioData?.path;
  const audioMime = audioData?.mimetype;

  try {
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found", success: false })
    }

    let aiPrompt;
    if (user.role == "patient" || user.role == "doctor") {
      aiPrompt = await buildFollowUpPrompt(question, user.role);
    } else if (user.role == "pharmacy") {
      aiPrompt = await pharmacyFollowUpPrompt(question);
    }
    else if (user.role == "lab") {
      aiPrompt = await labFollowUpPrompt(question)
    }
    const aiRaw = await fetchFromGemini(aiPrompt, filePath, audioPath, fileMime, audioMime);
    const dataToInsert = parseGeminiJSON(aiRaw);

    let saved;
    if (user.role === 'patient') {
      saved = await HealthKnowledge.create({
        summary: dataToInsert.summary,
        followUpQuestions: dataToInsert?.followUpQuestions,
        generatedFor: "followUp"
      });
    } else if (user.role == "doctor") {
      saved = await DoctorAiChat.create({
        summary: dataToInsert.summary,
        followUpQuestions: dataToInsert?.followUpQuestions,
        generatedFor: "followUp"
      });
    } else if (user.role == "pharmacy") {
      saved = await PharAiChat.create({
        summary: dataToInsert.summary,
        followUpQuestions: dataToInsert?.followUpQuestions,
        generatedFor: "followUp"
      })
    }
    else if (user.role == "lab") {
      saved = await LabAiChat.create({
        summary: dataToInsert.summary,
        followUpQuestions: dataToInsert?.followUpQuestions,
        generatedFor: "followUp"
      })
    }

    let savedData = await UserAiChat.create({
      userId,
      file: filePath,
      audio: audioPath,
      audience: user.role,
      question, chatSessionId,
      responseId: user.role === 'patient' ? saved._id : undefined,
      doctorResponseId: user.role === 'doctor' ? saved._id : undefined,
      pharResponseId: user.role === 'pharmacy' ? saved._id : undefined,
      labResponseId: user.role === 'lab' ? saved._id : undefined
    });

    savedData = await UserAiChat.findById(savedData._id)
      .populate("responseId")
      .populate("pharResponseId")
      .populate("labResponseId")
      .populate("doctorResponseId");

    const session = await ChatSession.findById(chatSessionId);

    if (session.title === "New Chat") {
      session.title = question.substring(0, 40);
      await session.save();
    }

    return res.status(200).json({
      success: true,
      questions: [savedData],
    });


  } catch (error) {
    console.log(error)
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
export const getGeneralQuestionController = async (req, res) => {
  const question = req.query.question
  try {
    const filter = {}
    if (question) {
      filter.title = {
        $regex: question,
        $options: "i"
      };
    }
    // 🔹 Fetch paginated data
    const data = await HealthKnowledge.find(filter).select("title").limit(10).sort({ createdAt: -1 })

    return res.status(200).json({
      success: true,
      data
    });

  } catch (error) {
    console.error("Get Ask Question Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
export const getUserDataController = async (req, res) => {
  const nh12 = req.params.nh12
  try {
    const user = await User.findOne({ nh12 }).select("-passwordHash")
      .populate("patientId", "profileImage").populate("doctorId", "profileImage")
    if (!user) {
      return res.status(200).json({ message: "user not found", success: false })
    }

    return res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
export const addOrUpatePaymentInfo = async (req, res) => {
  const { bankName, ifscCode, accountNumber, accountHolderName, branch } = req.body;
  const userId = req.user.id || req.user.userId;

  let qr = req?.file ? req.file.path : null;

  try {
    const isUser = await User.findById(userId);
    if (!isUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // ✅ get latest record
    const lastRecord = await PaymentInfo.findOne({ userId })
      .sort({ createdAt: -1 });

    // ✅ if no new QR uploaded, use old one
    if (!qr && lastRecord?.qr) {
      qr = lastRecord.qr;
    }

    // ✅ create new record (history maintained)
    await PaymentInfo.create({
      bankName,
      ifscCode,
      accountNumber,
      accountHolderName,
      branch,
      qr,
      userId,
    });

    return res.status(201).json({
      success: true,
      message: "Payment data saved successfully",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};
export const doctorAppointmentInvoice = async (req, res) => {
  const id = req.params.id
  try {
    const isPayment = await DoctorAptPayment.findById(id)
    if (!isPayment) {
      return res.status(404).json({ message: "Payment data not found", success: false })
    }
    const aptData = await DoctorAppointment.findById(isPayment.appointmentId).populate('doctorId patientId hospitalId', 'name email contactNumber nh12')
    const patientDemo = await PatientDemographic.findOne({ userId: aptData?.patientId?._id }).select('dob bloodGroup age gender address').lean()
    const ptBasic = await Patient.findOne({ userId: aptData?.patientId?._id })
    const patientData = {
      ...patientDemo, name: aptData?.patientId?.name, email: aptData?.patientId?.email, nh12: aptData?.patientId?.nh12,
      contactNumber: aptData?.patientId?.contactNumber, gender: ptBasic?.gender
    }
    if (aptData?.hospitalId) {
      const hospital = await User.findById(aptData?.hospitalId)
      let address = await HospitalAddress.findOne({ hospitalId: hospital?.hospitalId }).populate('country state city', 'name')
      const doctorAbout = await DoctorAbout.findOne({ userId: aptData?.doctorId }).select('specialty').populate('specialty', 'name')
      const dataToSend = {
        fees: aptData.fees,
        paymentMethod: isPayment.paymentMethod,
        transactionId: isPayment.customId,
        totalAmount: isPayment.totalAmount,
        subTotal: isPayment.subTotal,
        discountValue: isPayment.discountValue,
        discountType: isPayment.discountType,
        doctorName: aptData?.doctorId?.name,
        doctorNh12: aptData?.doctorId?.nh12,
        specialization: doctorAbout?.specialty?.name,
        bookedOn: aptData?.createdAt,
        appointmentDate: aptData?.date,
        orgName: aptData?.hospitalId?.name,
        orgAddress: `${address?.fullAddress} ,${address?.city?.name}, ${address?.state?.name}, ${address?.country?.name}, ${address?.pinCode}`,
        orgEmail: aptData?.hospitalId?.email,
        orgContactNumber: aptData?.hospitalId?.contactNumber,
        paymentStatus: aptData?.paymentStatus,
        bookingId: aptData?.customId,
        status: aptData?.status
      }

      return res.status(200).json({ success: true, ptData: patientData, data: dataToSend })
    } else {
      const hospital = await User.findById(aptData?.hospitalId)
      let address = await HospitalAddress.findOne({ hospitalId: hospital?.hospitalId }).populate('country state city', 'name')
      const doctorAbout = await DoctorAbout.findOne({ userId: aptData?.doctorId }).select('specialty').populate('specialty', 'name')
      const dataToSend = {
        fees: aptData.fees,
        paymentMethod: isPayment.paymentMethod,
        transactionId: isPayment.customId,
        totalAmount: isPayment.totalAmount,
        subTotal: isPayment.subTotal,
        discountValue: isPayment.discountValue,
        discountType: isPayment.discountType,
        doctorName: aptData?.doctorId?.name,
        doctorNh12: aptData?.doctorId?.nh12,
        specialization: doctorAbout?.specialty?.name,
        bookedOn: aptData?.createdAt,
        appointmentDate: aptData?.date,
        orgName: aptData?.doctorId?.name,
        orgAddress: `${address?.fullAddress} ,${address?.city?.name}, ${address?.state?.name}, ${address?.country?.name}, ${address?.pinCode}`,
        orgEmail: aptData?.doctorId?.email,
        orgContactNumber: aptData?.doctorId?.contactNumber,
        paymentStatus: aptData?.paymentStatus,
        bookingId: aptData?.customId,
        status: aptData?.status
      }

      return res.status(200).json({ success: true, ptData: patientData, data: dataToSend })
    }

  } catch (error) {
    return res.status(500).json({ success: false, message: error?.message })
  }
}
export const prescriptionPdf = async (req, res) => {
  const id = req.params.id
  try {
    const isPres = await Prescriptions.findById(id)
    if (!isPres) {
      return res.status(404).json({ message: "Prescription data not found", success: false })
    }
    const aptData =isPres?.appointmentId? await DoctorAppointment.findById(isPres.appointmentId).populate('doctorId patientId hospitalId', 'name email contactNumber nh12')
    : await BedAllotment.findById(isPres.allotmentId).populate('primaryDoctorId patientId hospitalId', 'name email contactNumber nh12')
    const patientDemo = await PatientDemographic.findOne({ userId: aptData?.patientId?._id }).select('dob bloodGroup age gender address').lean()
    const ptBasic = await Patient.findOne({ userId: aptData?.patientId?._id })
    const patientData = {
      ...patientDemo, name: aptData?.patientId?.name, email: aptData?.patientId?.email, nh12: aptData?.patientId?.nh12,
      contactNumber: aptData?.patientId?.contactNumber, gender: ptBasic?.gender
    }
    if (aptData?.hospitalId || aptData?.allotmentId) {
      const hospital = await User.findById(aptData?.hospitalId)
      let address = await HospitalAddress.findOne({ hospitalId: hospital?.hospitalId }).populate('country state city', 'name')
      const doctorId=aptData?.doctorId || aptData?.primaryDoctorId
      const doctorAbout = await DoctorAbout.findOne({ userId: doctorId  }).select('specialty').populate('specialty', 'name')
      const dataToSend = {
        doctorName: doctorId?.name,
        doctorNh12: doctorId?.nh12,
        specialization: doctorAbout?.specialty?.name,
        bookedOn: aptData?.createdAt,
        appointmentDate: aptData?.date,
        orgName: aptData?.hospitalId?.name,
        orgNh12:aptData?.hospitalId?.nh12,
        orgAddress: address?.fullAddress? `${address?.fullAddress} ,${address?.city?.name}, ${address?.state?.name}, ${address?.country?.name}, ${address?.pinCode}`:'',
        orgEmail: aptData?.hospitalId?.email,
        orgContactNumber: aptData?.hospitalId?.contactNumber,
        paymentStatus: aptData?.paymentStatus,
        bookingId: aptData?.customId,
        status: aptData?.status
      }

      return res.status(200).json({ success: true,prescription:isPres, ptData: patientData, data: dataToSend })
    } else {
      const hospital = await User.findById(aptData?.hospitalId)
      let address = await HospitalAddress.findOne({ hospitalId: hospital?.hospitalId }).populate('country state city', 'name')
      const doctorAbout = await DoctorAbout.findOne({ userId: aptData?.doctorId }).select('specialty').populate('specialty', 'name')
      const dataToSend = {
        doctorName: aptData?.doctorId?.name,
        doctorNh12: aptData?.doctorId?.nh12,
        specialization: doctorAbout?.specialty?.name,
        bookedOn: aptData?.createdAt,
        appointmentDate: aptData?.date,
        orgName: aptData?.doctorId?.name,
        orgNh12:aptData?.doctorId?.nh12,
        orgAddress:address?.fullAddress ? `${address?.fullAddress} ,${address?.city?.name}, ${address?.state?.name}, ${address?.country?.name}, ${address?.pinCode}` : '',
        orgEmail: aptData?.doctorId?.email,
        orgContactNumber: aptData?.doctorId?.contactNumber,
        paymentStatus: aptData?.paymentStatus,
        bookingId: aptData?.customId,
        status: aptData?.status
      }

      return res.status(200).json({ success: true,prescription:isPres, ptData: patientData, data: dataToSend })
    }

  } catch (error) {
    console.log(error)
    return res.status(500).json({ success: false, message: error?.message })
  }
}
export const getTestCatAndSub = async(req,res)=>{
  try {
    const testData=await TestCategory.find().populate('subCat')
    return res.status(200).json({message:"Test category and sub category data fetched",success:true,data:testData})
  } catch (error) {
    return res.status(500).json({message:error?.message,success:false})
  }
}
export const getSubTestCatById = async(req,res)=>{
  try {
    const testData=await SubTestCat.find({category:req.params.id})
    if(testData.length==0){
      return res.status(404).json({message:"Sub Test category  data not exist",success:false})
    }
    return res.status(200).json({message:"Sub Test category  data fetched",success:true,data:testData})
  } catch (error) {
    return res.status(500).json({message:error?.message,success:false})
  }
}
export const getSubTestCatDataById = async(req,res)=>{
  try {
    const testData=await SubTestCat.findById(req.params.id).populate('category','name')
    if(testData.length==0){
      return res.status(404).json({message:"Sub Test category  data not exist",success:false})
    }
    return res.status(200).json({message:"Sub Test category  data fetched",success:true,data:testData})
  } catch (error) {
    return res.status(500).json({message:error?.message,success:false})
  }
}
export const getMyTestCat = async(req,res)=>{
  const userId=req.user.id || req.user.userId
  try {
    const testData=await Test.find({labId:userId}).select('category')
   
    return res.status(200).json({message:" Test category  data fetched",success:true,data:testData})
  } catch (error) {
    return res.status(500).json({message:error?.message,success:false})
  }
}