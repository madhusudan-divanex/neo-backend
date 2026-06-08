import mongoose from "mongoose";
import HospitalBasic from "../../models/Hospital/HospitalBasic.js";
import HospitalContact from "../../models/Hospital/HospitalContact.js";
import HospitalImage from "../../models/Hospital/HospitalImage.js";
import HospitalCertificate from "../../models/Hospital/HospitalCertificate.js";
import HospitalAddress from "../../models/Hospital/HospitalAddress.js";
import User from "../../models/Hospital/User.js";
import DoctorAbout from "../../models/Doctor/addressAbout.model.js";
import StaffEmployement from "../../models/Staff/StaffEmployement.js";
import DoctorAppointment from "../../models/DoctorAppointment.js";
import LabAppointment from "../../models/LabAppointment.js";
import Department from "../../models/Department.js";
import BedAllotment from "../../models/Hospital/BedAllotment.js";
import HospitalPatient from "../../models/Hospital/HospitalPatient.js";



export const getHospitalDetail = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    /* =================================================
       1️⃣ Resolve hospitalBasicId from either User._id or HospitalBasic._id
    ================================================== */
    let hospitalBasicId = id;

    // Check if id is a User._id (hospitalId stored in User)
    const userCheck = await User.findById(id).lean();
    if (userCheck?.hospitalId) {
      hospitalBasicId = userCheck.hospitalId;
    }

    const hospital = await HospitalBasic.findById(hospitalBasicId).populate("userId", "name email contactNumber nh12").lean();

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    const hospitalRealId = hospital._id;

    /* =================================================
       2️⃣ Contact Person
    ================================================== */
    const contactPerson = await HospitalContact.findOne({
      hospitalId: hospitalBasicId,
    }).lean();

    /* =================================================
       3️⃣ Address (if stored in HospitalBasic)
    ================================================== */
    const address = hospital.address || null;

    /* =================================================
       4️⃣ Images (if stored in HospitalBasic)
    ================================================== */
    const images = hospital.images || null;

    /* =================================================
       5️⃣ Documents (license, certificate)
    ================================================== */
    const documents = hospital.documents || null;

    /* =================================================
       5b️⃣ Hospital Images
    ================================================== */
    const hospitalImages = await HospitalImage.find({ hospitalId: hospitalBasicId }).lean();

    /* =================================================
       5c️⃣ Hospital Certificates
    ================================================== */
    const certificates = await HospitalCertificate.find({ hospitalId: hospitalBasicId }).lean();

    /* =================================================
       5d️⃣ Hospital Address
    ================================================== */
    const hospitalAddress = await HospitalAddress.findOne({ hospitalId: hospitalBasicId })
      .populate("country", "name")
      .populate("state", "name")
      .populate("city", "name")
      .lean();




    /* =================================================
       FINAL RESPONSE
    ================================================== */

    res.json({
      success: true,
      hospital,
      contactPerson,
      address: hospitalAddress || address,
      images: hospitalImages.length ? hospitalImages : images,
      documents,
      certificates,
    });

  } catch (error) {
    console.error("getHospitalDetail error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const deleteHospital = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    // 1️⃣ Check hospital exists
    const hospital = await HospitalBasic.findById(id).session(session);

    if (!hospital) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    // 2️⃣ Delete all contacts of this hospital
    await HospitalContact.deleteMany(
      { hospitalId: hospital._id },
      { session }
    );

    // 3️⃣ Delete hospital
    await HospitalBasic.deleteOne(
      { _id: hospital._id },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: "Hospital and related contacts deleted successfully",
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getHospitals = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", status } = req.query;

    const query = {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { nh12: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { contactNumber: { $regex: search, $options: "i" } },
      ],
      role: "hospital"
    };
    // 1️⃣ Hospitals
    const hospitals = await User.find(query).select('name email nh12 contactNumber hospitalId').populate("hospitalId")
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 })
      .lean(); // IMPORTANT

    // 2️⃣ Hospital IDs
    const hospitalIds = hospitals.map(h => h.hospitalId?._id);

    // 3️⃣ Contacts
    const contacts = await HospitalContact.find({
      hospitalId: { $in: hospitalIds }
    }).lean();

    const address = await HospitalAddress.find({
      hospitalId: { $in: hospitalIds }
    }).select('fullAddress hospitalId').lean();

    // 4️⃣ Map contacts by hospitalId
    const contactMap = {};
    contacts.forEach(c => {
      contactMap[c.hospitalId.toString()] = c;
    });

    const addresMap = {};
    address.forEach(c => {
      addresMap[c.hospitalId.toString()] = c;
    });

    // 5️⃣ Merge contact into hospital
    const finalData = hospitals.map(h => ({
      ...h,
      contact: contactMap[h?.hospitalId?._id.toString()] || null,
      address: addresMap[h?.hospitalId?._id?.toString()] || null,
    }));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: finalData,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });

  } catch (err) {
    console.log(err)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const getHospitalRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", status } = req.query;

    const query = {
      $or: [
        { hospitalName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { mobileNo: { $regex: search, $options: "i" } },
      ],
      logoFileId: { $exists: true }
    };
    if (status && status !== "all") {
      query.kycStatus = status
    } else {
      query.kycStatus = { $in: ["pending", "rejected"] }
    }
    // 1️⃣ Hospitals
    const hospitals = await HospitalBasic.find(query).populate("userId", "name email nh12 contactNumber")
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 })
      .lean(); // IMPORTANT

    // 2️⃣ Hospital IDs
    const hospitalIds = hospitals.map(h => h._id);

    // 3️⃣ Contacts
    const contacts = await HospitalContact.find({
      hospitalId: { $in: hospitalIds }
    }).lean();

    const address = await HospitalAddress.find({
      hospitalId: { $in: hospitalIds }
    }).select('fullAddress hospitalId').lean();

    // 4️⃣ Map contacts by hospitalId
    const contactMap = {};
    contacts.forEach(c => {
      contactMap[c.hospitalId.toString()] = c;
    });

    const addresMap = {};
    address.forEach(c => {
      addresMap[c.hospitalId.toString()] = c;
    });

    // 5️⃣ Merge contact into hospital
    const finalData = hospitals.map(h => ({
      ...h,
      contact: contactMap[h?._id.toString()] || null,
      address: addresMap[h?._id?.toString()] || null,
    }));

    const total = await HospitalBasic.countDocuments(query);

    res.json({
      success: true,
      data: finalData,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });

  } catch (err) {
    console.log(err)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
export const approveRejectHospital = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const { default: HospitalBasic } = await import("../../models/Hospital/HospitalBasic.js");
    const hosp = await HospitalBasic.findById(id);
    if (!hosp) return res.status(404).json({ success: false, message: "Hospital not found" });
    hosp.kycStatus = status; // hospital uses kycStatus
    if (reason) hosp.rejectReason = reason;
    await hosp.save();
    res.json({ success: true, message: `Hospital ${status}`, data: hosp });
  } catch (err) { res.status(500).json({ success: false, message: "Internal server error" }); }
};

