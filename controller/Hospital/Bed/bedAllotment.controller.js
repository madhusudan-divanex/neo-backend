import BedAllotment from "../../../models/Hospital/BedAllotment.js";
import HospitalBed from "../../../models/Hospital/HospitalBed.js";
import HospitalPatient from "../../../models/Hospital/HospitalPatient.js";
import HospitalDoctor from "../../../models/Hospital/HospitalDoctor.js";

/* =====================================================
   ADD BED ALLOTMENT
===================================================== */
const addAllotment = async (req, res) => {
  try {
    const hospitalId = req.user.id;
    const { bedDetails, allotmentDetails, attendingStaff } = req.body;

    const {
      floorId,
      departmentId,
      roomId,
      bedName,
      perDayFees
    } = bedDetails;

    const {
      patientId,
      doctorId,
      allotmentDate,
      expectedDischargeDate,
      reason,
      note
    } = allotmentDetails;

    /* ---------- VALIDATION ---------- */
    if (
      !floorId ||
      !departmentId ||
      !roomId ||
      !bedName ||
      !patientId ||
      !doctorId ||
      !allotmentDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing"
      });
    }

    /* ---------- FIND BED ---------- */
    const bed = await HospitalBed.findOne({
      hospitalId,
      floorId,
      departmentId,
      roomId,
      bedName
    });

    if (!bed) {
      return res.status(404).json({
        success: false,
        message: "Bed not found"
      });
    }

    if (bed.status === "Booked") {
      return res.status(400).json({
        success: false,
        message: "Bed already allotted"
      });
    }

    /* ---------- FORMAT STAFF ---------- */
    const formattedStaff = (attendingStaff || [])
      .filter(s => s.type && s.staffId && s.date)
      .map(s => ({
        staffType: s.type,     // Doctor / Nurse
        staffId: s.staffId,
        date: new Date(s.date)
      }));

    /* ---------- CREATE ALLOTMENT ---------- */
  const allotment = await BedAllotment.create({
  hospitalId,
  patientId: allotmentDetails.patientId,
  bedId: bed._id,
  primaryDoctorId: allotmentDetails.doctorId,
  allotmentDate: allotmentDetails.allotmentDate,
  expectedDischargeDate: allotmentDetails.expectedDischargeDate,
  admissionReason: allotmentDetails.reason,
  note: allotmentDetails.note,
  attendingStaff: formattedStaff
});

    /* ---------- UPDATE BED ---------- */
    bed.status = "Booked";
    if (perDayFees !== undefined) {
      bed.pricePerDay = perDayFees;
    }
    await bed.save();

    res.json({
      success: true,
      message: "Bed allotted successfully",
      data: allotment
    });

  } catch (err) {
    console.error("Allotment Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* =====================================================
   DISCHARGE PATIENT
===================================================== */
const dischargePatient = async (req, res) => {
  try {
    const { allotmentId } = req.params;

    const allotment = await BedAllotment.findById(allotmentId);
    if (!allotment) {
      return res.status(404).json({
        success: false,
        message: "Allotment not found"
      });
    }

    if (allotment.status === "Discharged") {
      return res.status(400).json({
        success: false,
        message: "Patient already discharged"
      });
    }

    allotment.status = "Discharged";
    allotment.dischargeDate = new Date();
    await allotment.save();

    await HospitalBed.findByIdAndUpdate(allotment.bedId, {
      status: "Available"
    });

    res.json({
      success: true,
      message: "Patient discharged & bed freed"
    });

  } catch (err) {
    console.error("Discharge Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


/* =====================================================
   GET ALLOTMENT BY ID (EDIT PAGE)
===================================================== */
const getAllotmentById = async (req, res) => {
  try {
    const allotment = await BedAllotment.findById(req.params.id)
      .populate("patientId", "name email _id")
      .populate("primaryDoctorId", "name")
      .populate({
        path: "bedId",
        populate: [
          { path: "floorId", select: "floorName" },
          { path: "departmentId", select: "departmentName" },
          { path: "roomId", select: "roomName" }
        ]
      })
      .populate("attendingStaff.staffId", "name");

    if (!allotment) {
      return res.status(404).json({
        success: false,
        message: "Allotment not found"
      });
    }


    const hospitalPatient = await HospitalPatient.findOne({
      user_id: allotment.patientId._id
    });

    // 3️⃣ Attach hospital patient data
    const response = allotment.toObject();
    response.hospitalPatient = hospitalPatient || null;


    res.json({ success: true, data: response });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to load allotment"
    });
  }
};



/* =====================================================
   UPDATE ALLOTMENT
===================================================== */
const updateAllotment = async (req, res) => {
  try {
    const { allotmentDetails, attendingStaff } = req.body;

    const allotment = await BedAllotment.findById(req.params.id);
    if (!allotment) {
      return res.status(404).json({
        success: false,
        message: "Allotment not found"
      });
    }

    /* ---------- UPDATE BASIC FIELDS ---------- */
    allotment.primaryDoctorId = allotmentDetails.doctorId;
    allotment.expectedDischargeDate = allotmentDetails.expectedDischargeDate;
    allotment.admissionReason = allotmentDetails.reason;
    allotment.note = allotmentDetails.note;

    /* ---------- UPDATE ATTENDING STAFF ---------- */
    allotment.attendingStaff = (attendingStaff || [])
      .filter(s => s.type && s.staffId && s.date)
      .map(s => ({
        staffType: s.type,
        staffId: s.staffId,
        date: new Date(s.date)
      }));

    await allotment.save();

    res.json({
      success: true,
      message: "Allotment updated successfully"
    });

  } catch (err) {
    console.error("Update Allotment Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


export default {addAllotment,updateAllotment,getAllotmentById,dischargePatient}