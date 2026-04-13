import mongoose from "mongoose";
import HospitalPatient from "../../models/Hospital/HospitalPatient.js";
import Counter from "../../models/Hospital/Counter.js";
import User from "../../models/Hospital/User.js";
import bcrypt from "bcryptjs";
import PatientDepartment from "../../models/Hospital/PatientDepartment.js";
import Patient from "../../models/Patient/patient.model.js";
import PatientDemographic from "../../models/Patient/demographic.model.js";
import Country from "../../models/Hospital/Country.js";
import { assignNH12 } from "../../utils/nh12.js";
import HospitalAudit from "../../models/Hospital/HospitalAudit.js";
import Department from "../../models/Department.js";

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
    const hospitalId = req.user._id || req.user.id;;
    const data = req.body;
    if (!name || !dob || !gender || !contactNumber) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing"
      });
    }
    const departmentActive = await Department.findById(department)
    if (departmentActive && !departmentActive?.status) {
      return res.status(400).json({ message: "This department is deleted", success: false })
    }

    // ✅ AUTO PATIENT ID
    const patientId = await generatePatientId(hospitalId);
    // ✅ CREATE PATIENT
    const patient = await Patient.create({ name, gender, contactNumber, email });
    if (patient) {
      const rawPassword = contactNumber.slice(-4) + "@123";
      const passwordHash = await bcrypt.hash(rawPassword, 10);
      const pt = await User.create({ name, patientId: patient._id, contactNumber, email, role: 'patient', created_by: "hospital", created_by_id: hospitalId, passwordHash })
      await PatientDemographic.create({ userId: pt._id, dob, contact, address, pinCode, countryId, stateId, cityId })
      await Patient.findByIdAndUpdate(patient._id, { userId: pt._id }, { new: true })
      await PatientDepartment.create({ patientId: pt._id, departmentId: department, hospitalId, status })
      const countryData = await Country.findById(countryId)
      if (pt && countryData?.phonecode) {
        await assignNH12(pt._id, countryData?.phonecode)
      }
      if (req?.user?.loginUser && hospitalId) {
        await HospitalAudit.create({
          hospitalId, actionUser: req?.user?.loginUser,
          note: `A patient ${addPatient} was created.`
        })
      }
    }

    return res.status(200).json({
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
export const admitPatient = async (req, res) => {
  const { departmentId, patientId } = req.body

  try {
    const hospitalId = req.user._id || req.user.id;;
    if (!patientId || !departmentId) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing"
      });
    }
    const user = await User.findOne({ _id: patientId, role: "patient" })
    if (!user) return res.status(404).message({ success: false, message: "Patient not found" })
    const department = await Department.findOne({ _id: departmentId, userId:hospitalId })
    if (!department) return res.status(404).message({ success: false, message: "Department not found" })

    const data = await PatientDepartment.create({ patientId, departmentId, hospitalId, status: "Active" })
    if (req?.user?.loginUser && hospitalId) {
      await HospitalAudit.create({
        hospitalId, actionUser: req?.user?.loginUser,
        note: `A patient ${user?.name} was added in ${department?.departmentName}.`
      })
    }
    return res.status(200).json({
      success: true,
      message: "Patient added successfully",
      data
    });

  } catch (err) {
    console.log(err)
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export const listPatients = async (req, res) => {
  try {
    const hospitalId = req.user._id || req.user.id;
    const deptType = req.query.deptType
    const status = req.query.status?.trim(); // could be "Active", "Inactive", etc.
    let { page = 1, limit = 10, search = "", unique = "", } = req.query;

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

      {
        $unwind: {
          path: "$departmentInfo",
          preserveNullAndEmptyArrays: false
        }
      },

      // 🏥 Filter hospital
      {
        $match: {
          "departmentInfo.hospitalId": hospitalId
        }
      },

      // 🔗 Join department details
      {
        $lookup: {
          from: "departments",
          localField: "departmentInfo.departmentId",
          foreignField: "_id",
          as: "departmentDetails"
        }
      },

      {
        $unwind: {
          path: "$departmentDetails",
          preserveNullAndEmptyArrays: false
        }
      },

      // ✅ Apply filters FIRST
      ...(deptType
        ? [{
          $match: {
            "departmentDetails.type": deptType
          }
        }]
        : []),

      ...(status
        ? [{
          $match: {
            "departmentInfo.status": status
          }
        }]
        : []),

      // ✅ Sort (latest first)
      {
        $sort: { "departmentInfo.createdAt": -1 }
      },

      // ✅ Apply unique AFTER filtering
      ...(unique === "true"
        ? [
          {
            $group: {
              _id: "$_id", // group by patient
              doc: { $first: "$$ROOT" }
            }
          },
          {
            $replaceRoot: { newRoot: "$doc" }
          }
        ]
        : []),

      // 🔗 Join patient extra info
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

      // ❌ Remove sensitive fields
      {
        $project: {
          passwordHash: 0,
          "patientUser.passwordHash": 0
        }
      },

      // 📄 Pagination
      {
        $facet: {
          data: [
            { $skip: (page - 1) * limit },
            { $limit: limit }
          ],
          totalCount: [
            { $count: "count" }
          ]
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
    const hospitalId = req.user._id || req.user.id;;
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
    const hospitalId = req.user._id || req.user.id;;
    const patient = await User.findByIdAndUpdate(patientId, { name, email }, { new: true })
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }
    const departmentActive = await Department.findById(department)
    if (departmentActive && !departmentActive?.status) {
      return res.status(400).json({ message: "This department is deleted", success: false })
    }
    await Patient.findByIdAndUpdate(patient.patientId, { name, gender, contactNumber, email }, { new: true })
    await PatientDemographic.findOneAndUpdate({ userId: patient.patientId }, { dob, contact, address, pinCode, countryId, stateId, cityId }, { new: true })
    const isExist = await PatientDepartment.findOne({ patientId: patient._id, hospitalId })
    if (isExist) {
      await PatientDepartment.findOneAndUpdate({ patientId: patient._id, hospitalId }, { departmentId: department, status }, { new: true })
    } else {
      await PatientDepartment.create({ patientId: patient._id, hospitalId, departmentId: department, status })
    }
    if (req?.user?.loginUser && hospitalId) {
      await HospitalAudit.create({
        hospitalId, actionUser: req?.user?.loginUser,
        note: `A patient ${name} was updated.`
      })
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
  const hospitalId = req.user._id || req.user.id;
  try {
    const patientId = req.params.patientId;
    let patient;
    if (patientId?.length < 23) {
      patient = await User.findOne({
        nh12: patientId
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
    const hospitalId = req.user._id || req.user.id;;
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
    await PatientDepartment.findOneAndDelete({ _id: id, hospitalId })

    return res.json({
      success: true,
      message: "Patient deleted successfully"
    });

  } catch (err) {
    console.log(err)
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};