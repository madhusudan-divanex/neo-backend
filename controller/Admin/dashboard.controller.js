import Doctor from '../../models/Doctor/doctor.model.js'
import DoctorLogin from '../../models/Doctor/login.model.js'
import Patient from '../../models/Patient/patient.model.js'
import DoctorAppointment from '../../models/DoctorAppointment.js'
import LabAppointment from '../../models/LabAppointment.js'
import Laboratory from '../../models/Laboratory/laboratory.model.js'
import Pharmacy from '../../models/Pharmacy/pharmacy.model.js'
import Hospital from '../../models/Hospital/HospitalBasic.js'

export const getAdminDashboard = async (req, res) => {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      return { month: d.toLocaleString('default', { month: 'short' }), start: d, end: new Date(d.getFullYear(), d.getMonth() + 1, 0) }
    })

    const [
      totalDoctors, totalPatients, totalLabs, totalPharmacies, totalHospitals,
      pendingDoctors, pendingLabs, pendingPharmacies, pendingHospitals,
      totalDoctorAppts, totalLabAppts,
      newDoctorsThisMonth, newPatientsThisMonth
    ] = await Promise.all([
      DoctorLogin.countDocuments(),
      Patient.countDocuments(),
      Laboratory.countDocuments(),
      Pharmacy.countDocuments(),
      Hospital.countDocuments(),
      DoctorLogin.countDocuments({ status: 'pending' }),
      Laboratory.countDocuments({ status: 'pending' }),
      Pharmacy.countDocuments({ status: 'pending' }),
      Hospital.countDocuments({ status: 'pending' }),
      DoctorAppointment.countDocuments(),
      LabAppointment.countDocuments(),
      DoctorLogin.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Patient.countDocuments({ createdAt: { $gte: startOfMonth } }),
    ])

    // Monthly appointment chart data (last 6 months)
    const monthlyAppointments = await Promise.all(last6Months.map(async m => {
      const [doc, lab] = await Promise.all([
        DoctorAppointment.countDocuments({ createdAt: { $gte: m.start, $lte: m.end } }),
        LabAppointment.countDocuments({ createdAt: { $gte: m.start, $lte: m.end } })
      ])
      return { month: m.month, doctorAppointments: doc, labAppointments: lab }
    }))

    // Doctor gender distribution
    const genderStats = await DoctorLogin.aggregate([
      { $lookup: { from: 'doctors', localField: '_id', foreignField: 'userId', as: 'profile' } },
      { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$profile.gender', count: { $sum: 1 } } }
    ])

    // Recent registrations
    const recentDoctors = await DoctorLogin.find().sort({ createdAt: -1 }).limit(5).select('name email status createdAt')
    const recentPatients = await Patient.find().sort({ createdAt: -1 }).limit(5).select('name email contactNumber createdAt')

    // Appointment status breakdown
    const apptStatus = await DoctorAppointment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])

    res.json({
      success: true,
      data: {
        counts: { totalDoctors, totalPatients, totalLabs, totalPharmacies, totalHospitals, totalDoctorAppts, totalLabAppts },
        pending: { doctors: pendingDoctors, labs: pendingLabs, pharmacies: pendingPharmacies, hospitals: pendingHospitals },
        thisMonth: { newDoctors: newDoctorsThisMonth, newPatients: newPatientsThisMonth },
        monthlyAppointments,
        genderStats,
        apptStatus,
        recentDoctors,
        recentPatients
      }
    })
  } catch (err) {
    console.error('Dashboard error:', err)
    res.status(500).json({ success: false, message: err.message })
  }
}