export const getHospitalDoctors = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const search = req.query.search?.trim();

  try {
    const { id } = req.params;

    // Get employed doctors
    const staffEmp = await StaffEmployement.find({
      organizationId: id,
      userRole: "doctor",
    }).select('-password')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const doctorIds = staffEmp.map((emp) => emp.userId);

    // Base filter
    const filter = {
      _id: { $in: doctorIds },
      role: "doctor",
    };

    // Add search only if search exists
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { nh12: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { contactNumber: { $regex: search, $options: "i" } },
      ];
    }

    const doctors = await User.find(filter).select('doctorId nh12 email contactNumber name')
      .populate("doctorId", "profileImage dob");

    const doctorAbout = await DoctorAbout.find({
      userId: { $in: doctorIds },
    })
      .select("specialty hospitalName userId")
      .populate("specialty");

    // Create map
    const doctorAboutMap = {};

    doctorAbout.forEach((d) => {
      doctorAboutMap[d.userId.toString()] = d;
    });

    // Merge data
    const finalData = doctors.map((d) => ({
      ...d.toObject(),
      staffEmp: staffEmp.find((emp) => emp.userId.toString() === d._id.toString()) || null,
      doctorAbout: doctorAboutMap[d._id.toString()] || null,
    }));

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: finalData,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });

  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getHospitalDocApt = async (req, res) => {
  const { id } = req.params;
  try {
    const { page, limit, } = req.query;

    const apt = await DoctorAppointment.find({ hospitalId: id })
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({ path: "patientId", select: "name email nh12 contactNumber patientId", populate: { path: "patientId", select: "profileImage" } })
      .populate({ path: "doctorId", select: "name email nh12 contactNumber doctorIdId", populate: { path: "doctorId", select: "profileImage" } })
      .populate('department', 'departmentName')

    const total = await DoctorAppointment.countDocuments({ hospitalId: id });

    return res.json({ message: "Appointment fetched successfully", success: true, data: apt, total, totalPages: Math.ceil(total / limit), currentPage: page })
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", success: false })
  }
}
export const getHospitalLabApt = async (req, res) => {
  const { id } = req.params;
  try {
    const { page, limit, } = req.query;

    const apt = await LabAppointment.find({ labId: id })
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({ path: "patientId", select: "name email nh12 contactNumber patientId", populate: { path: "patientId", select: "profileImage" } })
      .populate({ path: "tests.subCat.subCatId", select: "subCategory" })


    const total = await LabAppointment.countDocuments({ labId: id });

    return res.json({ message: "Appointment fetched successfully", success: true, data: apt, total, totalPages: Math.ceil(total / limit), currentPage: page })
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", success: false })
  }
}
export const getAllotmentHistory = async (req, res) => {
  const { id } = req.params;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    let filter = { hospitalId: id };


    let query = BedAllotment.find(filter)
      .populate({
        path: "patientId",
        select: "name email nh12 contactNumber",
        populate: { path: "patientId", select: "profileImage" }
      })
      .populate({
        path: "primaryDoctorId",
        select: "name nh12 contactNumber",
        populate: { path: "doctorId", select: "profileImage" }
      })
      .populate("dischargeId", "createdAt").populate('departmentId', 'departmentName')
      .populate({
        path: "bedId",
        populate: [
          {
            path: "floorId",
            select: "floorName",
          },
          { path: "roomId", select: "roomName" }
        ]
      })
      .populate("attendingStaff.staffId", "name")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalRecords = await BedAllotment.countDocuments(filter);
    let allotment = await query.exec();

    if (!allotment.length) {
      return res.status(200).json({
        success: false,
        message: "No allotment history found"
      });
    }

    res.status(200).json({
      success: true,
      data: allotment,
      pagination: {
        totalRecords,
        currentPage: page,
        totalPages: Math.ceil(totalRecords / limit),
        limit
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to load allotment"
    });
  }
};
export const getAllotmentDetails = async (req, res) => {
  try {
    const allotment = await BedAllotment.findById(req.params.id)
      .populate("patientId", "name email contactNumber nh12")
      .populate("primaryDoctorId", "name contactNumber nh12")
      .populate({ path: 'labAppointment', populate: [{ path: 'tests.subCat.subCatId', select: 'subCategory' }] })
      .populate('departmentId', 'departmentName')
      .populate({
        path: "bedId",
        populate: [
          { path: "floorId", select: "floorName" },
          { path: "roomId", select: "roomName" }
        ]
      })
      .populate("attendingStaff.staffId", "name nh12");

    if (!allotment) {
      return res.status(404).json({
        success: false,
        message: "Allotment not found"
      });
    }

    const hospitalPatient = await HospitalPatient.findOne({
      user_id: allotment.patientId._id
    });

    const response = allotment.toObject();
    response.hospitalPatient = hospitalPatient || null;

    res.json({
      success: true,
      data: response
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to load allotment"
    });
  }
};