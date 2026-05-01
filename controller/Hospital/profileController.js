import HospitalBasic from "../../models/Hospital/HospitalBasic.js";
import HospitalImages from "../../models/Hospital/HospitalImage.js";
import HospitalAddress from "../../models/Hospital/HospitalAddress.js";
import HospitalContact from "../../models/Hospital/HospitalContact.js";
import HospitalCertificate from "../../models/Hospital/HospitalCertificate.js";
import Kyc from "../../models/Hospital/KycLog.js";
import User from "../../models/Hospital/User.js";
import bcrypt from "bcryptjs";
import Rating from "../../models/Rating.js";
import Doctor from "../../models/Doctor/doctor.model.js";
import DoctorAbout from "../../models/Doctor/addressAbout.model.js";
import HospitalPermission from "../../models/Hospital/HospitalPermission.model.js";
import DoctorAppointment from "../../models/DoctorAppointment.js";
import BedAllotment from "../../models/Hospital/BedAllotment.js";
import mongoose from "mongoose";
import Test from "../../models/Laboratory/test.model.js";
import Laboratory from "../../models/Laboratory/laboratory.model.js";
import LabAddress from "../../models/Laboratory/labAddress.model.js";
import LabPerson from "../../models/Laboratory/contactPerson.model.js";
import { capitalizeFirst } from "../../utils/globalFunction.js";
import Notification from "../../models/Notifications.js";
import PaymentInfo from "../../models/PaymentInfo.js";
import EditRequest from "../../models/EditRequest.js";
import HospitalAudit from "../../models/Hospital/HospitalAudit.js";
import PatientDepartment from "../../models/Hospital/PatientDepartment.js";
import Department from "../../models/Department.js";
import StaffEmployement from "../../models/Staff/StaffEmployement.js";
import HospitalTransfer from "../../models/Hospital/HospitalTransfer.js";
import HospitalImage from "../../models/Hospital/HospitalImage.js";
import PatientDemographic from "../../models/Patient/demographic.model.js";
import Patient from "../../models/Patient/patient.model.js";

// ================= CHANGE PASSWORD =================
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );

    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err?.message});
  }
};

