import DoctorAbout from "../models/Doctor/addressAbout.model.js";
import Doctor from "../models/Doctor/doctor.model.js";
import DoctorAppointment from "../models/DoctorAppointment.js";
import HospitalBasic from "../models/Hospital/HospitalBasic.js";
import User from "../models/Hospital/User.js";
import LabAppointment from "../models/LabAppointment.js";
import LabAddress from "../models/Laboratory/labAddress.model.js";
import Laboratory from "../models/Laboratory/laboratory.model.js";
import Test from "../models/Laboratory/test.model.js";
import LabTest from "../models/LabTest.js";
import PatientDemographic from "../models/Patient/demographic.model.js";
import Patient from "../models/Patient/patient.model.js";
import Prescriptions from "../models/Prescriptions.js";
import Rating from "../models/Rating.js";
import TestReport from "../models/testReport.js";

const bookDoctorAppointment = async (req, res) => {
    const { patientId, doctorId, date, fees } = req.body;
    try {
        const isExist = await User.findOne({ role: 'doctor', _id: doctorId });
        if (!isExist) return res.status(200).json({ message: 'Doctor not exist' });

        const isPatient = await User.findOne({ role: 'patient', _id: patientId });
        if (!isPatient) return res.status(200).json({ message: 'Patient not exist' });
     
        const book = await DoctorAppointment.create({ patientId, doctorId, date, fees,  })
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
const updateDoctorAppointment = async (req, res) => {
    const { patientId, doctorId, date, fees, labTest, appointmentId } = req.body;
    try {
        const isExist = await User.findOne({ role: 'doctor', _id: doctorId });
        if (!isExist) return res.status(200).json({ message: 'Doctor not exist' });

        const isPatient = await User.findOne({ role: 'patient', _id: patientId });
        if (!isPatient) return res.status(200).json({ message: 'Patient not exist' });
        const isLast = await DoctorAppointment.findOne().sort({ createdAt: -1 });
        const nextId = isLast
            ? String(Number(isLast.customId.slice(3)) + 1).padStart(4, "0")
            : "0001";

        const book = await DoctorAppointment.findByIdAndUpdate(appointmentId, { patientId, doctorId, date, fees, labTest }, { new: true })
        if (book) {
            return res.status(200).json({ message: "Appointment updated successfully", success: true })
        } else {
            return res.status(200).json({ message: "Appointment not found", success: false })
        }
    } catch (err) {
        return res.status(200).json({ message: 'Server Error' });
    }
}
const getDoctorAppointment = async (req, res) => {
    try {
        const doctorId = req.params.id;

        // Parse pagination params with defaults
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status || '';
        const statuses = req.query.statuses || ''
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;

        const skip = (page - 1) * limit;

        let filter = { doctorId };
        if (status) {
            filter.status = status;
        }
        if (statuses) {
            filter.status = { $in: statuses.split(',') };
        }
        const start = startDate && startDate !== 'null' ? new Date(startDate) : null;
        const end = endDate && endDate !== 'null' ? new Date(endDate) : null;

        if (start || end) {
            filter.date = {};
            if (start && !isNaN(start)) {
                filter.date.$gte = start;
            }
            if (end && !isNaN(end)) {
                end.setHours(23, 59, 59, 999); // include full day
                filter.date.$lte = end;
            }
        }



        // Check doctor exists
        const isExist = await User.findOne({ _id: doctorId, role: 'doctor' });
        if (!isExist) {
            return res.status(200).json({ message: 'Doctor not exist', success: false });
        }

        // Count total appointments
        const totalRecords = await DoctorAppointment.countDocuments(filter);

        // Fetch appointments with pagination
        const appointments = await DoctorAppointment.find(filter)
            .populate('prescriptionId')
            .populate({
                path: 'patientId',
                select: '-passwordHash',
                populate: {
                    path: 'patientId',
                    select: 'profileImage'
                }
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return res.status(200).json({
            success: true,
            message: 'Appointments fetched successfully',
            data: appointments,
            pagination: {
                totalRecords,
                totalPages: Math.ceil(totalRecords / limit),
                currentPage: page,
                limit
            }
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server Error', success: false });
    }
};

const actionDoctorAppointment = async (req, res) => {
    const { doctorId, appointmentId, status, note } = req.body;
    try {
        const isExist = await User.findOne({ _id: doctorId, role: 'doctor' });
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
        const isExist = await User.findById(patientId);
        if (!isExist) return res.status(200).json({ message: 'User not exist' });

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
const cancelLabAppointment = async (req, res) => {
    const { patientId, appointmentId, cancelMessage } = req.body;
    try {
        const isExist = await User.findById(patientId);
        if (!isExist) return res.status(200).json({ message: 'User not exist' });

        const isPatient = await LabAppointment.findById(appointmentId);
        if (!isPatient) return res.status(200).json({ message: 'Appointment not exist' });

        const update = await LabAppointment.findByIdAndUpdate(appointmentId, { status: 'cancel', cancelMessage }, { new: true })
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
    const { patientId, doctorId, medications, diagnosis, status, notes, appointmentId, labTest } = req.body;
    try {
        const isExist = await User.findOne({ role: 'doctor', _id: doctorId });
        if (!isExist) return res.status(200).json({ message: 'Doctor not exist' });

        const isPatient = await User.findOne({ role: 'patient', _id: patientId });
        if (!isPatient) return res.status(200).json({ message: 'Patient not exist' });

        const isAppointment = await DoctorAppointment.findById(appointmentId);
        if (!isAppointment) return res.status(200).json({ message: 'Appointment not exist' });
        const isLast = await Prescriptions.findOne().sort({ createdAt: -1 })
        const nextId = isLast
            ? String(Number(isLast.customId?.slice(3)) + 1).padStart(4, '0')
            : '0001';
        const add = await Prescriptions.create({ patientId, doctorId, medications, diagnosis, status, notes, appointmentId, customId: 'PRC' + nextId })
        if (add) {
            await DoctorAppointment.findByIdAndUpdate(isAppointment._id, { prescriptionId: add._id }, { new: true })
            return res.status(200).json({ message: "Presctiption add successfully", success: true })
        } else {
            return res.status(200).json({ message: "Presctiption not added", success: false })
        }
    } catch (err) {
        console.log(err)
        return res.status(200).json({ message: 'Server Error' });
    }
}
const getDoctorPrescriptiondata = async (req, res) => {
    const prescriptionId = req.params.id;
    try {
        let isExist;
        if (prescriptionId.length < 24) {
            isExist = await Prescriptions.findOne({ customId: prescriptionId }).populate({ path: 'doctorId', select: 'name unique_id',populate:{path:'doctorId',
                select:'profileImage'
            } }).populate({ path: 'patientId', select: 'name unique_id ' });
        } else {
            isExist = await Prescriptions.findById(prescriptionId).populate({ path: 'doctorId', select: 'name unique_id',populate:{path:'doctorId',
                select:'profileImage'
            } }).populate({ path: 'patientId', select: 'name unique_id ' });
        }
        if (!isExist) return res.status(200).json({ message: 'Prescription not exist' });

        return res.status(200).json({ message: "Presctiption data fetch successfully", data: isExist, success: true })

    } catch (err) {
        return res.status(200).json({ message: 'Server Error' });
    }
}
const deleteDoctorPrescription = async (req, res) => {
    const prescriptionId = req.params.id;
    try {
        let isExist;
        if (prescriptionId.length < 24) {
            isExist = await Prescriptions.findOneAndDelete({ customId: prescriptionId })
        } else {
            isExist = await Prescriptions.findByIdAndDelete(prescriptionId)
        }
        if (!isExist) return res.status(200).json({ message: 'Prescription not deleted' });
        await DoctorAppointment.findByIdAndUpdate(
            isExist.appointmentId,
            { $unset: { prescriptionId: "" } } // ya agar aap delete karna chahte ho: Appointment.findByIdAndDelete(...)
        );
        return res.status(200).json({ message: "Presctiption deleted", success: true })

    } catch (err) {
        return res.status(200).json({ message: 'Server Error' });
    }
}
const prescriptionAction = async (req, res) => {
    const { prescriptionId, status } = req.body;
    try {
        const isExist = await Prescriptions.findById(prescriptionId);
        if (!isExist) return res.status(200).json({ message: 'Prescription not exist' });


        const update = await Prescriptions.findByIdAndUpdate(prescriptionId, { status }, { new: true })
        if (update) {
            return res.status(200).json({ message: "Prescription updated successfully", success: true })
        } else {
            return res.status(200).json({ message: "Prescription not updated", success: false })
        }
    } catch (err) {
        return res.status(200).json({ message: 'Server Error' });
    }
}
const editDoctorPrescription = async (req, res) => {
    const { patientId, doctorId, medications, diagnosis, status, notes, prescriptionId, appointmentId, labTest } = req.body;
    try {
        const isExist = await User.findOne({ _id: doctorId, role: 'doctor' });
        if (!isExist) return res.status(200).json({ message: 'Doctor not exist' });

        const isPatient = await User.findOne({ _id: patientId, role: 'patient' });
        if (!isPatient) return res.status(200).json({ message: 'Patient not exist' });

        const isAppointment = await DoctorAppointment.findById(appointmentId);
        if (!isAppointment) return res.status(200).json({ message: 'Appointment not exist' });

        const isPrescriptions = await Prescriptions.findById(prescriptionId);
        if (!isPrescriptions) return res.status(200).json({ message: 'Patient not exist' });

        const add = await Prescriptions.findByIdAndUpdate(prescriptionId, { labTest, patientId, doctorId, medications, diagnosis, status, notes, appointmentId }, { new: true })
        if (add) {
            return res.status(200).json({ message: "Presctiption update successfully", success: true })
        } else {
            return res.status(200).json({ message: "Presctiption not added", success: false })
        }
    } catch (err) {
        console.log(err)
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
        let isExist;
        if (patientId?.length < 24) {
            isExist = await User.findOne({ unique_id: patientId });
        } else {
            isExist = await User.findById(patientId);
        }
        if (!isExist) return res.status(200).json({ message: 'Patient not exist', success: false });
        const appointments = await DoctorAppointment.find({ patientId }).populate('prescriptionId')
            .populate({
                path: 'doctorId', select: '-passwordHash', populate: {
                    path: 'doctorId',
                    model: 'Doctor',
                }
            }).sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .lean();
        const doctorIds = appointments.map(a => a.doctorId?._id).filter(Boolean);

        const doctorAddresses = await DoctorAbout.find({
            userId: { $in: doctorIds }
        }).populate('countryId stateId cityId', 'name').populate({path:'hospitalName',select:'hospitalName'})
            .lean();

        const addressMap = {};
        doctorAddresses.forEach(addr => {
            addressMap[addr.userId.toString()] = addr;
        });

        // appointment me address attach
        const finalData = appointments.map(app => ({
            ...app,
            doctorAddress: addressMap[app.doctorId?._id?.toString()] || null
        }));


        const totalDoctorApt = await DoctorAppointment.countDocuments({ patientId: isExist._id })
        const totalLabApt = await LabAppointment.countDocuments({ patientId: isExist._id })
        if (appointments?.length > 0) {
            return res.status(200).json({
                message: "Appointment fetch successfully", totalDoctorApt, totalLabApt,
                data: finalData, totalPage: Math.ceil(totalDoctorApt / limit), success: true
            })
        } else {
            return res.status(200).json({ message: "Appointment not found", success: false })
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
        let isExist;
        if (patientId?.length < 24) {
            isExist = await User.findOne({ unique_id: patientId });
        } else {
            isExist = await User.findById(patientId);
        }
        if (!isExist) return res.status(200).json({ message: 'Patient not exist', success: false });
        const appointments = await LabAppointment.find({ patientId: isExist._id })
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
const giveRating = async (req, res) => {
    const { patientId, doctorId, message, star, labId } = req.body;
    try {
        if (doctorId) {
            const isExist = await User.findById(doctorId);
            if (!isExist) return res.status(200).json({ message: 'Doctor not exist' });
        } else {
            const isExist = await User.findById(labId);
            if (!isExist) return res.status(200).json({ message: 'Lab not exist' });
        }
        const isPatient = await User.findById(patientId);
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
            .populate({ path: 'patientId', select: '-passwordHash', populate: { path: "patientId", select: 'profileImage' } })
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
        if (appointmentId.length < 24) {
            isExist = await LabAppointment.findOne({ customId: appointmentId }).populate({ path: 'testId', select: 'shortName price' })
                .populate({ path: 'patientId', select: '-passwordHash', populate: ({ path: 'patientId', select: 'name email contactNumber gender ' }) })
                .populate({ path: 'labId', select: '-passwordHash', populate: ({ path: 'labId', select: 'name logo gstNumber' }) }).lean()
                .populate({ path: 'doctorId', select: '-passwordHash' })
        } else {

            isExist = await LabAppointment.findById(appointmentId).populate({ path: 'testId', select: 'shortName price' })
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
const labDashboardData = async (req, res) => {
    const labId = req.params.id;
    try {
        const isExist = await User.findById(labId);
        if (!isExist) return res.status(200).json({ message: 'Lab not exist' });
        const pendingTestRequest = await LabAppointment.countDocuments({ labId: isExist._id, status: 'pending' })
        const deliverRequest = await LabAppointment.countDocuments({ labId: isExist._id, status: 'deliver-report' })
        const pendingReport = await LabAppointment.countDocuments({ labId: isExist._id, status: 'pending-report' })
        const totalTest = await Test.countDocuments({ labId: isExist._id })
        const totalTestRequest = await LabAppointment.countDocuments({ labId: isExist._id })
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
    const { patientId, labId, testId, date, fees, status, doctorId, doctorAp } = req.body;
    try {
        const isExist = await User.findById(labId);
        if (!isExist) return res.status(200).json({ message: 'Laboratory not exist' });

        const isPatient = await User.findById(patientId);
        if (!isPatient) return res.status(200).json({ message: 'Patient not exist' });
        const isLast = await LabAppointment?.findOne()?.sort({ createdAt: -1 })
        const nextId = isLast
            ? String(Number(isLast.customId) + 1).padStart(4, '0')
            : '0001';
        const book = await LabAppointment.create({ patientId, labId, testId, date, fees, customId: nextId, status, doctorAp, doctorId })
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
        const isExist = await User.findById(labId);
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
        if (patientId?.length < 24) {
            isExist = await User.findOne({ unique_id: patientId });

        } else {
            isExist = await User.findById(patientId);
        }
        if (!isExist) return res.status(200).json({ message: 'Patient not exist' });
        const appointment = await TestReport.find({ patientId: isExist?._id }).populate('appointmentId').populate({ path: 'labId', select: 'name customId ' })
            .populate({ path: 'testId' }).sort({ createdAt: -1 })
            .skip((page - 1) * 10)
            .limit(limit).lean()
        const totalData = await TestReport.countDocuments({ patientId: isExist?._id })

        if (appointment) {
            return res.status(200).json({
                message: "Report fetch successfully", data: appointment,
                pagination: {
                    totalData,
                    currentPage: page,
                    totalPage: Math.ceil(totalData / limit)
                },
                success: true
            })
        } else {
            return res.status(200).json({ message: "Report not found", success: false })
        }
    } catch (err) {
        console.log(err)
        return res.status(200).json({ message: 'Server Error' });
    }
}
const getNearByDoctor = async (req, res) => {
    const { page = 1, limit = 10 } = req.query
    try {
        const doctors = await User.find({ role: 'doctor' }).sort({ createdAt: -1 })
            .skip((page - 1) * 10)
            .limit(limit)

        const totalData = await User.countDocuments({ role: 'doctor' })

        return res.status(200).json({
            message: "Report fetch successfully", data: doctors,
            pagination: {
                totalData,
                currentPage: page,
                totalPage: Math.ceil(totalData / limit)
            },
            success: true
        })

    } catch (err) {
        console.log(err)
        return res.status(200).json({ message: 'Server Error' });
    }
}
const getDoctorAppointmentData = async (req, res) => {
    const appointmentId = req.params.id;
    try {
        let isExist;
        if (appointmentId.length < 24) {
            isExist = await DoctorAppointment.findOne({ customId: appointmentId })
                .populate({ path: 'patientId', select: '-passwordHash', populate: ({ path: 'patientId', select: 'name email contactNumber gender profileImage' }) })
                .populate({ path: 'doctorId', select: '-passwordHash', populate: ({ path: 'doctorId', select: 'name profileImage' }) }).lean()
                .populate({
                    path: 'labTest.lab',
                    select: 'name',
                })
                .populate({
                    path: 'labTest.labTests',
                    select: 'shortName price'
                })
                .populate('prescriptionId').lean();
        } else {

            isExist = await DoctorAppointment.findById(appointmentId)
                .populate({ path: 'patientId', select: '-passwordHash', populate: ({ path: 'patientId', select: 'name email contactNumber gender profileImage' }) })
                .populate({ path: 'doctorId', select: '-passwordHash', populate: ({ path: 'doctorId', select: 'name profileImage' }) }).lean()
                .populate({
                    path: 'labTest.lab',
                    select: 'name',
                })
                .populate({
                    path: 'labTest.labTests',
                    select: 'shortName price'
                })
                .populate('prescriptionId').lean();
        }
        const doctorAddress = await DoctorAbout.findOne({ userId: isExist?.doctorId?._id }).populate({path:'hospitalName',select:'hospitalName'}).populate('countryId stateId cityId', 'name')
        // const labReports = await TestReport.find({ appointmentId: isExist?._id }).populate('testId')
        if (!isExist) return res.status(200).json({ message: 'Appointment not exist' });
        return res.status(200).json({ message: "Appointment fetch successfully", data: isExist, doctorAddress, success: true })
    } catch (err) {
        console.log(err)
        return res.status(200).json({ message: 'Server Error' });
    }
}
const getDoctorPastAppointment = async (req, res) => {
    const patientId = req.params.patientId;
    const { page = 1, limit = 10 } = req.query
    try {
        let isExist;
        if (patientId?.length < 24) {
            isExist = await User.findOne({ unique_id: patientId });
        } else {
            isExist = await User.findById(patientId);
        }
        if (!isExist) return res.status(200).json({ message: 'Patient not exist', success: false });
        const appointments = await DoctorAppointment.find({ patientId }).populate('prescriptionId')
            .populate({
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
const getHospitalAppointment = async (req, res) => {
    try {
        const hospitalId = req.params.id;

        // Parse pagination params with defaults
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status || '';
        const statuses = req.query.statuses || ''
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;

        const skip = (page - 1) * limit;

        let filter = {  };
        if (status) {
            filter.status = status;
        }
        if (statuses) {
            filter.status = { $in: statuses.split(',') };
        }
        const start = startDate && startDate !== 'null' ? new Date(startDate) : null;
        const end = endDate && endDate !== 'null' ? new Date(endDate) : null;

        if (start || end) {
            filter.date = {};
            if (start && !isNaN(start)) {
                filter.date.$gte = start;
            }
            if (end && !isNaN(end)) {
                end.setHours(23, 59, 59, 999); // include full day
                filter.date.$lte = end;
            }
        }



        // Check doctor exists
        const isExist = await HospitalBasic.findById(hospitalId);
        if (!isExist) {
            return res.status(200).json({ message: 'Hospital not exist', success: false });
        }
        const doctorAdd=await DoctorAbout.find({hospitalName:hospitalId})
        const doctorIds=doctorAdd.map(item=>item.userId)
        filter.doctorId = { $in: doctorIds };

        // Count total appointments
        const totalRecords = await DoctorAppointment.countDocuments(filter);

        // Fetch appointments with pagination
        const appointments = await DoctorAppointment.find(filter)
            .populate('prescriptionId')
            .populate({
                path: 'patientId',
                select: '-passwordHash',
                populate: {
                    path: 'patientId',
                    select: 'profileImage'
                }
            })
            .populate({
                path: 'doctorId',
                select: '-passwordHash',
                populate: {
                    path: 'doctorId',
                    select: 'profileImage'
                }
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return res.status(200).json({
            success: true,
            message: 'Appointments fetched successfully',
            data: appointments,
            pagination: {
                totalRecords,
                totalPages: Math.ceil(totalRecords / limit),
                currentPage: page,
                limit
            }
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server Error', success: false });
    }
};
const getHospitalPastAppointment = async (req, res) => {
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
        const isHospital = await HospitalBasic.findById(hospitalId);
        if (!isHospital) {
            return res.status(200).json({ message: 'Hospital not exist', success: false });
        }
        const doctorAdd=await DoctorAbout.find({hospitalName:hospitalId})
        const doctorIds=doctorAdd.map(item=>item.userId)
        const appointments = await DoctorAppointment.find({ patientId,doctorId:{$in:doctorIds} }).populate('prescriptionId')
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
export {
    bookDoctorAppointment, actionDoctorAppointment, cancelDoctorAppointment, getLabAppointmentData,
    doctorLabTest, doctorPrescription, editDoctorPrescription, getDoctorAppointment, labDashboardData,
    getPatientAppointment, giveRating, getPatientLabAppointment, getLabAppointment, bookLabAppointment, actionLabAppointment,
    getLabReport, getDoctorPrescriptiondata, getNearByDoctor, cancelLabAppointment, getDoctorAppointmentData,
    getDoctorPastAppointment, deleteDoctorPrescription, prescriptionAction, updateDoctorAppointment,getHospitalAppointment,getHospitalPastAppointment
}