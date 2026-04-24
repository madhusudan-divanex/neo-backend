import Laboratory from "../../models/Laboratory/laboratory.model.js";
import EditRequest from '../../models/EditRequest.js';
import LabAddress from '../../models/Laboratory/labAddress.model.js';
import LabPerson from '../../models/Laboratory/contactPerson.model.js';
import LabImage from '../../models/Laboratory/labImages.model.js';
import Rating from '../../models/Rating.js';
import LabLicense from '../../models/Laboratory/labLicense.model.js';
import mongoose from 'mongoose';
import User from '../../models/Hospital/User.js';
import Notification from '../../models/Notifications.js';
import LabAppointment from "../../models/LabAppointment.js";



import DoctorAbout from "../../models/Doctor/addressAbout.model.js";
import Doctor from "../../models/Doctor/doctor.model.js";
import DoctorAppointment from "../../models/DoctorAppointment.js";
import HospitalBasic from "../../models/Hospital/HospitalBasic.js";
import Test from "../../models/Laboratory/test.model.js";
import LabTest from "../../models/LabTest.js";
import PatientDemographic from "../../models/Patient/demographic.model.js";
import Patient from "../../models/Patient/patient.model.js";
import Prescriptions from "../../models/Prescriptions.js";
import TestReport from "../../models/testReport.js";




export const getLabAppointmentDetail = async (req, res) => {
  const appointmentId = req.params.id;
  try {
    let isExist;
    if (appointmentId.length < 24) {
      isExist = await LabAppointment.findOne({ customId: appointmentId }).populate({ path: 'testId', select: 'shortName price' })
        .populate({ path: 'staff', select: 'name' })
        .populate({ path: 'patientId', select: '-passwordHash', populate: ({ path: 'patientId', select: 'name email contactNumber gender ' }) })
        .populate({ path: 'labId', select: '-passwordHash', populate: ({ path: 'labId', select: 'name logo gstNumber' }) }).lean()
        .populate({ path: 'doctorId', select: '-passwordHash' })
    } else {
      isExist = await LabAppointment.findById(appointmentId).populate({ path: 'testId', select: 'shortName price' })
        .populate({ path: 'staff', select: 'name' })
        .populate({ path: 'patientId', select: '-passwordHash', populate: ({ path: 'patientId', select: 'name email contactNumber gender ' }) })
        .populate({ path: 'labId', select: '-passwordHash', populate: ({ path: 'labId', select: 'name logo gstNumber' }) }).lean()
        .populate({ path: 'doctorId', select: '-passwordHash' })
    }
    const labAddress = await LabAddress.findOne({ userId: isExist?.labId?._id }).populate('countryId stateId cityId', 'name')
    const labReports = await TestReport.find({ appointmentId: isExist?._id }).populate('testId')
    const demographic = await PatientDemographic.findOne({ userId: isExist.patientId._id })
    if (!isExist) return res.status(200).json({ message: 'Appointment not exist' });
    return res.status(200).json({ message: "Appointment fetch successfully", data: isExist, labAddress, labReports, demographic, success: true })
  } catch (err) {
    console.log(err)
    return res.status(200).json({ message: 'Server Error' });
  }
}



