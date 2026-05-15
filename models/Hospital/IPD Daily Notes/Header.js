import mongoose, { Schema } from "mongoose";

const headerSchema=new Schema({
    hospitalId:{
        type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true ,index:true
    },
    doctorId:{
        type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true ,index:true
    },
    patientId:{
        type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true ,index:true
    },
    bedId:{
        type: mongoose.Schema.Types.ObjectId, ref: 'HospitalBed', required: true ,
    },
    roomId:{
        type: mongoose.Schema.Types.ObjectId, ref: 'HospitalRoom', required: true 
    },
    authorId:{
        type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true 
    },
    allotmentId:{
        type: mongoose.Schema.Types.ObjectId, ref: 'BedAllotment', required: true 
    },
    date:{type:String,required:true},
    time:{type:String,required:true},
    

},{timestamps:true})

const IPDHeader=mongoose.model('IPDHeader',headerSchema)

export default IPDHeader