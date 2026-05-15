
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

//      bed  routes
router.post("/floor/add", auth, floorCtrl.addFloor);
router.get("/floor/list", auth, floorCtrl.listFloors);
router.get("/floor/:id", auth, floorCtrl.getFloorById);
router.put("/floor/update/:id", auth, floorCtrl.updateFloor);
router.delete("/floor/:id", auth, floorCtrl.deleteFloor);
router.post("/room/add", auth, roomCtrl.addRoom);
router.get("/room/single/:id", auth, roomCtrl.getRoomById);
router.put("/room/update/:id", auth, roomCtrl.updateRoom);
router.get("/room/:floorId", auth, roomCtrl.listRoomsByFloor);
router.post("/bed/add", auth, bedCtrl.addBed);
router.get("/bed/single/:id", auth, bedCtrl.getBedById);
router.put("/bed/update/:id", auth, bedCtrl.updateBed);
router.delete("/bed/:id", auth, bedCtrl.deleteBed);
router.post("/allotment/add", auth, bedAllotmentCtrl.addAllotment);
router.put("/allotment/discharge/:allotmentId", auth, bedAllotmentCtrl.dischargePatient);
router.get("/allotment/:id", auth, bedAllotmentCtrl.getAllotmentById);
router.put("/allotment/update/:id", auth, bedAllotmentCtrl.updateAllotment);
router.get("/management/list", auth, bedMgmtCtrl.bedManagementList);

//      Department Routes 
router.post(
  "/",
  auth,
  createDepartment
);

//Get All Departments (List / Table)
router.get(
  "/",
  auth,
  getDepartments
);

//Get Single Department (Edit Modal)
router.get(
  "/:id",
  auth,
  getDepartmentById
);

//Update Department
router.put(
  "/:id",
  auth,
  updateDepartment
);

// Delete Department
router.delete(
  "/:id",
  auth,
  deleteDepartment
);

//      hospital.js

router.get("/get-hospital-profile", auth, profile.getProfile);
router.put("/update-hospital-profile", auth, profile.updateProfile);
router.post("/edit-request", auth, profile.sendEditRequest);
router.post("/edit-request/:requestId/approve", auth, profile.approveEditRequest);


// Step 1 Basic
router.post("/basic", auth, upload.single("logo"), basic.saveBasic);

// Step 2 Images
router.post(
    "/images",
    upload.fields([
        { name: "thumbnail", maxCount: 1 },
        { name: "gallery", maxCount: 5 }
    ]),
    auth,
    images.uploadImages
);

// Step 3 Address
router.post("/address", auth, address.saveAddress);

// Step 4 Contact
router.post("/contact", auth, upload.single("profilePhoto"), contact.saveContact);

// Step 5 Certificates
router.post(
    "/certificate",
    upload.single("file"),   // first
    auth,                    // then token check
    cert.uploadCertificate
);

// Submit KYC
router.post("/submit-kyc", auth, kyc.submitKyc);
router.post("/change-password", auth, profile.changePassword);


router.get('/patient-list', auth,  basic.PatientList);
router.get('/doctor-list', auth,  basic.DoctorList);
router.get('/staff-list', auth,  basic.StaffList);

//        Hospital Doctors 
router.post("/create", upload.fields([
  { name: "profileImage", maxCount: 1 },
  { name: "certificates", maxCount: 10 }
]), auth, createHospitalDoctor);
router.get('/list',auth,getHospitalDoctorList);
router.get('/my-all-staff',auth,getMyAllStaffList);
router.get("/get-by-id/:id", auth, getHospitalDoctorByIdNew);
router.get(
  "/:id",
  auth,
  getHospitalDoctorById
);
router.put("/:id",auth,
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "certificates", maxCount: 10 }
  ]),
  updateHospitalDoctor
);
router.delete(
  "/:id",
  auth,
  deleteDoctor
);

//      Hospital Patient.js
router.post("/add", auth, addPatient);
router.get("/list", auth, listPatients);
router.get("/:id", auth, getPatientById);
router.put("/:id", auth, updatePatient);
router.delete("/:id", auth, deletePatient);