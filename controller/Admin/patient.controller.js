import Patient from "../../models/Patient/patient.model.js";
import User from "../../models/Hospital/User.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import PatientKyc from '../../models/Patient/kyc.model.js';
import fs from 'fs'
import PatientDemographic from '../../models/Patient/demographic.model.js';
import MedicalHistory from '../../models/Patient/medicalHistory.model.js';
import EditRequest from '../../models/EditRequest.js';
import LabAppointment from '../../models/LabAppointment.js';
import PatientPrescriptions from '../../models/Patient/prescription.model.js';
import DoctorAppointment from '../../models/DoctorAppointment.js';
import StaffEmployement from "../../models/Staff/StaffEmployement.js";


export const getPatients = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const search = req.query.search || "";
    const gender = req.query.gender || "";
    const status = req.query.status || "";

    const query = {};

    if (gender) query.gender = gender;
    if (status) query.status = status;

    // search name / phone / email
    if (search) {
      const users = await User.find({
        $or: [
          { name: new RegExp(search, "i") },
          { email: new RegExp(search, "i") },
          { contactNumber: new RegExp(search, "i") }
        ]
      }).select("_id");

      query.userId = { $in: users.map(u => u._id) };
    }

    const patients = await Patient.find(query)
      .populate("userId", "name email contactNumber nh12")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Patient.countDocuments(query);

    res.json({
      success: true,
      data: patients,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const getPatientDetail = async (req, res) => {
  try {
    const userId = req.params.id;

    const isObjectId = userId?.length === 24;

    const user = await User
      .findOne(isObjectId ? { _id: userId } : { unique_id: userId })
      .select('-passwordHash')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const fullId = user._id;

    // ✅ FIX: variable name = patient (NOT Patient)
    const [
      patient,
      kyc,
      medicalHistory,
      demographic,
      prescription,
      isRequest,
      allowEdit,
      doctorAppointmentsCount,
      labAppointmentsCount
    ] = await Promise.all([
      Patient.findOne({ userId: fullId }).lean(),
      PatientKyc.findOne({ userId: fullId }).sort({ createdAt: -1 }).lean(),
      MedicalHistory.findOne({ userId: fullId }).sort({ createdAt: -1 }).lean(),
      PatientDemographic.findOne({ userId: fullId }).sort({ createdAt: -1 }).lean(),
      PatientPrescriptions.findOne({ userId: fullId }).sort({ createdAt: -1 }).lean(),
      EditRequest.findOne({ patientId: fullId }),
      EditRequest.exists({ patientId: fullId, status: 'approved' }).then(Boolean),
      DoctorAppointment.countDocuments({ patientId: fullId }),
      LabAppointment.countDocuments({ patientId: fullId })
    ]);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found"
      });
    }

    const notAllowed =
      patient.status !== 'approved' &&
      (doctorAppointmentsCount + labAppointmentsCount) > 5;

    return res.status(200).json({
      success: true,
      user: patient,
      customId: user.unique_id,
      role: user.role,
      kyc,
      demographic,
      prescription,
      medicalHistory,
      isRequest,
      allowEdit,
      notAllowed
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};



export const deletePatient = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    // 1️⃣ Find user
    const user = await User.findById(id).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // 2️⃣ Delete Patient core record
    await Patient.deleteOne({ userId: user._id }, { session });

    // 3️⃣ Fetch related docs (for file cleanup)
    const [kyc, prescription] = await Promise.all([
      PatientKyc.findOne({ userId: user._id }).session(session),
      PatientPrescriptions.findOne({ userId: user._id }).session(session),
    ]);

    // 4️⃣ Delete related collections
    await Promise.all([
      PatientKyc.deleteMany({ userId: user._id }, { session }),
      PatientDemographic.deleteMany({ userId: user._id }, { session }),
      MedicalHistory.deleteMany({ userId: user._id }, { session }),
      PatientPrescriptions.deleteMany({ userId: user._id }, { session }),
      DoctorAppointment.deleteMany({ patientId: user._id }, { session }),
      LabAppointment.deleteMany({ patientId: user._id }, { session }),
      EditRequest.deleteMany({ patientId: user._id }, { session }),
    ]);

    // 5️⃣ Delete user
    await User.deleteOne({ _id: user._id }, { session });

    await session.commitTransaction();
    session.endSession();

    // 6️⃣ File cleanup (outside transaction)
    if (kyc?.documentPath) {
      safeUnlink(kyc.documentPath);
    }

    if (prescription?.files?.length) {
      prescription.files.forEach(file => safeUnlink(file));
    }

    return res.json({
      success: true,
      message: "Patient and all related data deleted successfully",
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



export const getHospitalPastAppointment = async (req, res) => {
    const patientId = req.params.patientId;
    const hospitalId = req.params.hospitalId;
    const { page = 1, limit = 10 } = req.query
    try {
        let isExist;
        if (patientId?.length < 24) {
            isExist = await User.findOne({ unique_id: patientId });
        } else {
            isExist = await User.findById(patientId);
        }
        if (!isExist) return res.status(200).json({ message: 'Patient not exist', success: false });
        const isHospital = await User.findById(hospitalId);
        if (!isHospital) {
            return res.status(200).json({ message: 'Hospital not exist', success: false });
        }
        const doctorAdd = await StaffEmployement.find({organizationId: hospitalId })
        const doctorIds = doctorAdd.map(item => item.userId)
        const appointments = await DoctorAppointment.find({ patientId, doctorId: { $in: doctorIds } }).populate('prescriptionId')
            .populate({
                path: 'doctorId',
                select: 'name unique_id',
                populate: { path: 'doctorId', select: 'profileImage' }
            }).populate({
                path: 'labTest.lab',
                model: 'User',
                populate: { path: 'labId', select: 'logo' }
            })
            .populate({
                path: 'labTest.labTests',
                model: 'Test'
            }).lean();

        const appointmentIds = appointments.map(a => a._id);

        const labAppointments = await LabAppointment.find({
            doctorAp: { $in: appointmentIds }
        }).lean();

        const labApptIds = labAppointments.map(l => l._id);

        const reports = await TestReport.find({
            appointmentId: { $in: labApptIds }
        }).lean();
        const reportMap = {};

        for (const report of reports) {
            const labApptId = report.appointmentId.toString();
            if (!reportMap[labApptId]) {
                reportMap[labApptId] = [];
            }
            reportMap[labApptId].push(report);
        }
        const labAppointmentMap = {};

        for (const labAppt of labAppointments) {
            const doctorApptId = labAppt.doctorAp.toString();

            labAppt.reports = reportMap[labAppt._id.toString()] || [];

            if (!labAppointmentMap[doctorApptId]) {
                labAppointmentMap[doctorApptId] = [];
            }
            labAppointmentMap[doctorApptId].push(labAppt);
        }
        const finalAppointments = appointments.map(appt => {
            const labAppts = labAppointmentMap[appt._id.toString()] || [];
            return {
                ...appt,
                labAppointment: labAppts.length > 0 ? labAppts[0] : null
            };
        });
        const totalDoctorApt = await DoctorAppointment.countDocuments({ patientId: isExist._id })
        if (appointments?.length > 0) {
            return res.status(200).json({
                message: "Appointment fetch successfully", totalDoctorApt,
                data: finalAppointments, totalPage: Math.ceil(totalDoctorApt / limit), success: true
            })
        } else {
            return res.status(200).json({ message: "Appointment not found", success: false })
        }
    } catch (err) {
        console.log(err)
        return res.status(200).json({ message: 'Server Error' });
    }
}


export const getPastPatientLabAppointment = async (req, res) => {
    const patientId = req.params.patientId;
    const labId = req.params.labId;
    const { page = 1, limit = 10 } = req.query
    try {
        let isExist;
        if (patientId?.length < 24) {
            isExist = await User.findOne({ unique_id: patientId });
        } else {
            isExist = await User.findById(patientId);
        }
        if (!isExist) return res.status(200).json({ message: 'Patient not exist', success: false });
        const appointments = await LabAppointment.find({ patientId: isExist._id, labId })
            .populate({
                path: 'testId',
                select: 'shortName'
            })
            .populate({
                path: 'labId',
                select: 'name email labId',
                populate: {
                    path: 'labId',
                    model: 'Laboratory',
                    select: 'logo name'
                }
            })
            .populate({ path: 'doctorId', select: 'name' })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .lean();
        const labIds = appointments.map(a => a.labId?._id).filter(Boolean);

        const labAddresses = await LabAddress.find({
            userId: { $in: labIds }
        }).populate('countryId stateId cityId', 'name')
            .lean();

        // Map bana lo fast access ke liye
        const addressMap = {};
        labAddresses.forEach(addr => {
            addressMap[addr.userId.toString()] = addr;
        });

        // appointment me address attach
        const finalData = appointments.map(app => ({
            ...app,
            labAddress: addressMap[app.labId?._id?.toString()] || null
        }));


        const total = await LabAppointment.countDocuments({ patientId: isExist._id })
        if (appointments.length > 0) {
            return res.status(200).json({ message: "Appointment fetch successfully", total, data: finalData, totalPage: Math.ceil(total / limit), success: true })
        } else {
            return res.status(200).json({ message: "Appointment not found", success: false })
        }
    } catch (err) {
        console.log(err)
        return res.status(200).json({ message: 'Server Error' });
    }
}





/* ── Patient Bed Allotments ─────────────────────────────────────── */
export const getPatientAllotments = async (req, res) => {
  try {
    const { id } = req.params;
    const BedAllotment = (await import("../../models/Hospital/BedAllotment.js")).default;
    const allotments = await BedAllotment.find({ patientId: id })
      .populate("doctorId",  "name unique_id profileImage")
      .populate("bedId",     "bedName pricePerDay")
      .populate("roomId",    "roomName")
      .populate("floorId",   "floorName")
      .populate("departmentId", "departmentName")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: allotments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── Patient Lab Reports ─────────────────────────────────────────── */
export const getPatientLabReports = async (req, res) => {
  try {
    const { id } = req.params;
    const TestReport = (await import("../../models/testReport.js")).default;
    const reports = await TestReport.find({ patientId: id })
      .populate("labId",         "name")
      .populate("testId",        "shortName name")
      .populate("appointmentId", "customId")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: reports });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
