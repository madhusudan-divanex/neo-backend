import Doctor from '../../models/Doctor/doctor.model.js'
import Login from '../../models/login.js'
import Patient from '../../models/Patient/patient.model.js'
import DoctorAppointment from '../../models/DoctorAppointment.js'
import LabAppointment from '../../models/LabAppointment.js'
import Laboratory from '../../models/Laboratory/laboratory.model.js'
import Pharmacy from '../../models/Pharmacy/pharmacy.model.js'
import Hospital from '../../models/Hospital/HospitalBasic.js'
import HospitalBasic from '../../models/Hospital/HospitalBasic.js'

export const getAdminDashboard = async (req, res) => {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      return { month: d.toLocaleString('default', { month: 'short' }), start: d, end: new Date(d.getFullYear(), d.getMonth() + 1, 0) }
    })

    // const [
    //   totalDoctors, totalPatients, totalLabs, totalPharmacies, totalHospitals,
    //   pendingDoctors, pendingLabs, pendingPharmacies, pendingHospitals,
    //   totalDoctorAppts, totalLabAppts,
    //   newDoctorsThisMonth, newPatientsThisMonth
    // ] = await Promise.all([
    //   Doctor.countDocuments(),
    //   Patient.countDocuments(),
    //   Laboratory.countDocuments(),
    //   Pharmacy.countDocuments(),
    //   HospitalBasic.countDocuments(),
    //   Doctor.countDocuments({ status: 'pending' }),
    //   Laboratory.countDocuments({ status: 'pending' }),
    //   Pharmacy.countDocuments({ status: 'pending' }),
    //   HospitalBasic.countDocuments({ status: 'pending' }),
    //   DoctorAppointment.countDocuments(),
    //   LabAppointment.countDocuments(),
    //   Doctor.countDocuments({ createdAt: { $gte: startOfMonth } }),
    //   Patient.countDocuments({ createdAt: { $gte: startOfMonth } }),
    // ])
    const [
      doctors,
      patients,
      labs,
      pharmacies,
      hospitals,
      labAppointments,
      doctorAppointments,
      doctorRequests
    ] = await Promise.all([

      getGrowthStats(Doctor),

      getGrowthStats(Patient),

      getGrowthStats(Laboratory),

      getGrowthStats(Pharmacy),

      getGrowthStats(HospitalBasic),

      getGrowthStats(LabAppointment),

      getGrowthStats(DoctorAppointment),

      getGrowthStats(Doctor, { status: 'pending' })

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
    const genderStats = await Doctor.aggregate([
      {
        $lookup: {
          from: 'doctors',
          localField: '_id', // User me stored doctorId
          foreignField: '_id',
          as: 'doctor'
        }
      },
      {
        $unwind: {
          path: '$doctor',
          preserveNullAndEmptyArrays: true
        }
      },

      // Group by gender
      {
        $group: {
          _id: '$doctor.gender',
          count: { $sum: 1 }
        }
      }
    ])

    // Recent registrations
    const recentDoctors = await Doctor.find().sort({ createdAt: -1 }).limit(5).select('name email status createdAt')
    const recentPatients = await Patient.find().sort({ createdAt: -1 }).limit(5).select('name email contactNumber createdAt')

    // Appointment status breakdown
    const apptStatus = await DoctorAppointment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])

    const top5Doctors = await DoctorAppointment.aggregate([
      { $group: { _id: '$doctorId', count: { $sum: 1 } } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'doctors',
          localField: '_id',
          foreignField: 'userId',
          as: 'doctor'
        }
      },
      { $unwind: '$doctor' },
      { $project: { _id: 1, count: 1, name: '$user.name', nh12: '$user.nh12', doctorImage: '$doctor.profileImage' } }
    ])
    const recentDoctorAppts = await DoctorAppointment.find().sort({ createdAt: -1 }).limit(6)



    res.json({
      success: true,
      data: {
        doctors,
        patients,
        labs,
        pharmacies,
        hospitals,
        labAppointments,
        doctorAppointments,
        doctorRequests,

        // counts: { totalDoctors, totalPatients, totalLabs, totalPharmacies, totalHospitals, totalDoctorAppts, totalLabAppts },
        // pending: { doctors: pendingDoctors, labs: pendingLabs, pharmacies: pendingPharmacies, hospitals: pendingHospitals },
        // thisMonth: { newDoctors: newDoctorsThisMonth, newPatients: newPatientsThisMonth },
        monthlyAppointments,
        genderStats, recentDoctorAppts,
        apptStatus, top5Doctors,
        recentDoctors,
        recentPatients
      }
    })
  } catch (err) {
    console.error('Dashboard error:', err)
    res.status(500).json({ success: false, message: err.message })
  }
}
const now = new Date()

// Current Month
const startOfCurrentMonth = new Date(
  now.getFullYear(),
  now.getMonth(),
  1
)

// Previous Month
const startOfPreviousMonth = new Date(
  now.getFullYear(),
  now.getMonth() - 1,
  1
)

const endOfPreviousMonth = new Date(
  now.getFullYear(),
  now.getMonth(),
  0,
  23, 59, 59
)

// Last 6 Months
const last6Months = Array.from({ length: 6 }, (_, i) => {
  const d = new Date(
    now.getFullYear(),
    now.getMonth() - (5 - i),
    1
  )

  return {
    month: d.toLocaleString('default', { month: 'short' }),
    start: d,
    end: new Date(d.getFullYear(), d.getMonth() + 1, 0)
  }
})

const getGrowthStats = async (Model, filter = {}) => {

  const total = await Model.countDocuments(filter)

  const currentMonth = await Model.countDocuments({
    ...filter,
    createdAt: {
      $gte: startOfCurrentMonth
    }
  })

  const previousMonth = await Model.countDocuments({
    ...filter,
    createdAt: {
      $gte: startOfPreviousMonth,
      $lte: endOfPreviousMonth
    }
  })

  const percentage =
    previousMonth === 0
      ? 100
      : (
        (currentMonth - previousMonth) /
        previousMonth
      ) * 100

  return {
    total,
    currentMonth,
    previousMonth,
    percentage: percentage.toFixed(2),
    trend: percentage >= 0 ? 'increase' : 'decrease'
  }
}