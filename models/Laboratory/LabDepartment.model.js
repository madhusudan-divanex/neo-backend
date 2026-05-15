import mongoose from "mongoose";

const DepartmentEmployeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "lab-staff",
      required: true
    }
  },
  { _id: false }
);

const HospitalDepartmentSchema = new mongoose.Schema(
  {
    labId: {
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


    headOfDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "lab-staff"
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
  "LabDepartment",
  HospitalDepartmentSchema
);
