import HospitalBed from "../../../models/Hospital/HospitalBed.js";

/* ======================================================
   ADD BED
====================================================== */
export const addBed = async (req, res) => {
  try {
    const hospitalId = req.user.id;
    const { floorId, departmentId, roomId, bedName, perDayFees } = req.body;

    // ✅ Validation
    if (!floorId || !departmentId || !roomId || !bedName || !perDayFees) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    // 🔒 Duplicate bed check (same room + same bed name)
    const exists = await HospitalBed.findOne({
      hospitalId,
      roomId,
      bedName: bedName.trim(),
      status: "Available"
    });

    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Bed already exists in this room"
      });
    }

    const bed = await HospitalBed.create({
      hospitalId,
      floorId,
      departmentId,
      roomId,
      bedName: bedName.trim(),
      pricePerDay: perDayFees
    });

    res.json({
      success: true,
      message: "Bed added successfully",
      data: bed
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

/* ======================================================
   GET BED BY ID
====================================================== */
export const getBedById = async (req, res) => {
  try {
    const bed = await HospitalBed.findOne({
      _id: req.params.id,
      hospitalId: req.user.id
    });

    if (!bed) {
      return res.status(404).json({
        success: false,
        message: "Bed not found"
      });
    }

    res.json({ success: true, data: bed });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

/* ======================================================
   UPDATE BED
====================================================== */
export const updateBed = async (req, res) => {
  try {
    const { floorId, departmentId, roomId, bedName, perDayFees } = req.body;

    const bed = await HospitalBed.findOneAndUpdate(
      {
        _id: req.params.id,
        hospitalId: req.user.id
      },
      {
        floorId,
        departmentId,
        roomId,
        bedName: bedName.trim(),
        pricePerDay: perDayFees
      },
      { new: true }
    );

    if (!bed) {
      return res.status(404).json({
        success: false,
        message: "Bed not found"
      });
    }

    res.json({
      success: true,
      message: "Bed updated successfully",
      data: bed
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

/* ======================================================
   DELETE BED (SOFT DELETE)
====================================================== */
export const deleteBed = async (req, res) => {
  try {
    const bed = await HospitalBed.findOneAndUpdate(
      {
        _id: req.params.id,
        hospitalId: req.user.id
      },
      { status: "Deleted" },
      { new: true }
    );

    if (!bed) {
      return res.status(404).json({
        success: false,
        message: "Bed not found"
      });
    }

    res.json({
      success: true,
      message: "Bed deleted successfully"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
