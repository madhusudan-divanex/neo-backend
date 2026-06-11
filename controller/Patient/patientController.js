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
import HealthKnowledge from "../../models/AiChatResponse.js";
import { buildFollowUpPrompt, buildPrompt, doctorPrompt, fetchFromGemini, parseGeminiJSON } from "../../utils/globalFunction.js";
import UserAiChat from "../../models/UserAiChat.js";
import MedicalHistory from "../../models/Patient/medicalHistory.model.js";
import DoctorAiChat from "../../models/Doctor/doctoraichat.model.js";
import HospitalAddress from "../../models/Hospital/HospitalAddress.js";
import PharAddress from "../../models/Pharmacy/pharmacyAddress.model.js";
import HospitalBasic from "../../models/Hospital/HospitalBasic.js";
import Pharmacy from "../../models/Pharmacy/pharmacy.model.js";
import Country from "../../models/Hospital/Country.js";
import { populate } from "dotenv";
import BedAllotment from "../../models/Hospital/BedAllotment.js";
import Sell from "../../models/Pharmacy/sell.model.js";


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
  const userId = req.user.userId;
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
            pipeline: [
              {
                $project: {
                  name: 1,
                  email: 1,
                  labId: 1
                }
              }
            ],
            as: "lab"
          }
        },
        { $unwind: "$lab" },
        {
          $lookup: {
            from: "laboratories",
            localField: "labId",   // User._id
            foreignField: "userId",
            pipeline: [
              {
                $project: {
                  rating: 1,
                  logo: 1,
                }
              }
            ],
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
            pipeline: [
              {
                $project: {
                  lat: 1,
                  long: 1,
                  cityId: 1,
                  stateId: 1,
                }
              }
            ],
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
            pipeline: [
              {
                $project: {
                  name: 1,
                }
              }
            ],
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
            pipeline: [
              {
                $project: {
                  name: 1,
                }
              }
            ],
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
            foreignField: "userId",
            pipeline: [
              {
                $project: {
                  logoFileId: 1,
                  hospitalName: 1,
                  userId: 1,
                  rating: 1,
                }
              },
            ],
            as: "hospitalBasic"
          }
        },
        {
          $unwind: {
            path: "$hospitalBasic",
            preserveNullAndEmptyArrays: true
          }
        },

        // ✅ Correct collection name
        {
          $lookup: {
            from: "hospitaladdresses",
            localField: "hospitalBasic._id",
            foreignField: "hospitalId",
            pipeline: [
              {
                $project: {
                  cityId: 1,
                  fullAddress: 1,
                  stateId: 1,
                  lat: 1,
                  long: 1,
                }
              },
            ],
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
            pipeline: [
              {
                $project: {
                  name: 1,
                  email: 1,
                  nh12: 1,
                  doctorId: 1,

                }
              },
            ],
            as: "doctor"
          }
        },
        { $unwind: "$doctor" },
        {
          $lookup: {
            from: "doctors",
            localField: "doctorId",   // User._id
            foreignField: "userId",
            pipeline: [
              {
                $project: {
                  rating: 1,
                  profileImage: 1,
                  userId: 1,
                }
              },
            ],
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
            pipeline: [
              {
                $project: {
                  cityId: 1,
                  stateId: 1,
                  specialty: 1,
                  fees: 1,
                  hospitalName: 1,
                  userId: 1,
                  lat: 1,
                  long: 1
                }
              },
            ],
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
            pipeline: [
              {
                $project: {
                  name: 1,
                }
              }
            ],
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
            pipeline: [
              {
                $project: {
                  name: 1,
                }
              }
            ],
            as: "state"
          }
        },
        {
          $unwind: {
            path: "$state",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: "specialities",
            localField: "doctorAbout.specialty",
            foreignField: "_id",
            as: "specialty"
          }
        },
        {
          $unwind: {
            path: "$specialty",
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
              specialty: "$specialty?.name",
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
            pipeline: [
              {
                $project: {
                  name: 1,
                  email: 1,
                  pharId: 1
                }
              }
            ],
            as: "phar"
          }
        },
        { $unwind: "$phar" },
        {
          $lookup: {
            from: "pharmacies",
            localField: "pharId",   // User._id
            foreignField: "userId",
            pipeline: [
              {
                $project: {
                  logo: 1,
                  userId: 1,
                  rating: 1,
                }
              }
            ],
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
            pipeline: [
              {
                $project: {
                  lat: 1,
                  long: 1,
                  cityId: 1,
                  stateId: 1,
                }
              }
            ],
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
            pipeline: [
              {
                $project: {
                  name: 1,
                }
              }
            ],
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
            pipeline: [
              {
                $project: {
                  name: 1,
                }
              }
            ],
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

    let totalCount = 0;

    if (type === "lab") {
      totalCount = await Favorite.countDocuments({
        userId,
        labId: { $ne: null }
      });
    } else if (type === "hospital") {
      totalCount = await Favorite.countDocuments({
        userId,
        hospitalId: { $ne: null }
      });
    } else if (type === "doctor") {
      totalCount = await Favorite.countDocuments({
        userId,
        doctorId: { $ne: null }
      });
    } else if (type === "pharmacy") {
      totalCount = await Favorite.countDocuments({
        userId,
        pharId: { $ne: null }
      });
    }
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
        limit: Number(limit),
        totalPages: Math.ceil(totalCount / Number(limit))
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
    // pagination params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { patientId: userId };

    const total = await Prescriptions.countDocuments(filter);

    const prescriptions = await Prescriptions.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("doctorId", "name email nh12 contactNumber doctorId")
      .populate("hospitalId", "name email nh12 contactNumber ");

    const finalData = await Promise.all(
      prescriptions.map(async (item) => {
        const doctorId = item.doctorId?._id;

        const doctor = await Doctor.findOne({ userId: doctorId });

        const doctorAbout = await DoctorAbout.findOne({ userId: doctorId })
          .populate({
            path: "hospitalName specialty",
            select: "name",
          });

        return {
          prescription: item,
          doctor,
          doctorAbout,
        };
      })
    );

    return res.status(200).json({
      message: "Prescription fetched successfully",
      data: finalData,
      pagination: {
        totalRecords: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        limit: limit,
      },
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
async function getPatientPrescriptionsInvoice(req, res) {
  const pateintId = req.user.userId
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 10
  try {
    const sellData = await Sell.find({ patientId: pateintId })
      .populate({ path: 'pharId', select: 'name email nh12 contactNumber pharId', populate: { path: 'pharId', select: 'logo' } })
      .populate({ path: 'hospitalId', select: 'name email nh12 contactNumber hospitalId', populate: { path: 'hospitalId', select: 'logoFileId' } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)


    const finalData = await Promise.all(
      sellData.map(async (item) => ({
        ...item.toObject(),
        pharmacyName: item?.pharId?.name || item?.hospitalId?.name,
        pharmacyId: item?.pharId?.nh12 || item?.hospitalId?.nh12,
        contactNumber: item?.pharId?.contactNumber || item?.hospitalId?.contactNumber,
        email: item?.pharId?.email || item?.hospitalId?.email,
        role: item?.pharId?._id ? "pharmacy" : "hospital",
        logo:
          item?.pharId?.pharId?.logo ||
          (item?.hospitalId?.hospitalId?.logoFileId
            ? `api/file/${item.hospitalId.hospitalId.logoFileId}`
            : null),
      }))
    );

    const total = await Sell.countDocuments({ patientId: pateintId })
    return res.status(200).json({
      message: "Prescription fetched successfully",
      data: finalData,
      pagination: {
        totalRecords: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        limit: limit,
      },
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
}
async function getPrescriptionLabDetail(req, res) {
  const appointmentId = req.params.id;
  if (!appointmentId) {
    return res.status(400).json({
      message: "Appointment id is required",
      success: false,
    });
  }
  try {
    const appointments = await DoctorAppointment.findById(appointmentId)
    if (appointments?.labTest?.testCat) {
      const labData = await Laboratory.findOne({ userId: appointments.labTest.lab }).lean()
      const labAddress = await LabAddress.findOne({ userId: appointments.labTest.lab }).lean()
      const labTests = await Test.find({ _id: { $in: appointments.labTest.labTests } }).lean()
      const labImage = await LabImage.findOne({ userId: appointments.labTest.lab }).lean()
      const labStatus = await LabAppointment.findOne({ doctorAp: appointmentId }).select('status')
      const labReport = labStatus == "deliver-report" ? await TestReport.find({ appointmentId: labStatus?._id }).populate('subCatId') : []
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
async function userRating(req, res) {
  const { pharId, patientId, star, message, hospitalId } = req.body
  try {
    const isExist = await User.findById(patientId)
    if (!isExist) return res.status(200).json({ success: false, message: "patient not found" })

    if (hospitalId) {
      const isAlreadyGiven = await Rating.findOne({ patientId, hospitalId })
      if (isAlreadyGiven) {
        return res.status(200).json({ success: false, message: "Already rated" })
      }
      await Rating.create({ patientId, hospitalId, star, message })
    } else if (pharId) {
      const isAlreadyGiven = await Rating.findOne({ patientId, pharId })
      if (isAlreadyGiven) {
        return res.status(200).json({ success: false, message: "Already rated" })
      }
      await Rating.create({ patientId, pharId, star, message })
    }

    return res.status(200).json({ message: "Rating added", success: true })

  } catch (error) {
    console.log(error)
    return res.status(200).json({ message: "Server error", success: false })
  }
}
async function getHospitalAdmit(req, res) {
  const patientId = req.user.userId
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 10
  try {
    const admitList = await BedAllotment.find({ patientId: patientId })
      .populate({ path: 'primaryDoctorId', select: 'name email nh12 contactNumber doctorId', populate: { path: 'doctorId', select: 'profileImage' } })
      .populate({ path: 'hospitalId', select: 'name email nh12 contactNumber hospitalId', populate: { path: 'hospitalId', select: 'logoFileId' } })
      .populate('dischargeId', 'createdAt')
      .skip((page - 1) * limit)
      .limit(limit)


    const total = await BedAllotment.countDocuments({ patientId: patientId })
    return res.status(200).json({
      message: "Admit list fetched successfully",
      data: admitList,
      pagination: {
        totalRecords: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        limit: limit,
      },
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
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
        .populate("cityId", "name state country").populate('specialty')
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
      const doctorsWithLocation =
        await DoctorAbout.aggregate([

          {
            $geoNear: {

              near: {

                type: "Point",

                coordinates: [
                  Number(long),
                  Number(lat)
                ]
              },

              distanceField: "distance",

              spherical: true,

              query: {
                location: {
                  $exists: true
                }
              }
            }
          },

          {
            $skip: (page - 1) * limit
          },

          {
            $limit: Number(limit)
          },

          /* city */

          {
            $lookup: {

              from: "cities",

              localField: "cityId",

              foreignField: "_id",

              pipeline: [
                {
                  $project: {
                    name: 1,
                    state: 1,
                    country: 1
                  }
                }
              ],

              as: "cityId"
            }
          },

          {
            $unwind: {
              path: "$cityId",
              preserveNullAndEmptyArrays: true
            }
          },

          /* specialty */

          {
            $lookup: {

              from: "specialities",

              localField: "specialty",

              foreignField: "_id",

              as: "specialty"
            }
          },

          {
            $unwind: {
              path: "$specialty",
              preserveNullAndEmptyArrays: true
            }
          },

          /* user */

          {
            $lookup: {

              from: "users",

              localField: "userId",

              foreignField: "_id",

              pipeline: [

                {
                  $project: {
                    passwordHash: 0
                  }
                }
              ],

              as: "userId"
            }
          },

          {
            $unwind: {
              path: "$userId",
              preserveNullAndEmptyArrays: true
            }
          },

          /* doctor */

          {
            $lookup: {

              from: "doctors",

              localField: "userId.doctorId",

              foreignField: "_id",

              as: "userId.doctorId"
            }
          },

          {
            $unwind: {
              path: "$userId.doctorId",
              preserveNullAndEmptyArrays: true
            }
          }
        ]);
      doctors = doctorsWithLocation
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
const getTopUsers = async (req, res) => {
  const { lat, lng } = req.query;
  try {
    const doctorPipeline = [];

    if (lat && lng) {
      doctorPipeline.push({
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [Number(lng), Number(lat)]
          },
          distanceField: "distance",
          spherical: true,
          query: {
            "location.type": "Point"
          }
        }
      });
    }
    doctorPipeline.push({
      $sort: { createdAt: -1 }
    });

    doctorPipeline.push(
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                name: 1,
                email: 1,
                contactNumber: 1,
                doctorId: 1,
                role: 1,
                fcmToken: 1,
              }
            }
          ],
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },
      {
        $match: {
          "user.role": "doctor",
          "user.fcmToken": { $ne: null }
        }
      },
      {
        $lookup: {
          from: "doctors",
          localField: "user.doctorId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                profileImage: 1,
                rating: 1,
                gender: 1,
                status: 1
              }
            }
          ],
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
        $limit: 5
      }
    );
    doctorPipeline.push(
      {
        $lookup: {
          from: "specialities",
          localField: "specialty",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                name: 1
              }
            }
          ],
          as: "specialty"
        }
      },
      {
        $unwind: {
          path: "$specialty",
          preserveNullAndEmptyArrays: true
        }
      }
    );

    const doctors =
      await DoctorAbout.aggregate(
        doctorPipeline
      );

    const finalDoctors =
      doctors.map(item => ({
        _id: item.user._id,
        name: item.user.name,
        email: item.user.email,
        contactNumber: item.user.contactNumber,

        doctorId: item.user.doctorId,

        profileImage:
          item.doctorProfile?.profileImage,

        about: item,

        distanceInKm:
          item.distance
            ? (
              item.distance / 1000
            ).toFixed(2)
            : null
      }));
    const labPipeline = [];
    if (lat && lng) {
      labPipeline.push({
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [Number(lng), Number(lat)]
          },
          distanceField: "distance",
          spherical: true,
          query: {
            "location.type": "Point"
          }
        }
      });
    }
    labPipeline.push({
      $sort: { createdAt: -1 }
    });

    labPipeline.push(
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                name: 1,
                email: 1,
                contactNumber: 1,
                labId: 1,
                role: 1
              }
            }
          ],
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },
      {
        $match: {
          "user.labId": { $ne: null }
        }
      },
      {
        $lookup: {
          from: "laboratories",
          localField: "user.labId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                logo: 1,
                rating: 1,
              }
            }
          ],
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
        $limit: 5
      }
    );

    const labs =
      await LabAddress.aggregate(
        labPipeline
      );

    const finalLabs =
      labs.map(item => ({
        _id: item.user._id,
        name: item.user.name,
        email: item.user.email,
        contactNumber: item.user.contactNumber,

        labId: item.user.labId,

        logo:
          item.labProfile?.logo,

        about: item,

        distanceInKm:
          item.distance
            ? (
              item.distance / 1000
            ).toFixed(2)
            : null
      }));


    const pharPipeline = [];
    if (lat && lng) {
      pharPipeline.push({
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [Number(lng), Number(lat)]
          },
          distanceField: "distance",
          spherical: true,
          query: {
            "location.type": "Point"
          }
        }
      });
    }
    pharPipeline.push({
      $sort: { createdAt: -1 }
    });

    pharPipeline.push(
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                name: 1,
                email: 1,
                contactNumber: 1,
                pharId: 1,
                role: 1
              }
            }
          ],
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },
      {
        $match: {
          "user.pharId": { $ne: null }
        }
      },
      {
        $lookup: {
          from: "pharmacies",
          localField: "user.pharId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                logo: 1
              }
            }
          ],
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
        $limit: 5
      }
    );

    const pharmacys =
      await PharAddress.aggregate(
        pharPipeline
      );

    const finalPhar =
      pharmacys.map(item => ({
        _id: item.user._id,
        name: item.user.name,
        email: item.user.email,
        contactNumber: item.user.contactNumber,

        pharId: item.user.pharId,

        logo:
          item.pharProfile?.logo,

        about: item,

        distanceInKm:
          item.distance
            ? (
              item.distance / 1000
            ).toFixed(2)
            : null
      }));
    pharmacys.map(item => ({
      _id: item.user._id,
      name: item.user.name,
      email: item.user.email,
      contactNumber: item.user.contactNumber,

      pharId: item.user.pharId,

      logo:
        item.pharProfile?.logo,

      about: item,

      distanceInKm:
        item.distance
          ? (
            item.distance / 1000
          ).toFixed(2)
          : null
    }));

    const hospitalPipeline = [];
    if (lat && lng) {
      hospitalPipeline.push({
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [Number(lng), Number(lat)]
          },
          distanceField: "distance",
          spherical: true,
          query: {
            "location.type": "Point"
          }
        }
      });
    }
    hospitalPipeline.push({
      $sort: { createdAt: -1 }
    });

    hospitalPipeline.push(
      {
        $lookup: {
          from: "hospitalbasics",
          localField: "hospitalId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                hospitalName: 1,
                logoFileId: 1,
                userId: 1,
                category: 1
              }
            }
          ],
          as: "hospital"
        }
      },
      {
        $unwind: "$hospital"
      },

      // User lookup HospitalBasic.userId se
      {
        $lookup: {
          from: "users",
          localField: "hospital.userId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                name: 1,
                email: 1,
                contactNumber: 1,
                role: 1
              }
            }
          ],
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },

      {
        $match: {
          "user.role": "hospital"
        }
      },

      {
        $limit: 5
      }
    );

    const hosptials =
      await HospitalAddress.aggregate(
        hospitalPipeline
      );

    const finalHospitals = hosptials.map(item => ({
      _id: item.user._id,

      name:
        item.hospital.hospitalName ||
        item.user.name,

      email: item.user.email,

      contactNumber:
        item.user.contactNumber,

      hospitalId:
        item.hospital._id,

      logo:
        item.hospital.logoFileId
          ? `api/file/${item.hospital.logoFileId}`
          : null,

      about: item,

      distanceInKm:
        item.distance
          ? (item.distance / 1000).toFixed(2)
          : null
    }));

    return res.status(200).json({
      message: "Top data fetched",
      success: true,
      data: {
        doctors: finalDoctors,
        labs: finalLabs,
        pharmacy: finalPhar,
        hospitals: finalHospitals
      }
    });

  } catch (error) {
    console.log(error)
    return res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};
