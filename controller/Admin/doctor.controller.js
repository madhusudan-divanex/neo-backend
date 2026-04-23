import User from "../../models/Hospital/User.js";
import Doctor from "../../models/Doctor/doctor.model.js";
import { sendPush } from "../../utils/sendPush.js";
import DoctorAppointment from "../../models/DoctorAppointment.js";
import DoctorAbout from "../../models/Doctor/addressAbout.model.js";
import DoctorKyc from '../../models/Doctor/kyc.model.js';
import MedicalLicense from '../../models/Doctor/medicalLicense.model.js';
import DoctorEduWork from '../../models/Doctor/eduWork.js';


export const getDoctorDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const doctor = await User.findById(id).lean();
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }
    const user = await User.findOne({ _id: id }).lean();

    let about = null;
    if (id) {
      about = await DoctorAbout.findOne({ userId: id }).populate('countryId stateId cityId specialty treatmentAreas', 'name isoCode').sort({ createdAt: -1 })
    }

    const kyc = await DoctorKyc.findOne({ userId: id }).sort({ createdAt: -1 })
    const medicalLicense = await MedicalLicense.findOne({ userId: id }).sort({ createdAt: -1 })
    const eduWork = await DoctorEduWork.findOne({ userId: id }).sort({ createdAt: -1 })






    //  Response
    return res.json({
      success: true,
      data: {
        ...doctor,
        email: user?.email || null,
        contactNumber: user?.contactNumber || null,
        user: user || null,
        about: about || null,
        kyc: kyc || null,
        medicalLicense: medicalLicense || null,
        eduWork: eduWork || null
      }
    });

  } catch (err) {
    console.error("getDoctorDetail error:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};



/**
 * GET DOCTORS (Server-side pagination + search)
 */
export const getDoctors = async (req, res) => {
  try {
    const { search = "", page = 1, status = "" } = req.query;
    const limit = 10;
    const skip = (page - 1) * limit;

    const matchQuery = {
      name: { $regex: search, $options: "i" }
    };
    if (status && status !== "all") matchQuery.status = status;

    const doctors = await Doctor.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: "users",               // users collection
          localField: "_id",
          foreignField: "doctorId",
          as: "user"
        }
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "doctor-abouts",               // users collection
          localField: "userId",
          foreignField: "userId",
          as: "about"
        }
      },
      { $unwind: { path: "$about", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "specialities", // 👈 collection name check kar lena
          localField: "about.specialty",
          foreignField: "_id",
          as: "specialty"
        }
      },
      { $unwind: { path: "$specialty", preserveNullAndEmptyArrays: true } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          name: 1,
          email: 1,
          contactNumber: 1,
          dob: 1,
          status: 1,
          profileImage: 1,
          createdAt: 1,
          "about.hospitalName": 1,
          "specialty.name": 1,
          "user._id": 1,
          "user.nh12": 1
        }
      }
    ]);

    const total = await Doctor.countDocuments(matchQuery);

    res.json({
      success: true,
      data: doctors,
      totalPages: Math.ceil(total / limit)
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * TOGGLE DOCTOR STATUS + PUSH
 */
export const toggleDoctorStatus = async (req, res) => {
  try {
    const { doctorId } = req.params; // 👈 this is USER ID

    // ✅ doctor ko USER ID se find karo
    const doctor = await Doctor.findOne({ _id: doctorId });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // 🔄 toggle status
    doctor.status = doctor.status === "approved" ? "pending" : "approved";
    await doctor.save();

    // 🔔 push only when approved
    if (doctor.status === "approved") {
      //   const user = await User.findById(id);

      //   if (user?.fcmToken) {
      //     await sendPush({
      //       token: user.fcmToken,
      //       title: "🎉 Doctor Approved",
      //       body: "Your profile has been approved by admin",
      //       data: {
      //         type: "doctor_approved",
      //         doctorId: doctor._id.toString()
      //       }
      //     });
      //   }
    }

    res.json({
      success: true,
      status: doctor.status
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/**
 * DELETE DOCTOR (both tables)
 */
export const deleteDoctor = async (req, res) => {
  const doctorId = req.params.id;

  await Doctor.findByIdAndDelete(doctorId);
  await User.findOneAndDelete({ doctorId });

  res.json({ success: true });
};





export const getDoctorAppointments = async (req, res) => {
  try {
    const { id } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const [appointments, total] = await Promise.all([
      DoctorAppointment.find({ doctorId: id })
        .populate("patientId", "name unique_id")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      DoctorAppointment.countDocuments({ doctorId: id })
    ]);

    res.json({
      success: true,
      data: appointments,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};




export const approveRejectDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body; // status: "approved" | "rejected"
    const doctor = await Doctor.findById(id);
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found" });
    doctor.status = status;
    if (reason) doctor.rejectReason = reason;
    await doctor.save();
    res.json({ success: true, message: `Doctor ${status}`, data: doctor });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