export const LabAppointmentGet = async (req, res) => {
  try {
    const labUserId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const labUser = await User.findById(labUserId);
    if (!labUser) {
      return res.status(404).json({
        success: false,
        message: "Lab not found"
      });
    }

    const appointments = await LabAppointment.find({ labId: labUserId })
      .populate("patientId", "name unique_id")
      .populate({
        path: "testId",
        select: "shortName price"
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await LabAppointment.countDocuments({ labId: labUserId });

    const formatted = appointments.map((item) => ({
      _id: item._id,

      appointmentId: item.customId,

      patientName: item.patientId?.name || "N/A",
      patientId: item.patientId?.unique_id || "N/A",

      date: item.date,

      amount: item.fees,

      tests:
        item.testId
          ?.filter(Boolean)
          ?.map((t) => t.shortName) || [],

      paymentStatus: item.paymentStatus,

      status: item.status
    }));

    return res.status(200).json({
      success: true,
      data: formatted,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};




export const getLaboratorieDetail = async (req, res) => {
  const userId = req.params.id;

  try {
    // 1️⃣ Find user
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Lab not found"
      });
    }
    const labData = await Laboratory.findById(user.labId).select("-password");

    // 2️⃣ Fetch latest related documents
    const labPerson = await LabPerson.findOne({ userId }).sort({ createdAt: -1 });
    const labAddress = await LabAddress.findOne({ userId }).populate('countryId stateId cityId').sort({ createdAt: -1 });
    const labImg = await LabImage.findOne({ userId }).sort({ createdAt: -1 });
    const labLicense = await LabLicense.findOne({ userId }).sort({ createdAt: -1 });
    const isRequest = Boolean(await EditRequest.exists({ labId: user?._id }))
    const allowEdit = Boolean(await EditRequest.exists({ labId: user?._id, status: "approved" }))
    const notifications = await Notification.countDocuments({ userId }) || 0;


    // 3️⃣ Fetch ratings
    const rating = await Rating.find({ labId: user?.labId })
      .populate("patientId")
      .sort({ createdAt: -1 });

    // 4️⃣ Calculate average rating
    const avgStats = await Rating.aggregate([
      { $match: { labId: new mongoose.Types.ObjectId(user?.labId) } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$star" },
          total: { $sum: 1 }
        }
      }
    ]);

    const avgRating = avgStats.length ? avgStats[0].avgRating : 0;

    // 5️⃣ Count star ratings
    const ratingStats = await Rating.aggregate([
      { $match: { labId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$star",
          count: { $sum: 1 }
        }
      }
    ]);

    let ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingStats.forEach(r => {
      ratingCounts[r._id] = r.count;
    });

    // 6️⃣ Return final response
    return res.status(200).json({
      success: true,
      user: labData,
      labPerson,
      labAddress,
      labImg,
      labLicense, customId: user.unique_id,
      rating, allowEdit,
      avgRating,
      ratingCounts,
      isRequest, notifications
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
}

/* ================= LIST ================= */
export const getLaboratories = async (req, res) => {
  try {
    const { search = "", page = 1, status = "" } = req.query;
    const limit = 10;
    const skip = (page - 1) * limit;

    const query = {
      name: { $regex: search, $options: "i" }
    };
    if (status && status !== "all") query.status = status;

    const labs = await Laboratory.find(query).populate("userId", "nh12")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const labIds = labs?.map(item => item?.userId?._id)

    const contactPerson = await LabPerson.find({ userId: { $in: labIds } })
    const labAddr = await LabAddress.find({ userId: { $in: labIds } }).select('fullAddress userId')
   
    const labWithContact = labs.map(lab => {
      const contact = contactPerson.find(
        person => person?.userId?.toString() === lab?.userId._id.toString()
      );
      const address = labAddr.find(
        item => item?.userId?.toString() === lab?.userId._id.toString()
      );

      return {
        ...lab.toObject(),
        contactPerson: contact,
        address:address
      };
    });
    const total = await Laboratory.countDocuments(query);
    return res.json({
      success: true,
      data: labWithContact,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* STATUS TOGGLE + PUSH */
export const toggleLabStatus = async (req, res) => {
  const lab = await Laboratory.findById({ _id: req.params.id });
  if (!lab) return res.status(404).json({ message: "Lab not found" });

  lab.status =
    lab.status === "approved" || lab.status === "verify"
      ? "pending"
      : "approved";

  await lab.save();

  // 🔔 push when approved
  if (lab.status === "approved") {
    // const user = await User.findOne({ email: lab.email });
    // if (user?.fcmToken) {
    //   await sendPush({
    //     token: user.fcmToken,
    //     title: "🎉 Laboratory Approved",
    //     body: "Your laboratory has been approved by admin",
    //     data: { type: "lab_approved" }
    //   });
    // }
  }

  res.json({ success: true, status: lab.status });
};

/* DELETE */
export const deleteLab = async (req, res) => {
  await Laboratory.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};
export const approveRejectLab = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const lab = await Laboratory.findById(id);
    if (!lab) return res.status(404).json({ success: false, message: "Lab not found" });
    lab.status = status;
    if (reason) lab.rejectReason = reason;
    await lab.save();
    res.json({ success: true, message: `Lab ${status}`, data: lab });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
