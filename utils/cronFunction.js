import cron from 'node-cron'
import Prescriptions from '../models/Prescriptions.js';
import Notification from '../models/Notifications.js';
import HospitalBed from '../models/Hospital/HospitalBed.js';
import HospitalPayment from '../models/Hospital/HospitalPayment.js';
import BedAllotment from '../models/Hospital/BedAllotment.js';
import mongoose from 'mongoose';
import Inventory from '../models/Pharmacy/inventory.model.js';

cron.schedule('0 0 * * *', async () => {
  try {
    console.log("📌 Revisit cron started:", new Date());

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const prescriptions = await Prescriptions.find({
      status: 'Active', notif: false,
      reVisit: { $exists: true, $ne: null }
    }).populate('doctorId', 'name');

    for (const prescription of prescriptions) {

      const revisitDate = new Date(prescription.createdAt);
      revisitDate.setDate(revisitDate.getDate() + prescription.reVisit);
      revisitDate.setHours(0, 0, 0, 0);

      // agar aaj ka din hai
      if (revisitDate >= today && revisitDate < tomorrow) {

        await Notification.create({
          userId: prescription.patientId,
          title: "Doctor Revisit Reminder",
          message: `This is a reminder that you have a scheduled revisit today with Dr. ${prescription.doctorId.name} regarding ${prescription?.diagnosis}. Kindly book your appointment.`,
          type: "REVISIT"
        });
        await Prescriptions.findByIdAndUpdate(prescription._id, { notif: true }, { new: true })
        console.log(`✅ Notification sent to patient: ${prescription.patientId}`);
      }
    }

  } catch (error) {
    console.error("❌ Error in revisit cron job:", error);
  }
});
cron.schedule("0 0 * * *", async () => {
  // Runs daily at 12:00 AM
  console.log("Running Bed Charge Cron...");

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ✅ Get active patients
    const allotments = await BedAllotment.find({ status: "Active" }).session(session);

    for (const allot of allotments) {

      // ✅ Get bed price
      const bed = await HospitalBed.findById(allot.bedId).session(session);
      if (!bed) continue;

      const bedPrice = bed.pricePerDay || 0;

      // ✅ Get or create payment
      let payment = await HospitalPayment.findOne({
        allotmentId: allot._id
      }).session(session);

      if (!payment) {
        payment = await HospitalPayment.create([{
          allotmentId: allot._id,
          hospitalId: allot.hospitalId,
          patientId: allot.patientId,
          bedCharges: [],
          totalAmount: 0,
          finalAmount: 0
        }], { session });

        payment = payment[0];
      }

      // ❌ Prevent duplicate charge for same day
      const alreadyAdded = payment.bedCharges.some(bc =>
        new Date(bc.date).toDateString() === today.toDateString()
      );

      if (alreadyAdded) continue;

      // ✅ Add new charge
      payment.bedCharges.push({
        date: today,
        amount: bedPrice,
        bedId: allot.bedId
      });
      console.log("bed price", bedPrice)

      // ✅ Update totals
      payment.totalAmount = Number(payment.totalAmount) + bedPrice;
      payment.finalAmount = Number(payment.finalAmount) + bedPrice;

      await payment.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    console.log("✅ Bed charges added successfully");

  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error("❌ Cron failed:", err.message);
  }
});

cron.schedule("0 0 * * *", async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const start = new Date(yesterday);
    start.setHours(0, 0, 0, 0);
    const end = new Date(yesterday);
    end.setHours(23, 59, 59, 999);

    const expiredYesterday = await Inventory.find({
      expDate: { $gte: start, $lte: end }
    });

    for (const med of expiredYesterday) {

      await Notification.create({
        userId: med?.pharId || med?.hospitalId,
        title: "Medicine Expiry Alert",
        message: `The medicine ${med?.medicineName} with batch number ${med?.batchNumber} expired on ${med?.expDate.toDateString()}. Please take necessary action.`,
        type: "EXPIRY_ALERT"
      });

    }

    console.log(`✅ Expiry check completed. Notified ${expiredYesterday.length} medicines that expired yesterday.`);
  } catch (err) {
    console.error("❌ Cron failed:", err.message);
  }
});