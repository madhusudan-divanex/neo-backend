import { populate } from "dotenv";
import BedAllotment from "../../../models/Hospital/BedAllotment.js";
import HospitalBed from "../../../models/Hospital/HospitalBed.js";
import HospitalPayment from "../../../models/Hospital/HospitalPayment.js";
import DischargePatient from "../../../models/Hospital/DischargePatient.js";
import Prescriptions from "../../../models/Prescriptions.js";
import User from "../../../models/Hospital/User.js";
import LabAppointment from "../../../models/LabAppointment.js";
import Test from "../../../models/Laboratory/test.model.js";
import TestReport from "../../../models/testReport.js";
import mongoose from "mongoose";
import DepartmentTransfer from "../../../models/Hospital/DepartmentTransfer.js";
import PatientDemographic from "../../../models/Patient/demographic.model.js";
import Patient from '../../../models/Patient/patient.model.js'
import HospitalBasic from "../../../models/Hospital/HospitalBasic.js";
import HospitalAddress from "../../../models/Hospital/HospitalAddress.js";
import HospitalAudit from "../../../models/Hospital/HospitalAudit.js";
import StaffEmployement from "../../../models/Staff/StaffEmployement.js";
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
    if (req?.user?.loginUser && hospitalId) {
      await HospitalAudit.create({ hospitalId, actionUser: req?.user?.loginUser, note: `Add a ${bedName} bed.` })
    }else{
      await HospitalAudit.create({ hospitalId, note: `Add a ${bedName} bed.` })
    }

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
    const { floorId, departmentId, roomId, bedName, perDayFees, underMaintenance } = req.body;

    const bed = await HospitalBed.findOneAndUpdate(
      {
        _id: req.params.id,
        hospitalId: req.user.id
      },
      {
        floorId,
        departmentId,
        roomId, underMaintenance,
        bedName: bedName?.trim(),
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
    if (req?.user?.loginUser && bed?.hospitalId) {
      await HospitalAudit.create({ hospitalId: bed?.hospitalId, actionUser: req?.user?.loginUser, note: `Update a ${bedName} bed.` })
    }else{
      await HospitalAudit.create({ hospitalId: bed?.hospitalId, note: `Update a ${bedName} bed.` })
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
    const isAlloted = await HospitalBed.findOne({ _id: req.params.id, status: "Booked" })
    if (isAlloted) {
      return res.status(200).json({ success: false, message: "Bed is alloted to a patient so can't delete" })
    }
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

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const doctorId = req.query.doctorId;
  const bedStatus = req.query.bedStatus;
  const paymentStatus = req.query.paymentStatus;
  const floors = req.query.floor ? req.query.floor.split(",") : [];
  const search = req.query.search?.trim(); // <-- added search

  try {
    let filter = { hospitalId: id };

    if (doctorId && mongoose.Types.ObjectId.isValid(doctorId)) {
      filter.primaryDoctorId = new mongoose.Types.ObjectId(doctorId);
    }

    if (bedStatus) {
      filter.status = bedStatus;
    }

    let paymentFilter = {};
    if (paymentStatus) {
      paymentFilter.status = paymentStatus;
    }

    // Build patient search filter
    let patientMatch = {};
    if (search && search.length > 0) {
      patientMatch = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { nh12: { $regex: search, $options: "i" } }
        ]
      };
    }

    let query = BedAllotment.find(filter)
      .populate({
        path: "patientId",
        select: "name email nh12 unique_id",
        match: patientMatch, // <-- search applied here
        populate: { path: "patientId", select: "contactNumber profileImage" }
      })
      .populate("primaryDoctorId", "name nh12 unique_id")
      .populate("dischargeId", "createdAt")
      .populate({
        path: "paymentId",
        select: "status payments services ipdPayment bedCharges",
        match: paymentFilter
      })
      .populate({
        path: "bedId",
        populate: [
          {
            path: "floorId",
            select: "floorName",
            match: floors.length > 0
              ? { _id: { $in: floors.map(f => new mongoose.Types.ObjectId(f)) } }
              : {}
          },
          { path: "departmentId", select: "departmentName" },
          { path: "roomId", select: "roomName" }
        ]
      })
      .populate("attendingStaff.staffId", "name")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalRecords = await BedAllotment.countDocuments(filter);
    let allotment = await query.exec();

    // Remove entries where patientId or floorId didn't match search/floor filter
    allotment = allotment.filter(a => a.patientId && a.bedId && a.bedId.floorId && (paymentStatus ? a.paymentId : true));

    if (!allotment.length) {
      return res.status(200).json({
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
      patientId,
      services,
      payments,
      status, totalAmount, finalAmount, discountValue, discountType
    } = req.body;
    const hospitalId = req.user.id || req.user.userId
    const isAllotment = await BedAllotment.findOne({ _id:allotmentId, hospitalId }).populate('patientId')
    if (!isAllotment) {
      return res.status(404).json({ message: "Allotment not found", success: false })
    }

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
          status, totalAmount, finalAmount, discountValue, discountType
        },
        { new: true, runValidators: true }
      );

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment not found"
        });
      }
      if (req?.user?.loginUser && hospitalId) {
        await HospitalAudit.create({
          hospitalId, actionUser: req?.user?.loginUser,
          note: `An allotment payment was updated of patient ${isAllotment?.patientId?.name}.`
        })
      }else if(hospitalId && !req.user?.loginUser){
        await HospitalAudit.create({
          hospitalId, note: `An allotment payment was updated of patient ${isAllotment?.patientId?.name}.`
        })
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
        status, totalAmount, finalAmount, discountValue, discountType
      });

      await payment.save();
      await BedAllotment.findByIdAndUpdate(allotmentId, { paymentId: payment._id }, { new: true })
      if (req?.user?.loginUser && hospitalId) {
        await HospitalAudit.create({
          hospitalId, actionUser: req?.user?.loginUser,
          note: `An allotment payment was created of patient ${isAllotment?.patientId?.name}.`
        })
      }else if(hospitalId && !req.user?.loginUser){
        await HospitalAudit.create({
          hospitalId, note: `An allotment payment was created of patient ${isAllotment?.patientId?.name}.`
        })
      }
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

