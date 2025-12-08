import Doctor from "../models/Doctor/doctor.model.js";
import DoctorAppointment from "../models/DoctorAppointment.js";
import LabAppointment from "../models/LabAppointment.js";
import Laboratory from "../models/Laboratory/laboratory.model.js";
import Test from "../models/Laboratory/test.model.js";
import LabTest from "../models/LabTest.js";
import Patient from "../models/Patient/patient.model.js";
import Prescriptions from "../models/Prescriptions.js";
import Rating from "../models/Rating.js";
import TestReport from "../models/testReport.js";

const bookDoctorAppointment = async (req, res) => {
    const { patientId, doctorId, date, fees } = req.body;
    try {
        const isExist = await Doctor.findById(doctorId);
        if (!isExist) return res.status(200).json({ message: 'Doctor not exist' });

        const isPatient = await Patient.findById(patientId);
        if (!isPatient) return res.status(200).json({ message: 'Patient not exist' });
        const isLast=await DoctorAppointment.findOne().sort({createdAt:-1})
        const nextId = isLast
            ? String(Number(isLast.customId) + 1).padStart(4, '0')
            : '0001';

        const book = await DoctorAppointment.create({ patientId, doctorId, date, fees,customId:nextId })
        if (book) {
            return res.status(200).json({ message: "Appointment book successfully", success: true })
        } else {
            return res.status(200).json({ message: "Appointment not booked", success: false })
        }
    } catch (err) {
        return res.status(200).json({ message: 'Server Error' });
    }
}
const getDoctorAppointment = async (req, res) => {
    const doctorId = req.params.id;
    const { page, limit, status = '' } = req.query
    try {
        let filter = { doctorId }
        if (status !== '') {
            filter.status = status
        }
        const isExist = await Doctor.findById(doctorId);
        if (!isExist) return res.status(200).json({ message: 'Doctor not exist' });
        const appointment = await DoctorAppointment.find(filter).populate('prescriptionId').populate({ path: 'patientId', select: '-password' }).sort({ createdAt: -1 })
            .skip((page - 1) * 10)
            .limit(limit)
        if (appointment) {
            return res.status(200).json({ message: "Appointment fetch successfully", data: appointment, success: true })
        } else {
            return res.status(200).json({ message: "Appointment not fount", success: false })
        }
    } catch (err) {
        return res.status(200).json({ message: 'Server Error' });
    }
}
const actionDoctorAppointment = async (req, res) => {
    const { doctorId, appointmentId, status, note } = req.body;
    try {
        const isExist = await Doctor.findById(doctorId);
        if (!isExist) return res.status(200).json({ message: 'Doctor not exist' });

        const isPatient = await DoctorAppointment.findById(appointmentId);
        if (!isPatient) return res.status(200).json({ message: 'Appointment not exist' });

        const update = await DoctorAppointment.findByIdAndUpdate(appointmentId, { status, note }, { new: true })
        if (update) {
            return res.status(200).json({ message: "Appointment status updated", success: true })
        } else {
            return res.status(200).json({ message: "Appointment status not updated", success: false })
        }
    } catch (err) {
        return res.status(200).json({ message: 'Server Error' });
    }
}
const cancelDoctorAppointment = async (req, res) => {
    const { patientId, appointmentId, cancelMessage } = req.body;
    try {
        const isExist = await Doctor.findById(patientId);
        if (!isExist) return res.status(200).json({ message: 'Doctor not exist' });

        const isPatient = await DoctorAppointment.findById(appointmentId);
        if (!isPatient) return res.status(200).json({ message: 'Appointment not exist' });

        const update = await DoctorAppointment.findByIdAndUpdate(appointmentId, { status: 'cancel', cancelMessage }, { new: true })
        if (update) {
            return res.status(200).json({ message: "Appointment cancel successfully", success: true })
        } else {
            return res.status(200).json({ message: "Appointment not cancel", success: false })
        }
    } catch (err) {
        return res.status(200).json({ message: 'Server Error' });
    }
}

