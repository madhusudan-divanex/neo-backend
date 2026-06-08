import Pharmacy from "../../models/Pharmacy/pharmacy.model.js";
import User from "../../models/Hospital/User.js";
import { sendPush } from "../../utils/sendPush.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sendEmail from '../../utils/sendMail.js'
import Otp from '../../models/Otp.js';
import fs from 'fs'
import EditRequest from '../../models/EditRequest.js';
import PharAddress from '../../models/Pharmacy/pharmacyAddress.model.js';
import PharPerson from '../../models/Pharmacy/contactPerson.model.js';
import PharImage from '../../models/Pharmacy/pharmacyImg.model.js';
import Rating from '../../models/Rating.js';
import PharLicense from '../../models/Pharmacy/pharmacyLicense.model.js';
import mongoose from 'mongoose';
import safeUnlink from '../../utils/globalFunction.js';
import Notification from '../../models/Notifications.js';
import City from '../../models/Hospital/City.js';
import MedicineRequest from "../../models/Pharmacy/medicineRequest.model.js";
import ScheduleMedicines from "../../models/Admin/ScheduleMedicines.js";
import Sell from "../../models/Pharmacy/sell.model.js";
import Inventory from "../../models/Pharmacy/inventory.model.js";

export const getPharmaciesDetail = async (req, res) => {
  const userId = req.params.id;

  try {
    // Find user
    const user = await User.findById(userId).select("name email contactNumber nh12 pharId").lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Pharmacy not found"
      });
    }
    const data = await Pharmacy.findById(user.pharId).lean()

    // Fetch latest related documents
    const pharPerson = await PharPerson.findOne({ userId }).sort({ createdAt: -1 });
    const pharAddress = await PharAddress.findOne({ userId }).populate('stateId')
      .populate('countryId')
      .populate('cityId').sort({ createdAt: -1 });
    const pharImg = await PharImage.findOne({ userId }).sort({ createdAt: -1 });
    const pharLicense = await PharLicense.findOne({ userId }).sort({ createdAt: -1 });
    const isRequest = Boolean(await EditRequest.exists({ pharId: userId }))
    const allowEdit = Boolean(await EditRequest.exists({ pharId: userId, status: "approved" }))
    const notifications = await Notification.countDocuments({ userId }) || 0;

    // Fetch ratings
    const rating = await Rating.find({ pharId: userId })
      .populate("patientId")
      .sort({ createdAt: -1 });

    // Calculate average rating
    const avgStats = await Rating.aggregate([
      { $match: { pharId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$star" },
          total: { $sum: 1 }
        }
      }
    ]);

    const avgRating = avgStats.length ? avgStats[0].avgRating : 0;

    // Count star ratings
    const ratingStats = await Rating.aggregate([
      { $match: { pharId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$star",
          count: { $sum: 1 }
        }
      }
    ]);

    let ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingStats.forEach(r => {
      ratingCounts[r._id] = r.count;
    });

    // Return final response
    return res.status(200).json({
      success: true,
      user: { ...user, ...data },
      pharPerson,
      pharAddress,
      pharImg, customId: user.unique_id,
      pharLicense,
      rating,
      avgRating,
      ratingCounts, allowEdit,
      isRequest, notifications
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

/* ================= LIST ================= */
export const getPharmacies = async (req, res) => {
  try {
    const { search = "", page = 1, status = "" } = req.query;

    const limit = 10;
    const skip = (page - 1) * limit;



    const query = {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { nh12: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { contactNumber: { $regex: search, $options: "i" } },
      ],
    };
    if (status && status !== "all") query.status = status;

    const pharmacies = await Pharmacy.find(query).populate({
      path: "userId", select: "nh12 name email contactNumber", match: query
    })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const pharIds = pharmacies?.map(item => item?.userId?._id)
    const contactPerson = await PharPerson.find({ userId: { $in: pharIds } })
    const pharAddr = await PharAddress.find({ userId: { $in: pharIds } }).select('fullAddress userId')
    const pharmaciesWithContact = pharmacies.map(pharmacy => {
      const contact = contactPerson.find(
        person => person?.userId?.toString() === pharmacy?.userId._id.toString()
      );
      const address = pharAddr.find(
        item => item?.userId?.toString() === pharmacy?.userId._id.toString()
      );

      return {
        ...pharmacy.toObject(),
        contactPerson: contact,
        address
      };
    });

    const total = await Pharmacy.countDocuments(query);

    res.json({
      success: true,
      data: pharmaciesWithContact,
      totalPages: Math.ceil(total / limit),
    });

  } catch (err) {
    console.error(err); // 👈 debugging ke liye important
    res.status(500).json({ message: "Failed to load pharmacies" });
  }
};
export const getPharmacyRequests = async (req, res) => {
  try {
    const { search = "", page = 1, status = "" } = req.query;

    const limit = 10;
    const skip = (page - 1) * limit;



    const query = {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { nh12: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { contactNumber: { $regex: search, $options: "i" } },
      ],
    };
    if (status && status !== "all") {
      query.status = status
    } else {
      query.status = { $in: ["pending", "rejected"] }
    }

    const pharmacies = await Pharmacy.find(query).populate({
      path: "userId", select: "nh12 name email contactNumber", match: query
    })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const pharIds = pharmacies?.map(item => item?.userId?._id)
    const contactPerson = await PharPerson.find({ userId: { $in: pharIds } })
    const pharAddr = await PharAddress.find({ userId: { $in: pharIds } }).select('fullAddress userId')
    const pharmaciesWithContact = pharmacies.map(pharmacy => {
      const contact = contactPerson.find(
        person => person?.userId?.toString() === pharmacy?.userId._id.toString()
      );
      const address = pharAddr.find(
        item => item?.userId?.toString() === pharmacy?.userId._id.toString()
      );

      return {
        ...pharmacy.toObject(),
        contactPerson: contact,
        address
      };
    });

    const total = await Pharmacy.countDocuments(query);

    res.json({
      success: true,
      data: pharmaciesWithContact,
      totalPages: Math.ceil(total / limit),
    });

  } catch (err) {
    console.error(err); // 👈 debugging ke liye important
    res.status(500).json({ message: "Failed to load pharmacies" });
  }
};

/* ================= STATUS TOGGLE ================= */
export const togglePharmacyStatus = async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findById({ _id: new mongoose.Types.ObjectId(req.params.id) });
    if (!pharmacy) {
      return res.status(404).json({ message: "Pharmacy not found" });
    }

    // 🔄 verify → approved → pending
    pharmacy.status = req.params.status

    await pharmacy.save();

    // 🔔 Push only on approved
    if (pharmacy.status === "approved") {
      //   const user = await User.findOne({ email: pharmacy.email });

      //   if (user?.fcmToken) {
      //     await sendPush({
      //       token: user.fcmToken,
      //       title: "🎉 Pharmacy Approved",
      //       body: "Your pharmacy has been approved by admin",
      //       data: { type: "pharmacy_approved" }
      //     });
      //   }
    }

    res.json({ success: true, status: pharmacy.status });
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Internal server error" });
  }
};

