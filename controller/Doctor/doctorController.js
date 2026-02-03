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
import DoctorPermission from "../../models/Doctor/DoctorPermission.model.js"
import DoctorStaff from "../../models/Doctor/DoctorEmpPerson.model.js"
import EmpAccess from "../../models/Doctor/empAccess.model.js"
import EmpEmployement from "../../models/Doctor/employement.model.js"
import EmpProfesional from "../../models/Doctor/empProffesional.js"
import bcrypt from "bcryptjs"
import Permission from "../../models/Permission.js"
import TimeSlot from "../../models/TimeSlot.js"
import safeUnlink from "../../utils/globalFunction.js"
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

    const cardData = { pendingApt, completeApt, cancelApt, totalApt, todayApt, pendingRequest, approveApt }
    return res.status(200).json({ success: true, cardData, appointmentRequest, pendingAppointment })
  } catch (error) {
    return res.status(500).json({ message: "Internal server errror" })
  }
}
const getPatientHistory = async (req, res) => {
  try {
    const doctorId = req.params.id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Check doctor exists
    const isExist = await User.findOne({ _id: doctorId, role: 'doctor' });
    if (!isExist) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not exist'
      });
    }

    // Get unique patient IDs
    const patientIds = await DoctorAppointment.distinct('patientId', { doctorId, status: 'completed' });

    // Pagination on patient IDs
    const paginatedIds = patientIds.slice(skip, skip + limit);

    // Fetch patient data
    const ptData = await Promise.all(
      paginatedIds.map(async (id) => {
        const patient = await Patient.findOne({ userId: id }).populate({ path: 'userId', select: 'unique_id' }).lean()
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

    const query = {
      status: 'pending',
    };
    if (name && name !== "undefined") {
      query.name = { $regex: name, $options: 'i' }
    }

    const users = await Patient.find(query)
      .populate('userId', '-passwordHash')
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: 'Pending profiles fetched',
      data: users,
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
      message: 'Failed to fetch pending profiles'
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

const saveDoctorStaff = async (req, res) => {
  const { name, address, dob, state, city, pinCode, doctorId, empId, gender } = req.body
  const contactInformation = JSON.parse(req.body.contactInformation)
  const profileImage = req.files?.['profileImage']?.[0]?.path
  try {
    const isExist = await User.findById(doctorId);
    if (!isExist) return res.status(200).json({ message: "Doctor  not found", success: false })

    const isStaff = await DoctorStaff.findById(empId);

    if (profileImage && isStaff) {
      safeUnlink(isStaff.profileImage)
    }
    if (isStaff) {
      await DoctorStaff.findByIdAndUpdate(empId, { name, address, dob, state, gender, city, pinCode, contactInformation, doctorId, profileImage: profileImage || isStaff.profileImage }, { new: true })
      return res.status(200).json({
        success: true,
        message: "Staff updated",
      });
    } else {
      const staf = await DoctorStaff.create({ name, address, dob, state, gender, city, pinCode, contactInformation, doctorId, profileImage });
      return res.status(200).json({
        success: true,
        message: "Staff created",
        empId: staf._id
      });
    }


  } catch (error) {
    if (profileImage && fs.existsSync(profileImage)) {
      safeUnlink(profileImage)
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};
const saveEmpEmployement = async (req, res) => {
  const { id, empId, doctorId, position, joinDate, onLeaveDate, contractStart, contractEnd, salary, note } = req.body;

  try {
    // Check if employee exists
    const employee = await DoctorStaff.findById(empId);
    if (!employee) return res.status(200).json({ success: false, message: "Employee not found" });

    let data;
    if (id) {
      data = await EmpEmployement.findByIdAndUpdate(id, { empId, doctorId, position, joinDate, onLeaveDate, contractStart, contractEnd, salary, note }, { new: true });
      if (!data) return res.status(200).json({ success: false, message: "Employment record not found" });

      return res.status(200).json({
        success: true,
        message: "Employee employment updated",
        data
      });
    } else {
      // Create new
      data = await EmpEmployement.create({ empId, doctorId, position, joinDate, onLeaveDate, contractStart, contractEnd, salary, note });
      return res.status(200).json({
        success: true,
        message: "Employee employment created",
        data
      });
    }

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
const deleteSubEmpProffesional = async (req, res) => {
  const { id, empId, type } = req.body;

  try {
    // Check if employee exists
    const employee = await DoctorStaff.findById(empId);
    if (!employee) {
      return res.status(200).json({ success: false, message: "Employee not found" });
    }

    // Build pull query based on type
    let pullQuery = {};

    if (type === "education") {
      pullQuery = { $pull: { education: { _id: id } } };
    } else if (type === "cert") {
      const data = await EmpProfesional.findOne({ empId }).select('certificates')
      safeUnlink(data.certificates.certFile)
      pullQuery = { $pull: { certificates: { _id: id } } };
    } else {
      return res.status(400).json({ success: false, message: "Invalid type" });
    }

    const data = await EmpProfesional.findOneAndUpdate(
      { empId },
      pullQuery,
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Sub-document deleted successfully",
      data
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
const saveEmpProfessional = async (req, res) => {
  const { id, empId, profession, specialization, totalExperience, professionalBio, education } = req.body;
  const certMeta = JSON.parse(req.body.certificates || "[]");
  try {
    const employee = await DoctorStaff.findById(empId);
    if (!employee) return res.status(200).json({ success: false, message: "Employee not found" });
    const uploadedFiles = req.files?.certFile || [];
    const certificates = certMeta.map((meta, idx) => ({
      certName: meta.certName,
      certFile: uploadedFiles[idx] ? uploadedFiles[idx].path : "",
    }));
    const isExist = await EmpProfesional.findOne({ empId })
    let data;
    if (isExist) {
      const existing = await EmpProfesional.findById(isExist._id);
      if (!existing) return res.status(200).json({ success: false, message: "Professional record not found" });

      if (certificates.length > 0 && existing.certificates?.length) {
        existing.certificates.forEach(cert => safeUnlink(cert.certFile));
      }

      data = await EmpProfesional.findByIdAndUpdate(
        isExist._id,
        {
          profession,
          specialization,
          totalExperience,
          professionalBio,
          education: JSON.parse(education || "[]"), // assuming education comes as JSON string
          certificates: certificates.length > 0 ? certificates : existing.certificates
        },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        message: "Employee professional updated"
      });

    } else {
      // Create new record
      data = await EmpProfesional.create({
        empId,
        profession,
        specialization,
        totalExperience,
        professionalBio,
        education: JSON.parse(education || "[]"),
        certificates
      });

      return res.status(200).json({
        success: true,
        message: "Employee professional created"
      });
    }

  } catch (error) {
    // if (certificatesFiles.length > 0) {
    //     certificatesFiles.forEach(file => safeUnlink(file.path));
    // }
    return res.status(500).json({ success: false, message: error.message });
  }
};
const saveEmpAccess = async (req, res) => {
  const { id, empId, userName, email, password, permissionId } = req.body;
  try {
    console.log(req.body)
    const employee = await DoctorStaff.findById(empId);
    if (!employee) return res.status(200).json({ success: false, message: "Employee not found" });

    const permission = await Permission.findById(permissionId);
    if (!permission) return res.status(200).json({ success: false, message: "Permission not found" });

    const isExist = await EmpAccess.findOne({ empId: empId });
    let data;
    let hashedPassword;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10)
    }
    const d=await DoctorStaff.findByIdAndUpdate(empId, { permissionId }, { new: true })
    
    if (isExist) {
      data = await EmpAccess.findOneAndUpdate({ empId: empId }, { userName, email, password: hashedPassword, permissionId }, { new: true });
      if (!data) return res.status(200).json({ success: false, message: "Access record not found" });
      return res.status(200).json({
        success: true,
        message: "Employee access updated",
        data
      });
    } else {
      data = await EmpAccess.create({ userName, email, password: hashedPassword, permissionId ,empId});
      return res.status(200).json({
        success: true,
        message: "Employee access created",
        data
      });
    }

  } catch (error) {
    console.log(error)
    return res.status(500).json({ success: false, message: error.message });
  }
};
const doctorStaffData = async (req, res) => {
  const id = req.params.id
  try {
    const personal = await DoctorStaff.findById(id);
    if (!personal) return res.status(200).json({ message: "Employee  not found", success: false })

    const employment = await EmpEmployement.findOne({ empId: id })
    const professional = await EmpProfesional.findOne({ empId: id })
    const empAccess = await EmpAccess.findOne({ empId: id })?.populate('permissionId')

    return res.status(200).json({
      success: true,
      message: "Staff fetched",
      employee: personal, employment, professional, empAccess

    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
const doctorStaffAction = async (req, res) => {
  const { empId, status } = req.body
  try {
    const isExist = await DoctorStaff.findById(empId);
    if (!isExist) return res.status(200).json({ message: "Employee  not found", success: false })

    const employment = await DoctorStaff.findByIdAndUpdate(empId, { status }, { new: true })

    return res.status(200).json({
      success: true,
      message: "Staff status updated"

    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
const doctorStaff = async (req, res) => {
  const id = req.params.id;
  let { page, limit, name } = req.query;

  const pageNumber = parseInt(page) > 0 ? parseInt(page) : 1;
  const limitNumber = parseInt(limit) > 0 ? parseInt(limit) : 10;

  try {
    const isExist = await User.findById(id);
    if (!isExist) {
      return res.status(404).json({ message: "Doctor not found", success: false });
    }

    const filter = { doctorId: id };
    if (name) {
      filter.name = { $regex: name, $options: "i" };
    }

    const total = await DoctorStaff.countDocuments(filter);
    const employee = await DoctorStaff.find(filter)
      .populate({ path: "permissionId",select:'name doctor'})
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .lean();

    return res.status(200).json({
      success: true,
      message: "Staff fetched",
      data: employee,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber)
      },
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
const deleteStaffData = async (req, res) => {
  const id = req.params.id;

  try {
    const employee = await DoctorStaff.findById(id);
    if (!employee) return res.status(200).json({ success: false, message: "Employee not found" });

    safeUnlink(employee.profileImage);

    // Find related professional data
    const professional = await EmpProfesional.findOne({ empId: id });
    if (professional?.certificates?.length) {
      professional.certificates.forEach(cert => safeUnlink(cert.certFile));
    }

    // Find employment and access records
    const employment = await EmpEmployement.findOne({ empId: id });
    const empAccess = await EmpAccess.findOne({ empId: id });

    // Delete all related records
    await EmpProfesional.deleteMany({ empId: id });
    await EmpEmployement.deleteMany({ empId: id });
    await EmpAccess.deleteMany({ empId: id });
    await DoctorStaff.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Employee and related data deleted successfully"
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

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
    return res.status(200).json({ message: "Server Error", success: false })
  }
};
export const getTimeSlots = async (req, res) => {
  try {
    const { userId } = req.params;

    const data = await TimeSlot.find({ userId }).sort({ day: 1 });

    return res.json({ success: true, data });
  } catch (error) {
    return res.status(200).json({ message: "Server Error", success: false })
  }
};
export const updateTimeSlot = async (req, res) => {
  try {
    const { startTime, endTime,slotId } = req.body;
    const doc = await TimeSlot.findOne({ "slots._id": slotId });
    if (!doc) return res.status(404).json({ success: false });
    const slot = doc.slots.id(slotId);
    slot.startTime = startTime;
    slot.endTime = endTime;

    await doc.save();

    return res.json({ success: true, message: "Slot updated" });
  } catch (error) {
    console.log(error)
    return res.status(200).json({ message: "Server Error", success: false })
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
    return res.status(200).json({ message: "Server Error", success: false })
  }
};

export {
  doctorDashboard, getPatientHistory, getOccupiedSlots, getDoctorPatientReport, getPatientPending, sendReminder,
  saveDoctorStaff, deleteStaffData, doctorStaff,
  doctorStaffAction, doctorStaffData, saveEmpAccess, saveEmpEmployement, deleteSubEmpProffesional, saveEmpProfessional
}