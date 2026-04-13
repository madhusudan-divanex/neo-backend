import mongoose, { Schema } from "mongoose";

const permissionSchema=new Schema({
    
    // Doctors Management
    doctors: {
      list: { type: Boolean, default: false },
      add: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      view: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },

    // Appointment Management
    appointments: {
      list: { type: Boolean, default: false },
      add: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      view: { type: Boolean, default: false },
      cancel: { type: Boolean, default: false },
      addPrescription: { type: Boolean, default: false },
      editPrescription: { type: Boolean, default: false },
    },

    // Bed Management
    beds: {
      list: { type: Boolean, default: false },
      viewDetails: { type: Boolean, default: false },
      addAllotment: { type: Boolean, default: false },
      editAllotment: { type: Boolean, default: false },
      addPayment: { type: Boolean, default: false },
      dischargePatient: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },

    // Patient Management
    patients: {
      list: { type: Boolean, default: false },
      add: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      view: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },

    // Staff Management
    staff: {
      list: { type: Boolean, default: false },
      add: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      view: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },

    // Pharmacy Management
    pharmacy: {
      list: { type: Boolean, default: false },
      add: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },

    // Chat
    chat: {
      access: { type: Boolean, default: false },
    },
    name:{type:String,required:true},
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true ,index:true},
    

},{timestamps:true})

const HospitalPermission=mongoose.model('hospital-permission',permissionSchema)

export default HospitalPermission