import mongoose, { Schema} from "mongoose";

const requestSchema=new Schema({
    doctorId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Laboratory',required:true
    },
    patientId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Patient',required:true
    },
    testId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Test',required:true
    },
    date:{type:Date,required:true},
    fees:{type:String,required:true},
    status:{type:String,enum:['pending','approved','completed','rejected','cancel'],default:'pending'},
    cancelMessage:String

},{timestamps:true})
const LabAppointment= mongoose.model('lab-appointment', requestSchema);
export default LabAppointment