/* ================= DELETE ================= */
export const deletePharmacy = async (req, res) => {
  await Pharmacy.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};

export const approveRejectPharmacy = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const phar = await (await import("../../models/Pharmacy/pharmacy.model.js")).default.findById(id);
    if (!phar) return res.status(404).json({ success: false, message: "Pharmacy not found" });
    phar.status = status;
    if (reason) phar.rejectReason = reason;
    await phar.save();
    res.json({ success: true, message: `Pharmacy ${status}`, data: phar });
  } catch (err) { res.status(500).json({ success: false, message: "Internal server error" }); }
};

export const getH1MedicineReqeusts = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  try {
    const requests = await MedicineRequest.find({ pharId: req.params.id }).sort({ createdAt: -1 }).populate('medicineId').skip(skip).limit(limit);
    const count = await MedicineRequest.countDocuments({ pharId: req.params.id });
    res.json({ success: true, data: requests, totalPages: Math.ceil(count / limit) });
  } catch (err) { res.status(500).json({ success: false, message: "Internal server error" }); }
}

export const updateMedicineReqeustStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const request = await MedicineRequest.findById(id);
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });
    request.status = status;
    await request.save();
    res.json({ success: true, message: `Request ${status}` });
  } catch (err) { res.status(500).json({ success: false, message: "Internal server error" }); }
}
export const getSellH1Medicines = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  try {
    const h1 = await ScheduleMedicines.findOne({ name: 'H1' })
    if (!h1) return res.status(404).json({ success: false, message: 'H1 not found' })
    const getH1Medicines = await Inventory.find({ pharId: req.params.id, schedule: h1?._id })
    if (!getH1Medicines) return res.status(404).json({ success: false, message: 'No H1 medicines found' })
    const inventoryIds = getH1Medicines.map((item) => item._id)

    const sellData = await Sell.find({ pharId: req.params.id, "products.inventoryId": { $in: inventoryIds }, returnProducts: [] }).sort({ createdAt: -1 })
      .populate('patientId doctorId', 'name').populate({ path: 'prescriptionId', select: 'doctorId', populate: { path: 'doctorId', select: 'name' } }).skip(skip).limit(limit);
    const count = await Sell.countDocuments({ pharId: req.params.id, "products.inventoryId": { $in: inventoryIds } });

    res.json({ success: true, data: sellData, totalPages: Math.ceil(count / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" })
  }
}

export const getSellH1MedicineDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const sell = await Sell.findById(id).populate('patientId doctorId', 'name')
      .populate({ path: 'prescriptionId', populate: { path: 'doctorId', select: 'name nh12', populate: { path: 'doctorId', select: 'profileImage' } } });
    res.json({ success: true, data: sell });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" })
  }
}