const doctorPrescription = async (req, res) => {
    const { patientId, doctorId, medications, diagnosis, status, notes, appointmentId } = req.body;
    try {
        const isExist = await Doctor.findById(doctorId);
        if (!isExist) return res.status(200).json({ message: 'Doctor not exist' });

        const isPatient = await Patient.findById(patientId);
        if (!isPatient) return res.status(200).json({ message: 'Patient not exist' });

        const isAppointment = await DoctorAppointment.findById(appointmentId);
        if (!isAppointment) return res.status(200).json({ message: 'Appointment not exist' });

        const add = await Prescriptions.create({ patientId, doctorId, medications, diagnosis, status, notes, appointmentId })
        if (add) {
            await DoctorAppointment.findByIdAndUpdate(isAppointment._id, { prescriptionId: add._id }, { new: true })
            return res.status(200).json({ message: "Presctiption add successfully", success: true })
        } else {
            return res.status(200).json({ message: "Presctiption not added", success: false })
        }
    } catch (err) {
        return res.status(200).json({ message: 'Server Error' });
    }
}
const editDoctorPrescription = async (req, res) => {
    const { patientId, doctorId, medications, diagnosis, status, notes, prescriptionId, appointmentId } = req.body;
    try {
        const isExist = await Doctor.findById(doctorId);
        if (!isExist) return res.status(200).json({ message: 'Doctor not exist' });

        const isPatient = await Patient.findById(patientId);
        if (!isPatient) return res.status(200).json({ message: 'Patient not exist' });

        const isAppointment = await DoctorAppointment.findById(appointmentId);
        if (!isAppointment) return res.status(200).json({ message: 'Appointment not exist' });

        const isPrescriptions = await Prescriptions.findById(prescriptionId);
        if (!isPrescriptions) return res.status(200).json({ message: 'Patient not exist' });

        const add = await Prescriptions.create({ patientId, doctorId, medications, diagnosis, status, notes, appointmentId })
        if (add) {
            return res.status(200).json({ message: "Presctiption update successfully", success: true })
        } else {
            return res.status(200).json({ message: "Presctiption not added", success: false })
        }
    } catch (err) {
        return res.status(200).json({ message: 'Server Error' });
    }
}
const doctorLabTest = async (req, res) => {
    const { patientId, doctorId, labId, testId, appointmentId } = req.body;
    try {
        const isExist = await Doctor.findById(doctorId);
        if (!isExist) return res.status(200).json({ message: 'Doctor not exist' });

        const isPatient = await Patient.findById(patientId);
        if (!isPatient) return res.status(200).json({ message: 'Patient not exist' });

        const isAppointment = await DoctorAppointment.findById(appointmentId);
        if (!isAppointment) return res.status(200).json({ message: 'Appointment not exist' });

        const isLab = await Laboratory.findById(labId);
        if (!isLab) return res.status(200).json({ message: 'Lab not exist' });

        const add = await LabTest.create({ patientId, doctorId, labId, testId, appointmentId })
        if (add) {
            return res.status(200).json({ message: "Lab Test add successfully", success: true })
        } else {
            return res.status(200).json({ message: "Lab Test not added", success: false })
        }
    } catch (err) {
        console.log(err)
        return res.status(200).json({ message: 'Server Error' });
    }
}
const getPatientAppointment = async (req, res) => {
    const patientId = req.params.id;
    const { page = 1, limit = 10 } = req.query
    try {
        const isExist = await Patient.findById(patientId);
        if (!isExist) return res.status(200).json({ message: 'Patient not exist' });
        const appointment = await DoctorAppointment.find({ patientId }).populate('prescriptionId').populate({ path: 'doctorId', select: '-password' }).sort({ createdAt: -1 })
            .skip((page - 1) * 10)
            .limit(limit)
        if (appointment) {
            return res.status(200).json({ message: "Appointment fetch successfully", data: appointment, success: true })
        } else {
            return res.status(200).json({ message: "Appointment not fount", success: false })
        }
    } catch (err) {
        console.log(err)
        return res.status(200).json({ message: 'Server Error' });
    }
}
const getPatientLabAppointment = async (req, res) => {
    const patientId = req.params.id;
    const { page = 1, limit = 10 } = req.query
    try {
        const isExist = await Patient.findById(patientId);
        if (!isExist) return res.status(200).json({ message: 'Patient not exist' });
        const appointment = await LabAppointment.find({ patientId }).populate('doctorId').sort({ createdAt: -1 })
            .skip((page - 1) * 10)
            .limit(limit)
        if (appointment) {
            return res.status(200).json({ message: "Appointment fetch successfully", data: appointment, success: true })
        } else {
            return res.status(200).json({ message: "Appointment not fount", success: false })
        }
    } catch (err) {
        return res.status(200).json({ message: 'Server Error' });
    }
}
const giveRating = async (req, res) => {
    const { patientId, doctorId, message, star, labId } = req.body;
    try {
        if (doctorId) {
            const isExist = await Doctor.findById(doctorId);
            if (!isExist) return res.status(200).json({ message: 'Doctor not exist' });
        } else {
            const isExist = await Laboratory.findById(labId);
            if (!isExist) return res.status(200).json({ message: 'Lab not exist' });
        }
        const isPatient = await Patient.findById(patientId);
        if (!isPatient) return res.status(200).json({ message: 'Patient not exist' });
        const add = await Rating.create({ patientId, doctorId, message, star, labId })
        if (add) {
            return res.status(200).json({ message: "Rating add successfully", success: true })
        } else {
            return res.status(200).json({ message: "Rating not added", success: false })
        }
    } catch (err) {
        console.log(err)
        return res.status(200).json({ message: 'Server Error' });
    }
}
const getLabAppointment = async (req, res) => {
    const labId = req.params.id;
    const {
        page = 1,
        limit = 10,
        status,
        paymentStatus,
        dateFrom,
        dateTo,
        test,
        patientName
    } = req.query;

    try {
        const filter = { labId };

        // STATUS FILTER
        if (status) {
            filter.status = status;
        }

        // PAYMENT STATUS FILTER
        if (paymentStatus) {
            filter.paymentStatus = paymentStatus;
        }

        // TEST FILTER
        if (test) {
            filter.testId = { $in: [test] };
        }

        // DATE RANGE FILTER
        if (dateFrom || dateTo) {
            filter.date = {};
            if (dateFrom) filter.date.$gte = new Date(dateFrom);
            if (dateTo) filter.date.$lte = new Date(dateTo);
        }

        // PATIENT NAME FILTER (requires lookup after populate)
        let appointmentQuery = LabAppointment.find(filter)
            .populate({ path: 'testId', select: 'shortName' })
            .populate({ path: 'patientId', select: '-password' })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        let appointment = await appointmentQuery;

        // Filter by patient name AFTER populate
        if (patientName) {
            appointment = appointment.filter(item =>
                item.patientId?.fullName?.toLowerCase().includes(patientName.toLowerCase())
            );
        }

        const totalAppointment = await LabAppointment.countDocuments(filter);

        return res.status(200).json({
            message: "Appointments fetched successfully",
            data: appointment,
            success: true,
            totalPages: Math.ceil(totalAppointment / limit)
        });

    } catch (err) {
        console.log(err);
        return res.status(200).json({ message: 'Server Error' });
    }
};

