import mongoose from "mongoose";

const StaffEmploymentSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true
    },

    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User" // hospital / lab / pharmacy
    },

    organizationType: {
        type: String,
        enum: ["hospital", "lab", "pharmacy", "doctor"]
    },

    department:  {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
    },
    fees:Number,
    email:String,
    contactNumber:String,
    password:String,
    role: String,
    joinDate: String,
    salary: Number,
    contractStart: String,
    contractEnd: String,
    note:String,

    status: {
        type: String,
        enum: ["active", "inactive", "leave"],
        default: "active"
    },
    password: String,
    userRole:{
        type:String,
        enum:['staff','doctor'],
        default:"staff"
    },
    permissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'permission' },


}, { timestamps: true });
export default mongoose.model("StaffEmployement", StaffEmploymentSchema);