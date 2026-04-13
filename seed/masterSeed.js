/**
 * NeoHealth Master Seed Script
 * Usage:  node seed/masterSeed.js   (run from Backend/ folder)
 */
import mongoose from "mongoose";
import bcrypt   from "bcryptjs";
import dotenv   from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env") });
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/NeoHealth";
const hash = (pw) => bcrypt.hash(pw, 10);

async function findOrCreate(Model, query, data) {
  let doc = await Model.findOne(query);
  if (!doc) doc = await Model.create({ ...query, ...data });
  return doc;
}

async function seed() {
  console.log("Connecting to:", MONGO_URI.replace(/:([^:@]+)@/, ":***@"));
  await mongoose.connect(MONGO_URI);
  console.log("✅ MongoDB connected\n");

  // Admin now stored in User table with role:'admin'
  // const Admin = (await import('../models/Admin/Admin.js')).default; // no longer used for admin
  const User         = (await import("../models/Hospital/User.js")).default;
  const HospBasic    = (await import("../models/Hospital/HospitalBasic.js")).default;
  const HospAddress  = (await import("../models/Hospital/HospitalAddress.js")).default;
  const HospDept     = (await import("../models/Hospital/HospitalDepartment.js")).default;
  const HospFloor    = (await import("../models/Hospital/HospitalFloor.js")).default;
  const HospRoom     = (await import("../models/Hospital/HospitalRoom.js")).default;
  const HospBed      = (await import("../models/Hospital/HospitalBed.js")).default;
  const HospPatient  = (await import("../models/Hospital/HospitalPatient.js")).default;
  const Doctor       = (await import("../models/Doctor/doctor.model.js")).default;
  const Patient      = (await import("../models/Patient/patient.model.js")).default;
  const PatientDemog = (await import("../models/Patient/demographic.model.js")).default;
  const Lab          = (await import("../models/Laboratory/laboratory.model.js")).default;
  const Phar         = (await import("../models/Pharmacy/pharmacy.model.js")).default;
  const Speciality   = (await import("../models/Speciality.js")).default;
  const TestCat      = (await import("../models/TestCategory.js")).default;
  const Country      = (await import("../models/Hospital/Country.js")).default;
  const State        = (await import("../models/Hospital/State.js")).default;
  const City         = (await import("../models/Hospital/City.js")).default;

  // ── 0. Location ────────────────────────────────────────────────────────────
  const country = await findOrCreate(Country, { isoCode: "IN" }, { name: "India", phonecode: "91" });
  const state   = await findOrCreate(State, { isoCode: "RJ", countryCode: "IN" }, { name: "Rajasthan" });
  const city    = await findOrCreate(City, { name: "Jaipur", stateCode: "RJ" }, { countryCode: "IN" });
  console.log("✅ Location: India > Rajasthan > Jaipur");

  // ── 1. Specialities ────────────────────────────────────────────────────────
  const specNames = ["Cardiology","Orthopedics","Gynecology","Pediatrics","Neurology",
                     "Dermatology","ENT","Ophthalmology","Psychiatry","General Medicine"];
  for (const name of specNames)
    await findOrCreate(Speciality, { name }, { icon: name.toLowerCase().replace(/ /g,"-")+".png" });
  console.log(`✅ ${specNames.length} Specialities`);

  // ── 2. Test Categories ─────────────────────────────────────────────────────
  const testCats = ["Blood Test","Urine Test","X-Ray","MRI/CT","ECG","Ultrasound","Biopsy","Culture/Sensitivity"];
  for (const name of testCats)
    await findOrCreate(TestCat, { name }, { icon: name.toLowerCase().replace(/[/]/g,"-")+".png" });
  console.log(`✅ ${testCats.length} Test Categories`);

  // ── 3. Admin (stored in User table with role:"admin") ─────────────────────
  await findOrCreate(User, { email: "admin@neohealth.com", role: "admin" }, {
    name: "Super Admin", passwordHash: await hash("Admin@123"),
    contactNumber: "9000000000", created_by: "self"
  });
  console.log("✅ Admin → admin@neohealth.com / Admin@123  (User table)");

  // ── 4. Hospital ────────────────────────────────────────────────────────────
  // HospitalBasic: hospitalName, licenseId, mobileNo, email, gstNumber, about, userId, kycStatus
  const hosBasic = await findOrCreate(HospBasic,
    { hospitalName: "NeoHealth City Hospital" },
    { about: "A premier multi-specialty hospital.", mobileNo: "9100000001", email: "hospital@neohealth.com", kycStatus: "approved" }
  );
  const hosUser = await findOrCreate(User,
    { email: "hospital@neohealth.com" },
    { name: "NeoHealth City Hospital", contactNumber: "9100000001",
      passwordHash: await hash("Hospital@123"), role: "hospital",
      hospitalId: hosBasic._id, created_by: "hospital", created_by_id: hosBasic._id }
  );
  if (!hosBasic.userId) await HospBasic.findByIdAndUpdate(hosBasic._id, { userId: hosUser._id });

  // HospitalAddress: hospitalId (ref HospitalBasic), fullAddress, country/state/city (ObjectId), pinCode
  await findOrCreate(HospAddress,
    { hospitalId: hosBasic._id },
    { fullAddress: "Plot 42, Malviya Nagar, Jaipur", country: country._id, state: state._id, city: city._id, pinCode: "302017" }
  );

  // HospitalDepartment: hospitalId(User ref), departmentName, type(OPD|IPD - REQUIRED)
  const deptOPD = await findOrCreate(HospDept,
    { hospitalId: hosUser._id, departmentName: "General OPD" },
    { type: "OPD" }
  );
  const deptIPD = await findOrCreate(HospDept,
    { hospitalId: hosUser._id, departmentName: "General IPD" },
    { type: "IPD" }
  );

  // HospitalFloor: hospitalId(User ref), floorName (required), status
  const floor = await findOrCreate(HospFloor,
    { hospitalId: hosUser._id, floorName: "Ground Floor" },
    {}
  );

  // HospitalRoom: hospitalId(User ref), floorId, departmentId, roomName (required), status
  const roomsData = [
    { roomName: "Room 101 - General",          deptId: deptIPD._id },
    { roomName: "Room ICU - Intensive Care",   deptId: deptIPD._id },
    { roomName: "Room 201 - Semi-Private",     deptId: deptIPD._id },
  ];
  const rooms = [];
  for (const r of roomsData) {
    const room = await findOrCreate(HospRoom,
      { hospitalId: hosUser._id, roomName: r.roomName },
      { floorId: floor._id, departmentId: r.deptId }
    );
    rooms.push(room);
  }

  // HospitalBed: hospitalId(User ref), floorId, roomId, departmentId, bedName (required), pricePerDay, status
  const bedsData = [
    { bedName: "Bed G-1",   ri: 0, price: 800  },
    { bedName: "Bed G-2",   ri: 0, price: 800  },
    { bedName: "Bed ICU-1", ri: 1, price: 3500 },
    { bedName: "Bed ICU-2", ri: 1, price: 3500 },
    { bedName: "Bed SP-1",  ri: 2, price: 1500 },
  ];
  for (const b of bedsData) {
    await findOrCreate(HospBed,
      { hospitalId: hosUser._id, bedName: b.bedName },
      { floorId: floor._id, roomId: rooms[b.ri]._id, departmentId: deptIPD._id, pricePerDay: b.price, status: "Available" }
    );
  }
  console.log("✅ Hospital → hospital@neohealth.com / Hospital@123");
  console.log("   Setup: 2 departments, 1 floor, 3 rooms, 5 beds");

  // ── 5. Doctors ─────────────────────────────────────────────────────────────
  // Doctor: name(req), gender(req), dob(req), contactNumber(req), email, status, userId
  const doctorsData = [
    { name: "Dr. Arjun Sharma", email: "doctor1@neohealth.com", mobile: "9100000010", gender: "Male",   dob: "1980-05-15" },
    { name: "Dr. Priya Mehta",  email: "doctor2@neohealth.com", mobile: "9100000011", gender: "Female", dob: "1985-09-22" },
    { name: "Dr. Vikram Singh", email: "doctor3@neohealth.com", mobile: "9100000012", gender: "Male",   dob: "1978-03-10" },
  ];
  for (const d of doctorsData) {
    const docProfile = await findOrCreate(Doctor,
      { contactNumber: d.mobile },
      { name: d.name, email: d.email, gender: d.gender, dob: new Date(d.dob), status: "approved" }
    );
    const docUser = await findOrCreate(User,
      { contactNumber: d.mobile, role: "doctor" },
      { name: d.name, email: d.email, passwordHash: await hash("Doctor@123"),
        role: "doctor", doctorId: docProfile._id, created_by: "self" }
    );
    if (!docProfile.userId) await Doctor.findByIdAndUpdate(docProfile._id, { userId: docUser._id });
    console.log(`  ✅ Doctor → ${d.mobile} / Doctor@123  (${d.name})`);
  }

  // ── 6. Patients ────────────────────────────────────────────────────────────
  // Patient: name(req), gender(req), contactNumber(req), email, status, userId
  // PatientDemog: userId(req), dob(req), height, weight, bloodGroup, countryId/stateId/cityId, pinCode
  // HospitalPatient: hospitalId(req), patientId(String req), name(req), dob(req), gender(req), mobile(req), user_id
  const patientsData = [
    { name: "Ramesh Gupta",  email: "patient1@neohealth.com", mobile: "9200000001", gender: "Male",   dob: "1975-08-20", blood: "O+",  h: "170", w: "75" },
    { name: "Sunita Sharma", email: "patient2@neohealth.com", mobile: "9200000002", gender: "Female", dob: "1990-02-14", blood: "A+",  h: "162", w: "58" },
    { name: "Anil Verma",    email: "patient3@neohealth.com", mobile: "9200000003", gender: "Male",   dob: "1965-11-05", blood: "B-",  h: "175", w: "82" },
    { name: "Kavita Joshi",  email: "patient4@neohealth.com", mobile: "9200000004", gender: "Female", dob: "1998-07-30", blood: "AB+", h: "158", w: "52" },
    { name: "Suresh Patel",  email: "patient5@neohealth.com", mobile: "9200000005", gender: "Male",   dob: "1955-04-18", blood: "O-",  h: "168", w: "78" },
  ];
  for (const p of patientsData) {
    const patProfile = await findOrCreate(Patient,
      { contactNumber: p.mobile },
      { name: p.name, email: p.email, gender: p.gender, status: "approved" }
    );
    const patUser = await findOrCreate(User,
      { contactNumber: p.mobile, role: "patient" },
      { name: p.name, email: p.email, passwordHash: await hash("Patient@123"),
        role: "patient", patientId: patProfile._id, created_by: "self" }
    );
    if (!patProfile.userId) await Patient.findByIdAndUpdate(patProfile._id, { userId: patUser._id });

    // PatientDemographic: countryId/stateId/cityId (ObjectId), dob(req), userId(req)
    await findOrCreate(PatientDemog,
      { userId: patUser._id },
      { dob: new Date(p.dob), height: p.h, weight: p.w, bloodGroup: p.blood,
        countryId: country._id, stateId: state._id, cityId: city._id, pinCode: "302001" }
    );

    // Link first 3 patients to hospital
    // HospitalPatient: patientId(String req), name(req), dob(req), gender(req), mobile(req)
    if (["9200000001","9200000002","9200000003"].includes(p.mobile)) {
      await findOrCreate(HospPatient,
        { hospitalId: hosUser._id, mobile: p.mobile },
        { patientId: p.mobile, user_id: patUser._id, name: p.name,
          dob: new Date(p.dob), gender: p.gender, mobile: p.mobile,
          email: p.email, address: "Jaipur, Rajasthan", state: "Rajasthan", city: "Jaipur", pinCode: "302001" }
      );
    }
    console.log(`  ✅ Patient → ${p.mobile} / Patient@123  (${p.name})`);
  }

  // ── 7. Laboratory ──────────────────────────────────────────────────────────
  // Lab: name(req), email(req), contactNumber(req), gstNumber(req), about(req), status, userId
  const labProfile = await findOrCreate(Lab,
    { contactNumber: "9300000001" },
    { name: "NeoHealth Diagnostics", email: "lab@neohealth.com",
      gstNumber: "07AAACL1234A1Z5", about: "NABL-accredited diagnostic lab.", status: "verify" }
  );
  const labUser = await findOrCreate(User,
    { contactNumber: "9300000001", role: "lab" },
    { name: "NeoHealth Diagnostics", email: "lab@neohealth.com",
      passwordHash: await hash("Lab@123"), role: "lab", labId: labProfile._id, created_by: "self" }
  );
  if (!labProfile.userId) await Lab.findByIdAndUpdate(labProfile._id, { userId: labUser._id });
  console.log("✅ Lab → 9300000001 / Lab@123  (lab@neohealth.com)");

  // ── 8. Pharmacy ────────────────────────────────────────────────────────────
  // Phar: name(req), email(req), contactNumber(req), gstNumber(req), about(req), status, userId
  const pharProfile = await findOrCreate(Phar,
    { contactNumber: "9400000001" },
    { name: "NeoHealth MedStore", email: "pharmacy@neohealth.com",
      gstNumber: "07AAACM5678B1Z5", about: "24-hour pharmacy with home delivery.", status: "verify" }
  );
  const pharUser = await findOrCreate(User,
    { contactNumber: "9400000001", role: "pharmacy" },
    { name: "NeoHealth MedStore", email: "pharmacy@neohealth.com",
      passwordHash: await hash("Pharmacy@123"), role: "pharmacy", pharId: pharProfile._id, created_by: "self" }
  );
  if (!pharProfile.userId) await Phar.findByIdAndUpdate(pharProfile._id, { userId: pharUser._id });
  console.log("✅ Pharmacy → 9400000001 / Pharmacy@123  (pharmacy@neohealth.com)");

  await mongoose.disconnect();
  printLoginDetails();
}

