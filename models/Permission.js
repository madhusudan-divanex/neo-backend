import mongoose, { Schema } from "mongoose";

const permissionSchema = new Schema(
  {
    // 🔑 COMMON
    name: { type: String, required: true },

    type: {
      type: String,
      enum: ["doctor", "hospital", "lab", "pharmacy"],
      required: true,
      index: true
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    staffEmp:[{
      type: mongoose.Schema.Types.ObjectId,
      ref: "StaffEmployement",
    }],

    // ================== DOCTOR ==================
    doctor: {
      appointmentVital: { type: Boolean, default: false },
      appointmentAdd: { type: Boolean, default: false },
      appointmentPayment: { type: Boolean, default: false },
      appointmentStatus: { type: Boolean, default: false },

      addPrescription: { type: Boolean, default: false },
      editPrescription: { type: Boolean, default: false },
      deletePrescription: { type: Boolean, default: false },

      addLabTest: { type: Boolean, default: false },
      chat: { type: Boolean, default: false }
    },

    // ================== HOSPITAL ==================
    hospital: {
      doctors: {
        list: { type: Boolean, default: false },
        add: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        view: { type: Boolean, default: false },
        delete: { type: Boolean, default: false }
      },

      appointments: {
        list: { type: Boolean, default: false },
        add: { type: Boolean, default: false },
        view: { type: Boolean, default: false },
        addPrescription: { type: Boolean, default: false },
        editPrescription: { type: Boolean, default: false },
        status: { type: Boolean, default: false }
      },
      billing: {
        doctorPayment: { type: Boolean, default: false },
        labPayment: { type: Boolean, default: false },
        allotmentPayment: { type: Boolean, default: false },
      },

      beds: {
        add: { type: Boolean, default: false },
        viewDetails: { type: Boolean, default: false },
        addAllotment: { type: Boolean, default: false },
        editAllotment: { type: Boolean, default: false },
        dischargePatient: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },

      patients: {
        list: { type: Boolean, default: false },
        add: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        view: { type: Boolean, default: false },
        delete: { type: Boolean, default: false }
      },

      staff: {
        list: { type: Boolean, default: false },
        add: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        view: { type: Boolean, default: false },
        delete: { type: Boolean, default: false }
      },

      pharmacy: {
        listInventory: { type: Boolean, default: false },
        addInventory: { type: Boolean, default: false },
        editInventory: { type: Boolean, default: false },
        deleteInventory: { type: Boolean, default: false },
        sellMedicine: { type: Boolean, default: false },
      },
      lab: {
        paymentStatus: { type: Boolean, default: false },
        appointmentStatus: { type: Boolean, default: false },
        addAppointment: { type: Boolean, default: false },
        addTest: { type: Boolean, default: false },
        editTest: { type: Boolean, default: false },
        deleteTest: { type: Boolean, default: false },
        addReport: { type: Boolean, default: false },
      },

      chat: {
        access: { type: Boolean, default: false }
      }
    },

    // ================== LAB ==================
    lab: {
      testRequest: { type: Boolean, default: false },
      addTest: { type: Boolean, default: false },
      editTest: { type: Boolean, default: false },
      billing: { type: Boolean, default: false },

      viewReport: { type: Boolean, default: false },
      addReport: { type: Boolean, default: false },
      editReport: { type: Boolean, default: false },
      export: { type: Boolean, default: false },

      patientDetails: { type: Boolean, default: false },
      appointmentDetails: { type: Boolean, default: false },

      sendReportMail: { type: Boolean, default: false },
      printReport: { type: Boolean, default: false },

      patientCall: { type: Boolean, default: false },

      paymentStatus: { type: Boolean, default: false },
      appointmentStatus: { type: Boolean, default: false },
      chat: { type: Boolean, default: false }
    },

    // ================== PHARMACY ==================
    pharmacy: {
      listInventory: { type: Boolean, default: false },
      addInventory: { type: Boolean, default: false },
      editInventory: { type: Boolean, default: false },
      viewInventory: { type: Boolean, default: false },
      deleteInventory: { type: Boolean, default: false },
      listSell: { type: Boolean, default: false },
      addSell: { type: Boolean, default: false },
      editSell: { type: Boolean, default: false },
      viewSell: { type: Boolean, default: false },
      listSupplier: { type: Boolean, default: false },
      addSupplier: { type: Boolean, default: false },
      editSupplier: { type: Boolean, default: false },
      viewSupplier: { type: Boolean, default: false },
      deleteSupplier: { type: Boolean, default: false },
      listReturn: { type: Boolean, default: false },
      addReturn: { type: Boolean, default: false },
      editReturn: { type: Boolean, default: false },
      deleteReturn: { type: Boolean, default: false },
      viewReturn: { type: Boolean, default: false },
      patientList: { type: Boolean, default: false },
      details: { type: Boolean, default: false },
      chat: { type: Boolean, default: false }
    }
  },
  { timestamps: true }
);

const Permission = mongoose.model("permission", permissionSchema);
export default Permission;
