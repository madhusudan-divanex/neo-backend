import mongoose, { Schema } from "mongoose"


const certSchema = new Schema({
  certName: { type: String, required: true },
  certFile: { type: String, required: true },
});
const eduSchema = new Schema({
  university: { type: String, required: true },
  degree: { type: String, required: true },
  yearFrom:{type:String,required:true},
  yearTo:{type:String,required:true}
});
const licSchema = new Schema({
    labCert: [certSchema],
    profession:{type:String,required:true},
    specialization:{type:String,required:true},
    totalExperience:{type:String,required:true},
    professionalBio:{type:String,required:true},
    education:[eduSchema],
    empId: { type: mongoose.Schema.Types.ObjectId, ref: 'lab-staff', required: true ,index:true},
}, { timestamps: true })

const EmpProfesional = mongoose.model('lab-emp-prof', licSchema)

export default EmpProfesional