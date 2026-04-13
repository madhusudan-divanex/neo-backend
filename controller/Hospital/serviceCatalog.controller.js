import ServiceCatalog from "../../models/Hospital/ServiceCatalog.js";
import AuditLog from "../../models/Hospital/AuditLog.js";

export const createService = async (req, res) => {
  try {
    const { hospitalId } = req.user;
    // Check duplicate code for this hospital
    if (req.body.code) {
      const existing = await ServiceCatalog.findOne({ hospitalId, code: req.body.code.toUpperCase(), isActive: true });
      if (existing) {
        return res.status(400).json({ success: false, message: `Service code "${req.body.code}" already exists. Use a unique code like CONS-OPD-001.` });
      }
    }
    const service = await ServiceCatalog.create({ ...req.body, code: req.body.code?.toUpperCase(), hospitalId, createdBy: req.user._id });
    await AuditLog.log({ actorId: req.user._id, actorRole: req.user.role, hospitalId, module: "SERVICE_CATALOG", action: "CREATE", after: { code: service.code, name: service.name } });
    res.json({ success: true, data: service });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getServices = async (req, res) => {
  try {
    const { hospitalId } = req.user;
    const { category, isActive = true } = req.query;
    const filter = { hospitalId };
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === "true";
    const data = await ServiceCatalog.find(filter).sort({ category: 1, name: 1 });
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const updateService = async (req, res) => {
  try {
    const service = await ServiceCatalog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await AuditLog.log({ actorId: req.user._id, actorRole: req.user.role, hospitalId: req.user.hospitalId, module: "SERVICE_CATALOG", action: "UPDATE", resourceId: service._id, after: req.body });
    res.json({ success: true, data: service });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const deleteService = async (req, res) => {
  try {
    await ServiceCatalog.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: "Service deactivated" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Price lookup for doctor badge "₹___ will be added to bill"
export const getServicePrice = async (req, res) => {
  try {
    const { hospitalId } = req.user;
    const { category, trigger } = req.query;
    const service = await ServiceCatalog.findOne({ hospitalId, category, chargeTrigger: trigger, isActive: true });
    res.json({ success: true, data: service ? { name: service.name, price: service.finalPrice, autoCharge: service.autoCharge } : null });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
