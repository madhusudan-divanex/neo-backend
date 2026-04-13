import mongoose from 'mongoose';

const labInvoiceSchema = new mongoose.Schema(
    {
        labId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        appointmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'LabAppointment',
            required: true,
        },
        

        customId: {
            type: String,
            unique: true,
        },
        paymentType:{
            type:String,
            enum:['CARD','ONLINE','CASH']
        },
        paymentId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PaymentInfo',
        },
        subTotal:String,
        discount:String,
        taxes:String,
        total:String

    },
    { timestamps: true }
);
labInvoiceSchema.pre("save", async function (next) {
  if (this.customId) return next();

  try {
    while (true) {
      const id = Math.floor(100000 + Math.random() * 900000).toString();
      const exists = await this.constructor.findOne({ customId: id });
      if (!exists) {
        this.customId = `INV-${id}`;
        break;
      }
    }
    next();
  } catch (err) {
    next(err);
  }
});
const LabPayment = mongoose.model('LabPayment', labInvoiceSchema);

export default LabPayment