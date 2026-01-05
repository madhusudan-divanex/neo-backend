import mongoose from "mongoose"
import Doctor from "../../models/Doctor/doctor.model.js"
import DoctorAppointment from "../../models/DoctorAppointment.js"
import User from "../../models/Hospital/User.js"
import Patient from "../../models/Patient/patient.model.js"
import PatientDemographic from "../../models/Patient/demographic.model.js"

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
    const patientIds = await DoctorAppointment.distinct('patientId', { doctorId });

    // Pagination on patient IDs
    const paginatedIds = patientIds.slice(skip, skip + limit);

    // Fetch patient data
    const ptData = await Promise.all(
      paginatedIds.map(async (id) => {
        const patient=await Patient.findOne({ userId: id }).populate({path:'userId',select:'unique_id'}).lean()
        const patientDemographic=await PatientDemographic.findOne({ userId: id }).select('dob').lean()
        return {...patient,patientDemographic};
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

 


export { doctorDashboard, getPatientHistory }