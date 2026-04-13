import mongoose from "mongoose";

const DepartmentEmployeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { _id: false }
);

const departmentSchema = new mongoose.Schema(
  {
    userId: {
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
      enum: ["OPD", "IPD","EMERGENCY","LAB"],
    },

    headOfDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
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
  "Department",
  departmentSchema
);
