import EditRequest from "../../models/EditRequest.js";
import HospitalAddress from "../../models/Hospital/HospitalAddress.js";
import HospitalContact from "../../models/Hospital/HospitalContact.js";
import LabPerson from "../../models/Laboratory/contactPerson.model.js";
import LabAddress from "../../models/Laboratory/labAddress.model.js";
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
        .skip(skip).limit(limit)
        .populate({ path: "hospitalId", match: match, select: "name contactNumber email hospitalId" }).lean()
      const hospitalIds = requests.map(item => item?.hospitalId?.hospitalId)
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
      const finalData = requests.map(h => ({
        ...h,
        contact: contactMap[h?.hospitalId?.hospitalId.toString()] || null,
        address: addresMap[h?.hospitalId?.hospitalId?.toString()] || null,
      }));
      const total = await EditRequest.countDocuments(filter);
      return res.json({ success: true, data: finalData, totalPages: Math.ceil(total / limit), total });

    } else if (type == "lab") {
      const requests = await EditRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit)
        .populate({ path: "labId", match: match, select: "name contactNumber email" }).lean()
      const labIds = requests.map(item => item?.labId?._id)
      const contactPerson = await LabPerson.find({ userId: { $in: labIds } })
      const labAddr = await LabAddress.find({ userId: { $in: labIds } }).select('fullAddress userId')
      const labWithContact = requests.map(lab => {
        const contact = contactPerson.find(
          person => person?.userId?.toString() === lab?.labId._id.toString()
        );
        const address = labAddr.find(
          item => item?.userId?.toString() === lab?.labId._id.toString()
        );

        return {
          ...lab,
          contact: contact,
          address
        };
      });
      const total = await EditRequest.countDocuments(filter);
      res.json({
        success: true,
        data: labWithContact,
        totalPages: Math.ceil(total / limit)
      });

    }else if (type == "pharmacy") {
      const requests = await EditRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit)
        .populate({ path: "pharId", match: match, select: "name contactNumber email" }).lean()
      const pharIds = requests.map(item => item?.pharId?._id)
      const contactPerson = await PharPerson.find({ userId: { $in: pharIds } })
      const pharAddr = await PharAddress.find({ userId: { $in: pharIds } }).select('fullAddress userId')
      const pharWithContact = requests.map(phar => {
        const contact = contactPerson.find(
          person => person?.userId?.toString() === phar?.pharId._id.toString()
        );
        const address = pharAddr.find(
          item => item?.userId?.toString() === phar?.pharId._id.toString()
        );

        return {
          ...phar,
          contact: contact,
          address
        };
      });
      const total = await EditRequest.countDocuments(filter);
      res.json({
        success: true,
        data: pharWithContact,
        totalPages: Math.ceil(total / limit)
      });

    }

    const [requests, total] = await Promise.all([
      EditRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit)
        .populate("doctorId", "name contactNumber email profileImage")
        .populate("patientId", "name contactNumber email profileImage")
        .populate("labId", "name contactNumber email")
        .populate("pharId", "name contactNumber email")
        .populate("hospitalId", "name contactNumber email hospitalId"),
      EditRequest.countDocuments(filter),
    ]);

    res.json({ success: true, data: requests, totalPages: Math.ceil(total / limit), total });
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