function printLoginDetails() {
  const L = "═".repeat(65);
  console.log("\n" + L);
  console.log("       NEOHEALTH — ALL PANEL LOGIN CREDENTIALS");
  console.log(L);
  [
    ["ADMIN PANEL",  "localhost:5173", "Email:   admin@neohealth.com",      "Admin@123"],
    ["HOSPITAL",     "localhost:5174", "Email:   hospital@neohealth.com",   "Hospital@123"],
    ["DOCTOR 1",     "localhost:5176", "Mobile:  9100000010 (Cardiology)",  "Doctor@123"],
    ["DOCTOR 2",     "localhost:5176", "Mobile:  9100000011 (Gynecology)",  "Doctor@123"],
    ["DOCTOR 3",     "localhost:5176", "Mobile:  9100000012 (Orthopedics)", "Doctor@123"],
    ["PATIENT 1",    "localhost:5175", "Mobile:  9200000001 Ramesh Gupta",  "Patient@123"],
    ["PATIENT 2",    "localhost:5175", "Mobile:  9200000002 Sunita Sharma", "Patient@123"],
    ["PATIENT 3",    "localhost:5175", "Mobile:  9200000003 Anil Verma",    "Patient@123"],
    ["PATIENT 4",    "localhost:5175", "Mobile:  9200000004 Kavita Joshi",  "Patient@123"],
    ["PATIENT 5",    "localhost:5175", "Mobile:  9200000005 Suresh Patel",  "Patient@123"],
    ["LABORATORY",   "localhost:5178", "Mobile:  9300000001",               "Lab@123"],
    ["PHARMACY",     "localhost:5177", "Mobile:  9400000001",               "Pharmacy@123"],
  ].forEach(([p, url, login, pw]) => {
    console.log(`\n  ${p}`);
    console.log(`    URL      : http://${url}`);
    console.log(`    Login    : ${login}`);
    console.log(`    Password : ${pw}`);
  });
  console.log("\n" + L + "\n");
}

seed().catch(err => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
