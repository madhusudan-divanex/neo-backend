import mongoose, { Schema} from "mongoose";

const requestSchema=new Schema({
    doctorId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Doctor'
    },
    patientId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Patient'
    },
    labId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Laboratory'
    },
    pharId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Pharmacy'
    },
    message:{type:String,required:true},

    type:{type:String,enum:['doctor','patient','lab','pharmacy'],default:'doctor'},
    status:{type:String,enum:['pending','approved','rejected'],default:'pending'}

},{timestamps:true})
const EditRequest= mongoose.model('edit-request', requestSchema);
export default EditRequest