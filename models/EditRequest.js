import mongoose, { Schema} from "mongoose";

const requestSchema=new Schema({
    doctorId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    patientId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    labId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    pharId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    message:{type:String,required:true},

    type:{type:String,enum:['doctor','patient','lab','pharmacy'],default:'doctor'},
    status:{type:String,enum:['pending','approved','rejected'],default:'pending'}

},{timestamps:true})
const EditRequest= mongoose.model('edit-request', requestSchema);
export default EditRequest