export const getAllotmentPayment = async (req, res) => {
  const { id } = req.params
  try {
    const isExist = await HospitalPayment.findOne({ allotmentId: id })
    .populate("ipdPayment.userId", "name role").populate("bedCharges.bedId", "bedName")
    if (isExist) {
      return res.status(200).json({ message: "Payment found", data: isExist, success: true })
    }
    return res.status(200).json({ message: "Payment not found", success: false })
  } catch (error) {
    return res.status(200).json({ message: "Server error" })
  }
}

// export const addOrUpdateDischargePatient = async (req, res) => {
//   try {
//     const {
//       dischargeId,
//       paymentId,
//       allotmentId,
//       hospitalId,
//       patientId,
//       note,
//       dischargeDate,
//       dischargeType

//     } = req.body;

//     let discharge;

//     if (dischargeId) {
//       // 👉 UPDATE
//       discharge = await DischargePatient.findByIdAndUpdate(
//         dischargeId,
//         {
//           paymentId,
//           allotmentId,
//           hospitalId,
//           patientId,
//           note, dischargeType,
//           dischargeDate,
//         },
//         { new: true, runValidators: true }
//       );

//       if (!discharge) {
//         return res.status(404).json({
//           success: false,
//           message: "Discharge not found"
//         });
//       }

//       return res.status(200).json({
//         success: true,
//         message: "Discharge updated successfully",
//         data: discharge
//       });
//     } else {
//       // 👉 CREATE
//       discharge = new DischargePatient({
//         paymentId,
//         allotmentId,
//         hospitalId,
//         patientId,
//         note, dischargeType,
//         dischargeDate,
//       });

