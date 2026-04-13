import EditRequest from "../../models/EditRequest.js";
import Inventory from "../../models/Pharmacy/inventory.model.js";
import MedicineRequest from "../../models/Pharmacy/medicineRequest.model.js";

export const getEditRequests = async (req, res) => {
  try {
    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 10;
    const skip   = (page - 1) * limit;
    const { type, status, search } = req.query;

    const filter = {};
    if (type   && type   !== "all") filter.type   = type;
    if (status && status !== "all") filter.status = status;

    const [requests, total] = await Promise.all([
      EditRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit)
        .populate("doctorId",  "name contactNumber email profileImage")
        .populate("patientId", "name contactNumber email profileImage")
        .populate("labId",     "name contactNumber email")
        .populate("pharId",    "name contactNumber email")
        .populate("hospitalId","name contactNumber email"),
      EditRequest.countDocuments(filter),
    ]);

    res.json({ success: true, data: requests, totalPages: Math.ceil(total / limit), total });
  } catch (err) {
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
    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 10;
    const skip   = (page - 1) * limit;
    const { type, status, search } = req.query;

    const filter = {};
    if (type   && type   !== "all") filter.type   = type;
    if (status && status !== "all") filter.status = status;
    const [requests, total] = await Promise.all([
      MedicineRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit)
        .populate("pharId hospitalId",  "name nh12 email ").populate('medicineId','medicineName'),
      MedicineRequest.countDocuments(filter),
    ]);
    console.log(requests)

    res.json({ success: true, data: requests, totalPages: Math.ceil(total / limit), total });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load requests" });
  }
};
export const actionMedicineRequests = async (req, res) => {
  const {requestId,status}=req.body
  try {
    const request = await MedicineRequest.findByIdAndUpdate(
      requestId, { status }, { new: true }
    );
    if(request){
      const inventoryItem = await Inventory.findByIdAndUpdate(request.medicineId,{status},{new:true});
    }
    return res.json({ success: true, message: "Status updated", data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load requests" });
  }
};