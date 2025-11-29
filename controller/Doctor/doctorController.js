import Doctor from "../../models/Doctor/doctor.model"
import DoctorAppointment from "../../models/DoctorAppointment"

const doctorDashboard = async (req, res) => {
    const id = req.params.id
    try {
        const isExist = await Doctor.findById(id)
        if (!isExist) {
            return res.status(200).json({ message: "Doctor not exist", success: false })
        }
        const start = new Date();
        start.setHours(0, 0, 0, 0);  

        const end = new Date();
        end.setHours(23, 59, 59, 999);
        const pendingRequest = await DoctorAppointment.countDocuments({ doctorId: id, status: 'pending' })
        const completeAppointment = await DoctorAppointment.countDocuments({ doctorId: id, status: 'completed' })
        const cancelAppointment = await DoctorAppointment.countDocuments({ doctorId: id, status: 'reject' })
        const totalAppointment = await DoctorAppointment.countDocuments({ doctorId: id })
        const todayAppointment = await DoctorAppointment.countDocuments({ doctorId: id, createdAt:{ $gte: start, $lte: end }})
        return res.status(200).json({success:true,pendingRequest,completeAppointment,todayAppointment,cancelAppointment,totalAppointment})
    } catch (error) {
        return res.status(500).json({ message: "Internal server errror" })
    }
}