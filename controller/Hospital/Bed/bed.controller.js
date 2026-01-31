import { populate } from "dotenv";
import BedAllotment from "../../../models/Hospital/BedAllotment.js";
import HospitalBed from "../../../models/Hospital/HospitalBed.js";
import HospitalPayment from "../../../models/Hospital/HospitalPayment.js";

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
export const getAllotmentHistory = async (req, res) => {
  const { id } = req.params;

  // pagination params
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const totalRecords = await BedAllotment.countDocuments({
      hospitalId: id
    });

    const allotment = await BedAllotment.find({ hospitalId: id })
      .populate({path:"patientId",select: "name email unique_id",populate:{path:"patientId",select:"contactNumber profileImage"}})
      .populate("primaryDoctorId", "name unique_id")
      .populate({
        path: "bedId",
        populate: [
          { path: "floorId", select: "floorName" },
          { path: "departmentId", select: "departmentName" },
          { path: "roomId", select: "roomName" }
        ]
      })
      .populate("attendingStaff.staffId", "name")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // optional but recommended

    if (!allotment.length) {
      return res.status(404).json({
        success: false,
        message: "No allotment history found"
      });
    }

    res.status(200).json({
      success: true,
      data: allotment,
      pagination: {
        totalRecords,
        currentPage: page,
        totalPages: Math.ceil(totalRecords / limit),
        limit
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to load allotment"
    });
  }
};

export const addOrUpdateHospitalPayment = async (req, res) => {
  try {
    const {
      paymentId, // optional
      allotmentId,
      hospitalId,
      patientId,
      services,
      payments,
      status
    } = req.body;

    let payment;

    if (paymentId) {
      // 👉 UPDATE
      payment = await HospitalPayment.findByIdAndUpdate(
        paymentId,
        {
          allotmentId,
          hospitalId,
          patientId,
          services,
          payments,
          status
        },
        { new: true, runValidators: true }
      );

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment not found"
        });
      }

      return res.status(200).json({
        success: true,
        message: "Payment updated successfully",
        data: payment
      });
    } else {
      // 👉 CREATE
      payment = new HospitalPayment({
        allotmentId,
        hospitalId,
        patientId,
        services,
        payments,
        status
      });

      await payment.save();
      await BedAllotment.findByIdAndUpdate(allotmentId,{paymentId:payment._id},{new:true})

      return res.status(201).json({
        success: true,
        message: "Payment created successfully",
        data: payment
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

export const getAllotmentPayment =async(req,res)=>{
  const {id}=req.params
  try {
    const isExist=await HospitalPayment.findOne({allotmentId:id})
    if(isExist){
      return res.status(200).json({message:"Payment found",data:isExist,success:true})
    }
    return res.status(200).json({message:"Payment not found",success:false})
  } catch (error) {
    return res.status(200).json({message:"Server error"})
  }
}