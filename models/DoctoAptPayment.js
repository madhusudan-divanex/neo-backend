import mongoose from 'mongoose';

const doctorAptInvoiceSchema = new mongoose.Schema(
    {
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        hospitalId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        appointmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'doctor-appointment',
            required: true,
        },        

        customId: {
            type: String,
            unique: true,
        },
        paymentMethod:{
            type:String,
            enum:['CARD','ONLINE','CASH']
        },
        paymentInfoId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PaymentInfo',
        },
        totalAmount:String,
        subTotal:String,
        discountValue:String,
        discountType:{type:String,enum:['Fixed', 'Percentage',""],default:""},

    },
    { timestamps: true }
);
doctorAptInvoiceSchema.pre("save", async function (next) {
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
const DoctorAptPayment = mongoose.model('DoctorAptPayment', doctorAptInvoiceSchema);

export default DoctorAptPayment