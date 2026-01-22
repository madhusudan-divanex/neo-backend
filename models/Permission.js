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

    // ================== DOCTOR ==================
    doctor: {
      appointmentList: { type: Boolean, default: false },
      appointmentAdd: { type: Boolean, default: false },
      appointmentView: { type: Boolean, default: false },
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
        edit: { type: Boolean, default: false },
        view: { type: Boolean, default: false },
        cancel: { type: Boolean, default: false },
        addPrescription: { type: Boolean, default: false },
        editPrescription: { type: Boolean, default: false }
      },

      beds: {
        list: { type: Boolean, default: false },
        viewDetails: { type: Boolean, default: false },
        addAllotment: { type: Boolean, default: false },
        editAllotment: { type: Boolean, default: false },
        addPayment: { type: Boolean, default: false },
        dischargePatient: { type: Boolean, default: false },
        delete: { type: Boolean, default: false }
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
        list: { type: Boolean, default: false },
        add: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false }
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
      viewTest: { type: Boolean, default: false },

      viewReport: { type: Boolean, default: false },
      addReport: { type: Boolean, default: false },
      editReport: { type: Boolean, default: false },
      export: { type: Boolean, default: false },

      patientDetails: { type: Boolean, default: false },
      appointmentDetails: { type: Boolean, default: false },

      sendReportMail: { type: Boolean, default: false },
      printReport: { type: Boolean, default: false },

      patientCall: { type: Boolean, default: false },
      patientMail: { type: Boolean, default: false },

      paymentStatus: { type: Boolean, default: false },
      appointmentStatus: { type: Boolean, default: false },
      chat: { type: Boolean, default: false }
    },

    // ================== PHARMACY ==================
    pharmacy: {
      listView: { type: Boolean, default: false },
      add: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      view: { type: Boolean, default: false },
      patientList: { type: Boolean, default: false },
      details: { type: Boolean, default: false },
      chat: { type: Boolean, default: false }
    }
  },
  { timestamps: true }
);

const Permission = mongoose.model("permission", permissionSchema);
export default Permission;