const getSearchCity = async (req, res) => {
  const { name, page, limit } = req.query
  try {
    const country = await Country.findOne({ name: "India" })

    const filter = {}
    if (name) {
      filter.name = { $regex: name, $options: "i" }
    }
    filter.countryCode = country.isoCode

    const city = await City.find(filter).skip((page - 1) * limit).limit(limit)


    return res.status(200).json({
      message: "City fetched successfully",
      success: true,
      data: city,
      pagination: {
        total: city.length,
        page,
        limit,
        totalPages: Math.ceil(city.length / limit)
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
}

const getTopUserByCategory = async (req, res) => {
  let { catType, catId, page = 1, limit = 10 } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);
  const skip = (page - 1) * limit;
  const lat = req.query.lat
  const lng = req.query.long
  const location = req.query.location

  try {
    if (catType == "hospital") {
      const filter = {}
      if (catId) {
        filter.category = new mongoose.Types.ObjectId(catId);
      }
      const pipeline = [];

      if (lat && lng) {
        pipeline.push({
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [
                Number(lng),
                Number(lat)
              ]
            },
            distanceField: "distance",
            spherical: true,
            query: {
              location: { $exists: true }
            }
          }
        });
      }
      pipeline.push({
        $lookup: {
          from: "hospitalbasics",
          localField: "hospitalId",
          foreignField: "_id",
          as: "hospital"
        }
      });

      pipeline.push({
        $unwind: "$hospital"
      });
      if (location) {
        pipeline.push({
          $match: {
            city: new mongoose.Types.ObjectId(location)
          }
        });
      }

      const matchFilter = {};

      if (catId) {
        matchFilter["hospital.category"] = { $in: [new mongoose.Types.ObjectId(catId)] };
      }

      if (Object.keys(matchFilter).length) {
        pipeline.push({
          $match: matchFilter
        });
      }
      if (!lat || !lng) {
        pipeline.push({
          $sort: {
            createdAt: -1
          }
        });
      }
      const countPipeline = [...pipeline];

      countPipeline.push({
        $count: "total"
      });

      const totalResult =
        await HospitalAddress.aggregate(countPipeline);

      const total =
        totalResult?.[0]?.total || 0;

      pipeline.push({
        $skip: (page - 1) * limit
      });

      pipeline.push({
        $limit: limit
      });
      const data =
        await HospitalAddress.aggregate(pipeline);

      const hospitalIds =
        data.map(item => item.hospital._id);
      const address = await HospitalAddress.find({ hospitalId: { $in: hospitalIds } })
      const addressMap = {};
      address.forEach(addr => {
        addressMap[addr.hospitalId.toString()] = addr;
      });
      // 3️⃣ Fetch rating stats (AVG + COUNT)
      const ratingStats = await Rating.aggregate([
        {
          $match: {
            hospitalId: { $in: hospitalIds }
          }
        },
        {
          $group: {
            _id: "$hospitalId",
            avgRating: { $avg: "$star" },
            totalReviews: { $sum: 1 }
          }
        }
      ]);

      const ratingMap = {};
      ratingStats.forEach(r => {
        ratingMap[r._id.toString()] = {
          avgRating: Number(r.avgRating.toFixed(1)),
          totalReviews: r.totalReviews
        };
      });
      const finalData = data.map(item => ({
        ...item.hospital,

        logo: item.hospital.logoFileId
          ? `api/file/${item.hospital.logoFileId}`
          : null,

        address: item,

        avgRating:
          ratingMap[item.hospital._id.toString()]
            ?.avgRating || 0,

        totalReviews:
          ratingMap[item.hospital._id.toString()]
            ?.totalReviews || 0,

        distanceInKm: item.distance
          ? (item.distance / 1000).toFixed(2)
          : null
      }));


      return res.status(200).json({
        message: "hospital",
        success: true,
        data: finalData,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    }
    else if (catType == "doctor") {
      const geoPipeline = [];

      // location based sorting
      if (lat && lng) {

        geoPipeline.push({
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [Number(lng), Number(lat)]
            },

            distanceField: "distance",

            spherical: true,
            query: {
              "location.type": "Point"
            }
          }
        });
      }

      if (location) {
        geoPipeline.push({

          $match: {
            cityId: new mongoose.Types.ObjectId(location)
          }
        });

      }
      const matchFilter = {};

      if (catId?.length) {
        geoPipeline.push({
          $match: {
            $or: [
              { specialty: new mongoose.Types.ObjectId(catId) },
              { treatmentAreas: new mongoose.Types.ObjectId(catId) }
            ]
          }
        });
      }
      if (Object.keys(matchFilter).length) {
        geoPipeline.push({
          $match: matchFilter
        });
      }

      /* ---------------- POPULATE ---------------- */

      geoPipeline.push({
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          pipeline: [
            {
              $match: {
                fcmToken: { $ne: "" },
              }
            },
            {
              $project: {
                name: 1,
                role: 1,
                fcmToken: 1,
                doctorId: 1,
              }
            }
          ],
          as: "user"
        }
      });

      geoPipeline.push({
        $unwind: "$user"
      });


      geoPipeline.push({
        $lookup: {
          from: "doctors",
          localField: "user.doctorId",
          foreignField: "_id",
          as: "doctorProfile"
        }
      });

      geoPipeline.push({
        $unwind: {
          path: "$doctorProfile",
          preserveNullAndEmptyArrays: true
        }
      });

      geoPipeline.push({
        $addFields: {
          avgRating: {
            $ifNull: ["$doctorProfile.rating", 0]
          }
        }
      });


      geoPipeline.push({
        $lookup: {
          from: "countries",
          localField: "countryId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                name: 1
              }
            }
          ],
          as: "countryData"
        }
      });

      geoPipeline.push({
        $unwind: {
          path: "$countryData",
          preserveNullAndEmptyArrays: true
        }
      });

      geoPipeline.push({
        $lookup: {
          from: "states",
          localField: "stateId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                name: 1
              }
            }
          ],
          as: "stateId"
        }
      });

      geoPipeline.push({
        $unwind: {
          path: "$stateId",
          preserveNullAndEmptyArrays: true
        }
      });


      geoPipeline.push({
        $lookup: {
          from: "cities",
          localField: "cityId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                name: 1
              }
            }
          ],
          as: "cityId"
        }
      });

      geoPipeline.push({
        $unwind: {
          path: "$cityId",
          preserveNullAndEmptyArrays: true
        }
      });
      geoPipeline.push({
        $lookup: {
          from: "specialities",
          localField: "specialty",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                name: 1
              }
            }
          ],
          as: "specialty"
        }
      });

      geoPipeline.push({
        $unwind: {
          path: "$specialty",
          preserveNullAndEmptyArrays: true
        }
      });

      const totalData = await DoctorAbout.aggregate(geoPipeline);

      geoPipeline.push({
        $skip: (page - 1) * limit
      });

      geoPipeline.push({
        $limit: limit
      });


      const doctors = await DoctorAbout.aggregate(geoPipeline);

      const finalData = doctors.map(item => ({
        _id: item.user._id,
        name: item.user.name,
        email: item.user.email,
        contactNumber: item.user.contactNumber,

        doctorId: item.user.doctorId,

        profileImage: item.doctorProfile?.profileImage || null,

        avgRating: item.avgRating,

        doctorAddress: item,

        distanceInKm: item.distance
          ? (item.distance / 1000).toFixed(2)
          : null
      }));



      return res.status(200).json({
        success: true,
        message: "Doctors data fetched",
        data: finalData,
        pagination: {
          total: totalData.length,
          page,
          limit,
          totalPages: Math.ceil(totalData.length / limit)
        }
      });
    }

    else if (catType == "pharmacy") {
      const pipeline = [];
      /* ================= GEO NEAR ================= */

      if (lat && lng) {
        pipeline.push({
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [
                Number(lng),
                Number(lat)
              ]
            },
            distanceField: "distance",
            spherical: true,
            query: {
              location: { $exists: true }
            }
          }
        });
      }
      if (location) {
        pipeline.push({

          $match: {
            cityId: new mongoose.Types.ObjectId(location)
          }
        });

      }

      /* ================= USER LOOKUP ================= */

      pipeline.push({
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                name: 1,
                nh12: 1,
                email: 1,
                pharId: 1,
                role: 1,
              }
            }
          ],
          as: "user"
        }
      });

      pipeline.push({
        $unwind: "$user"
      });

      /* ================= FILTER ================= */

      const matchFilter = {
        "user.role": "pharmacy"
      };



      pipeline.push({
        $match: matchFilter
      });

      /* ================= PHARMACY LOOKUP ================= */

      pipeline.push({
        $lookup: {
          from: "pharmacies",
          localField: "user.pharId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                logo: 1,
                name: 1,
              }
            }
          ],
          as: "pharmacy"
        }
      });

      pipeline.push({
        $unwind: {
          path: "$pharmacy",
          preserveNullAndEmptyArrays: true
        }
      });

      /* ================= DEFAULT SORT ================= */

      if (!lat || !lng) {
        pipeline.push({
          $sort: {
            createdAt: -1
          }
        });
      }
      pipeline.push({
        $facet: {
          data: [
            {
              $skip: (page - 1) * limit
            },
            {
              $limit: limit
            }
          ],
          totalCount: [
            {
              $count: "count"
            }
          ]
        }
      });

      /* =======================================================
         FETCH DATA
      ======================================================= */

      const result = await PharAddress.aggregate(pipeline);

      const data = result[0]?.data || [];
      const total = result[0]?.totalCount?.[0]?.count || 0

      /* =======================================================
         RATINGS
      ======================================================= */

      const userIds = data.map(item => item.user._id);

      const ratingStats = await Rating.aggregate([

        {
          $match: {
            pharId: { $in: userIds }
          }
        },

        {
          $group: {

            _id: "$pharId",

            avgRating: {
              $avg: "$star"
            },

            totalReviews: {
              $sum: 1
            }
          }
        }
      ]);

      const ratingMap = {};

      ratingStats.forEach((r) => {

        ratingMap[r._id.toString()] = {

          avgRating: Number(
            r.avgRating.toFixed(1)
          ),

          totalReviews: r.totalReviews
        };
      });

      /* =======================================================
         FINAL FORMAT
      ======================================================= */

      const mergedData = data.map((item) => ({

        ...item.user,

        pharId: item.pharmacy,

        pharAddress: item,

        avgRating:
          ratingMap[item.user._id.toString()]
            ?.avgRating || 0,

        totalReviews:
          ratingMap[item.user._id.toString()]
            ?.totalReviews || 0,
        distanceInKm: item.distance
          ? (item.distance / 1000).toFixed(2)
          : null
      }));

      return res.status(200).json({
        message: "pharmacy",
        success: true,
        data: mergedData,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    }

    else if (catType == "lab") {
      let locationUserIds = null;

      if (location) {

        const labAddressFilter = {};
        labAddressFilter.cityId = new mongoose.Types.ObjectId(location);


        const labAddresses =
          await LabAddress.find(
            labAddressFilter
          )
            .select('userId')
            .lean();

        locationUserIds =
          labAddresses.map(
            a => a.userId.toString()
          );
      }

      const userFilter = {

        labId: {
          $exists: true,
          $ne: null
        }
      };

      userFilter.role = { $in: ['lab', 'hospital'] };
      if (locationUserIds) {

        userFilter._id = {
          $in: locationUserIds
        };
      }
      const users = await User.find(userFilter)
        .select('-passwordHash')
        .populate('labId')
        .lean();

      const fetchedUserIds =
        users.map(u => u._id);

      const pipeline = [];

      /* ================= GEO NEAR ================= */

      if (lat != null && lng != null) {

        pipeline.push({

          $geoNear: {

            near: {
              type: "Point",

              coordinates: [
                Number(lng),
                Number(lat)
              ]
            },

            distanceField: "distance",

            spherical: true,

            query: {
              userId: {
                $in: fetchedUserIds
              },

              location: {
                $exists: true
              }
            }
          }
        });
      } else {

        pipeline.push({

          $match: {

            userId: {
              $in: fetchedUserIds
            }
          }
        });
      }
      pipeline.push({

        $lookup: {

          from: "countries",

          localField: "countryId",

          foreignField: "_id",

          pipeline: [
            {
              $project: {
                name: 1
              }
            }
          ],

          as: "countryId"
        }
      });

      pipeline.push({

        $unwind: {
          path: "$countryId",
          preserveNullAndEmptyArrays: true
        }
      });

      pipeline.push({

        $lookup: {

          from: "states",

          localField: "stateId",

          foreignField: "_id",

          pipeline: [
            {
              $project: {
                name: 1
              }
            }
          ],

          as: "stateId"
        }
      });

      pipeline.push({

        $unwind: {
          path: "$stateId",
          preserveNullAndEmptyArrays: true
        }
      });

      pipeline.push({

        $lookup: {

          from: "cities",

          localField: "cityId",

          foreignField: "_id",

          pipeline: [
            {
              $project: {
                name: 1
              }
            }
          ],

          as: "cityId"
        }
      });

      pipeline.push({

        $unwind: {
          path: "$cityId",
          preserveNullAndEmptyArrays: true
        }
      });

      /* ================= DEFAULT SORT ================= */

      if (lat == null || lng == null) {

        pipeline.push({

          $sort: {
            createdAt: -1
          }
        });
      }
      /* ================= PAGINATION ================= */

      pipeline.push({

        $facet: {

          data: [

            {
              $skip:
                (page - 1) * limit
            },

            {
              $limit: limit
            }
          ],

          totalCount: [

            {
              $count: "count"
            }
          ]
        }
      });

      const result =
        await LabAddress.aggregate(
          pipeline
        );

      const labAddresses =
        result[0]?.data || [];

      const total =
        result[0]?.totalCount?.[0]
          ?.count || 0;

      /* ======================================================
         STEP 6: ADDRESS MAP
      ====================================================== */

      const labAddressMap = {};

      labAddresses.forEach(a => {

        labAddressMap[
          a.userId.toString()
        ] = a;
      });

      /* ======================================================
         STEP 7: USER MAP
      ====================================================== */

      const userMap = {};

      users.forEach(u => {

        userMap[
          u._id.toString()
        ] = u;
      });

      /* ======================================================
         STEP 8: MERGE DATA
      ====================================================== */

      let mergedData;



      mergedData =
        users.map(u => ({

          ...u,

          address:
            labAddressMap[
            u._id.toString()
            ] || null,

          avgRating:
            u?.labId?.rating || 0,

          distanceInKm:
            labAddressMap[
              u._id.toString()
            ]?.distance
              ? (
                labAddressMap[
                  u._id.toString()
                ].distance / 1000
              ).toFixed(2)
              : null
        }));


      return res.status(200).json({
        message: "lab",
        success: true,
        data: mergedData,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    }

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server Error"
    });
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

export {
  getTopUsers, getTopUserByCategory, getSearchCity, getPatientPrescriptionsInvoice, userRating, getHospitalAdmit,
  favoriteController, getPatientFavorite, getMyRating, getPatientFavoriteData, getPatientPrescriptions, getPrescriptionLabDetail, profileAction, getPatients, getNearByDoctor,

}