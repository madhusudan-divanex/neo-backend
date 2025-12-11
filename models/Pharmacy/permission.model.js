import mongoose, { Schema } from "mongoose";

const permissionSchema=new Schema({
    name:{type:String,required:true},
    listView:{type:Boolean,default:false},
    add:{type:Boolean,default:false},
    edit:{type:Boolean,default:false},
    view:{type:Boolean,default:false},
    patientList:{type:Boolean,default:false},
    details:{type:Boolean,default:false},
    chat:{type:Boolean,default:false},
    pharId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', required: true },
    

},{timestamps:true})

const PharPermission=mongoose.model('phar-permission',permissionSchema)

export default PharPermission