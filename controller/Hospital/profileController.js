import HospitalBasic from "../../models/Hospital/HospitalBasic.js";
import HospitalImages from "../../models/Hospital/HospitalImage.js";
import HospitalAddress from "../../models/Hospital/HospitalAddress.js";
import HospitalContact from "../../models/Hospital/HospitalContact.js";
import HospitalCertificate from "../../models/Hospital/HospitalCertificate.js";
import Kyc from "../../models/Hospital/KycLog.js";
import EditRequest from "../../models/Hospital/HospitalEditRequest.js";
import User from "../../models/Hospital/User.js";
import bcrypt from "bcryptjs";
import Rating from "../../models/Rating.js";
import Doctor from "../../models/Doctor/doctor.model.js";
import DoctorAbout from "../../models/Doctor/addressAbout.model.js";
import HospitalPermission from "../../models/Hospital/HospitalPermission.model.js";
import DoctorAppointment from "../../models/DoctorAppointment.js";
import EmpEmployement from "../../models/Hospital/DoctorEmployement.js";
import HospitalDepartment from "../../models/Hospital/HospitalDepartment.js";
import HospitalStaff from "../../models/Hospital/HospitalStaff.js";
import BedAllotment from "../../models/Hospital/BedAllotment.js";
import mongoose from "mongoose";
import Test from "../../models/Laboratory/test.model.js";

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
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET PROFILE =================
export const getProfile = async (req, res) => {
  try {
    const hospitalId = req.user.created_by_id;

    if (!hospitalId) {
      return res.status(400).json({ message: "Hospital ID missing" });
    }

    const basic = await HospitalBasic.findById(hospitalId);
    const address = await HospitalAddress.findOne({ hospitalId }).populate('state country city');

    // CONTACT (with image URL)
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
    const kyc = await Kyc.findOne({ hospitalId });

    // Images
    const allImages = await HospitalImages.find({ hospitalId });
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

    const lastEditRequest = await EditRequest
      .findOne({ hospitalId })
      .sort({ createdAt: -1 });



    return res.json({
      message: "Hospital profile fetched",
      profile: {
        basic,
        images: {
          thumbnail,
          gallery
        },
        address,
        contact,
        certificates: certificates.map(c => ({
          ...c._doc,
          url: baseUrl + c.fileId
        })),
        kyc,
        editRequestStatus: lastEditRequest
          ? lastEditRequest.status
          : "none"
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
    const payload = req.body;

    if (!hospitalId) {
      return res.status(400).json({ message: "Hospital ID missing" });
    }

    if (payload.basic) {
      await HospitalBasic.findByIdAndUpdate(
        hospitalId,
        payload.basic,
        { new: true }
      );
    }

    if (payload.address) {
      await HospitalAddress.findOneAndUpdate(
        { hospitalId },
        payload.address,
        { upsert: true, new: true }
      );
    }

    if (payload.contact) {
      await HospitalContact.findOneAndUpdate(
        { hospitalId },
        payload.contact,
        { upsert: true, new: true }
      );
    }

    res.json({ message: "Profile updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= SEND EDIT REQUEST =================
export const sendEditRequest = async (req, res) => {
  try {
    const hospitalId = req.user.created_by_id;
    const userId = req.user._id;
    const { note } = req.body;

    const reqDoc = await EditRequest.create({
      hospitalId,
      userId,
      note
    });

    res.json({
      message: "Edit request submitted",
      request: reqDoc
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
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
    res.status(500).json({ message: "Server error" });
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
    const users = await HospitalBasic.find(filter)
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
      ...user,
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

    const totalDoctors = await EmpEmployement.countDocuments({ hospitalId });
    const totalAppointment = await DoctorAppointment.countDocuments({ hospitalId });
    const uniquePatient = await DoctorAppointment.distinct('patientId', { hospitalId });
    const totalPatients = uniquePatient.length;
    const totalDepartments = await HospitalDepartment.countDocuments({ hospitalId });
    const totalStaffs = await HospitalStaff.countDocuments({ hospitalId });
    const bookedBed = await BedAllotment.countDocuments({ hospitalId, status: { $in: ['Active'] } });
    const departments = await HospitalDepartment.aggregate([
      {
        $match: { hospitalId: new mongoose.Types.ObjectId(hospitalId) }
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


    return res.status(200).json({
      success: true, departments,
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
    const filter = { hospitalId: user._id }
    const query = { role: 'doctor' };
    const users = await EmpEmployement.find(filter).select('userId')
    const usersIds = users.map(item => item.userId)
    query._id = { $in: usersIds };

    const [staff, total] = await Promise.all([
      User.find(query)
        .populate('doctorId')
        .select("-passwordHash")
        .sort({ createdAt: -1 })
        .limit(10),
      User.countDocuments(query)
    ]);

    const userIds = staff.map(user => user._id);

    const doctorAbouts = await DoctorAbout.find({ userId: { $in: userIds } }).populate('specialty','name');
    const doctorEmp = await EmpEmployement.find({ userId: { $in: userIds } });


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

    return res.json({
      message: "Hospital profile fetched",
      success: true,
      doctors: staffWithAbout,
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
    const users = await EmpEmployement.find(filter).select('userId')
    const usersIds = users.map(item => item.userId)
    query._id = { $in: usersIds };

    const [staff, total] = await Promise.all([
      User.find(query)
        .populate('doctorId')
        .select("-passwordHash")
        .sort({ createdAt: -1 })
        .skip(Number(skip))
        .limit(Number(limit)),
      User.countDocuments(query)
    ]);

    const userIds = staff.map(user => user._id);

    const doctorAbouts = await DoctorAbout.find({ userId: { $in: userIds } });
    const doctorEmp = await EmpEmployement.find({ userId: { $in: userIds } });


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
    const {id} = req.params;

    if (!id) {
      return res.status(400).json({ message: "Hospital ID missing" });
    }

    const basic = await HospitalBasic.findById(id);
    const address = await HospitalAddress.findOne({ hospitalId:id }).populate('state country city');
    const certificates = await HospitalCertificate.find({ hospitalId:id });  
    // Images
    const allImages = await HospitalImages.find({ hospitalId:id });
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
    const labTest=await Test.find({type:"hospital",hospitalId:basic.userId})




    return res.json({success:true,
      message: "Hospital profile fetched",labTest,
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
