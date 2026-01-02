import mongoose, { Schema} from "mongoose";

const requestSchema=new Schema({
    labId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',required:true
    },
    patientId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',required:true
    },
    testId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Test',required:true
    },
    appointmentId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'lab-appointment',required:true
    },
    component: [
    {
      cmpId: String,  
      result: String, 
      status: String, 
    },
  ],
    comment:{type:String,required:true}

},{timestamps:true})
const TestReport= mongoose.model('test-report', requestSchema);
export default TestReport