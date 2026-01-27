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
import City from "../../models/Hospital/City.js";


async function favoriteController(req, res) {
  const { userId, labId, hospitalId, doctorId, pharId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "userId is required", success: false });
  }

  try {
    // Find existing favorite matching userId + any of labId, hospitalId, doctorId
    const isAlready = await Favorite.findOne({
      userId,
      pharId: pharId || null,
      labId: labId || null,
      hospitalId: hospitalId || null,
      doctorId: doctorId || null,
    });

    if (isAlready) {
      await Favorite.findByIdAndDelete(isAlready._id);
      return res.status(200).json({ message: "Removed from favorite", success: true });
    }

    await Favorite.create({ userId, labId, hospitalId, doctorId, pharId });
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
    } else if (type === "pharmacy") {
      filter.pharId = { $ne: null };
      myFavorite = await Favorite.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            pharId: { $ne: null }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "pharId",
            foreignField: "_id",
            as: "phar"
          }
        },
        { $unwind: "$phar" },
        {
          $lookup: {
            from: "pharmacies",
            localField: "pharId",   // User._id
            foreignField: "userId",
            as: "pharProfile"
          }
        },
        {
          $unwind: {
            path: "$pharProfile",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: "phar-addresses",
            localField: "pharId",   // User._id
            foreignField: "userId",
            as: "pharAbout"
          }
        },
        {
          $unwind: {
            path: "$pharAbout",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: "cities",
            localField: "pharAbout.cityId",
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
            localField: "pharAbout.stateId",
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
            let: { pharId: "$pharId" },
            pipeline: [
              { $match: { $expr: { $eq: ["$pharId", "$$pharId"] } } },
              {
                $group: {
                  _id: "$pharId",
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
            pharAbout: {

              city: "$city.name",
              state: "$state.name",
            }
          }
        },

        {
          $project: {
            ratingData: 0,
            "phar.passwordHash": 0
          }
        },

        { $sort: { createdAt: -1 } },
        { $skip: (page - 1) * Number(limit) },
        { $limit: Number(limit) }
      ]);

    }
    const [labCount, hospitalCount, doctorCount, pharCount] = await Promise.all([
      Favorite.countDocuments({ userId, labId: { $ne: null } }),
      Favorite.countDocuments({ userId, hospitalId: { $ne: null } }),
      Favorite.countDocuments({ userId, doctorId: { $ne: null } }),
      Favorite.countDocuments({ userId, pharId: { $ne: null } })
    ]);


    return res.status(200).json({
      message: "Favorite data fetched",
      data: myFavorite,
      success: true,
      counts: {
        lab: labCount,
        hospital: hospitalCount,
        doctor: doctorCount,
        pharmacy: pharCount
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
    if (appointments?.labTest?.lab) {
      const labData = await Laboratory.findOne({ userId: appointments.labTest.lab }).lean()
      const labAddress = await LabAddress.findOne({ userId: appointments.labTest.lab }).lean()
      const labTests = await Test.find({ _id: { $in: appointments.labTest.labTests } }).lean()
      const labImage = await LabImage.findOne({ userId: appointments.labTest.lab }).lean()
      const labStatus = await LabAppointment.findOne({ doctorAp: appointmentId }).select('status')
      const labReport = labStatus ? await TestReport.find({ appointmentId: labStatus?._id }).populate('testId') : []
      return res.status(200).json({
        message: "lab data fetched", labStatus, success: true, labReport,
        labData: { ...labData, labImg: labImage?.thumbnail }, labAddress, labTests
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

    const users = await User.find({ role: 'patient' })
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
const getNearByDoctor = async (req, res) => {
  const { lat, long, page = 1, limit = 10, distance = 200, location } = req.query;

  try {
    let doctors = [];

    // Case 1️⃣: Search by city name
    if (location) {
      // Find city first
      const city = await City.findOne({ name: new RegExp(`^${location}$`, "i") });

      if (!city) {
        return res.status(404).json({ success: false, message: "City not found" });
      }

      doctors = await DoctorAbout.find({ cityId: city._id })
        .populate("cityId", "name state country")
        .populate({
          path: "userId",
          select: "-passwordHash",
          populate: "doctorId"
        })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean();
    } else {
      // Case 2️⃣: Search by lat/long + distance
      if (!lat || !long) {
        return res
          .status(400)
          .json({ success: false, message: "lat and long required" });
      }

      // Fetch doctors who have lat/long
      const doctorsWithLocation = await DoctorAbout.find({
        lat: { $ne: null },
        long: { $ne: null }
      })
        .populate("cityId", "name state country")
        .populate({
          path: "userId",
          select: "-passwordHash",
          populate: "doctorId"
        })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean();

      // Filter doctors within given distance
      doctors = doctorsWithLocation.filter(doc => {
        const dist = getDistanceInKm(
          Number(lat),
          Number(long),
          Number(doc.lat),
          Number(doc.long)
        );
        return dist <= Number(distance);
      });
    }

    return res.status(200).json({
      success: true,
      message: "Nearby doctors fetched successfully",
      data: doctors,
      pagination: {
        totalData: doctors.length,
        currentPage: Number(page),
        totalPage: Math.ceil(doctors.length / limit)
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};


const getDistanceInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in KM
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export { favoriteController, getPatientFavorite, getMyRating, getPatientFavoriteData, getPatientPrescriptions, getPrescriptionLabDetail, profileAction, getPatients, getNearByDoctor }