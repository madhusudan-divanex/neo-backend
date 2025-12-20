import mongoose from 'mongoose';

const DepartmentEmployeeSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "HospitalStaff",
    required: true
  },
  role: {
    type: String,
    required: true
  }
}, { _id: false });

const HospitalDepartmentSchema = new mongoose.Schema({
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
    enum: ["OPD", "IPD"],
    required: true
  },

  headOfDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "HospitalStaff"
  },

  employees: [DepartmentEmployeeSchema],

  status: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

const HospitalDeparment = mongoose.model(
  "HospitalDepartment",
  HospitalDepartmentSchema
);
export default HospitalDeparment