// ================= GET PROFILE =================
export const getProfile = async (req, res) => {
  try {
    const hospitalId = req.user.created_by_id;

    if (!hospitalId) {
      return res.status(400).json({ message: "Hospital ID missing" });
    }
    const user = await User.findById(req.user.id)
    const basic = await HospitalBasic.findById(hospitalId);
    const address = await HospitalAddress.findOne({ hospitalId }).populate('state country city');
    const paymentInfo = await PaymentInfo.findOne({ userId: req.user.id })?.sort({ createdAt: -1 })

    // CONTACT (with image URL)
    const rawContact = await HospitalContact.findOne({ hospitalId });
    let contact = null;

    if (rawContact) {
      contact = {
        ...rawContact._doc,
        profilePhotoUrl: rawContact.profilePhotoId
          ? `${process.env.BACKEND_URL}/api/file/${rawContact.profilePhotoId}`
          : null
      };
    }

    const certificates = await HospitalCertificate.find({ hospitalId });
    const kyc = await Kyc.findOne({ hospitalId });
    const unRead = await Notification.countDocuments({ userId: req.user.id })

    // Images
    const allImages = await HospitalImages.find({ hospitalId }).sort({ createdAt: -1 });
    const baseUrl = `${process.env.BACKEND_URL}/api/file/`;
    const thumbnail = allImages
      .filter(img => img.type === "thumbnail")
      .map(img => ({
        ...img._doc,
        url: baseUrl + img.fileId
      }));

    const gallery = allImages
      .filter(img => img.type === "gallery")
      .map(img => ({
        ...img._doc,
        url: baseUrl + img.fileId
      }));

    const lastEditRequest = await EditRequest.findOne({ hospitalId: req.user.id }).sort({ createdAt: -1 });



    return res.json({
      success: true,
      message: "Hospital profile fetched",
      profile: {
        basic, user,
        images: {
          thumbnail,
          gallery
        },
        address,
        contact, paymentInfo,
        certificates: certificates.map(c => ({
          ...c._doc,
          url: baseUrl + c.fileId
        })),
        kyc,
        editRequestStatus: lastEditRequest
          ? lastEditRequest.status
          : "none", unRead
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server Error" });
  }
};

// ================= UPDATE PROFILE =================
export const updateProfile = async (req, res) => {
  try {
    const hospitalId = req.user.created_by_id;
    const userId = req.user.id
    const payload = req.body;

    if (!hospitalId) {
      return res.status(400).json({ message: "Hospital ID missing" });
    }
    const baseUrl = `api/file/`;
    if (payload.basic) {
      const exists = await User.findOne({ email: basic.email, _id: { $ne: userId } });
      if (exists)
        return res.status(200).json({ message: "User already exists" });
      const isName = await User.findOne({ name: basic.hospitalName, _id: { $ne: userId } });
      if (isName)
        return res.status(200).json({ message: "This name already exists" });

      const basic = await HospitalBasic.findByIdAndUpdate(
        hospitalId,
        payload.basic,
        { new: true }
      );
      await User.findByIdAndUpdate(userId, { name: basic.hospitalName, email: basic.email }, { new: true })
      await Laboratory.findOneAndUpdate({ userId: userId }, {
        name: basic.hospitalName,
        email: basic.email,
        contactNumber: basic.mobileNo,
        gstNumber: basic.gstNumber,
        about: basic.about,
        logo: baseUrl + basic.logoFieldId,
      }, { new: true })
    }

    if (payload.address) {
      const address = await HospitalAddress.findOneAndUpdate(
        { hospitalId },
        payload.address,
        { upsert: true, new: true }
      );
      await LabAddress.findOneAndUpdate(userId, {
        fullAddress: address.fullAddress,
        cityId: address.city,
        stateId: address.state,
        countryId: address.country,
        pinCode: address.pinCode
      }, { new: true })
    }

    if (payload.contact) {
      const contact = await HospitalContact.findOneAndUpdate(
        { hospitalId },
        payload.contact,
        { upsert: true, new: true }
      );
      await LabPerson.findOneAndUpdate(userId, {
        name: contact.name,
        email: contact.email,
        contactNumber: contact.mobileNumber,
        photo: baseUrl + contact.profilePhotoId,
        gender: capitalizeFirst(contact.gender)
      }, { new: true })
    }

    res.json({ message: "Profile updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err?.message});
  }
};

// ================= SEND EDIT REQUEST =================
export const sendEditRequest = async (req, res) => {
  try {
    const hospitalId = req.user.id;
    const { note } = req.body;

    const reqDoc = await EditRequest.create({
      hospitalId,
      message: note, type: "hospital"
    });

    res.json({
      message: "Edit request submitted",
      request: reqDoc
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err?.message});
  }
};

// ================= APPROVE EDIT REQUEST (ADMIN) =================
export const approveEditRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const reqDoc = await EditRequest.findByIdAndUpdate(
      requestId,
      { status: "approved" },
      { new: true }
    );

    if (!reqDoc) {
      return res.status(404).json({ message: "Request not found" });
    }

    await HospitalBasic.findByIdAndUpdate(
      reqDoc.hospitalId,
      { kycStatus: "approved" }
    );

    res.json({ message: "Edit request approved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err?.message});
  }
};

export const getHospitals = async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const name = req.query.name

  try {
    // 1️⃣ Fetch hospital users
    const filter = {}
    if (name) {
      filter.hospitalName = { $regex: name, $options: "i" };
    }
    const users = await HospitalBasic.find(filter).select('hospitalName logoFileId userId')
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();
    const hospitalIds = users.map(item => item._id)
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

    // 4️⃣ Merge everything
    const finalData = users.map(user => ({
      ...user, logo: user.logoFileId ? `api/file/${user?.logoFileId}` : null,
      address: addressMap[user._id.toString()] || null,
      avgRating: ratingMap[user._id.toString()]?.avgRating || 0,
      totalReviews: ratingMap[user._id.toString()]?.totalReviews || 0
    }));


    const total = await HospitalBasic.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: finalData,
      pagination: {
        total,
        totalPage: Math.ceil(total / limit),
        currentPage: page
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
export const hospitalDashboard = async (req, res) => {
  try {
    const hospitalId = req.user.id;
    if (!hospitalId) {
      return res.status(400).json({ message: "Hospital ID missing" });
    }
    // Total Appointments
    const totalAppointments = await DoctorAppointment.countDocuments({ hospitalId });
    // Completed Appointments
    const completedAppointments = await DoctorAppointment.countDocuments({ hospitalId, status: 'completed' });
    // Pending Appointments
    const pendingAppointments = await DoctorAppointment.countDocuments({ hospitalId, status: 'pending' });

    const totalDoctors = await StaffEmployement.countDocuments({ organizationId: hospitalId });
    const totalAppointment = await DoctorAppointment.countDocuments({ hospitalId });
    const uniquePatient = await PatientDepartment.distinct('patientId', { hospitalId });
    const totalPatients = uniquePatient.length;
    const totalDepartments = await Department.countDocuments({ userId: hospitalId });
    const totalStaffs = await StaffEmployement.countDocuments({ organizationId: hospitalId });
    const bookedBed = await BedAllotment.countDocuments({ hospitalId, status: 'Active' });
    const departments = await Department.aggregate([
      {
        $match: { userId: new mongoose.Types.ObjectId(hospitalId) }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: "doctor-employments",
          localField: "_id",
          foreignField: "department",
          as: "doctors"
        }
      },
      {
        $addFields: {
          doctorCount: { $size: "$doctors" }
        }
      },
      {
        $project: {
          doctors: 0 // doctor list hide kar di, sirf count rakha
        }
      }
    ]);
    const [images, address, person, license] = await Promise.all([
      HospitalImage.findOne({ hospitalId: req.user.created_by_id }),
      HospitalAddress.findOne({ hospitalId: req.user.created_by_id }),
      HospitalContact.findOne({ hospitalId: req.user.created_by_id }),
      HospitalCertificate.findOne({ hospitalId: req.user.created_by_id })
    ])
    let nextStep = null;
    let profileComplete = 100

    if (!images) {
      profileComplete -= 20;
      if (!nextStep) nextStep = "/create-account-image";
    }

    if (!address) {
      profileComplete -= 20;
      if (!nextStep) nextStep = "/create-account-address";
    }

    if (!person) {
      profileComplete -= 20;
      if (!nextStep) nextStep = "/create-account-person";
    }

    if (!license) {
      profileComplete -= 20;
      if (!nextStep) nextStep = "/create-account-upload";
    }

    return res.status(200).json({
      success: true, departments, nextStep, profileComplete,
      data: {
        totalAppointments,
        completedAppointments, bookedBed,
        pendingAppointments, totalPatients, totalStaffs,
        totalDoctors, totalDepartments, totalAppointment
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server Error" });
  }
}
export const getHospitalList = async (req, res) => {

  try {
    const users = await HospitalBasic.find().sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      success: true,
      data: users,

    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
export const getHospitalProfile = async (req, res) => {
  try {
    const hospitalId = req.params.id;

    if (!hospitalId) {
      return res.status(400).json({ message: "Hospital ID missing" });
    }
    const user = await User.findOne({ created_by_id: hospitalId, role: "hospital" }).select('name email')
    const basic = await HospitalBasic.findById(hospitalId);
    const address = await HospitalAddress.findOne({ hospitalId });
    const rawContact = await HospitalContact.findOne({ hospitalId });
    let contact = null;

    if (rawContact) {
      contact = {
        ...rawContact._doc,
        profilePhotoUrl: rawContact.profilePhotoId
          ? `${process.env.BACKEND_URL}://${req.get("host")}/api/file/${rawContact.profilePhotoId}`
          : null
      };
    }
    const certificates = await HospitalCertificate.find({ hospitalId });
    // Images
    const allImages = await HospitalImages.find({ hospitalId });
    const baseUrl = `${process.env.BACKEND_URL}://${req.get("host")}/api/file/`;
    const thumbnail = allImages
      .filter(img => img.type === "thumbnail")
      .map(img => ({
        ...img._doc,
        url: baseUrl + img.fileId
      }));
    // const filter = { hospitalId: user._id }
    // const query = { role: 'doctor' };
    // const users = await EmpEmployement.find(filter).select('userId')
    // const usersIds = users.map(item => item.userId)
    // query._id = { $in: usersIds };

    // const [staff, total] = await Promise.all([
    //   User.find(query)
    //     .populate('doctorId')
    //     .select("-passwordHash")
    //     .sort({ createdAt: -1 })
    //     .limit(10),
    //   User.countDocuments(query)
    // ]);

    // const userIds = staff.map(user => user._id);

    // const doctorAbouts = await DoctorAbout.find({ userId: { $in: userIds } }).populate('specialty treatmentAreas', 'name');
    // const doctorEmp = await EmpEmployement.find({ userId: { $in: userIds } });
    // const ratingStats = await Rating.aggregate([
    //   {
    //     $match: {
    //       doctorId: { $in: userIds }
    //     }
    //   },
    //   {
    //     $group: {
    //       _id: "$doctorId",
    //       avgRating: { $avg: "$star" },
    //       totalReviews: { $sum: 1 }
    //     }
    //   }
    // ]);
    // const ratingMap = {};
    // ratingStats.forEach(r => {
    //   ratingMap[r._id.toString()] = {
    //     avgRating: Number(r.avgRating.toFixed(1)),
    //     totalReviews: r.totalReviews
    //   };
    // });
    // const staffWithAbout = staff.map(user => {
    //   const about = doctorAbouts.find(da => da.userId.toString() === user._id.toString());
    //   const employement = doctorEmp.find(da => da.userId.toString() === user._id.toString());

    //   return {
    //     ...user.toObject(),
    //     doctorAbout: about || null,
    //     avgRating: ratingMap[user._id.toString()]?.avgRating || 0,
    //     fees: employement?.fees || null,
    //   };
    // });

    return res.json({
      message: "Hospital profile fetched",
      success: true,
      // doctors: staffWithAbout,
      profile: {
        basic, user,
        images: {
          thumbnail,
        },
        address,
        contact,
        certificates: certificates.map(c => ({
          ...c._doc,
          url: baseUrl + c.fileId
        })),
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server Error" });
  }
};
export const getHospitalDoctorList = async (req, res) => {
  try {
    const hospitalId = req.params.id;
    const {
      page = 1,
      limit = 10,
      search = "",
      department,
      status
    } = req.query;

    const skip = (page - 1) * limit;

    const query = { role: 'doctor' };

    if (search) {
      query.$or = [
        { "name": { $regex: search, $options: "i" } },
        { "email": { $regex: search, $options: "i" } },
      ];
    }
    const filter = { hospitalId }
    if (status) {
      filter.status = status;
    }
    const users = await StaffEmployement.find(filter).select('userId')
    const usersIds = users.map(item => item.userId)
    query._id = { $in: usersIds };

    const [staff, total] = await Promise.all([
      User.find(query)
        .populate('doctorId', 'profileImage')
        .select("name email contactNumber")
        .sort({ createdAt: -1 })
        .skip(Number(skip))
        .limit(Number(limit)),
      User.countDocuments(query)
    ]);

    const userIds = staff.map(user => user._id);

    const doctorAbouts = await DoctorAbout.find({ userId: { $in: userIds } }).select('fullAddress hospitalName userId specialty').populate('specialty', 'name');

    const doctorEmp = await StaffEmployement.find({ userId: { $in: userIds } });


    const ratingStats = await Rating.aggregate([
      {
        $match: {
          doctorId: { $in: userIds }
        }
      },
      {
        $group: {
          _id: "$doctorId",
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
    const staffWithAbout = staff.map(user => {
      const about = doctorAbouts.find(da => da.userId.toString() === user._id.toString());
      const employement = doctorEmp.find(da => da.userId.toString() === user._id.toString());

      return {
        ...user.toObject(),
        doctorAbout: about || null,
        avgRating: ratingMap[user._id.toString()]?.avgRating || 0,
        fees: employement?.fees || null,
      };
    });
    res.json({
      success: true,
      data: staffWithAbout,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (err) {
    console.log(err)
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
export const getAllPermission = async (req, res) => {
  const id = req.params.id;
  let { page = 1, limit = 10, name } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);

  try {
    const filter = { hospitalId: id };
    if (name && name !== 'null') {
      filter.name = { $regex: name, $options: "i" };
    }

    const hospitaloratory = await User.findById(id);

    if (!hospitaloratory) {
      return res.status(200).json({
        message: "Hospitaloratory not found",
        success: false
      });
    }

    const total = await HospitalPermission.countDocuments(filter);

    const permissions = await HospitalPermission.find(filter)
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      message: "Hospitaloratory permissions fetched successfully",
      data: permissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      success: true
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: 'Server Error',
      success: false
    });
  }
};

export const addHospitalPermission = async (req, res) => {
  try {
    const { name, hospitalId, ...permissions } = req.body;
    const isExist = await User.findById(hospitalId);
    if (!isExist) return res.status(200).json({ message: "Hospitaloratory not found", success: false })


    if (!name || !hospitalId) {
      return res.status(400).json({
        success: false,
        message: "name and hospitalId are required"
      });
    }

    const existing = await HospitalPermission.findOne({ name, hospitalId });

    if (existing) {
      const updated = await HospitalPermission.findByIdAndUpdate(
        existing._id,
        { ...permissions },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        message: "Permission updated successfully",
        data: updated
      });
    }

    const created = await HospitalPermission.create({
      name,
      hospitalId,
      ...permissions
    });

    return res.status(200).json({
      success: true,
      message: "Permission created successfully",
      data: created
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
export const updateHospitalPermission = async (req, res) => {
  try {
    const { name, permissionId, hospitalId, ...permissions } = req.body;
    const isExist = await User.findById(hospitalId);
    if (!isExist) return res.status(200).json({ message: "Hospital not found", success: false })
    const isPermExist = await HospitalPermission.findById(permissionId);
    if (!isPermExist) return res.status(200).json({ message: "Permission not found", success: false })

    if (!name || !hospitalId) {
      return res.status(400).json({
        success: false,
        message: "name and hospitalId are required"
      });
    }
    const updated = await HospitalPermission.findByIdAndUpdate(
      isPermExist._id,
      { ...permissions, name },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Permission updated successfully",
      data: updated
    });


  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
export const deleteHospitalPermission = async (req, res) => {
  const { permissionId, hospitalId } = req.body;
  try {
    const isHospitalExist = await User.findById(hospitalId);
    if (!isHospitalExist) return res.status(200).json({ message: "Hospitaloratory not found", success: false })
    const isExist = await HospitalPermission.findById(permissionId);
    if (!isExist) return res.status(200).json({ message: "Hospitaloratory permission not found", success: false })

    const delPerm = await HospitalPermission.findByIdAndDelete(permissionId);

    if (delPerm) {
      return res.status(200).json({
        success: true,
        message: "Permission deleted successfully",
      });
    }
    return res.status(200).json({
      success: false,
      message: "Permission not deleted"
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}
export const getProfileDetail = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Hospital ID missing" });
    }

    const basic = await HospitalBasic.findById(id);
    const address = await HospitalAddress.findOne({ hospitalId: id }).populate('state country city');
    const certificates = await HospitalCertificate.find({ hospitalId: id });
    // Images
    const allImages = await HospitalImages.find({ hospitalId: id });
    const baseUrl = `${process.env.BACKEND_URL}://${req.get("host")}/api/file/`;
    const thumbnail = allImages
      .filter(img => img.type === "thumbnail")
      .map(img => ({
        ...img._doc,
        url: baseUrl + img.fileId
      }));

    const gallery = allImages
      .filter(img => img.type === "gallery")
      .map(img => ({
        ...img._doc,
        url: baseUrl + img.fileId
      }));
    const labTest = await Test.find({ type: "hospital", hospitalId: basic.userId })




    return res.json({
      success: true,
      message: "Hospital profile fetched", labTest,
      profile: {
        basic,
        images: {
          thumbnail,
          gallery
        },
        address,
        certificates: certificates.map(c => ({
          ...c._doc,
          url: baseUrl + c.fileId
        })),

      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server Error" });
  }
};
export const getAuditLog = async (req, res) => {
  try {
    const hospitalId = req.user.id;

    // Get page & limit from query (defaults)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    // Fetch paginated data
    const audit = await HospitalAudit
      .find({ hospitalId }).populate('actionUser')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Total count for frontend pagination
    const total = await HospitalAudit.countDocuments({ hospitalId });

    res.status(200).json({
      message: 'Audit fetched successfully',
      data: audit,
      success: true,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const addHospitalService = async (req, res) => {
  const hospitalId = req.user.id || req.user.userId
  const { services } = req.body
  try {
    const isUser = await User.findById(hospitalId)
    if (!isUser) {
      return res.status(404).json({ message: "User not found", success: false })
    }
    const data = await HospitalBasic.findByIdAndUpdate(isUser.hospitalId, { services }, { new: true })
    if (data) {
      return res.status(200).json({ message: "Services update", success: true })
    }
    return res.status(404).json({ message: "User not found", success: false })
  } catch (error) {
    return res.status(500).json({ message: error?.message })
  }
}
export const createTransfer = async (req, res) => {
  const hospitalId = req.user.id || req.user.userId
  const { toHospital, patientId, reason, departmentFrom, departmentTo, status, transferDate, receivingDoctor, fromAllotment } = req.body;
  if (!toHospital || !patientId || !departmentFrom || !departmentTo || !receivingDoctor) {
    return res.status(400).json({ message: "All fields are required", success: false })
  }
  try {
    const isStaffUser = await User.findOne({ nh12: receivingDoctor, role: "doctor" })
    if (!isStaffUser) {
      return res.status(404).json({ message: "Receiving doctor not found", success: false })
    }
    const isHospital = await User.findOne({ nh12: toHospital, role: "hospital" })
    if (!isHospital) {
      return res.status(404).json({ message: "Receiving hospital not found", success: false })
    }
    const isStaff = await StaffEmployement.findOne({ organizationId: isHospital._id, userId: isStaffUser._id, status: "active" })
    if (!isStaff) {
      return res.status(404).json({ message: "Receiving doctor is not working in receiving hospital", success: false })
    }
    const isDepartment = await Department.findOne({ _id: departmentTo, userId: isHospital._id })
    if (!isDepartment) {
      return res.status(404).json({ message: "Receiving department not found in receiving hospital", success: false })
    }
    const isAllotment = await BedAllotment.findById(fromAllotment)
    if (!isAllotment) {
      return res.status(404).json({ message: "Allotment not found", success: false })
    }
    let documentShared = { dischargeSummary: null, labReports: null, prescriptions: null }
    if (req.body.documentShared?.dischargeSummary) {
      documentShared.dischargeSummary = isAllotment.dischargeId
    }
    if (req.body.documentShared?.labReports) {
      documentShared.labReports = isAllotment.reportIds
    }
    if (req.body.documentShared?.prescriptions) {
      documentShared.prescriptions = isAllotment.prescriptionId
    }
    const transfer = new HospitalTransfer({
      ...req.body, documentShared,sendingDoctor:isAllotment.primaryDoctorId,
      toHospital: isHospital._id, fromHospital: hospitalId, receivingDoctor: isStaffUser._id
    });
    const savedTransfer = await transfer.save();
    isAllotment.transferid=savedTransfer?._id
    res.status(201).json({
      success: true,
      data: savedTransfer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating transfer",
      error: error.message,
    });
  }
};
export const getHospitalDepartments = async (req, res) => {
  const hospitalId = req.params.id
  try {
    const isHospital = await User.findOne({ nh12: hospitalId, role: "hospital" })
    if (!isHospital) {
      return res.status(404).json({ message: "Hospital not found", success: false })
    }
    const departments = await Department.find({
      userId: isHospital._id,
      $or: [{ type: "IPD" }, { type: "OPD" }]
    }).select('departmentName').sort({ createdAt: -1 })
    res.status(200).json({ message: "Departments fetched", success: true, data: departments })
  } catch (error) {
    return res.status(500).json({ message: error?.message })
  }
}
export const IpdPatientsList = async (req, res) => {
  try {
    const hospitalId = req.user._id || req.user.id;
    const deptType = req.query.deptType
    const status = req.query.status?.trim(); // could be "Active", "Inactive", etc.
    let { page = 1, limit = 10, search = "", unique = "" } = req.query;

    page = Math.max(Number(page), 1);
    limit = Number(limit);
    search = search.trim();

    const matchStage = {
      role: "patient"
    };

    if (search.length > 0) {
      matchStage.$or = [
        { name: { $regex: search, $options: "i" } },
        {
          $expr: {
            $regexMatch: {
              input: { $toString: "$patientId" },
              regex: search,
              options: "i"
            }
          }
        },
        {
          $expr: {
            $regexMatch: {
              input: { $toString: "$email" },
              regex: search,
              options: "i"
            }
          }
        }
      ];
    }



    const pipeline = [
      { $match: matchStage },

      // 🔗 Join PatientDepartment
      {
        $lookup: {
          from: "patientdepartments",
          localField: "_id",
          foreignField: "patientId",
          as: "departmentInfo"
        }
      },

      {
        $unwind: {
          path: "$departmentInfo",
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $lookup: {
          from: "bedallotments",
          localField: "departmentInfo.allotmentId",
          foreignField: "_id",
          as: "allotmentInfo"
        }
      },

      {
        $unwind: {
          path: "$allotmentInfo",
          preserveNullAndEmptyArrays: true
        }
      },

      // 🏥 Filter hospital
      {
        $match: {
          "departmentInfo.hospitalId": hospitalId
        }
      },

      // 🔗 Join department details
      {
        $lookup: {
          from: "departments",
          localField: "departmentInfo.departmentId",
          foreignField: "_id",
          as: "departmentDetails"
        }
      },

      {
        $unwind: {
          path: "$departmentDetails",
          preserveNullAndEmptyArrays: false
        }
      },

      // ✅ Apply filters FIRST
      ...(deptType
        ? [{
          $match: {
            "departmentDetails.type": deptType
          }
        }]
        : []),

      ...(status
        ? [{
          $match: {
            "departmentInfo.status": status
          }
        }]
        : []),

      // ✅ Sort (latest first)
      {
        $sort: { "departmentInfo.createdAt": -1 }
      },

      // ✅ Apply unique AFTER filtering
      ...(unique === "true"
        ? [
          {
            $group: {
              _id: "$_id", // group by patient
              doc: { $first: "$$ROOT" }
            }
          },
          {
            $replaceRoot: { newRoot: "$doc" }
          }
        ]
        : []),

      // 🔗 Join patient extra info
      {
        $lookup: {
          from: "patients",
          localField: "patientId",
          foreignField: "_id",
          as: "patientUser"
        }
      },

      {
        $unwind: {
          path: "$patientUser",
          preserveNullAndEmptyArrays: true
        }
      },

      // ❌ Remove sensitive fields
      {
        $project: {
          passwordHash: 0,
          fcmToken: 0,
          walletBalance: 0,
          lastSeen: 0,
          isOnline: 0,
          createdAt: 0,
          role: 0,
          created_by: 0,
          "patientUser.password": 0,
          "patientUser.name": 0,
          "patientUser.email": 0,
          "patientUser.createdAt": 0,
          "patientUser.updatedAt": 0,
        }
      },

      // 📄 Pagination
      {
        $facet: {
          data: [
            { $skip: (page - 1) * limit },
            { $limit: limit }
          ],
          totalCount: [
            { $count: "count" }
          ]
        }
      }
    ];

    const result = await User.aggregate(pipeline);
    const patients = result[0].data;
    const total = result[0].totalCount[0]?.count || 0;

    res.json({
      success: true,
      data: patients,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export const getPatientTransferLetter=async(req,res)=>{
  const id=req.params.id
  try {
    const isExist=await HospitalTransfer.findById(id).populate('fromHospital toHospital sendingDoctor receivingDoctor patientId','name nh12 email contactNumber')
    .populate('departmentTo departmentFrom','departmentName')
    if(!isExist){
      return res.status(404).json({ message: "Transfer data not found" ,success:false})
    }
    const hospitalUser=await User.findById(isExist.fromHospital?._id).select('nh12 name email contactNumber hospitalId').lean()
    const hospitalAddress=await HospitalAddress.findOne({hospitalId:hospitalUser?.hospitalId}).populate('city country state','name').lean()
    const ptDemo=await PatientDemographic.findOne({userId:isExist.patientId?._id}).select('fullAddress bloodGroup dob').lean()
    const ptPersonal=await Patient.findOne({userId:isExist.patientId?._id}).select('gender').lean()
    const patientData={...ptDemo,...ptPersonal}
    const organization={...hospitalUser,...hospitalAddress}
    return res.status(200).json({message:"Hospital Transfer data fetched",data:isExist,organization,patientData,success:true})


  } catch (error) {
    return res.status(500).json({ message: error?.message ,success:false})
  }
}