//       await discharge.save();
//       const bedAllotment = await BedAllotment.findByIdAndUpdate(allotmentId, { dischargeId: discharge._id, status: "Discharged" }, { new: true })
//       if (bedAllotment) {
//         await HospitalBed.findByIdAndUpdate(bedAllotment?.bedId, { status: "Available" }, { new: true })
//       }
//       return res.status(201).json({
//         success: true,
//         message: "Patient Discharge successfully",
//         data: discharge
//       });
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message
//     });
//   }
// };
export const addOrUpdateDischargePatient = async (req, res) => {
  try {
    const {
      dischargeId,
      paymentId,
      allotmentId,
      confirmation,
      dischargeType,
      dischargeNote,
      finalDiagnosis,
      hospitalCourse,
      conditionOfDischarge,
      followUpPlan,
      redFlag,
      doctorSignature

    } = req.body;
    const hospitalId = req.user.id || req.user.userId
    let discharge;
    const isAllotment = await BedAllotment.findOne({ _id: allotmentId, hospitalId }).populate('patientId')
    if (!isAllotment) {
      return res.status(200).json({ message: "Allotment not found", success: false })
    }

    if (dischargeId) {
      // 👉 UPDATE
      discharge = await DischargePatient.findByIdAndUpdate(
        dischargeId,
        {
          paymentId,
          allotmentId,
          prescriptionId: isAllotment?.prescriptionId || null,
          hospitalId,
          patientId: isAllotment?.patientId,
          confirmation,
          dischargeType,
          dischargeNote,
          finalDiagnosis,
          hospitalCourse,
          conditionOfDischarge,
          followUpPlan,
          redFlag,
          doctorSignature
        },
        { new: true, runValidators: true }
      );

      if (!discharge) {
        return res.status(404).json({
          success: false,
          message: "Discharge not found"
        });
      }
      if (req?.user?.loginUser && hospitalId) {
        await HospitalAudit.create({ hospitalId, actionUser: req?.user?.loginUser, 
          note: `An discharge data was updated of patient ${isAllotment?.patientId?.name}.` })
      }else if(hospitalId && !req.user?.loginUser){
        await HospitalAudit.create({ hospitalId, note: `An discharge data was updated of patient ${isAllotment?.patientId?.name}.` })
      }
      return res.status(200).json({
        success: true,
        message: "Discharge updated successfully",
        data: discharge
      });
    } else {
      // 👉 CREATE
      discharge = new DischargePatient({
        paymentId,
        allotmentId,
        prescriptionId: isAllotment?.prescriptionId || null,
        hospitalId,
        patientId: isAllotment?.patientId,
        confirmation,
        dischargeType,
        dischargeNote,
        finalDiagnosis,
        hospitalCourse,
        conditionOfDischarge,
        followUpPlan,
        redFlag,
        doctorSignature
      });

      await discharge.save();
      const bedAllotment = await BedAllotment.findByIdAndUpdate(allotmentId, { dischargeId: discharge._id, status: "Discharged" }, { new: true })
      if (bedAllotment) {
        await HospitalBed.findByIdAndUpdate(bedAllotment?.bedId, { status: "Available" }, { new: true })
      }
      if (req?.user?.loginUser && hospitalId) {
        await HospitalAudit.create({ hospitalId, actionUser: req?.user?.loginUser, 
          note: `A discharge data was creaated of patient ${isAllotment?.patientId?.name}.` })
      }else if(hospitalId && !req.user?.loginUser){
        await HospitalAudit.create({ hospitalId, note: `A discharge data was creaated of patient ${isAllotment?.patientId?.name}.` })
      }
      return res.status(201).json({
        success: true,
        message: "Patient Discharge successfully",
        data: discharge
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
export const getDischargePatient = async (req, res) => {
  const { id } = req.params
  try {
    const isExist = await DischargePatient.findOne({ allotmentId: id })
    if (isExist) {
      return res.status(200).json({ message: "Discharge recores found", data: isExist, success: true })
    }
    return res.status(200).json({ message: "Discharge recores not found", success: false })
  } catch (error) {
    return res.status(200).json({ message: "Server error" })
  }
}
export const getDischargeScan = async (req, res) => {
  const { id } = req.params
  try {
    const isExist = await DischargePatient.findOne({ customId: id })
    if (isExist) {
      const allotmentData = await BedAllotment.findById(isExist?.allotmentId).populate("patientId", "name email unique_id nh12")
        .populate("primaryDoctorId", "name unique_id nh12").populate('labAppointment')
        .populate({
          path: "bedId",
          populate: [
            { path: "floorId", select: "floorName" },
            { path: "departmentId", select: "departmentName" },
            { path: "roomId", select: "roomName" }
          ]
        })
        .populate("attendingStaff.staffId", "name nh12");
      const prescriptionData = await Prescriptions.findById(allotmentData?.prescriptionId)
      const ptdata = await Patient.findOne({ userId: allotmentData.patientId?._id }).lean()
      const ptDemo = await PatientDemographic.findOne({ userId: allotmentData.patientId?._id }).lean().sort({ createdAt: -1 })
      const hospitalUser = await User.findById(allotmentData?.hospitalId).select('name email contactNumber hospitalId nh12').lean()
      const basic = await HospitalBasic.findById(hospitalUser?.hospitalId).lean()
      const address = await HospitalAddress.findOne({ hospitalId: basic?._id }).lean()
      return res.status(200).json({
        message: "Discharge recores found", data: isExist, hospitalData: { ...hospitalUser, ...basic, ...address }, allotmentData, prescriptionData, patientData: { ...ptDemo, ...ptdata },
        success: true
      })
    }

    return res.status(200).json({ message: "Discharge recores not found", success: false })
  } catch (error) {
    console.log(error)
    return res.status(200).json({ message: "Server error" })
  }
}
const allotmentPrescription = async (req, res) => {
  const { patientId, doctorId, medications, diagnosis, status, notes, allotmentId, reVisit } = req.body;
  try {
    const isExist = await User.findOne({ role: 'doctor', _id: doctorId });
    if (!isExist) return res.status(200).json({ message: 'Doctor not exist' });

    const isPatient = await User.findOne({ role: 'patient', _id: patientId });
    if (!isPatient) return res.status(200).json({ message: 'Patient not exist' });

    const isAllotment = await BedAllotment.findById(allotmentId);
    if (!isAllotment) return res.status(200).json({ message: 'Appointment not exist' });

    const add = await Prescriptions.create({ patientId, doctorId, medications, diagnosis, status, notes, allotmentId, reVisit, })
    if (add) {
      await BedAllotment.findByIdAndUpdate(isAllotment._id, { prescriptionId: add._id }, { new: true })
      return res.status(200).json({ message: "Presctiption add successfully", success: true })
    } else {
      return res.status(200).json({ message: "Presctiption not added", success: false })
    }
  } catch (err) {
    console.log(err)
    return res.status(200).json({ message: 'Server Error' });
  }
}
const getAllotmentPrescriptiondata = async (req, res) => {
  const prescriptionId = req.params.id;
  try {
    let isExist;
    if (prescriptionId.length < 24) {
      isExist = await Prescriptions.findOne({ customId: prescriptionId }).populate({
        path: 'doctorId', select: 'name unique_id', populate: {
          path: 'doctorId',
          select: 'profileImage'
        }
      }).populate({ path: 'patientId', select: 'name unique_id ' });
    } else {
      isExist = await Prescriptions.findById(prescriptionId).populate({
        path: 'doctorId', select: 'name unique_id', populate: {
          path: 'doctorId',
          select: 'profileImage'
        }
      }).populate({ path: 'patientId', select: 'name unique_id ' });
    }
    if (!isExist) return res.status(200).json({ message: 'Prescription not exist' });

    return res.status(200).json({ message: "Presctiption data fetch successfully", data: isExist, success: true })

  } catch (err) {
    return res.status(200).json({ message: 'Server Error' });
  }
}
const deleteAllotmentPrescription = async (req, res) => {
  const prescriptionId = req.params.id;
  try {
    let isExist;
    if (prescriptionId.length < 24) {
      isExist = await Prescriptions.findOneAndDelete({ customId: prescriptionId })
    } else {
      isExist = await Prescriptions.findByIdAndDelete(prescriptionId)
    }
    if (!isExist) return res.status(200).json({ message: 'Prescription not deleted' });
    await BedAllotment.findByIdAndUpdate(
      isExist.allotmentId,
      { $unset: { prescriptionId: "" } } // ya agar aap delete karna chahte ho: Appointment.findByIdAndDelete(...)
    );
    return res.status(200).json({ message: "Presctiption deleted", success: true })

  } catch (err) {
    return res.status(200).json({ message: 'Server Error' });
  }
}
const prescriptionAction = async (req, res) => {
  const { prescriptionId, status } = req.body;
  try {
    const isExist = await Prescriptions.findById(prescriptionId);
    if (!isExist) return res.status(200).json({ message: 'Prescription not exist' });


    const update = await Prescriptions.findByIdAndUpdate(prescriptionId, { status }, { new: true })
    if (update) {
      return res.status(200).json({ message: "Prescription updated successfully", success: true })
    } else {
      return res.status(200).json({ message: "Prescription not updated", success: false })
    }
  } catch (err) {
    return res.status(200).json({ message: 'Server Error' });
  }
}
const editAllotmentPrescription = async (req, res) => {
  const { patientId, doctorId, medications, diagnosis, status, notes, prescriptionId, allotmentId, reVisit } = req.body;
  try {
    const isExist = await User.findOne({ _id: doctorId, role: 'doctor' });
    if (!isExist) return res.status(200).json({ message: 'Allotment not exist' });

    const isPatient = await User.findOne({ _id: patientId, role: 'patient' });
    if (!isPatient) return res.status(200).json({ message: 'Patient not exist' });

    const isAllotment = await BedAllotment.findById(allotmentId);
    if (!isAllotment) return res.status(200).json({ message: 'Appointment not exist' });

    const isPrescriptions = await Prescriptions.findById(prescriptionId);
    if (!isPrescriptions) return res.status(200).json({ message: 'Patient not exist' });

    const add = await Prescriptions.findByIdAndUpdate(prescriptionId, { patientId, doctorId, reVisit, medications, diagnosis, status, notes, allotmentId }, { new: true })
    if (add) {
      return res.status(200).json({ message: "Presctiption update successfully", success: true })
    } else {
      return res.status(200).json({ message: "Presctiption not added", success: false })
    }
  } catch (err) {
    console.log(err)
    return res.status(200).json({ message: 'Server Error' });
  }
}
const addTestForBedPatient = async (req, res) => {
  const { allotmentId, testIds } = req.body;

  try {
    const allotment = await BedAllotment.findById(allotmentId);
    if (!allotment)
      return res.status(404).json({ message: 'Allotment does not exist', success: false });

    let labAppointment = null;
    if (allotment.labAppointment) {
      labAppointment = await LabAppointment.findById(allotment.labAppointment);
      if (!labAppointment)
        return res.status(404).json({ message: "Lab appointment not found", success: false });

      // Find reports
      const reports = await TestReport.find({
        appointmentId: labAppointment._id,
        testId: { $in: labAppointment.testId }
      }).select('testId');

      const reportedTestIds = reports.map(r => r.testId.toString());

      // Prevent deletion of tests with reports
      const tryingToRemoveReported = labAppointment.testId.some(
        t => reportedTestIds.includes(t.toString()) && !testIds.includes(t.toString())
      );
      if (tryingToRemoveReported)
        return res.status(400).json({
          message: "Cannot remove test(s) which already have reports",
          success: false
        });

      // Calculate tests to add
      const testsToAdd = testIds.filter(t => !labAppointment.testId.includes(t.toString()));

      // Calculate tests to remove (only if no report)
      const testsToRemove = labAppointment.testId.filter(
        t => !testIds.includes(t.toString()) && !reportedTestIds.includes(t.toString())
      );

      // Update labAppointment.testId
      labAppointment.testId = testIds;

      // Update fees
      const addedTestData = await Test.find({ _id: { $in: testsToAdd } });
      const removedTestData = await Test.find({ _id: { $in: testsToRemove } });

      const addedFees = addedTestData.reduce((sum, t) => sum + Number(t.price || 0), 0);
      const removedFees = removedTestData.reduce((sum, t) => sum + Number(t.price || 0), 0);

      labAppointment.fees = (Number(labAppointment.fees) || 0) + addedFees - removedFees;
      if (testsToAdd.length > 0) {
        labAppointment.date = new Date()
        labAppointment.status = "approved";
      }

      await labAppointment.save({ validateBeforeSave: false });

      return res.status(200).json({
        message: "Lab appointment updated successfully",
        success: true
      });
    }

    // No lab appointment → create new
    const testData = await Test.find({ _id: { $in: testIds } });
    const totalFees = testData.reduce((sum, t) => sum + (t.price || 0), 0);

    labAppointment = new LabAppointment({
      patientId: allotment.patientId,
      testId: testIds,
      labId: allotment.hospitalId,
      date: new Date(),
      fees: totalFees
    });

    await labAppointment.save({ validateBeforeSave: false });

    allotment.labAppointment = labAppointment._id;
    await allotment.save({ validateBeforeSave: false });

    return res.status(200).json({ message: "Lab appointment created successfully", success: true });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server Error', success: false });
  }
};
const getTestReportForBedPatient = async (req, res) => {
  const { appointmentId } = req.params;
  try {
    const isExist = await LabAppointment.findById(appointmentId);

    if (!isExist) return res.status(200).json({ message: 'Appointment not exist' });
    const testReports = await TestReport.find({ appointmentId }).populate("testId").populate("appointmentId", "customId")

    return res.status(200).json({
      message: "Lab test report fetched successfully", testReports,
      success: true
    })

  } catch (err) {
    console.log(err)
    return res.status(200).json({ message: 'Server Error' });
  }
}
export const getHospitalBed = async (req, res) => {
  const { department, status, underMaintenance } = req.query
  try {
    let filter = {
      hospitalId: req.user.id
    }
    if (department) {
      filter.departmentId = department
    }
    if (underMaintenance === "No") {
      filter.underMaintenance = { $ne: true };
    }
    if (status) {
      filter.status = status
    }
    const bed = await HospitalBed.find(filter);
    return res.json({ success: true, data: bed });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export const departmentTransfer = async (req, res) => {
  const {
    reason,
    doctorTo,
    bedFrom,
    bedTo,
    departmentFrom,
    departmentTo,
    allotmentId
  } = req.body;

  const hospitalId = req.user.id;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // ✅ Check allotment
    const isAllotment = await BedAllotment.findById(allotmentId).session(session);
    if (!isAllotment) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Allotment not found", success: false });
    }

    // ✅ Validate doctorTo
    const toDoctor = await User.findOne({ nh12: doctorTo, role: "doctor" }).session(session);
    if (!toDoctor) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Doctor To not found", success: false });
    }

    // ✅ Check employment
    const toDoctorEmployment = await StaffEmployement.findOne({
      organizationId:hospitalId,
      userId: toDoctor._id
    }).session(session);

    if (!toDoctorEmployment) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Doctor not in hospital" });
    }

    if (toDoctorEmployment.status !== "Active") {
      await session.abortTransaction();
      return res.status(400).json({
        message: `Doctor is ${toDoctorEmployment.status}`,
        success: false
      });
    }

    // ✅ Create transfer
    const transfer = await DepartmentTransfer.create([{
      reason,
      doctorFrom: isAllotment?.primaryDoctorId,
      doctorTo: toDoctor._id,
      bedFrom,
      bedTo,
      departmentFrom,
      departmentTo,
      allotmentId,
      hospitalId,
      patientId: isAllotment?.patientId
    }], { session });

    // ✅ Update allotment
    isAllotment.primaryDoctorId = toDoctor._id;
    isAllotment.bedId = bedTo
    await isAllotment.save({ session });

    // ✅ Update beds
    await HospitalBed.findByIdAndUpdate(
      bedFrom,
      { status: "Available" },
      { new: true, session }
    );

    await HospitalBed.findByIdAndUpdate(
      bedTo,
      { status: "Booked" },
      { new: true, session }
    );

    // ✅ Commit transaction
    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: "Transfer successfully",
      success: true
    });

  } catch (err) {
    // ❌ Rollback everything if error
    await session.abortTransaction();
    session.endSession();

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
export const getDepartmentTransfer = async (req, res) => {
  let { page = 1, limit = 10 } = req.query;
  const allotmentId = req.params.id;

  try {
    // ✅ Convert to number
    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    // ✅ Fetch paginated data
    const history = await DepartmentTransfer.find({ allotmentId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('bedFrom bedTo', 'bedName')
      .populate('departmentFrom departmentTo', 'departmentName')
      .populate('doctorFrom doctorTo', 'name');

    // ✅ Total count
    const total = await DepartmentTransfer.countDocuments({ allotmentId });

    return res.status(200).json({
      message: "Department Transfer Data fetched",
      success: true,
      data: history,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalRecords: total
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false
    });
  }
};
export { allotmentPrescription, editAllotmentPrescription, prescriptionAction, getAllotmentPrescriptiondata, deleteAllotmentPrescription, addTestForBedPatient, getTestReportForBedPatient }