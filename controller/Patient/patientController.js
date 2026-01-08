import mongoose from "mongoose";
import DoctorAbout from "../../models/Doctor/addressAbout.model.js";
import Doctor from "../../models/Doctor/doctor.model.js";
import Favorite from "../../models/Patient/favorite.model.js"
import Prescriptions from "../../models/Prescriptions.js";
import Rating from "../../models/Rating.js";
import DoctorAppointment from "../../models/DoctorAppointment.js";
import Laboratory from "../../models/Laboratory/laboratory.model.js";
import LabAddress from "../../models/Laboratory/labAddress.model.js";
import Test from "../../models/Laboratory/test.model.js";
import LabImage from "../../models/Laboratory/labImages.model.js";
import LabAppointment from "../../models/LabAppointment.js";
import TestReport from "../../models/testReport.js";
import ProfileStatus from "../../models/ProfileStatus.js";
import Patient from "../../models/Patient/patient.model.js";
import User from "../../models/Hospital/User.js";

async function favoriteController(req, res) {
  const { userId, labId, hospitalId, doctorId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "userId is required", success: false });
  }

  try {
    // Find existing favorite matching userId + any of labId, hospitalId, doctorId
    const isAlready = await Favorite.findOne({
      userId,
      labId: labId || null,
      hospitalId: hospitalId || null,
      doctorId: doctorId || null,
    });

    if (isAlready) {
      await Favorite.findByIdAndDelete(isAlready._id);
      return res.status(200).json({ message: "Removed from favorite", success: true });
    }

    await Favorite.create({ userId, labId, hospitalId, doctorId });
    return res.status(200).json({ message: "Favorite saved", success: true });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error", success: false });
  }
}
async function getPatientFavorite(req, res) {
  const userId = req.params.id;
  if (!userId) {
    return res.status(400).json({ message: "userId is required", success: false });
  }
  const { limit = 10, page = 1 } = req.query
  try {
    // Find existing favorite matching userId + any of labId, hospitalId, doctorId
    const myFavroite = await Favorite.find({ userId }).sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit);
    return res.status(200).json({ message: "Favorite saved", data: myFavroite, success: true });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error", success: false });
  }
}
async function getMyRating(req, res) {
  const userId = req.params.id;

  if (!userId) {
    return res.status(400).json({
      message: "userId is required",
      success: false,
    });
  }

  const { type = "" } = req.query;

  try {
    const filter = { patientId: userId };

    // filter by rating type
    if (type === "lab") {
      filter.labId = { $ne: null };
    } else if (type === "doctor") {
      filter.doctorId = { $ne: null };
    } else if (type === "pharmacy") {
      filter.pharId = { $ne: null };
    }

    const myRatings = await Rating.find(filter)
      .sort({ createdAt: -1 })
    // .populate("doctorId labId pharId patientId",'name');

    return res.status(200).json({
      message: "Ratings fetched successfully",
      data: myRatings,
      success: true,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
}
async function getPatientFavoriteData(req, res) {
  const userId = req.params.id;
  if (!userId) {
    return res.status(400).json({
      message: "userId is required",
      success: false
    });
  }
  const { limit = 10, page = 1, type } = req.query;
  try {
    let filter = { userId };
    let myFavorite;

    // 🔹 type based filtering
    if (type === "lab") {
      filter.labId = { $ne: null };
      myFavorite = await Favorite.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            labId: { $ne: null }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "labId",
            foreignField: "_id",
            as: "lab"
          }
        },
        { $unwind: "$lab" },
        {
          $lookup: {
            from: "laboratories",
            localField: "labId",   // User._id
            foreignField: "userId",
            as: "labProfile"
          }
        },
        {
          $unwind: {
            path: "$labProfile",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: "lab-addresses",
            localField: "labId",   // User._id
            foreignField: "userId",
            as: "labAbout"
          }
        },
        {
          $unwind: {
            path: "$labAbout",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: "cities",
            localField: "labAbout.cityId",
            foreignField: "_id",
            as: "city"
          }
        },
        {
          $unwind: {
            path: "$city",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: "states",
            localField: "labAbout.stateId",
            foreignField: "_id",
            as: "state"
          }
        },
        {
          $unwind: {
            path: "$state",
            preserveNullAndEmptyArrays: true
          }
        },



        // ⭐ Avg Rating
        {
          $lookup: {
            from: "ratings",
            let: { labId: "$labId" },
            pipeline: [
              { $match: { $expr: { $eq: ["$labId", "$$labId"] } } },
              {
                $group: {
                  _id: "$labId",
                  avgRating: { $avg: "$star" }
                }
              }
            ],
            as: "ratingData"
          }
        },

        {
          $addFields: {
            avgRating: {
              $ifNull: [{ $arrayElemAt: ["$ratingData.avgRating", 0] }, 0]
            },
            labAbout: {

              city: "$city.name",
              state: "$state.name",
            }
          }
        },

        {
          $project: {
            ratingData: 0,
            "lab.passwordHash": 0
          }
        },

        { $sort: { createdAt: -1 } },
        { $skip: (page - 1) * Number(limit) },
        { $limit: Number(limit) }
      ]);
    } else if (type === "hospital") {
      filter.hospitalId = { $ne: null };
      myFavorite = await Favorite.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            hospitalId: { $ne: null }
          }
        },

        // ✅ Correct collection name
        {
          $lookup: {
            from: "hospitalbasics",
            localField: "hospitalId",
            foreignField: "_id",
            as: "hospital"
          }
        },
        {
          $unwind: {
            path: "$hospital",
            preserveNullAndEmptyArrays: true
          }
        },

        // ✅ Correct collection name
        {
          $lookup: {
            from: "hospitaladdresses",
            localField: "hospitalId",
            foreignField: "hospitalId",
            as: "hospitalAddress"
          }
        },
        {
          $unwind: {
            path: "$hospitalAddress",
            preserveNullAndEmptyArrays: true
          }
        },

        // ⭐ Avg Rating
        {
          $lookup: {
            from: "ratings",
            let: { hospitalId: "$hospitalId" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$hospitalId", "$$hospitalId"] }
                }
              },
              {
                $group: {
                  _id: "$hospitalId",
                  avgRating: { $avg: "$star" }
                }
              }
            ],
            as: "ratingData"
          }
        },

        {
          $addFields: {
            avgRating: {
              $ifNull: [{ $arrayElemAt: ["$ratingData.avgRating", 0] }, 0]
            }
          }
        },

        {
          $project: {
            ratingData: 0
          }
        },

        { $sort: { createdAt: -1 } },
        { $skip: (page - 1) * Number(limit) },
        { $limit: Number(limit) }
      ]);

    } else if (type === "doctor") {
      filter.doctorId = { $ne: null };
      myFavorite = await Favorite.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            doctorId: { $ne: null }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "doctorId",
            foreignField: "_id",
            as: "doctor"
          }
        },
        { $unwind: "$doctor" },
        {
          $lookup: {
            from: "doctors",
            localField: "doctorId",   // User._id
            foreignField: "userId",
            as: "doctorProfile"
          }
        },
        {
          $unwind: {
            path: "$doctorProfile",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: "doctor-abouts",
            localField: "doctorId",   // User._id
            foreignField: "userId",
            as: "doctorAbout"
          }
        },
        {
          $unwind: {
            path: "$doctorAbout",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: "cities",
            localField: "doctorAbout.cityId",
            foreignField: "_id",
            as: "city"
          }
        },
        {
          $unwind: {
            path: "$city",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: "states",
            localField: "doctorAbout.stateId",
            foreignField: "_id",
            as: "state"
          }
        },
        {
          $unwind: {
            path: "$state",
            preserveNullAndEmptyArrays: true
          }
        },



        // ⭐ Avg Rating
        {
          $lookup: {
            from: "ratings",
            let: { doctorId: "$doctorId" },
            pipeline: [
              { $match: { $expr: { $eq: ["$doctorId", "$$doctorId"] } } },
              {
                $group: {
                  _id: "$doctorId",
                  avgRating: { $avg: "$star" }
                }
              }
            ],
            as: "ratingData"
          }
        },

        {
          $addFields: {
            avgRating: {
              $ifNull: [{ $arrayElemAt: ["$ratingData.avgRating", 0] }, 0]
            },
            doctorAbout: {
              about: "$doctorAbout.aboutYou",
              city: "$city.name",
              state: "$state.name",
              fees: "$doctorAbout.fees",
              specialty: "$doctorAbout.specialty",
              hospitalName: "$doctorAbout.hospitalName"
            }
          }
        },

        {
          $project: {
            ratingData: 0,
            "doctor.passwordHash": 0
          }
        },

        { $sort: { createdAt: -1 } },
        { $skip: (page - 1) * Number(limit) },
        { $limit: Number(limit) }
      ]);
    }
    const [labCount, hospitalCount, doctorCount] = await Promise.all([
      Favorite.countDocuments({ userId, labId: { $ne: null } }),
      Favorite.countDocuments({ userId, hospitalId: { $ne: null } }),
      Favorite.countDocuments({ userId, doctorId: { $ne: null } })
    ]);


    return res.status(200).json({
      message: "Favorite data fetched",
      data: myFavorite,
      success: true,
      counts: {
        lab: labCount,
        hospital: hospitalCount,
        doctor: doctorCount
      },
      pagination: {
        currentPage: Number(page),
        limit: Number(limit)
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false
    });
  }
}
async function getPatientPrescriptions(req, res) {
  const userId = req.params.id;
  if (!userId) {
    return res.status(400).json({
      message: "userId is required",
      success: false,
    });
  }
  try {
    const filter = { patientId: userId };
    const prescriptions = await Prescriptions.find({ patientId: userId })
      .sort({ createdAt: -1 })
      .populate("doctorId", "-passwordHash"); // basic doctor info

    // For each prescription, fetch doctor + doctorAbout
    const finalData = await Promise.all(
      prescriptions.map(async (item) => {
        const doctorId = item.doctorId?._id;
        const doctor = await Doctor.findOne({ userId: doctorId })
        console.log(doctorId, item)
        const doctorAbout = await DoctorAbout.findOne({ userId: doctorId }).populate({ path: 'hospitalName', select: 'name' });
        return {
          prescription: item,
          doctor,
          doctorAbout
        };
      })
    );
    return res.status(200).json({
      message: "Prescription fetched successfully",
      data: finalData,
      success: true,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
}
async function getPrescriptionLabDetail(req, res) {
  const appointmentId = req.params.id;
  if (!appointmentId) {
    return res.status(400).json({
      message: "userId is required",
      success: false,
    });
  }
  try {
    const appointments = await DoctorAppointment.findById(appointmentId)
    if (appointments?.labTest) {
      const labData = await Laboratory.findOne({ userId: appointments.labTest.lab }).lean()
      const labAddress = await LabAddress.findOne({ userId: appointments.labTest.lab }).lean()
      const labTests = await Test.find({ _id: { $in: appointments.labTest.labTests } }).lean()
      const labImage = await LabImage.findOne({ userId: appointments.labTest.lab }).lean()
      const labStatus = await LabAppointment.findOne({ doctorAp: appointmentId }).select('status')
      const labReport = labStatus ? await TestReport.find({ appointmentId: labStatus?._id }).populate('testId') : []
      return res.status(200).json({
        message: "lab data fetched", labStatus, success: true, labReport,
        labData: { ...labData, labImg: labImage.thumbnail }, labAddress, labTests
      })

    }

    return res.status(200).json({
      message: "Lab data not found",
      success: false,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
}
async function profileAction(req, res) {
  const { doctorId, patientId, status, note } = req.body
  try {
    const isExist = await User.findById(patientId)
    if (!isExist) return res.status(200).json({ success: false, message: "patient not found" })
    await Patient.findByIdAndUpdate(isExist.patientId, { status }, { new: true })
    await ProfileStatus.create({ patientId, doctorId, status, note })
    return res.status(200).json({ message: "Profile updated", success: true })

  } catch (error) {
    console.log(error)
    return res.status(200).json({ message: "Server error", success: false })
  }
}
async function getPatients(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const name = req.query.name || null;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find({role:'patient',created_by:'self'})
      .select('-passwordHash')
      .lean();

    const total = await User.countDocuments();

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
export { favoriteController, getPatientFavorite, getMyRating, getPatientFavoriteData, getPatientPrescriptions, getPrescriptionLabDetail, profileAction ,getPatients}