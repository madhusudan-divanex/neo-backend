import mongoose, { Schema } from "mongoose";

const permissionSchema=new Schema({
    name:{type:String,required:true},
    testRequest:{type:Boolean,default:false},
    addTest:{type:Boolean,default:false},
    editTest:{type:Boolean,default:false},
    viewTest:{type:Boolean,default:false},
    viewReport:{type:Boolean,default:false},
    export:{type:Boolean,default:false},
    editReport:{type:Boolean,default:false},
    patientDetails:{type:Boolean,default:false},
    appointmentDetails:{type:Boolean,default:false},
    sendReportMail:{type:Boolean,default:false},
    printReport:{type:Boolean,default:false},
    addReport:{type:Boolean,default:false},
    patientCall:{type:Boolean,default:false},
    patientMail:{type:Boolean,default:false},
    paymentStatus:{type:Boolean,default:false},
    appointmentStatus:{type:Boolean,default:false},
    chat:{type:Boolean,default:false},
    labId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    

},{timestamps:true})

const LabPermission=mongoose.model('lab-permission',permissionSchema)

export default LabPermission