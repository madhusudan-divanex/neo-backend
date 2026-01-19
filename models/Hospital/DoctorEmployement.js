import mongoose, { Schema } from "mongoose"

const licSchema = new Schema({
    position:{type:String},
    joinDate:{type:Date,required:true},
    onLeaveDate:{type:Date},
    contractStart:{type:Date,required:true},
    contractEnd:{type:Date},
    salary:{type:String,required:true},
    note:{type:String,required:true},
    fees:{type:String},
    reportingTo:{type:String},
    employmentType:{type:String},
    department:{ type: mongoose.Schema.Types.ObjectId,
          ref: "HospitalDepartment",
          required:true},
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true ,index:true},
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true ,index:true},
}, { timestamps: true })

const EmpEmployement = mongoose.model('doctor-employment', licSchema)

export default EmpEmployement