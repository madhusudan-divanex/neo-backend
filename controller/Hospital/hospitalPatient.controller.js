import mongoose from "mongoose";
import HospitalPatient from "../../models/Hospital/HospitalPatient.js";
import Counter from "../../models/Hospital/Counter.js";
import User from "../../models/Hospital/User.js";
import bcrypt from "bcryptjs";
import PatientDepartment from "../../models/Hospital/PatientDepartment.js";
import Patient from "../../models/Patient/patient.model.js";
import PatientDemographic from "../../models/Patient/demographic.model.js";

const generatePatientId = async (hospitalId) => {
  const counter = await Counter.findOneAndUpdate(
    { key: `patient_${hospitalId}` },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `PAT-${String(counter.seq).padStart(4, "0")}`;
};

export const addPatient = async (req, res) => {
  const { name, dob, gender, contactNumber, email, department, address, countryId, stateId, cityId, pinCode, status, contact } = req.body

  try {
    const hospitalId = req.user._id;
    const data = req.body;
    if (!name || !dob || !gender || !contactNumber) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing"
      });
    }

    // ✅ AUTO PATIENT ID
    const patientId = await generatePatientId(hospitalId);
    // ✅ CREATE PATIENT
    const patient = await Patient.create({ name, gender, contactNumber,  email });
    if (patient) {
      const rawPassword = contactNumber.slice(-4) + "@123";
      const passwordHash = await bcrypt.hash(rawPassword, 10);
      const pt = await User.create({ name, patientId: patient._id, email, role: 'patient', created_by: "hospital", created_by_id: hospitalId, passwordHash })
      await PatientDemographic.create({ userId: pt._id, dob, contact, address, pinCode, countryId, stateId, cityId })
      await Patient.findByIdAndUpdate(patient._id, { userId: pt._id }, { new: true })
      await PatientDepartment.create({ patientId: pt._id,  departmentId: department,hospitalId,status})
    }
    res.status(200).json({
      success: true,
      message: "Patient added successfully",
      data: patient
    });

  } catch (err) {
    console.log(err)
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export const listPatients = async (req, res) => {
  try {
    const hospitalId = req.user._id;
    let { page = 1, limit = 10, search = "" } = req.query;

    page = Math.max(Number(page), 1);
    limit = Number(limit);
    search = search.trim();

    const matchStage = {
      role: "patient"
    };

    if (search.length > 0) {
      matchStage.$or = [
        { name: { $regex: search, $options: "i" } },
        {
          $expr: {
            $regexMatch: {
              input: { $toString: "$patientId" },
              regex: search,
              options: "i"
            }
          }
        },
        {
          $expr: {
            $regexMatch: {
              input: { $toString: "$email" },
              regex: search,
              options: "i"
            }
          }
        }
      ];
    }

    const pipeline = [
      { $match: matchStage },

      // 🔗 Join PatientDepartment
      {
        $lookup: {
          from: "patientdepartments",
          localField: "_id",
          foreignField: "patientId",
          as: "departmentInfo"
        }
      },

      // 🏥 Filter by hospital
      {
        $match: {
          "departmentInfo.hospitalId": hospitalId
        }
      },

      // 🔗 Populate patientId from User table
      {
        $lookup: {
          from: "patients",
          localField: "patientId",
          foreignField: "_id",
          as: "patientUser"
        }
      },

      {
        $unwind: {
          path: "$patientUser",
          preserveNullAndEmptyArrays: true
        }
      },

      // ❌ Remove passwordHash
      {
        $project: {
          passwordHash: 0,
          "patientUser.passwordHash": 0
        }
      },

      { $sort: { createdAt: -1 } },

      {
        $facet: {
          data: [
            { $skip: (page - 1) * limit },
            { $limit: limit }
          ],
          totalCount: [{ $count: "count" }]
        }
      }
    ];

    const result = await User.aggregate(pipeline);

    const patients = result[0].data;
    const total = result[0].totalCount[0]?.count || 0;

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
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};


export const getPatientById = async (req, res) => {
  try {
    const hospitalId = req.user._id;
    const { id } = req.params;

    const patient = await Patient.findOne({
      userId: id
    }).lean();

    const demographic = await PatientDemographic.findOne({ userId: id }).lean()
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }
    const department = await PatientDepartment.findOne({ patientId: id, hospitalId })

    res.json({
      success: true,
      data: { ...patient, ...demographic }, department
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export const updatePatient = async (req, res) => {
  const { name, dob, gender, contactNumber, email, department, address, countryId, stateId, cityId, pinCode, status, contact, patientId } = req.body
  try {
    const hospitalId = req.user._id;
    const patient = await User.findByIdAndUpdate(patientId, { name, email }, { new: true })
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }
    await Patient.findByIdAndUpdate(patient.patientId, { name, gender, contactNumber, email }, { new: true })
    await PatientDemographic.findOneAndUpdate({ userId: patient.patientId }, { dob, contact, address, pinCode, countryId, stateId, cityId }, { new: true })
    const isExist = await PatientDepartment.findOne({ patientId: patient._id, hospitalId })
    if (isExist) {
      await PatientDepartment.findOneAndUpdate({ patientId: patient._id, hospitalId }, { departmentId: department,status }, { new: true })
    } else {
      await PatientDepartment.create({ patientId: patient._id, hospitalId, departmentId: department,status })
    }

    res.json({
      success: true,
      message: "Patient updated successfully",
      data: patient
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export const getPatientByPatientId = async (req, res) => {
  const hospitalId = req.user._id
  try {
    const patientId = req.params.patientId;
    let patient;
    if (patientId?.length < 23) {
      patient = await User.findOne({
        unique_id: patientId
      });
    } else {
      patient = await User.findById(patientId);
    }

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }
    const patientDetail = await Patient.findById(patient.patientId).lean();
    const patientAddress = await PatientDemographic.findOne({
      userId: patient._id
    }).populate('countryId stateId cityId').lean();
    const department = await PatientDepartment.findOne({
      patientId: patient._id,
      hospitalId: new mongoose.Types.ObjectId(hospitalId),
    });
    return res.json({
      success: true,
      user: patientDetail, demographic: patientAddress, department
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export const deletePatient = async (req, res) => {
  try {
    const hospitalId = req.user._id;
    const { id } = req.params;

    // const patient = await User.findOneAndDelete({
    //   _id: id,
    //   created_by_id: hospitalId
    // });
    // await PatientDemographic.findOneAndDelete({ userId: id })
    // if (!patient) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "Patient not found"
    //   });
    // }
    await PatientDepartment.findOneAndDelete({ patientId: id ,hospitalId})

    res.json({
      success: true,
      message: "Patient deleted successfully"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};