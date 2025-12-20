import HospitalRoom from "../../../models/Hospital/HospitalRoom.js";

/* ======================================================
   ADD ROOM
====================================================== */
const addRoom = async (req, res) => {
  try {
    const hospitalId = req.user.id;
    const { floorId, departmentId, roomName } = req.body;

    if (!floorId || !departmentId || !roomName) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    // 🔒 Duplicate check (same floor + same room)
    const exists = await HospitalRoom.findOne({
      hospitalId,
      floorId,
      roomName: roomName.trim(),
      status: "Active"
    });

    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Room already exists on this floor"
      });
    }

    const room = await HospitalRoom.create({
      hospitalId,
      floorId,
      departmentId,
      roomName: roomName.trim()
    });

    res.json({
      success: true,
      message: "Room added successfully",
      data: room
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

/* ======================================================
   LIST ROOMS BY FLOOR
====================================================== */
const listRoomsByFloor = async (req, res) => {
  try {
    const rooms = await HospitalRoom.find({
      hospitalId: req.user.id,
      floorId: req.params.floorId,
      status: "Active"
    })
      .populate("departmentId", "departmentName")
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      data: rooms
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

/* ======================================================
   GET SINGLE ROOM (EDIT)
====================================================== */
const getRoomById = async (req, res) => {
  try {
    const room = await HospitalRoom.findOne({
      _id: req.params.id,
      hospitalId: req.user.id
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found"
      });
    }

    res.json({
      success: true,
      data: room
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

/* ======================================================
   UPDATE ROOM
====================================================== */
const updateRoom = async (req, res) => {
  try {
    const { floorId, departmentId, roomName } = req.body;

    if (!floorId || !departmentId || !roomName) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    // 🔒 Duplicate check (exclude current room)
    const exists = await HospitalRoom.findOne({
      hospitalId: req.user.id,
      floorId,
      roomName: roomName.trim(),
      _id: { $ne: req.params.id },
      status: "Active"
    });

    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Room already exists on this floor"
      });
    }

    const room = await HospitalRoom.findOneAndUpdate(
      {
        _id: req.params.id,
        hospitalId: req.user.id
      },
      {
        floorId,
        departmentId,
        roomName: roomName.trim()
      },
      { new: true }
    );

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found"
      });
    }

    res.json({
      success: true,
      message: "Room updated successfully",
      data: room
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
export default {updateRoom,getRoomById,listRoomsByFloor,addRoom}