const getLabAppointmentData = async (req, res) => {
    const appointmentId = req.params.id;
    try {
        let isExist;
        if(appointmentId<24){
            isExist = await LabAppointment.findOne({customId:appointmentId}).populate({ path: 'testId', select: 'shortName price' })
            .populate({ path: 'patientId', select: 'name contactNumber gender customId' }).lean();
        }else{

            isExist = await LabAppointment.findById(appointmentId).populate({ path: 'testId', select: 'shortName price' })
            .populate({ path: 'patientId', select: 'name contactNumber gender customId' }).lean();
        }
        if (!isExist) return res.status(200).json({ message: 'Appointment not exist' });
        return res.status(200).json({ message: "Appointment fetch successfully", data: isExist, success: true })
    } catch (err) {
        console.log(err)
        return res.status(200).json({ message: 'Server Error' });
    }
}
const labDashboardData = async (req, res) => {
    const labId = req.params.id;
    try {
        const isExist = await Laboratory.findById(labId);
        if (!isExist) return res.status(200).json({ message: 'Lab not exist' });
        const pendingTestRequest = await LabAppointment.countDocuments({ labId, status: 'pending' })
        const deliverRequest = await LabAppointment.countDocuments({ labId, status: 'deliver-report' })
        const pendingReport = await LabAppointment.countDocuments({ labId, status: 'pending-report' })
        const totalTest = await Test.countDocuments({ labId })
        const totalTestRequest = await LabAppointment.countDocuments({ labId })
        const testRequests = { totalTestRequest }
        const labReports = { pendingReport, deliverRequest, pendingTestRequest }
        return res.status(200).json({
            message: "Dashboard data fetch successfully", labReports, testRequests, totalTest
            , success: true
        })

    } catch (err) {
        console.log(err)
        return res.status(200).json({ message: 'Server Error' });
    }
}

