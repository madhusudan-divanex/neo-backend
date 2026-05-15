import express from "express";
import authMiddleware from "../middleware/authMiddleare.js";
import Ambulance from "../models/Ambulance.js";

const router = express.Router();

// Book ambulance
router.post("/book-ambulance", authMiddleware, async (req, res) => {
  try {
    const { userId, pickupAddress, pickupLat, pickupLng, dropAddress, dropLat, dropLng, emergencyType, notes } = req.body;
    const booking = await Ambulance.create({ patientId: userId, pickupAddress, pickupLat, pickupLng, dropAddress, dropLat, dropLng, emergencyType, notes });
    res.json({ success: true, data: booking });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Get active booking
router.get("/ambulance-active/:userId", authMiddleware, async (req, res) => {
  try {
    const booking = await Ambulance.findOne({ patientId: req.params.userId, status: { $in: ["searching","driver_assigned","pickup","ongoing"] } })
      .populate("driverId", "name phone vehicleNumber photo").sort({ createdAt: -1 });
    res.json({ success: true, data: booking });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Get last booking (for completed/cancelled screens)
router.get("/ambulance-last/:userId", authMiddleware, async (req, res) => {
  try {
    const booking = await Ambulance.findOne({ patientId: req.params.userId }).sort({ createdAt: -1 }).populate("driverId","name phone vehicleNumber");
    res.json({ success: true, data: booking });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Get booking history
router.get("/ambulance-history/:userId", authMiddleware, async (req, res) => {
  try {
    const data = await Ambulance.find({ patientId: req.params.userId }).sort({ createdAt: -1 }).populate("driverId","name phone vehicleNumber");
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Cancel booking
router.post("/ambulance-cancel/:id", authMiddleware, async (req, res) => {
  try {
    const booking = await Ambulance.findByIdAndUpdate(req.params.id, { status: "cancelled", cancelReason: req.body.reason }, { new: true });
    res.json({ success: true, data: booking });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

export default router;
