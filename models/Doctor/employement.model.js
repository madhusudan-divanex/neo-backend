import mongoose, { Schema } from "mongoose"

const licSchema = new Schema({
    position:{type:String,required:true},
    joinDate:{type:Date,required:true},
    onLeaveDate:{type:Date},
    contractStart:{type:Date,required:true},
    contractEnd:{type:Date},
    salary:{type:String,required:true},
    note:{type:String,required:true},

    empId: { type: mongoose.Schema.Types.ObjectId, ref: 'doctor-staff', required: true ,index:true},
}, { timestamps: true })

const EmpEmployment =
  mongoose.models.DoctorStaffEmployment ||
  mongoose.model("DoctorStaffEmployment", licSchema)

export default EmpEmployment