const bookLabAppointment = async (req, res) => {
    const { patientId, labId, testId, date, fees,status } = req.body;
    try {
        const isExist = await Laboratory.findById(labId);
        if (!isExist) return res.status(200).json({ message: 'Laboratory not exist' });

        const isPatient = await Patient.findById(patientId);
        if (!isPatient) return res.status(200).json({ message: 'Patient not exist' });
        const isLast =await LabAppointment?.findOne()?.sort({createdAt:-1})
        const nextId = isLast
            ? String(Number(isLast.customId) + 1).padStart(4, '0')
            : '0001';
        const book = await LabAppointment.create({ patientId, labId, testId, date, fees, customId: nextId,status })
        if (book) {
            return res.status(200).json({ message: "Appointment book successfully", success: true })
        } else {
            return res.status(200).json({ message: "Appointment not booked", success: false })
        }
    } catch (err) {
        console.log(err)
        return res.status(200).json({ message: 'Server Error' });
    }
}

const actionLabAppointment = async (req, res) => {
    const { labId, appointmentId, status, note, type, paymentStatus } = req.body;
    try {
        const isExist = await Laboratory.findById(labId);
        if (!isExist) return res.status(200).json({ message: 'Lab not exist' });

        const isPatient = await LabAppointment.findById(appointmentId);
        if (!isPatient) return res.status(200).json({ message: 'Appointment not exist' });
        if (type == 'payment') {
            const update = await LabAppointment.findByIdAndUpdate(appointmentId, { paymentStatus, note }, { new: true })
            if (update) {
                return res.status(200).json({ message: "Appointment status updated", success: true })
            } else {
                return res.status(200).json({ message: "Appointment status not updated", success: false })
            }
        } else {


            const update = await LabAppointment.findByIdAndUpdate(appointmentId, { status, note }, { new: true })
            if (update) {
                return res.status(200).json({ message: "Appointment status updated", success: true })
            } else {
                return res.status(200).json({ message: "Appointment status not updated", success: false })
            }
        }
    } catch (err) {
        return res.status(200).json({ message: 'Server Error' });
    }
}
const getLabReport = async (req, res) => {
    const patientId = req.params.id;
    const { page = 1, limit = 10 } = req.query
    try {
        let isExist;
        if(patientId<24){
         isExist = await Patient.findOne({customId:patientId});

        }else{
             isExist = await Patient.findById(patientId);
        }
        if (!isExist) return res.status(200).json({ message: 'Patient not exist' });
        const appointment = await TestReport.find({ patientId:isExist?._id }).populate('appointmentId').populate({ path: 'labId', select: 'name customId ' })
            .populate({ path: 'testId', select: 'shortName customId' }).sort({ createdAt: -1 })
            .skip((page - 1) * 10)
            .limit(limit)
        if (appointment) {
            return res.status(200).json({ message: "Report fetch successfully", data: appointment, success: true })
        } else {
            return res.status(200).json({ message: "Report not fount", success: false })
        }
    } catch (err) {
        console.log(err)
        return res.status(200).json({ message: 'Server Error' });
    }
}
export {
    bookDoctorAppointment, actionDoctorAppointment, cancelDoctorAppointment, getLabAppointmentData,
    doctorLabTest, doctorPrescription, editDoctorPrescription, getDoctorAppointment, labDashboardData,
    getPatientAppointment, giveRating, getPatientLabAppointment, getLabAppointment, bookLabAppointment, actionLabAppointment,
    getLabReport
}