import mongoose from "mongoose";

const DepartmentEmployeeSchema = new mongoose.Schema(
    {
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "DoctorStaff",
        }
    },
    { _id: false }
);

const doctorepartmentSchema = new mongoose.Schema(
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


        headOfDepartment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "doctor-staff"
        },

        employees: [DepartmentEmployeeSchema],

    },
    { timestamps: true }
);

const DoctorDepartment = mongoose.model(
    "DoctorDepartment",
    doctorepartmentSchema
);
export default DoctorDepartment;