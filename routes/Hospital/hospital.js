import express from 'express'
const router = express.Router();
import auth from "../../middleware/auth.js";

import multer from"multer";
const upload = multer({ storage: multer.memoryStorage() });

import basic from "../../controller/Hospital/hospitalBasicController.js";
import images from "../../controller/Hospital/hospitalImageController.js";
import address from "../../controller/Hospital/hospitalAddressController.js";
import contact from "../../controller/Hospital/hospitalContactController.js";
import cert from "../../controller/Hospital/hospitalCertificateController.js";
import kyc from "../../controller/Hospital/kycController.js";
import profile from "../../controller/Hospital/profileController.js";


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

export default router;
