import cron from 'node-cron'
import Prescriptions from '../models/Prescriptions.js';
import Notification from '../models/Notifications.js';
import HospitalBed from '../models/Hospital/HospitalBed.js';
import HospitalPayment from '../models/Hospital/HospitalPayment.js';
import BedAllotment from '../models/Hospital/BedAllotment.js';
import mongoose from 'mongoose';
import Inventory from '../models/Pharmacy/inventory.model.js';
import sendPatientEmail, { sendDoctorEmail, sendPharEmail } from './sendTemplateEmail.js';
import HospitalBasic from '../models/Hospital/HospitalBasic.js';
import HospitalAddress from '../models/Hospital/HospitalAddress.js';
import DoctorAppointment from '../models/DoctorAppointment.js';
import DoctorAbout from '../models/Doctor/addressAbout.model.js';
import User from '../models/Hospital/User.js';
import Rating from '../models/Rating.js';
import Laboratory from '../models/Laboratory/laboratory.model.js';
import Doctor from '../models/Doctor/doctor.model.js';

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
    }).populate('doctorId patientId', 'name');

    for (const prescription of prescriptions) {

      const revisitDate = new Date(prescription.createdAt);
      revisitDate.setDate(revisitDate.getDate() + prescription.reVisit);
      revisitDate.setHours(0, 0, 0, 0);

      // agar aaj ka din hai
      if (revisitDate >= today && revisitDate < tomorrow) {
        const doctorAbout = await DoctorAbout.findOne({
          userId: prescription.doctorId?._id
        }).populate("specialty");
        sendPatientEmail(
          "Email Template/patient/DoctorFollowUp.html",
          {
            doctorName: prescription?.doctorId?.name || "Doctor",
            date: new Date().toLocaleDateString("en-GB"),
            name: prescription?.patientId?.name,
            btnLink: process.env.PATIENT_URL + '/my-appointment',
            specialization: doctorAbout?.specialty?.name || 'General'
          },
          "Doctor Consultation Follow-up",
          prescription?.patientId?._id
        );
        sendDoctorEmail(
          "Email Template/Doctor/PatientFollowUp.html",
          {
            patientName: prescription?.patientId?.name || "Patient",
            date: new Date().toLocaleDateString("en-GB"),
            name: prescription?.doctorId?.name,
            btnLink: process.env.DOCTOR_URL + `/detail-view/${prescription?.patientId?.name}/${prescription?.appointmentId}`,
            diagnosis: prescription?.diagnosis
          },
          "Patient Follow-up Reminder",
          prescription?.doctorId?._id
        );
        await Notification.create({
          userId: prescription.patientId?._id,
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
        await BedAllotment.findByIdAndUpdate(
          allot._id,
          { paymentId: payment._id },
          { session }
        );
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
cron.schedule("0 0 * * *", async () => {
  try {

    // Aaj ki date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Exact 10th day
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + 10);

    // Start & End
    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(targetDate);
    end.setHours(23, 59, 59, 999);

    // Medicines
    const upcomingExpired = await Inventory.find({
      expDate: {
        $gte: start,
        $lte: end
      }
    }).populate("pharId", "name email");

    // Group by pharmacy
    const groupedByPharmacy = {};

    for (const med of upcomingExpired) {

      const pharId = med?.pharId?._id?.toString();

      if (!pharId) continue;

      if (!groupedByPharmacy[pharId]) {
        groupedByPharmacy[pharId] = {
          pharmacy: med.pharId,
          medicines: []
        };
      }

      groupedByPharmacy[pharId].medicines.push({
        medicineName: med.medicineName,
        batchNumber: med.batchNumber,
        expDate: med.expDate
      });
    }

    // Single mail per pharmacy
    for (const pharId in groupedByPharmacy) {

      const pharmacyData = groupedByPharmacy[pharId];

      await sendPharEmail(
        "Email Template/Pharmacy/ExpiryMedicine.html",
        {
          btnLink: process.env.PHARMACY_URL + "/inventory",
          name: pharmacyData.pharmacy.name,
        },
        "Expiring Medicines Alert",
        pharId
      );
    }

    console.log(
      `✅ Upcoming expiry check completed. ${Object.keys(groupedByPharmacy).length} pharmacy emails sent.`
    );

  } catch (err) {
    console.error("❌ Upcoming expiry cron failed:", err.message);
  }
});
cron.schedule("* * * * *", async () => {
  try {
    // Current time
    const now = new Date();

    // Next 5 hours
    const nextFiveHours = new Date(now.getTime() + 5 * 60 * 60 * 1000);

    // Find appointments between now and next 5 hours
    const appointments = await DoctorAppointment.find({
      date: {
        $gte: now,
        $lte: nextFiveHours
      },
      status: "approved",
      reminderSent: { $ne: true }
    }).populate("doctorId patientId", "name email");

    for (const apt of appointments) {
      let location = "";
      let specialization = "General";

      const doctorAbout = await DoctorAbout.findOne({
        userId: apt.doctorId?._id
      }).populate("cityId specialty");

      if (apt.hospitalId) {
        const isHosp = await HospitalBasic.findOne({
          userId: apt.hospitalId
        });

        const hospitalAddress = await HospitalAddress.findOne({
          hospitalId: isHosp?._id
        }).populate("city", "name");

        location =
          `${hospitalAddress?.fullAddress || ""}, ` +
          `${hospitalAddress?.city?.name || ""}, ` +
          `${hospitalAddress?.pinCode || ""}`;
      } else {
        location =
          `${doctorAbout?.fullAddress || ""}, ` +
          `${doctorAbout?.cityId?.name || ""}, ` +
          `${doctorAbout?.pinCode || ""}`;
      }

      specialization = doctorAbout?.specialty?.name || "General";

      const btnLink =
        process.env.PATIENT_URL +
        `/appointment-detail/${apt?.doctorId?.name}/${apt?._id}`;

      // Send email
      await sendPatientEmail(
        "Email Template/patient/DoctorAptReminder.html",
        {
          aptId: apt?.customId,
          doctorName: apt?.doctorId?.name || "Doctor",
          date: new Date(apt?.date).toLocaleDateString("en-GB"),
          time: new Date(apt?.date).toLocaleTimeString("en-GB"),
          name: apt?.patientId?.name,
          specialization,
          btnLink,
          location
        },
        "Doctor Appointment Reminder",
        apt?.patientId?._id
      );

      // Send notification
      await Notification.create({
        userId: apt?.patientId?._id,
        title: "Appointment Reminder",
        message: `Your appointment with Dr. ${apt?.doctorId?.name} is scheduled within next 5 hours.`,
        type: "APPOINTMENT_REMINDER"
      });

      // Mark reminder as sent
      await DoctorAppointment.findByIdAndUpdate(apt._id, {
        reminderSent: true
      });
    }
  } catch (error) {
    console.error("Cron Error:", error);
  }
});
cron.schedule("0 9 * * 1", async () => {

  try {

    const lowStockMedicines = await Inventory.find({

      $expr: {

        $lte: [
          "$quantity",
          { $multiply: ["$sellCount", 0.10] }
        ]

      }

    }).populate("pharId", "name email");

    // unique pharmacies with data
    const pharmacies = {};

    for (const med of lowStockMedicines) {

      const pharId = med?.pharId?._id?.toString();

      if (!pharId) continue;

      pharmacies[pharId] = med.pharId;

    }

    // send one mail per pharmacy
    for (const pharId in pharmacies) {

      const pharmacy = pharmacies[pharId];

      await sendPharEmail(

        "Email Template/Pharmacy/LowMedicine.html",

        {
          btnLink: process.env.PHARMACY_URL + "/inventory",
          name: pharmacy?.name,
        },

        "Low Stock Alert",

        pharId

      );

    }

    console.log(`✅ Low stock alert sent to ${Object.keys(pharmacies).length} pharmacies`);

  } catch (err) {

    console.error("❌ Low stock cron failed:", err.message);

  }

});
cron.schedule("0 2 * * *", async () => {
  console.log(`[RatingCron] Started at ${new Date().toISOString()}`);

  try {
    // Step 1: Saare lab/hospital users fetch karo
    const labUsers = await User.find({
      labId: { $exists: true, $ne: null },
      role: { $in: ['lab', 'hospital'] }
    }).select('_id labId').lean();

    if (!labUsers.length) {
      console.log('[RatingCron] No lab users found. Skipping.');
      return;
    }

    const labUserIds = labUsers.map(u => u._id);

    // Step 2: Ek hi aggregation mein saari ratings calculate karo
    const ratings = await Rating.aggregate([
      {
        $match: { labId: { $in: labUserIds } }
      },
      {
        $group: {
          _id: '$labId',
          avgRating: { $avg: '$star' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    // Step 3: Rating map banao  ->  userId => { avg, total }
    const ratingMap = {};
    ratings.forEach(r => {
      ratingMap[r._id.toString()] = {
        avgRating: Number(r.avgRating.toFixed(1)),
        totalReviews: r.totalReviews
      };
    });

    // Step 4: Har lab ke liye bulkWrite se ek saath update karo (efficient)
    const bulkOps = labUsers.map(u => {
      const rating = ratingMap[u._id.toString()] || {
        avgRating: 0,
        totalReviews: 0
      };

      return {
        updateOne: {
          filter: { _id: u.labId },          // Laboratory model ka _id
          update: {
            $set: {
              rating: rating.avgRating,
            }
          }
        }
      };
    });

    const result = await Laboratory.bulkWrite(bulkOps);

    console.log(
      `[RatingCron] Done. Modified: ${result.modifiedCount} | ` +
      `Matched: ${result.matchedCount} | ` +
      `Time: ${new Date().toISOString()}`
    );

  } catch (err) {
    console.error('[RatingCron] Error:', err.message);
  }
});
cron.schedule("0 2 * * *", async () => {
  console.log(`[RatingCron] Started at ${new Date().toISOString()}`);

  try {
    // Step 1: Saare lab/hospital users fetch karo
    const doctorUsers = await User.find({
      doctorId: { $exists: true, $ne: null },
      role: { $in: ['doctor'] }
    }).select('_id doctorId').lean();

    if (!doctorUsers.length) {
      console.log('[RatingCron] No lab users found. Skipping.');
      return;
    }

    const doctorUserIds = doctorUsers.map(u => u._id);

    // Step 2: Ek hi aggregation mein saari ratings calculate karo
    const ratings = await Rating.aggregate([
      {
        $match: { doctorId: { $in: doctorUserIds } }
      },
      {
        $group: {
          _id: '$doctorId',
          avgRating: { $avg: '$star' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    // Step 3: Rating map banao  ->  userId => { avg, total }
    const ratingMap = {};
    ratings.forEach(r => {
      ratingMap[r._id.toString()] = {
        avgRating: Number(r.avgRating.toFixed(1)),
        totalReviews: r.totalReviews
      };
    });

    // Step 4: Har lab ke liye bulkWrite se ek saath update karo (efficient)
    const bulkOps = doctorUsers.map(u => {
      const rating = ratingMap[u._id.toString()] || {
        avgRating: 0,
        totalReviews: 0
      };

      return {
        updateOne: {
          filter: { _id: u.doctorId },          // Laboratory model ka _id
          update: {
            $set: {
              rating: rating.avgRating,
            }
          }
        }
      };
    });

    const result = await Doctor.bulkWrite(bulkOps);

    console.log(
      `[RatingCron] Done. Modified: ${result.modifiedCount} | ` +
      `Matched: ${result.matchedCount} | ` +
      `Time: ${new Date().toISOString()}`
    );

  } catch (err) {
    console.error('[RatingCron] Error:', err.message);
  }
});
