import BedAllotment from "../../../models/Hospital/BedAllotment.js";
import HospitalBed from "../../../models/Hospital/HospitalBed.js";
import HospitalPatient from "../../../models/Hospital/HospitalPatient.js";
import HospitalDoctor from "../../../models/Hospital/HospitalDoctor.js";
import HospitalAudit from "../../../models/Hospital/HospitalAudit.js";
import User from "../../../models/Hospital/User.js";
import PatientDepartment from "../../../models/Hospital/PatientDepartment.js";

/* =====================================================
   ADD BED ALLOTMENT
===================================================== */
export const addAllotment = async (req, res) => {
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
      note,patientDepartment
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
    const isPatient = await User.findOne({ _id: patientId, role: "patient" })
    if (!isPatient) {
      return res.status(404).json({ success: false, message: "Patient not found" })
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

    const isActive = await BedAllotment.findOne({ patientId, status: "Active", hospitalId })
    if (isActive) {
      return res.status(400).json({ message: "Patient already alloted to an allotment ", success: false })
    }

    /* ---------- CREATE ALLOTMENT ---------- */
    const allotment = await BedAllotment.create({
      hospitalId,
      patientId,
      bedId: bed._id,
      departmentId,
      primaryDoctorId: doctorId,
      allotmentDate,patientDepartment,
      expectedDischargeDate,
      admissionReason: reason,
      note,
      attendingStaff: formattedStaff
    });

    /* ---------- UPDATE BED ---------- */
    bed.status = "Booked";
    if (perDayFees !== undefined) {
      bed.pricePerDay = perDayFees;
    }
    await PatientDepartment.findOneAndUpdate({patientId,hospitalId},{allotmentId:allotment?._id},{new:true})
    await bed.save();
    if (req?.user?.loginUser && hospitalId) {
      await HospitalAudit.create({ hospitalId, actionUser: req?.user?.loginUser, note: `Added an allotment for patient ${isPatient?.name}.` })
    }
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
export const dischargePatient = async (req, res) => {
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
export const getAllotmentById = async (req, res) => {
  try {
    const allotment = await BedAllotment.findById(req.params.id)
      .populate("patientId", "name email unique_id nh12")
      .populate("primaryDoctorId", "name unique_id nh12")
      .populate({path:'labAppointment',populate:[{path:'subCatId',select:'subCategory'}]})
      .populate('departmentId','departmentName')
      .populate({
        path: "bedId",
        populate: [
          { path: "floorId", select: "floorName" },
          { path: "roomId", select: "roomName" }
        ]
      })
      .populate("attendingStaff.staffId", "name nh12");

    if (!allotment) {
      return res.status(404).json({
        success: false,
        message: "Allotment not found"
      });
    }

    const hospitalPatient = await HospitalPatient.findOne({
      user_id: allotment.patientId._id
    });

    const response = allotment.toObject();
    response.hospitalPatient = hospitalPatient || null;

    res.json({
      success: true,
      data: response
    });

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
export const updateAllotment = async (req, res) => {
  try {
    const { allotmentDetails, attendingStaff } = req.body;

    const allotment = await BedAllotment.findById(req.params.id);
    if (!allotment) {
      return res.status(404).json({
        success: false,
        message: "Allotment not found"
      });
    }
    const isPatient = await User.findOne({_id:allotmentDetails?.patientId,role:"patient"});
    if (!isPatient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }

    /* ---------- UPDATE BASIC FIELDS ---------- */
    allotment.primaryDoctorId = allotmentDetails.doctorId;
    allotment.expectedDischargeDate =
      allotmentDetails.expectedDischargeDate;
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
    if (req?.user?.loginUser && allotment?.hospitalId) {
      await HospitalAudit.create({ hospitalId: allotment.hospitalId, actionUser: req?.user?.loginUser, note: `An allotment details was updated of patient ${isPatient?.name}.` })
    }
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
