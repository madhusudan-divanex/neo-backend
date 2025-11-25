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
    message:{type:String,required:true},

    type:{type:String,enum:['doctor','patient','lab'],default:'doctor'},
    status:{type:String,enum:['pending','approved','rejected'],default:'pending'}

},{timestamps:true})
const EditRequest= mongoose.model('edit-request', requestSchema);
export default EditRequest