import mongoose, { Schema} from "mongoose";

const componentSchema=new Schema({
    name:{type:String,required:true},
    unit:{type:String,required:true},
    optionType:{type:String,required:true,default:'text'},
    result:[{type:String,required:true}],
    referenceRange:{type:String,required:true},
    status:{type:Boolean,default:false}    
})

const requestSchema=new Schema({
    labId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Laboratory',required:true
    },
    title:[{type:String}],
    precautions:{type:String,required:true},
    shortName:{type:String,required:true},
    component:[componentSchema],
    testCategory:{type:String,required:true},
    sampleType:{type:String,required:true},
    price:{type:String,required:true},
    status:{type:String,enum:['active','inactive'],default:'inactive'},
    cancelMessage:String

},{timestamps:true})
const Test= mongoose.model('Test', requestSchema);
export default Test