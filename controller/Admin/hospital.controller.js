import mongoose from "mongoose";
import HospitalBasic from "../../models/Hospital/HospitalBasic.js";
import HospitalContact from "../../models/Hospital/HospitalContact.js";
import HospitalImage from "../../models/Hospital/HospitalImage.js";
import HospitalCertificate from "../../models/Hospital/HospitalCertificate.js";
import HospitalAddress from "../../models/Hospital/HospitalAddress.js";
import User from "../../models/Hospital/User.js";
import DoctorAbout from "../../models/Doctor/addressAbout.model.js";
import StaffEmployement from "../../models/Staff/StaffEmployement.js";



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

    const hospital = await HospitalBasic.findById(hospitalBasicId).lean();

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
      hospitalId: id,
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
    const hospitalImages = await HospitalImage.find({ hospitalId: hospitalRealId }).lean();

    /* =================================================
       5c️⃣ Hospital Certificates
    ================================================== */
    const certificates = await HospitalCertificate.find({ hospitalId: hospitalRealId }).lean();

    /* =================================================
       5d️⃣ Hospital Address
    ================================================== */
    const hospitalAddress = await HospitalAddress.findOne({ hospitalId: hospitalRealId })
      .populate("country", "name")
      .populate("state",   "name")
      .populate("city",    "name")
      .lean();

    /* =================================================
       5e️⃣ Hospital User (for unique_id)
    ================================================== */
    const hospitalUser = await User.findOne({ hospitalId: hospitalRealId }).select("unique_id name").lean();

    /* =================================================
       6️⃣ Doctors List (for Doctor List tab)
    ================================================== */

    const employments = await StaffEmployement.find({
      organizationId: hospital?._id,
      status: "active"
    }).select("userId");

    const userIds = employments.map(e => e.userId);

    const doctors = await User.find({
      _id: { $in: userIds },
      role: "doctor"
    })
      .populate("doctorId")
      .select("-passwordHash")
      .lean();

    /* ---- Attach Doctor About ---- */

    const abouts = await DoctorAbout.find({
      userId: { $in: userIds }
    }).populate("specialty");

    const doctorsWithDetails = doctors.map(d => {
      const about = abouts.find(
        a => a.userId.toString() === d._id.toString()
      );

      return {
        ...d,
        about: about || null
      };
    });

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
      doctors: doctorsWithDetails,
      uniqueId: hospitalUser?.unique_id || ""
    });

  } catch (error) {
    console.error("getHospitalDetail error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
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
      message: error.message,
    });
  }
};

export const getHospitals = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" ,status} = req.query;

    const query = {
      hospitalName: { $regex: search, $options: "i" },      
    };
    if(status && status!=="all"){
      query.kycStatus=status
    } 

    // 1️⃣ Hospitals
    const hospitals = await HospitalBasic.find(query).populate("userId","nh12")
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
      contact: contactMap[h._id.toString()] || null,
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
      message: err.message
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
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
