import cron from 'node-cron'
import Prescriptions from '../models/Prescriptions.js';
import Notification from '../models/Notifications.js';

cron.schedule('0 0 * * *', async () => {
  try {
    console.log("📌 Revisit cron started:", new Date());

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const prescriptions = await Prescriptions.find({status:'Active',notif:false,
      reVisit: { $exists: true, $ne: null }
    }).populate('doctorId','name');

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
        await Prescriptions.findByIdAndUpdate(prescription._id,{notif:true},{new:true})
        console.log(`✅ Notification sent to patient: ${prescription.patientId}`);
      }
    }

  } catch (error) {
    console.error("❌ Error in revisit cron job:", error);
  }
});
