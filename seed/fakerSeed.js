/**
 * NeoHealth FAKER Seed — 100+ records per major collection
 * Usage: node seed/fakerSeed.js
 */
import mongoose from "mongoose";
import bcrypt   from "bcryptjs";
import dotenv   from "dotenv";
import path     from "path";
import { fileURLToPath } from "url";

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env") });
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/NeoHealth";

// ── helpers ──────────────────────────────────────────────────────────────────
const FIRST  = ["Rahul","Priya","Amit","Sunita","Vikram","Kavita","Ravi","Pooja","Suresh","Anjali","Manish","Neha","Deepak","Rekha","Arun","Sonal","Kiran","Meena","Ajay","Preeti","Ramesh","Geeta","Naveen","Seema","Rohit","Nisha","Dinesh","Vandana","Sunil","Anita"];
const LAST   = ["Sharma","Gupta","Verma","Singh","Patel","Joshi","Kumar","Agarwal","Mehta","Shah","Yadav","Mishra","Pandey","Tiwari","Srivastava","Malhotra","Kapoor","Chaudhary","Bose","Nair"];
const CITIES = ["Jaipur","Delhi","Mumbai","Bangalore","Chennai","Hyderabad","Pune","Kolkata","Ahmedabad","Lucknow"];
const BLOOD  = ["A+","A-","B+","B-","O+","O-","AB+","AB-"];
const GENDERS= ["Male","Female"];
const BLOG_CATS = ["Health","Wellness","Medical","Nutrition","Fitness","News"];
const HOSP_NAMES= ["City Hospital","Apollo Clinic","Sunrise Medical","LifeCare Center","Wellness Hub","Medicare Plus","Healing Touch","Unity Hospital","Prime Health","Care & Cure"];

