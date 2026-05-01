import mongoose from "mongoose"
import Doctor from "../../models/Doctor/doctor.model.js"
import DoctorAppointment from "../../models/DoctorAppointment.js"
import User from "../../models/Hospital/User.js"
import Patient from "../../models/Patient/patient.model.js"
import PatientDemographic from "../../models/Patient/demographic.model.js"
import LabAppointment from "../../models/LabAppointment.js"
import TestReport from "../../models/testReport.js"
import Prescriptions from "../../models/Prescriptions.js"
import Notification from "../../models/Notifications.js"
import bcrypt from "bcryptjs"
import Permission from "../../models/Permission.js"
import TimeSlot from "../../models/TimeSlot.js"
import safeUnlink from "../../utils/globalFunction.js"
import { sendPush } from "../../utils/sendPush.js"
import Country from "../../models/Hospital/Country.js"
import { assignNH12 } from "../../utils/nh12.js"
import Department from "../../models/Department.js"
import StaffEmployement from "../../models/Staff/StaffEmployement.js"
import Staff from "../../models/Staff/Staff.js"
const doctorDashboard = async (req, res) => {
  const id = req.params.id
  try {
    const isExist = await User.findById(id)
    if (!isExist) {
      return res.status(200).json({ message: "Doctor not exist", success: false })
    }
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const pendingApt = await DoctorAppointment.countDocuments({ doctorId: id, status: 'pending' })
    const approveApt = await DoctorAppointment.countDocuments({ doctorId: id, status: 'approved' })
    const completeApt = await DoctorAppointment.countDocuments({ doctorId: id, status: 'completed' })
    const cancelApt = await DoctorAppointment.countDocuments({ doctorId: id, status: { $in: ['cancel', 'rejected'] } })
    const totalApt = await DoctorAppointment.countDocuments({ doctorId: id })
    const todayApt = await DoctorAppointment.countDocuments({ doctorId: id, createdAt: { $gte: start, $lte: end } })
    const pendingRequest = 0
    const uniquePatientIds = await DoctorAppointment.distinct('patientId', { doctorId: id })
    const totalPatient = uniquePatientIds.length
    const totalStaff = await Staff.countDocuments({ userId: id })
    const totalDoctors = await StaffEmployement.countDocuments({ organizationId: id, role: "doctor" })
    const totalDepartments = await Department.countDocuments({ userId: id })
    const appointmentRequest = await DoctorAppointment.find({ doctorId: id, status: 'pending' })
      .populate({
        path: 'patientId', select: '-passwordHash', populate: {
          path: 'patientId',
          select: 'profileImage'
        }
      }).sort({ createdAt: -1 }).limit(10)
    const pendingAppointment = await DoctorAppointment.find({ doctorId: id, status: 'approved' })
      .populate({
        path: 'patientId', select: '-passwordHash', populate: {
          path: 'patientId',
          select: 'profileImage'
        }
      }).sort({ createdAt: -1 }).limit(10)

    const cardData = { pendingApt, completeApt, cancelApt, totalApt, todayApt, pendingRequest, totalDepartments, approveApt, totalDoctors, totalPatient, totalStaff }
    return res.status(200).json({ success: true, cardData, appointmentRequest, pendingAppointment })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: "Internal server errror" })
  }
}
const getPatientHistory = async (req, res) => {
  try {
    const doctorId = req.params.id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const userFilter = search
      ? {
        $or: [
          { nh12: { $regex: search, $options: "i" } },
          { name: { $regex: search, $options: "i" } }
        ],
        role: "patient"
      }
      : {};

    const users = await User.find(userFilter).select("_id");
    const userIds = users.map(u => u._id);

    // Check doctor exists
    const isExist = await User.findOne({ _id: doctorId, role: 'doctor' });
    if (!isExist) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not exist'
      });
    }

    // Get unique patient IDs
    const patientIds = await DoctorAppointment.distinct("patientId", {
      doctorId,
      status: "completed",
      ...(search && { patientId: { $in: userIds } })
    });

    // Pagination on patient IDs
    const paginatedIds = patientIds.slice(skip, skip + limit);

    // Fetch patient data
    const ptData = await Promise.all(
      paginatedIds.map(async (id) => {
        const patient = await Patient.findOne({ userId: id }).populate({ path: 'userId', select: 'nh12' }).lean()
        const patientDemographic = await PatientDemographic.findOne({ userId: id }).select('dob').lean()
        const lastApt = await DoctorAppointment.findOne({ patientId: id, doctorId }).sort({ createdAt: -1 }).lean()
        return { ...patient, patientDemographic, lastApt };
      })
    );

    return res.status(200).json({
      success: true,
      message: 'Patient history fetched successfully',
      data: ptData,
      pagination: {
        page,
        limit,
        totalPatients: patientIds.length
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

const getOccupiedSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.params;

    // Parse the date to start and end of the day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Find all appointments for this doctor on that date
    const appointments = await DoctorAppointment.find({
      doctorId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    // Extract times as strings like "08.00 PM"
    const occupiedTimes = appointments.map(app => {
      const hours = app.date.getHours();
      const minutes = app.date.getMinutes();
      let meridiem = hours >= 12 ? "PM" : "AM";
      let hour12 = hours % 12;
      if (hour12 === 0) hour12 = 12;
      const minuteStr = minutes.toString().padStart(2, "0");
      return `${hour12}.${minuteStr} ${meridiem}`;
    });

    return res.json({ success: true, occupiedTimes });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: "Internal server error" })
  }
}
async function getDoctorPatientReport(req, res) {
  const doctorId = req.params.doctorId;
  const patientId = req.params.patientId
  try {
    const appointments = await DoctorAppointment.find({
      doctorId, patientId,
      "labTest.lab": { $exists: true, $ne: null },
      "labTest.labTests.0": { $exists: true }
    })
    const aptIds = appointments.map(item => item._id)
    const labAppointments = await LabAppointment.find({ doctorAp: { $in: aptIds }, status: 'deliver-report' })
    const labAptIds = labAppointments.map(item => item?._id)
    const labReports = await TestReport.find({ appointmentId: { $in: labAptIds } }).populate('labId').populate('testId')
      .populate('appointmentId')
    return res.status(200).json({ message: "labReports", data: labReports, success: true })

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
}
async function getPatientPending(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const name = req.query.name || null;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let matchStage = {
      status: 'pending'
    };

    if (name && name !== "undefined") {
      matchStage.name = { $regex: name, $options: 'i' };
    }

    const patients = await Patient.aggregate([
      { $match: matchStage },

      {
        $lookup: {
          from: 'patient-demographics', // ✅ correct collection name
          localField: 'userId',
          foreignField: 'userId',
          as: 'demographicData'
        }
      },

      // ✅ only those who completed step 4
      {
        $match: {
          demographicData: { $ne: [] }
        }
      },

      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userId'
        }
      },
      { $unwind: "$userId" },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]);

    const totalResult = await Patient.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'patient-demographics',
          localField: 'userId',
          foreignField: 'userId',
          as: 'demographicData'
        }
      },
      {
        $match: {
          demographicData: { $ne: [] }
        }
      },
      { $count: "total" }
    ]);

    const total = totalResult[0]?.total || 0;

    return res.status(200).json({
      success: true,
      message: 'Only completed step-4 patients fetched',
      data: patients,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch patients'
    });
  }
}
async function sendReminder(req, res) {
  const { patientId, appointmentId, doctorId } = req.body;
  try {
    const isPrescription = await Prescriptions.findOne({ patientId, appointmentId, doctorId }).populate('patientId doctorId', 'name')
    if (!isPrescription) {
      return res.status(200).json({ message: "Not found", success: false })
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const revisitDate = new Date(isPrescription.createdAt);
    revisitDate.setDate(revisitDate.getDate() + isPrescription.reVisit);
    revisitDate.setHours(0, 0, 0, 0);

    // // agar aaj ka din hai
    // console.log(revisitDate,isPrescription.reVisit)
    // if (revisitDate >= today && revisitDate < tomorrow) {
    const user = await User.findById(isPrescription.patientId?._id)
    if (user.fcmToken) {
      await sendPush({
        token: user.fcmToken,
        title: "Doctor Revisit Reminder",
        body: `This is a reminder that you have a scheduled revisit today with Dr. ${isPrescription.doctorId.name} regarding ${isPrescription?.diagnosis}. Kindly book your appointment.` || "📩 New message received",
        data: {
          type: "REVISIT",
        }
      })
    }
    await Notification.create({
      userId: patientId,
      title: "Doctor Revisit Reminder",
      message: `This is a reminder that you have a scheduled revisit today with Dr. ${isPrescription.doctorId.name} regarding ${isPrescription?.diagnosis}. Kindly book your appointment.`,
      type: "REVISIT"
    });
    return res.status(200).json({ messsage: "Notfication send", success: true })
    // }
    // return res.status(200).json({message:"Reminder not required today",success:false})

  } catch (error) {

  }
}


//      time slots 
export const addTimeSlot = async (req, res) => {
  try {


    const { userId, day, startTime, endTime } = req.body;

    let doc = await TimeSlot.findOne({ userId, day });

    if (!doc) {
      doc = new TimeSlot({ userId, day, slots: [] });
    }

    // overlap check
    const overlap = doc.slots.some(
      s => !(endTime <= s.startTime || startTime >= s.endTime)
    );

    if (overlap) {
      return res.status(400).json({
        success: false,
        message: "Time slot overlaps with existing slot"
      });
    }

    doc.slots.push({ startTime, endTime });
    await doc.save();

    return res.json({ success: true, message: "Slot added successfully" });
  } catch (error) {
    console.log(error)
    return res.status(200).json({ message: error?.message, success: false })
  }
};
export const getTimeSlots = async (req, res) => {
  try {
    const { userId } = req.params;

    const data = await TimeSlot.find({ userId }).sort({ day: 1 });

    return res.json({ success: true, data });
  } catch (error) {
    return res.status(200).json({ message: error?.message, success: false })
  }
};
export const updateTimeSlot = async (req, res) => {
  try {
    const { startTime, endTime, slotId } = req.body;
    const doc = await TimeSlot.findOne({ "slots._id": slotId });
    if (!doc) return res.status(404).json({ success: false });
    const slot = doc.slots.id(slotId);
    slot.startTime = startTime;
    slot.endTime = endTime;

    await doc.save();

    return res.json({ success: true, message: "Slot updated" });
  } catch (error) {
    console.log(error)
    return res.status(200).json({ message: error?.message, success: false })
  }
};
export const updateDaySlot = async (req, res) => {
  try {
    const { slots, day, userId } = req.body;

    const doc = await TimeSlot.findOne({ userId, day });
    if (!doc) return res.status(404).json({ success: false, message: "Time slot not found" });
    doc.slots = slots
    await doc.save();
    return res.json({ success: true, message: "Slot updated" });

  } catch (error) {
    console.log(error)
    return res.status(200).json({ message: error?.message, success: false })
  }
};
export const deleteTimeSlot = async (req, res) => {
  try {

    const { slotId } = req.params;

    const doc = await TimeSlot.findOne({ "slots._id": slotId });
    if (!doc) return res.status(404).json({ success: false });

    doc.slots.id(slotId).deleteOne();
    await doc.save();

    return res.json({ success: true, message: "Slot deleted" });
  } catch (error) {
    return res.status(200).json({ message: error?.message, success: false })
  }
};
export const addPatient = async (req, res) => {
  const { name, dob, gender, contactNumber, email, address, countryId, stateId, cityId, pinCode, contact } = req.body

  try {
    const doctorId = req.user._id;
    const data = req.body;
    if (!name || !dob || !gender || !contactNumber) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing"
      });
    }
    const isExist = await User.findOne({ email }) || await User.findOne({ contactNumber });
    if (isExist) {
      return res.status(200).json({
        success: false,
        message: "Patient already exists"
      });
    }
    // ✅ CREATE PATIENT
    const patient = await Patient.create({ name, gender, contactNumber, email });
    if (patient) {
      const rawPassword = contactNumber.slice(-4) + "@123";
      const passwordHash = await bcrypt.hash(rawPassword, 10);
      const pt = await User.create({ name, contactNumber, patientId: patient._id, email, role: 'patient', created_by: "doctor", created_by_id: doctorId, passwordHash })
      await PatientDemographic.create({ userId: pt._id, dob, contact, address, pinCode, countryId, stateId, cityId })
      await Patient.findByIdAndUpdate(patient._id, { userId: pt._id }, { new: true })
      const countryData = await Country.findById(countryId)
      if (pt && countryData?.phonecode) {
        await assignNH12(pt._id, countryData?.phonecode)
      }
      return res.status(200).json({
        success: true,
        message: "Patient added successfully",
        data: pt
      });
    }
    return res.status(200).json({
      success: false,
      message: "Patient not added ",
    });

  } catch (err) {
    console.log(err)
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export {
  doctorDashboard, getPatientHistory, getOccupiedSlots, getDoctorPatientReport, getPatientPending, sendReminder,

}