import mongoose from "mongoose";

const DepartmentEmployeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true
    }
  },
  { _id: false }
);

const HospitalDepartmentSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    departmentName: {
      type: String,
      required: true,
      trim: true
    },

    type: {
      type: String,
      enum: ["OPD", "IPD","EMERGENCY"],
      required: true
    },

    headOfDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff"
    },

    employees: [DepartmentEmployeeSchema],

    status: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export default mongoose.model(
  "HospitalDepartment",
  HospitalDepartmentSchema
);
