import mongoose from "mongoose";
import HospitalPatient from "../../models/Hospital/HospitalPatient.js";
import Counter from "../../models/Hospital/Counter.js";


import User from "../../models/Hospital/User.js";
import bcrypt from "bcryptjs";

const generatePatientId = async (hospitalId) => {
  const counter = await Counter.findOneAndUpdate(
    { key: `patient_${hospitalId}` },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `PAT-${String(counter.seq).padStart(4, "0")}`;
};

const addPatient = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const hospitalId = req.user.id;
    const data = req.body;

    if (!data.name || !data.dob || !data.gender || !data.mobile) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Required fields missing"
      });
    }

    // ✅ AUTO PATIENT ID
    const patientId = await generatePatientId(hospitalId);

    // ✅ CREATE PATIENT
    const patient = await HospitalPatient.create(
      [{
        ...data,
        patientId,
        hospitalId
      }],
      { session }
    );

    //USER ENTRY
    const rawPassword = data.mobile.slice(-4) + "@123"; 
    const passwordHash = await bcrypt.hash(rawPassword, 10);
    const user = await User.create(
      [{
        hospitalId,
        name: data.name,
        mobile: data.mobile,
        email: data.email || null,
        role: "patient",
        refId: patient[0]._id,
        passwordHash,
        status: "Active"
      }],
      { session }
    );


    // ✅ UPDATE PATIENT WITH USER ID
    patient[0].user_id = user[0]._id;
    await patient[0].save({ session });
    

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Patient added successfully",
      data: patient[0]
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
const listPatients = async (req, res) => {
  try {
    const hospitalId = req.user.id;

    let { page = 1, limit = 10, search = "" } = req.query;

    page = Number(page);
    limit = Number(limit);

    const query = {
      hospitalId,
      $or: [
        { name: { $regex: search, $options: "i" } },
        { patientId: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } }
      ]
    };

    const total = await HospitalPatient.countDocuments(query);

    const patients = await HospitalPatient.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      data: patients,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
const getPatientById = async (req, res) => {
  try {
    const hospitalId = req.user.id;
    const { id } = req.params;

    const patient = await HospitalPatient.findOne({
      _id: id,
      hospitalId
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }

    res.json({
      success: true,
      data: patient
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
const updatePatient = async (req, res) => {
  try {
    const hospitalId = req.user.id;
    const { id } = req.params;

    const patient = await HospitalPatient.findOneAndUpdate(
      { _id: id, hospitalId },
      req.body,
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }

    res.json({
      success: true,
      message: "Patient updated successfully",
      data: patient
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
const deletePatient = async (req, res) => {
  try {
    const hospitalId = req.user.id;
    const { id } = req.params;

    const patient = await HospitalPatient.findOneAndDelete({
      _id: id,
      hospitalId
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }

    res.json({
      success: true,
      message: "Patient deleted successfully"
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export {addPatient,listPatients,generatePatientId,updatePatient,deletePatient,getPatientById}







