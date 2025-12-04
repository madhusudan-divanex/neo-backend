import mongoose, { Schema} from "mongoose";

const requestSchema=new Schema({
    labId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Laboratory',required:true
    },
    patientId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Patient',required:true
    },
    doctorId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Doctor'
    },
    testId:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Test',required:true
    }],
    date:{type:Date,required:true},
    fees:{type:String,required:true},
    paymentStatus:{type:String,enum:['due','paid'],default:'due'},
    status:{type:String,enum:['pending','approved','deliver-report','pending-report','rejected','cancel'],default:'pending'},
    cancelMessage:String

},{timestamps:true})
const LabAppointment= mongoose.model('lab-appointment', requestSchema);
export default LabAppointment