const rnd   = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rndN  = (min,max) => Math.floor(Math.random()*(max-min+1))+min;
const fname = () => `${rnd(FIRST)} ${rnd(LAST)}`;
const dname = () => `Dr. ${rnd(FIRST)} ${rnd(LAST)}`;
const mob   = () => `9${String(Math.floor(100000000+Math.random()*900000000))}`;
const mail  = (n) => `${n.toLowerCase().replace(/[^a-z0-9]/g,".")}${rndN(1,99)}@gmail.com`;
const dob   = (min=20,max=65) => new Date(new Date().getFullYear()-rndN(min,max), rndN(0,11), rndN(1,28));
const past  = (days=180) => new Date(Date.now()-rndN(1,days)*86400000);
const uid8  = () => Math.floor(10000000+Math.random()*90000000).toString();
const pw    = () => bcrypt.hash("Test@123",10);
const gst   = (pre) => `07${pre}${rndN(1000,9999)}A1Z5`;

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected:", MONGO_URI.replace(/:([^:@]+)@/,":***@"), "\n");

  // ── imports ─────────────────────────────────────────────────────────────
  const User        = (await import("../models/Hospital/User.js")).default;
  const Doctor      = (await import("../models/Doctor/doctor.model.js")).default;
  const Patient     = (await import("../models/Patient/patient.model.js")).default;
  const PatDemog    = (await import("../models/Patient/demographic.model.js")).default;
  const Lab         = (await import("../models/Laboratory/laboratory.model.js")).default;
  const Pharmacy    = (await import("../models/Pharmacy/pharmacy.model.js")).default;
  const HospBasic   = (await import("../models/Hospital/HospitalBasic.js")).default;
  const HospAddr    = (await import("../models/Hospital/HospitalAddress.js")).default;
  const HospPatient = (await import("../models/Hospital/HospitalPatient.js")).default;
  const DocAppt     = (await import("../models/DoctorAppointment.js")).default;
  const LabAppt     = (await import("../models/LabAppointment.js")).default;
  const EditReq     = (await import("../models/EditRequest.js")).default;
  const Blog        = (await import("../models/Blog.js")).default;
  const Faq         = (await import("../models/Admin/Faq.js")).default;
  const Supplier    = (await import("../models/Pharmacy/supplier.model.js")).default;
  const Notif       = (await import("../models/Notifications.js")).default;
  const Country     = (await import("../models/Hospital/Country.js")).default;
  const State       = (await import("../models/Hospital/State.js")).default;
  const City        = (await import("../models/Hospital/City.js")).default;

  const country = await Country.findOne({ isoCode:"IN" });
  const state   = await State.findOne({ isoCode:"RJ" });
  const city    = await City.findOne({ name:"Jaipur" });
  const hosUser = await User.findOne({ role:"hospital" });

  // ── 1. DOCTORS (20) ─────────────────────────────────────────────────────
  console.log("Seeding 20 doctors...");
  const doctorUserIds = [];
  // Doctor model required: name, gender, dob, contactNumber
  // status enum: pending | approved | rejected
  const docStatuses = ["approved","approved","approved","approved","pending","pending","rejected","approved","approved","approved","approved","pending","approved","rejected","approved","approved","pending","approved","approved","approved"];
  for (let i = 0; i < 20; i++) {
    const n = dname(), m = mob(), e = mail(n);
    const doc = await Doctor.create({
      name: n, email: e, gender: rnd(GENDERS),
      dob: dob(30,60), contactNumber: m,
      status: docStatuses[i]
    });
    const u = await User.create({
      name: n, email: e, contactNumber: m,
      passwordHash: await pw(),
      role: "doctor", doctorId: doc._id,
      created_by: "seed", unique_id: uid8()
    });
    await Doctor.findByIdAndUpdate(doc._id, { userId: u._id });
    doctorUserIds.push(u._id);
  }
  console.log("  ✅ 20 doctors (password: Test@123)");

  // ── 2. PATIENTS (50) ────────────────────────────────────────────────────
  console.log("Seeding 50 patients...");
  const patientUserIds = [];
  // Patient model required: name, gender, contactNumber
  for (let i = 0; i < 50; i++) {
    const n = fname(), m = mob(), e = mail(n);
    const g = rnd(GENDERS);
    const d = dob(5,80);
    const pat = await Patient.create({
      name: n, email: e, gender: g,
      contactNumber: m, status: "approved"
    });
    const u = await User.create({
      name: n, email: e, contactNumber: m,
      passwordHash: await pw(),
      role: "patient", patientId: pat._id,
      created_by: "seed", unique_id: uid8()
    });
    await Patient.findByIdAndUpdate(pat._id, { userId: u._id });
    // PatientDemographic required: dob, userId
    if (country && state && city) {
      await PatDemog.create({
        userId: u._id, dob: d, bloodGroup: rnd(BLOOD),
        height: String(rndN(140,190)), weight: String(rndN(40,100)),
        countryId: country._id, stateId: state._id, cityId: city._id,
        pinCode: String(302000+rndN(1,99))
      });
    }
    // HospitalPatient required: hospitalId, patientId(String), name, dob, gender, mobile
    if (i < 30 && hosUser) {
      await HospPatient.create({
        hospitalId: hosUser._id,
        patientId: m,         // String required
        user_id: u._id,
        name: n,              // required
        dob: d,               // required
        gender: g,            // required
        mobile: m,            // required
        email: e,
        address: `${rndN(1,200)}, ${rnd(CITIES)}`
      });
    }
    patientUserIds.push(u._id);
  }
  console.log("  ✅ 50 patients (30 linked to hospital)");

  // ── 3. LABORATORIES (5) ─────────────────────────────────────────────────
  console.log("Seeding 5 labs...");
  const labUserIds = [];
  // Lab required: name, email, contactNumber, gstNumber, about
  // status: no enum — any string (default 'pending')
  const labNames = ["Advanced Diagnostics","Prime Pathlab","City Labs","Apollo Diagnostics","Metro Test Centre"];
  const labStatList = ["verify","approved","pending","verify","approved"];
  for (let i = 0; i < 5; i++) {
    const n = labNames[i], m = mob(), e = mail(n);
    const lab = await Lab.create({
      name: n, email: e, contactNumber: m,
      gstNumber: gst("AAAL"), about: `NABL accredited lab in ${rnd(CITIES)}.`,
      status: labStatList[i]
    });
    const u = await User.create({
      name: n, email: e, contactNumber: m,
      passwordHash: await pw(),
      role: "lab", labId: lab._id,
      created_by: "seed", unique_id: uid8()
    });
    await Lab.findByIdAndUpdate(lab._id, { userId: u._id });
    labUserIds.push(u._id);
  }
  console.log("  ✅ 5 labs");

  // ── 4. PHARMACIES (5) ───────────────────────────────────────────────────
  console.log("Seeding 5 pharmacies...");
  const pharUserIds = [];
  // Pharmacy required: name, email, contactNumber, gstNumber, about
  // status enum: pending | verify ONLY
  const pharNames = ["Health MedStore","Care Pharmacy","Life Drugs","Medi Plus","Wellness Pharma"];
  const pharStatList = ["verify","pending","verify","pending","verify"];
  for (let i = 0; i < 5; i++) {
    const n = pharNames[i], m = mob(), e = mail(n);
    const phar = await Pharmacy.create({
      name: n, email: e, contactNumber: m,
      gstNumber: gst("AAAP"), about: `24-hour pharmacy in ${rnd(CITIES)}.`,
      status: pharStatList[i]
    });
    const u = await User.create({
      name: n, email: e, contactNumber: m,
      passwordHash: await pw(),
      role: "pharmacy", pharId: phar._id,
      created_by: "seed", unique_id: uid8()
    });
    await Pharmacy.findByIdAndUpdate(phar._id, { userId: u._id });
    pharUserIds.push(u._id);
  }
  console.log("  ✅ 5 pharmacies");

  // ── 5. HOSPITALS (5 more) ───────────────────────────────────────────────
  console.log("Seeding 5 more hospitals...");
  const hospUserIds = [];
  // HospitalBasic: no required fields (all optional with defaults)
  // kycStatus enum: draft | pending | in_review | approved | rejected
  const hospKyc = ["approved","pending","in_review","approved","rejected"];
  for (let i = 0; i < 5; i++) {
    const n = `${rnd(CITIES)} ${HOSP_NAMES[i]}`;
    const m = mob(), e = mail(n);
    const h = await HospBasic.create({
      hospitalName: n, about: `Multi-specialty hospital in ${rnd(CITIES)}.`,
      mobileNo: m, email: e, kycStatus: hospKyc[i]
    });
    const u = await User.create({
      name: n, email: e, contactNumber: m,
      passwordHash: await pw(),
      role: "hospital", hospitalId: h._id,
      created_by: "seed", unique_id: uid8()
    });
    await HospBasic.findByIdAndUpdate(h._id, { userId: u._id });
    if (country && state && city) {
      // HospitalAddress required: hospitalId, country, state, city
      await HospAddr.create({
        hospitalId: h._id,
        fullAddress: `${rndN(1,200)}, ${rnd(CITIES)}`,
        country: country._id,  // ObjectId required
        state:   state._id,    // ObjectId required
        city:    city._id,     // ObjectId required
        pinCode: String(302000+rndN(1,99))
      });
    }
    hospUserIds.push(u._id);
  }
  console.log("  ✅ 5 hospitals");

  // ── 6. DOCTOR APPOINTMENTS (120) ────────────────────────────────────────
  console.log("Seeding 120 doctor appointments...");
  // DocAppt required: doctorId, patientId, date, fees
  // status enum: pending | approved | completed | rejected | cancel
  const docApptStatus = ["pending","approved","completed","rejected","cancel"];
  const notes = ["Fever & headache","Back pain","Routine checkup","Diabetes followup","BP monitoring","Skin rash","Eye pain","Joint pain","Cough & cold","Chest pain"];
  if (doctorUserIds.length && patientUserIds.length) {
    const docs = [];
    for (let i = 0; i < 120; i++) {
      docs.push({
        doctorId:  rnd(doctorUserIds),
        patientId: rnd(patientUserIds),
        date:   past(180),
        fees:   String(rndN(200,1500)),   // required String
        note:   rnd(notes),
        status: rnd(docApptStatus),
        customId: `DA${rndN(10000,99999)}`
      });
    }
    await DocAppt.insertMany(docs);
    console.log("  ✅ 120 doctor appointments");
  }

  // ── 7. LAB APPOINTMENTS (100) ───────────────────────────────────────────
  console.log("Seeding 100 lab appointments...");
  // LabAppt required: labId, patientId, date, fees
  // status enum: pending | approved | deliver-report | pending-report | rejected | cancel
  // paymentStatus enum: due | paid
  const labApptStatus = ["pending","approved","deliver-report","pending-report","rejected","cancel"];
  const testNames = [
    ["CBC","Blood Sugar"],["LFT","KFT"],["Thyroid Profile"],["Lipid Profile"],
    ["HbA1c"],["Vitamin D, B12"],["Urine R/E"],["Stool Test"],["X-Ray Chest"],["ECG"]
  ];
  if (labUserIds.length && patientUserIds.length) {
    const docs = [];
    for (let i = 0; i < 100; i++) {
      const tests = rnd(testNames);
      const feeAmt = rndN(200,3000);
      docs.push({
        labId:     rnd(labUserIds),
        patientId: rnd(patientUserIds),
        doctorId:  doctorUserIds.length ? rnd(doctorUserIds) : undefined,
        testId:    [],                    // array, not required individually
        date:      past(180),
        fees:      String(feeAmt),        // required String
        testData:  tests.map(t => ({ name:t, fees: rndN(100,800) })),
        totalAmount: feeAmt,
        status:        rnd(labApptStatus),
        paymentStatus: rnd(["due","paid"]),
        customId: `LA${rndN(10000,99999)}`
      });
    }
    await LabAppt.insertMany(docs);
    console.log("  ✅ 100 lab appointments");
  }

  // ── 8. EDIT REQUESTS (60) ───────────────────────────────────────────────
  console.log("Seeding 60 edit requests...");
  // EditReq required: message
  // type enum: doctor | patient | lab | pharmacy | hospital
  // status enum: pending | approved | rejected
  const msgs = ["Photo Change","Wrong Profile Name","Update Mobile","Change Address","Update License","Change Email","Fix Qualification","Update Clinic Name","Update DOB","Wrong Specialty"];
  const erTypes = ["doctor","patient","lab","pharmacy","hospital"];
  const erStatus = ["pending","approved","rejected"];
  const erDocs = [];
  for (let i = 0; i < 60; i++) {
    const type = erTypes[i % 5];
    const doc = { message: rnd(msgs), type, status: rnd(erStatus) };
    if (type === "doctor"   && doctorUserIds.length)  doc.doctorId   = rnd(doctorUserIds);
    if (type === "patient"  && patientUserIds.length) doc.patientId  = rnd(patientUserIds);
    if (type === "lab"      && labUserIds.length)     doc.labId      = rnd(labUserIds);
    if (type === "pharmacy" && pharUserIds.length)    doc.pharId     = rnd(pharUserIds);
    if (type === "hospital" && hospUserIds.length)    doc.hospitalId = rnd(hospUserIds);
    erDocs.push(doc);
  }
  await EditReq.insertMany(erDocs);
  console.log("  ✅ 60 edit requests (12 per type)");

  // ── 9. BLOGS (30) ───────────────────────────────────────────────────────
  console.log("Seeding 30 blogs...");
  // Blog required: title, description
  const blogTitles = [
    "10 Tips for a Healthy Heart","Managing Diabetes with Diet","Yoga for Back Pain",
    "Understanding Blood Pressure","Children's Vaccination Guide","Mental Health in 2025",
    "Nutrition During Pregnancy","Sleep Disorders and Remedies","Cancer Prevention Tips",
    "Importance of Regular Checkups","Boost Your Immunity Naturally","Skin Care in Summer",
    "Managing Arthritis Pain","Eye Care for Screen Users","Dental Hygiene Tips",
    "Weight Management Strategies","Understanding Thyroid Issues","Kidney Health Guide",
    "Living with Asthma","Food Allergy Awareness","Liver Health Tips","Bone Health & Calcium",
    "Stress Management Techniques","Post-COVID Recovery Tips","Winter Health Care",
    "Gut Health and Probiotics","Headache Types and Treatments","Migraine Management",
    "Sports Injuries Guide","Healthy Aging Tips"
  ];
  const blogDocs = blogTitles.map((title, i) => ({
    title,
    description: `${title} — A comprehensive guide to help you understand and manage your health better with expert advice.`,
    content: `<h2>${title}</h2><p>Healthcare is important. Regular monitoring and proper lifestyle can make a significant difference in your health outcomes. Consult your doctor for personalized advice.</p>`,
    category: rnd(BLOG_CATS),
    author: "NeoHealth Team",
    status: i < 25 ? "published" : "draft",
    tags: [rnd(BLOG_CATS).toLowerCase(), "health", "neohealth"],
    views: rndN(0,5000)
  }));
  await Blog.insertMany(blogDocs);
  console.log("  ✅ 30 blogs (25 published, 5 draft)");

  // ── 10. FAQs (30) ───────────────────────────────────────────────────────
  console.log("Seeding 30 FAQs...");
  // Faq required: question, answer, createdBy(ObjectId required!)
  // Get admin user for createdBy
  const adminUser = await User.findOne({ role: "admin" });
  const faqData = [
    ["How do I book a doctor appointment?","Login, go to Find Doctors, select specialist, choose slot and confirm."],
    ["What documents are needed for registration?","A valid government ID, recent photograph, and medical history."],
    ["How can I cancel my appointment?","Go to My Appointments, select appointment and click Cancel. Free up to 2 hours before."],
    ["Is my health data secure?","Yes, all data is encrypted and stored securely per healthcare data protection standards."],
    ["How do I download my lab reports?","Go to My Reports section and click Download against the required report."],
    ["Can I consult a doctor online?","Yes, NeoHealth supports video consultations. Select Video Consult when booking."],
    ["How are doctors verified?","All doctors undergo thorough verification including medical license and identity check."],
    ["What payment methods are accepted?","We accept UPI, credit/debit cards, net banking and cash at facility."],
    ["How do I get a refund?","Refunds are processed within 5-7 business days for eligible cancellations."],
    ["Can I book for family members?","Yes, you can add family members under Child Profiles in your account."],
    ["What is NeoHealthCard?","Your lifetime health identity card with unique ID for all medical records."],
    ["How do I update my medical history?","Go to Profile → Medical History and update the required information."],
    ["What is the NHC ID?","NHC ID is your unique 8-digit NeoHealthCard identifier used across all portals."],
    ["How to find a nearby lab?","Use Find Lab with location access enabled to see labs near you."],
    ["Can pharmacies deliver medicines?","Yes, registered pharmacies on our platform offer home delivery services."],
    ["How to give feedback for a doctor?","After appointment, you'll receive a rating prompt to rate and review."],
    ["What is OPD vs IPD?","OPD is for consultation without admission. IPD requires hospital admission."],
    ["How to get an emergency ambulance?","Use the Ambulance Booking feature in the app for immediate dispatch."],
    ["Are prescriptions stored digitally?","Yes, all prescriptions are stored in your NeoHealthCard timeline permanently."],
    ["How to change my mobile number?","Submit an edit request through Profile Settings, reviewed by admin."],
    ["What specialties are available?","We cover 15+ specialties including Cardiology, Orthopedics, Gynecology and more."],
    ["How to track pharmacy order?","Go to Orders section and track your medicine delivery in real-time."],
    ["What if my doctor is unavailable?","Choose another doctor of same specialty or be added to the waitlist."],
    ["How does teleconsultation work?","After booking video appointment, you'll receive a link at scheduled time."],
    ["Can I see my past appointments?","Yes, all past appointments are in the Appointment History section."],
    ["How are lab test prices determined?","Prices are set by individual labs and displayed transparently before booking."],
    ["What is the emergency contact feature?","Add emergency contacts who will be notified during medical emergencies."],
    ["How to check hospital bed availability?","Hospital portal shows real-time bed availability across registered hospitals."],
    ["What is DAMA/LAMA discharge?","DAMA means Discharge Against Medical Advice. LAMA means Left Against Medical Advice."],
    ["How to generate NeoCard?","Admin can generate NeoCards for patients from the Card Generator section."]
  ];
  const faqDocs = faqData.map(([q,a]) => ({
    question: q, answer: a,
    status: true,
    createdBy: adminUser?._id || new mongoose.Types.ObjectId()
  }));
  await Faq.insertMany(faqDocs);
  console.log("  ✅ 30 FAQs");

  // ── 11. SUPPLIERS (20) ──────────────────────────────────────────────────
  console.log("Seeding 20 suppliers...");
  // Supplier required: name, mobileNumber
  const suppPrefixes = ["MedPlus","PharmaCo","HealthLine","BioCure","MediSupply","DrugCorp","PharmWorld","MedTrade","CurePharma","VitalMed"];
  const suppDocs = [];
  for (let i = 0; i < 20; i++) {
    suppDocs.push({
      pharId: pharUserIds.length ? pharUserIds[i % pharUserIds.length] : undefined,
      name: `${suppPrefixes[i%10]} ${rnd(LAST)} Pvt Ltd`,
      mobileNumber: mob(),       // required
      email: mail(`supplier${i}`),
      address: `${rndN(1,500)}, Industrial Area, ${rnd(CITIES)}`,
      city: rnd(CITIES),
      pincode: String(302000+rndN(1,99)),
      score: rndN(1,5),
      type: rnd(["pharmacy","hospital"])
    });
  }
  await Supplier.insertMany(suppDocs);
  console.log("  ✅ 20 suppliers");

  // ── 12. NOTIFICATIONS (30) ──────────────────────────────────────────────
  console.log("Seeding 30 notifications...");
  // Notification required: userId, title, message
  // type enum: appointment | chat | call | lab | prescription | general | payment | ambulance
  const notifTemplates = [
    { t:"Appointment Confirmed",  m:"Your appointment is confirmed for tomorrow at 10:00 AM.", type:"appointment" },
    { t:"Lab Report Ready",       m:"Your blood test report is ready for download.",           type:"lab" },
    { t:"Prescription Updated",   m:"Doctor has updated your prescription. Please check.",     type:"prescription" },
    { t:"Payment Successful",     m:"Payment of ₹500 received successfully.",                  type:"payment" },
    { t:"Appointment Reminder",   m:"Reminder: You have an appointment in 2 hours.",           type:"appointment" },
    { t:"Lab Appointment Booked", m:"Your lab appointment is scheduled for tomorrow.",         type:"lab" },
    { t:"Welcome to NeoHealth",   m:"Welcome! Your NeoHealth account is now active.",          type:"general" },
    { t:"Chat Message",           m:"You have a new message from your doctor.",                type:"chat" },
    { t:"Ambulance Dispatched",   m:"Ambulance has been dispatched to your location.",         type:"ambulance" },
    { t:"Call Missed",            m:"You missed a call from Dr. Sharma.",                      type:"call" },
  ];
  if (patientUserIds.length) {
    const notifDocs = [];
    for (let i = 0; i < 30; i++) {
      const tmpl = rnd(notifTemplates);
      notifDocs.push({
        userId:  rnd(patientUserIds),   // required
        title:   tmpl.t,               // required
        message: tmpl.m,               // required
        type:    tmpl.type,
        read:    Math.random() > 0.5,
        data:    {}
      });
    }
    await Notif.insertMany(notifDocs);
    console.log("  ✅ 30 notifications");
  }

  await mongoose.disconnect();

  console.log("\n" + "═".repeat(62));
  console.log("       🌱 FAKER SEED COMPLETE");
  console.log("═".repeat(62));
  console.log("  20  Doctors           → Doctor portal  (Test@123)");
  console.log("  50  Patients          → Patient portal (Test@123)");
  console.log("   5  Laboratories      → Lab portal     (Test@123)");
  console.log("   5  Pharmacies        → Pharmacy portal(Test@123)");
  console.log("   5  Hospitals         → Hospital portal(Test@123)");
  console.log(" 120  Doctor Appointments");
  console.log(" 100  Lab Appointments");
  console.log("  60  Edit Requests (12 per type)");
  console.log("  30  Blogs (25 published, 5 draft)");
  console.log("  30  FAQs");
  console.log("  20  Suppliers");
  console.log("  30  Notifications");
  console.log("═".repeat(62));
  console.log("  Run again to add MORE records (fully additive)\n");
}

seed().catch(err => {
  console.error("❌ Faker seed failed:", err.message);
  process.exit(1);
});
