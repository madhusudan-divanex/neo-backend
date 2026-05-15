import DoctorAbout from "../../models/Doctor/addressAbout.model.js";
import Doctor from "../../models/Doctor/doctor.model.js";
import EditRequest from "../../models/EditRequest.js";
import HospitalAddress from "../../models/Hospital/HospitalAddress.js";
import HospitalContact from "../../models/Hospital/HospitalContact.js";
import LabPerson from "../../models/Laboratory/contactPerson.model.js";
import LabAddress from "../../models/Laboratory/labAddress.model.js";
import PatientDemographic from "../../models/Patient/demographic.model.js";
import Patient from "../../models/Patient/patient.model.js";
import PharPerson from "../../models/Pharmacy/contactPerson.model.js";
import Inventory from "../../models/Pharmacy/inventory.model.js";
import MedicineRequest from "../../models/Pharmacy/medicineRequest.model.js";
import PharAddress from "../../models/Pharmacy/pharmacyAddress.model.js";

export const getEditRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { type, status, search } = req.query;

    const filter = {};
    if (type && type !== "all") filter.type = type;
    if (status && status !== "all") filter.status = status;
    let match = {};
    if (search) {
      match = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { nh12: { $regex: search, $options: "i" } }
        ]
      };
    }

    if (type == "hospital") {
      const requests = await EditRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "hospitalId",
          match: match,
          select: "name contactNumber email hospitalId"
        })
        .lean();

      // ✅ remove null populated docs
      const filteredRequests = requests.filter(r => r.hospitalId);

      // ✅ correct ID extraction
      const hospitalIds = filteredRequests
        .map(item => item?.hospitalId?.hospitalId)
        .filter(Boolean);

      const contacts = await HospitalContact.find({
        hospitalId: { $in: hospitalIds }
      }).lean();

      const addresses = await HospitalAddress.find({
        hospitalId: { $in: hospitalIds }
      }).select("fullAddress hospitalId").lean();

      // ✅ map creation (O(n))
      const contactMap = {};
      contacts.forEach(c => {
        if (c?.hospitalId) {
          contactMap[c.hospitalId.toString()] = c;
        }
      });

      const addressMap = {};
      addresses.forEach(a => {
        if (a?.hospitalId) {
          addressMap[a.hospitalId.toString()] = a;
        }
      });

      // ✅ safe merge
      const finalData = filteredRequests.map(h => {
        const key = h?.hospitalId?.hospitalId?.toString();

        return {
          ...h,
          contact: key ? contactMap[key] || null : null,
          address: key ? addressMap[key] || null : null
        };
      });

      const total = await EditRequest.countDocuments(filter);

      return res.json({
        success: true,
        data: finalData,
        totalPages: Math.ceil(total / limit),
        total
      });
    } else if (type == "lab") {
      const requests = await EditRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "labId",
          match: match,
          select: "name contactNumber email"
        })
        .lean();

      // ✅ filter out failed populate
      const filteredRequests = requests.filter(r => r.labId);

      // ✅ clean ID list
      const labIds = filteredRequests
        .map(item => item?.labId?._id)
        .filter(Boolean);

      const contactPersons = await LabPerson.find({
        userId: { $in: labIds }
      }).lean();

      const labAddresses = await LabAddress.find({
        userId: { $in: labIds }
      }).select("fullAddress userId").lean();

      // ✅ convert to maps (O(n))
      const contactMap = {};
      contactPersons.forEach(p => {
        if (p?.userId) {
          contactMap[p.userId.toString()] = p;
        }
      });

      const addressMap = {};
      labAddresses.forEach(a => {
        if (a?.userId) {
          addressMap[a.userId.toString()] = a;
        }
      });

      // ✅ safe merge
      const labWithContact = filteredRequests.map(lab => {
        const key = lab?.labId?._id?.toString();

        return {
          ...lab,
          contact: key ? contactMap[key] || null : null,
          address: key ? addressMap[key] || null : null
        };
      });

      const total = await EditRequest.countDocuments(filter);

      res.json({
        success: true,
        data: labWithContact,
        totalPages: Math.ceil(total / limit),
        total
      });
    } else if (type == "pharmacy") {
      const requests = await EditRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "pharId",
          match: match,
          select: "name contactNumber email"
        })
        .lean();

      // ✅ filter out null populated docs
      const filteredRequests = requests.filter(r => r.pharId);

      // ✅ clean ID list
      const pharIds = filteredRequests
        .map(item => item?.pharId?._id)
        .filter(Boolean);

      const contactPersons = await PharPerson.find({
        userId: { $in: pharIds }
      }).lean();

      const pharAddresses = await PharAddress.find({
        userId: { $in: pharIds }
      }).select("fullAddress userId").lean();

      // ✅ map creation (O(n))
      const contactMap = {};
      contactPersons.forEach(p => {
        if (p?.userId) {
          contactMap[p.userId.toString()] = p;
        }
      });

      const addressMap = {};
      pharAddresses.forEach(a => {
        if (a?.userId) {
          addressMap[a.userId.toString()] = a;
        }
      });

      // ✅ safe merge
      const pharWithContact = filteredRequests.map(phar => {
        const key = phar?.pharId?._id?.toString();

        return {
          ...phar,
          contact: key ? contactMap[key] || null : null,
          address: key ? addressMap[key] || null : null
        };
      });

      const total = await EditRequest.countDocuments(filter);

      res.json({
        success: true,
        data: pharWithContact,
        totalPages: Math.ceil(total / limit),
        total
      });
    } else if (type == "doctor") {
      const requests = await EditRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "doctorId",
          match: match,
          select: "name contactNumber email"
        })
        .lean();

      // ✅ filter null populated docs
      const filteredRequests = requests.filter(r => r.doctorId);

      // ✅ clean IDs
      const doctorIds = filteredRequests
        .map(item => item?.doctorId?._id)
        .filter(Boolean);

      const dtData = await Doctor.find({
        userId: { $in: doctorIds }
      })
        .select("profileImage dob userId")
        .lean();

      const aboutDoctor = await DoctorAbout.find({
        userId: { $in: doctorIds }
      })
        .select("hospitalName specialty userId")
        .populate("specialty", "name")
        .lean(); // ✅ important

      // ✅ convert to maps (O(n))
      const doctorDataMap = {};
      dtData.forEach(d => {
        if (d?.userId) {
          doctorDataMap[d.userId.toString()] = d;
        }
      });

      const aboutMap = {};
      aboutDoctor.forEach(a => {
        if (a?.userId) {
          aboutMap[a.userId.toString()] = a;
        }
      });

      // ✅ safe merge
      const doctorWithContact = filteredRequests.map(doc => {
        const key = doc?.doctorId?._id?.toString();

        const doctorData = key ? doctorDataMap[key] : null;
        const about = key ? aboutMap[key] : null;

        return {
          ...doc,
          about: about || null,
          profileImage: doctorData?.profileImage || null,
          dob: doctorData?.dob || null
        };
      });

      const total = await EditRequest.countDocuments(filter);

      res.json({
        success: true,
        data: doctorWithContact,
        totalPages: Math.ceil(total / limit),
        total
      });
    } else if (type == "patient") {
      const requests = await EditRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "patientId",
          match: match,
          select: "name contactNumber email"
        })
        .lean();

      // ✅ filter null populated docs
      const filteredRequests = requests.filter(r => r.patientId);

      // ✅ clean IDs
      const patientIds = filteredRequests
        .map(item => item?.patientId?._id)
        .filter(Boolean);

      const ptData = await Patient.find({
        userId: { $in: patientIds }
      })
        .select("profileImage userId")
        .lean(); // ✅ important

      const aboutPatient = await PatientDemographic.find({
        userId: { $in: patientIds }
      })
        .select("dob userId")
        .lean(); // ✅ important

      // ✅ convert to maps (O(n))
      const profileMap = {};
      ptData.forEach(p => {
        if (p?.userId) {
          profileMap[p.userId.toString()] = p;
        }
      });

      const aboutMap = {};
      aboutPatient.forEach(a => {
        if (a?.userId) {
          aboutMap[a.userId.toString()] = a;
        }
      });

      // ✅ safe merge
      const patientWithContact = filteredRequests.map(p => {
        const key = p?.patientId?._id?.toString();

        const profile = key ? profileMap[key] : null;
        const about = key ? aboutMap[key] : null;

        return {
          ...p,
          profileImage: profile?.profileImage || null,
          about: about || null
        };
      });

      const total = await EditRequest.countDocuments(filter);

      res.json({
        success: true,
        data: patientWithContact,
        totalPages: Math.ceil(total / limit),
        total
      });
    }

  } catch (err) {
    console.log(err)
    res.status(500).json({ success: false, message: "Failed to load requests" });
  }
};

export const updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const request = await EditRequest.findByIdAndUpdate(
      req.params.id, { status }, { new: true }
    );
    res.json({ success: true, message: "Status updated", data: request });
  } catch {
    res.status(500).json({ success: false, message: "Update failed" });
  }
};

export const getMedicineRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { type, status, search } = req.query;

    const filter = {};
    if (type && type !== "all") filter.type = type;
    if (status && status !== "all") filter.status = status;
    const [requests, total] = await Promise.all([
      MedicineRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit)
        .populate("pharId hospitalId", "name nh12 email ").populate('medicineId', 'medicineName'),
      MedicineRequest.countDocuments(filter),
    ]);
    console.log(requests)

    res.json({ success: true, data: requests, totalPages: Math.ceil(total / limit), total });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load requests" });
  }
};
export const actionMedicineRequests = async (req, res) => {
  const { requestId, status } = req.body
  try {
    const request = await MedicineRequest.findByIdAndUpdate(
      requestId, { status }, { new: true }
    );
    if (request) {
      const inventoryItem = await Inventory.findByIdAndUpdate(request.medicineId, { status }, { new: true });
    }
    return res.json({ success: true, message: "Status updated", data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load requests" });
  }
};