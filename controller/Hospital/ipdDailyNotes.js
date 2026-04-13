
import IPDAssessment from "../../models/Hospital/IPD Daily Notes/Assessment.js";
import IPDHeader from "../../models/Hospital/IPD Daily Notes/Header.js";
import IPDLabImaging from "../../models/Hospital/IPD Daily Notes/LabsImaging.js";
import IPDObjective from "../../models/Hospital/IPD Daily Notes/Objective.js";
import IPDSignOff from "../../models/Hospital/IPD Daily Notes/SignOff.js";
import IPDSubjective from "../../models/Hospital/IPD Daily Notes/Subjective.js";
import IPDTodayPlan from "../../models/Hospital/IPD Daily Notes/TodayPlan.js";
import User from "../../models/Hospital/User.js";
import HospitalBed from "../../models/Hospital/HospitalBed.js";
import HospitalRoom from "../../models/Hospital/HospitalRoom.js";
import BedAllotment from "../../models/Hospital/BedAllotment.js";
import HospitalPayment from "../../models/Hospital/HospitalPayment.js";
import Staff from "../../models/Staff/Staff.js";
import StaffEmployement from "../../models/Staff/StaffEmployement.js";


// CREATE
export const createIPDHeader = async (req, res) => {
    try {
        const { hospitalId, patientId, bedId, roomId, authorNh12, doctorNh12, allotmentId, date, time } = req.body;
        const data = { hospitalId, patientId, bedId, roomId, allotmentId, date, time }
        // 1️⃣ Validate hospital
        const hospitalExists = await User.findById(hospitalId);
        if (!hospitalExists) return res.status(404).json({ success: false, message: "Hospital not found" });

        // 2️⃣ Validate doctor & hospital employment
        const doctorExists = await User.findOne({ nh12: doctorNh12, role: "doctor" });
        if (!doctorExists) return res.status(404).json({ success: false, message: "Doctor not found" });

        const doctorInHospital = await StaffEmployement.findOne({organizationId: hospitalId, userId: doctorExists?._id });
        if (!doctorInHospital) return res.status(400).json({ success: false, message: "Doctor is not employed at this hospital" });

        // 3️⃣ Validate patient
        const patientExists = await User.findById(patientId);
        if (!patientExists) return res.status(404).json({ success: false, message: "Patient not found" });

        // 4️⃣ Validate bed
        const bedExists = await HospitalBed.findById(bedId);
        if (!bedExists) return res.status(404).json({ success: false, message: "Bed not found" });

        // 5️⃣ Validate room
        const roomExists = await HospitalRoom.findById(roomId);
        if (!roomExists) return res.status(404).json({ success: false, message: "Room not found" });

        // 6️⃣ Validate author
        const authorExists = await User.findOne({ nh12: authorNh12, role: "staff", });
        if (!authorExists) return res.status(404).json({ success: false, message: "Author not found" });

        // 7️⃣ Validate bed allotment
        const allotmentExists = await BedAllotment.findById(allotmentId);
        if (!allotmentExists) return res.status(404).json({ success: false, message: "Bed allotment not found" });

        if (allotmentExists.primaryDoctorId?.toString() !== doctorExists?._id?.toString()) {
            return res.status(404).json({ message: "You are not attending doctor of this allotment", success: false })
        }
        const isAttendingStaff = allotmentExists.attendingStaff.some(
            staff => staff.staffId?.toString() === authorExists._id.toString()
        );

        if (!isAttendingStaff) {
            return res.status(403).json({
                success: false,
                message: "You are not attending staff of this allotment"
            });
        }

        const now = new Date();

        const cDate = now.toLocaleDateString("en-CA");
        const cTime = now.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        });
        const staffData = await StaffEmployement.findOne({ userId: authorExists?._id,organizationId: hospitalId})

        // ✅ All good, create header
        const header = new IPDHeader({
            hospitalId, doctorId: doctorExists?._id, patientId, bedId, roomId, authorId: authorExists?._id, allotmentId,
            date: cDate, time: cTime
        });
        const savedHeader = await header.save();
        // Find existing payment document for this allotment
        let paymentDoc = await HospitalPayment.findOne({ allotmentId });

        if (!paymentDoc) {
            // If not exists → create new
            paymentDoc = new HospitalPayment({
                allotmentId,
                hospitalId,
                patientId,
                ipdPayment: []
            });
        }

        // Push doctor payment
        paymentDoc.ipdPayment.push({
            role: "doctor",
            fees: doctorInHospital?.fees,
            userId: doctorExists?._id,
            headerId: savedHeader._id
        });
console.log(staffData)
        // Push staff payment
        paymentDoc.ipdPayment.push({
            role: "staff",
            fees: staffData?.fees,
            userId: authorExists?._id,
            headerId: savedHeader._id
        });

        // Save payment doc
        await paymentDoc.save();
        return res.status(201).json({
            success: true,
            message: "IPD Header created successfully",
            data: savedHeader
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
// GET SINGLE
export const getIPDHeaderById = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        let filter = {
            bedId: req.params.bedId,
        };
        if (req.query.patientId) {
            filter.patientId = req.query.patientId
        }
        const header = await IPDHeader.find(filter)
            .populate("hospitalId doctorId patientId", "name nh12")
            .populate("bedId roomId authorId allotmentId")
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);

        if (!header.length) {
            return res.status(404).json({
                success: false,
                message: "Data not found"
            });
        }

        const total = await IPDHeader.countDocuments(filter);

        return res.status(200).json({
            success: true,
            data: header,
            pagination: {
                totalRecords: total,
                totalPages: Math.ceil(total / limit),
                currentPage: page
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// UPDATE
export const updateIPDHeader = async (req, res) => {
    try {
        const { hospitalId, patientId, bedId, roomId, authorNh12, doctorNh12, allotmentId, date, time } = req.body;

        const data = {};

        // 1️⃣ Validate hospital
        if (hospitalId) {
            const hospitalExists = await User.findById(hospitalId);
            if (!hospitalExists) return res.status(404).json({ success: false, message: "Hospital not found" });
            data.hospitalId = hospitalId;
        }

        // 2️⃣ Validate doctor & hospital employment
        if (doctorNh12) {
            const doctorExists = await User.findOne({ nh12: doctorNh12, role: "doctor" });
            if (!doctorExists) return res.status(404).json({ success: false, message: "Doctor not found" });

            const doctorInHospital = await StaffEmployement.findOne({ organizationId: hospitalId || undefined, userId: doctorExists._id });
            if (!doctorInHospital) return res.status(400).json({ success: false, message: "Doctor is not employed at this hospital" });

            data.doctorId = doctorExists._id;
        }

        // 3️⃣ Validate patient
        if (patientId) {
            const patientExists = await User.findById(patientId);
            if (!patientExists) return res.status(404).json({ success: false, message: "Patient not found" });
            data.patientId = patientId;
        }

        // 4️⃣ Validate bed
        if (bedId) {
            const bedExists = await HospitalBed.findById(bedId);
            if (!bedExists) return res.status(404).json({ success: false, message: "Bed not found" });
            data.bedId = bedId;
        }

        // 5️⃣ Validate room
        if (roomId) {
            const roomExists = await HospitalRoom.findById(roomId);
            if (!roomExists) return res.status(404).json({ success: false, message: "Room not found" });
            data.roomId = roomId;
        }

        // 6️⃣ Validate author
        if (authorNh12) {
            const authorExists = await User.findOne({ nh12: authorNh12, role: "staff", created_by_id: hospitalId || undefined });
            if (!authorExists) return res.status(404).json({ success: false, message: "Author not found" });
            data.authorId = authorExists._id;
        }

        // 7️⃣ Validate bed allotment
        if (allotmentId) {
            const allotmentExists = await BedAllotment.findById(allotmentId);
            if (!allotmentExists) return res.status(404).json({ success: false, message: "Bed allotment not found" });
            data.allotmentId = allotmentId;
        }

        const hasSignOff = await IPDSignOff.findOne({ headerId: req.params.id })
        if (hasSignOff) {
            return res.status(200).json({ message: "You can't edit once the data is saved", success: false })
        }

        // Optional fields
        if (date) data.date = date;
        if (time) data.time = time;

        // ✅ Update header
        const updatedHeader = await IPDHeader.findByIdAndUpdate(
            req.params.id,
            data,
            { new: true, runValidators: true }
        );

        if (!updatedHeader) {
            return res.status(404).json({
                success: false,
                message: "Header not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Header updated successfully",
            data: updatedHeader
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// DELETE
export const deleteIPDHeader = async (req, res) => {
    try {
        const deleted = await IPDHeader.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Header not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Header deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
//                                      Ipd Daily Notes Subjective
// CREATE SUBJECTIVE
export const createSubjective = async (req, res) => {
    try {
        const { headerId } = req.body;
        // 🔎 Check header exists
        const headerExists = await IPDHeader.findById(headerId);
        if (!headerExists) {
            return res.status(404).json({
                success: false,
                message: "IPD Header not found"
            });
        }
        const subjectiveExists = await IPDSubjective.findOne({ headerId });
        if (subjectiveExists) {
            return res.status(409).json({
                success: false,
                message: "IPD Subjective already exists"
            });
        }
        const subjective = new IPDSubjective(req.body);
        const savedData = await subjective.save();

        res.status(201).json({
            success: true,
            message: "Subjective data added successfully",
            data: savedData
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// GET SUBJECTIVE BY ID
export const getSubjectiveById = async (req, res) => {
    try {

        const data = await IPDSubjective.findOne({ headerId: req.params.id })


        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Subjective record not found"
            });
        }

        res.status(200).json({
            success: true,
            data
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// UPDATE SUBJECTIVE
export const updateSubjective = async (req, res) => {
    try {
        const hasSignOff = await IPDSignOff.findOne({ headerId: req.body.headerId })
        if (hasSignOff) {
            return res.status(200).json({ message: "You can't edit once the data is saved", success: false })
        }

        const updated = await IPDSubjective.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: "Subjective record not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Subjective updated successfully",
            data: updated
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// DELETE SUBJECTIVE
export const deleteSubjective = async (req, res) => {
    try {

        const deleted = await IPDSubjective.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Subjective record not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Subjective deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
//                                      Ipd Daily Notes Objective
// CREATE OBJECTIVE
export const createObjective = async (req, res) => {
    try {
        const { headerId } = req.body;

        // 🔎 Validate header exists
        const headerExists = await IPDHeader.findById(headerId);

        if (!headerExists) {
            return res.status(404).json({
                success: false,
                message: "IPD Header not found"
            });
        }
        const objectiveExists = await IPDObjective.findOne({ headerId });

        if (objectiveExists) {
            return res.status(409).json({
                success: false,
                message: "IPD Objective already exists"
            });
        }

        const objective = new IPDObjective(req.body);
        const savedData = await objective.save();

        res.status(201).json({
            success: true,
            message: "Objective data added successfully",
            data: savedData
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// GET OBJECTIVE BY ID
export const getObjectiveById = async (req, res) => {
    try {

        const data = await IPDObjective.findOne({ headerId: req.params.id })


        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Objective record not found"
            });
        }

        res.status(200).json({
            success: true,
            data
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// UPDATE OBJECTIVE
export const updateObjective = async (req, res) => {
    try {
        const hasSignOff = await IPDSignOff.findOne({ headerId: req.body.headerId })
        if (hasSignOff) {
            return res.status(200).json({ message: "You can't edit once the data is saved", success: false })
        }
        const updated = await IPDObjective.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: "Objective record not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Objective updated successfully",
            data: updated
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// DELETE OBJECTIVE
export const deleteObjective = async (req, res) => {
    try {

        const deleted = await IPDObjective.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Objective record not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Objective deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

//                                      Ipd Daily Notes Lab & Imaging 
// CREATE LAB / IMAGING
export const createLabImaging = async (req, res) => {
    try {

        const { headerId } = req.body;

        // 🔎 Validate header exists
        const headerExists = await IPDHeader.findById(headerId);

        if (!headerExists) {
            return res.status(404).json({
                success: false,
                message: "IPD Header not found"
            });
        }
        const labImagingExists = await IPDLabImaging.findOne({ headerId });

        if (labImagingExists) {
            return res.status(409).json({
                success: false,
                message: "IPD Lab & image already exists"
            });
        }

        const labImaging = new IPDLabImaging(req.body);
        const savedData = await labImaging.save();

        res.status(201).json({
            success: true,
            message: "Lab & Imaging data added successfully",
            data: savedData
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// GET SINGLE LAB / IMAGING
export const getLabImagingById = async (req, res) => {
    try {

        const data = await IPDLabImaging.findOne({ headerId: req.params.id });

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Lab/Imaging record not found"
            });
        }

        res.status(200).json({
            success: true,
            data
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// UPDATE LAB / IMAGING
export const updateLabImaging = async (req, res) => {
    try {
        const hasSignOff = await IPDSignOff.findOne({ headerId: req.body.headerId })
        if (hasSignOff) {
            return res.status(200).json({ message: "You can't edit once the data is saved", success: false })
        }
        const updated = await IPDLabImaging.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: "Lab/Imaging record not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Lab/Imaging updated successfully",
            data: updated
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// DELETE LAB / IMAGING
export const deleteLabImaging = async (req, res) => {
    try {

        const deleted = await IPDLabImaging.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Lab/Imaging record not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Lab/Imaging deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

//                                      Ipd Daily Notes Assessment
// CREATE ASSESSMENT
export const createAssessment = async (req, res) => {
    try {

        const { headerId } = req.body;

        // 🔎 Check if header exists
        const headerExists = await IPDHeader.findById(headerId);

        if (!headerExists) {
            return res.status(404).json({
                success: false,
                message: "IPD Header not found"
            });
        }
        const assessmentExists = await IPDAssessment.findOne({ headerId });

        if (assessmentExists) {
            return res.status(409).json({
                success: false,
                message: "IPD Assessment already exists"
            });
        }

        const assessment = new IPDAssessment(req.body);
        const savedData = await assessment.save();

        res.status(201).json({
            success: true,
            message: "Assessment added successfully",
            data: savedData
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// GET SINGLE ASSESSMENT
export const getAssessmentById = async (req, res) => {
    try {

        const data = await IPDAssessment.findOne({ headerId: req.params.id })

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Assessment record not found"
            });
        }

        res.status(200).json({
            success: true,
            data
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// UPDATE ASSESSMENT
export const updateAssessment = async (req, res) => {
    try {
        const hasSignOff = await IPDSignOff.findOne({ headerId: req.body.headerId })
        if (hasSignOff) {
            return res.status(200).json({ message: "You can't edit once the data is saved", success: false })
        }
        const updated = await IPDAssessment.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: "Assessment record not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Assessment updated successfully",
            data: updated
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// DELETE ASSESSMENT
export const deleteAssessment = async (req, res) => {
    try {

        const deleted = await IPDAssessment.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Assessment record not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Assessment deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

//                                      Ipd Daily Notes Today Plan 
// CREATE TODAY PLAN
export const createTodayPlan = async (req, res) => {
    try {

        const { headerId } = req.body;

        // 🔎 Validate header exists
        const headerExists = await IPDHeader.findById(headerId);

        if (!headerExists) {
            return res.status(404).json({
                success: false,
                message: "IPD Header not found"
            });
        }
        const todayPlanExists = await IPDTodayPlan.findOne({ headerId });

        if (todayPlanExists) {
            return res.status(409).json({
                success: false,
                message: "IPD Today Plan already exists"
            });
        }

        const todayPlan = new IPDTodayPlan(req.body);
        const savedData = await todayPlan.save();

        res.status(201).json({
            success: true,
            message: "Today's plan added successfully",
            data: savedData
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// GET SINGLE TODAY PLAN
export const getTodayPlanById = async (req, res) => {
    try {

        const data = await IPDTodayPlan.findOne({ headerId: req.params.id })

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Today plan record not found"
            });
        }

        res.status(200).json({
            success: true,
            data
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// UPDATE TODAY PLAN
export const updateTodayPlan = async (req, res) => {
    try {
        const hasSignOff = await IPDSignOff.findOne({ headerId: req.body.headerId })
        if (hasSignOff) {
            return res.status(200).json({ message: "You can't edit once the data is saved", success: false })
        }
        const updated = await IPDTodayPlan.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: "Today plan record not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Today plan updated successfully",
            data: updated
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// DELETE TODAY PLAN
export const deleteTodayPlan = async (req, res) => {
    try {

        const deleted = await IPDTodayPlan.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Today plan record not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Today plan deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

//                                      Ipd Daily Notes Sign off
// CREATE SIGN OFF
export const createSignOff = async (req, res) => {
    const { headerId, authorActorNh12, authorSignature, reviewedBy, reviewerSignature, noteVersion, amendmentReason } = req.body
    try {
        const data = { headerId, authorSignature, reviewerSignature, noteVersion, amendmentReason }

        // 🔎 Validate header exists
        const headerExists = await IPDHeader.findById(headerId);

        if (!headerExists) {
            return res.status(404).json({
                success: false,
                message: "IPD Header not found"
            });
        }
        const signOffExists = await IPDSignOff.findOne({ headerId });

        if (signOffExists) {
            return res.status(409).json({
                success: false,
                message: "IPD Sign off already exists"
            });
        }
        const isStaff = await User.findOne({ nh12: authorActorNh12, role: "staff", })
        if(isStaff){
            const staffHasEmp=await StaffEmployement.findOne({userId:isStaff._id,organizationId:headerExists.hospitalId,status:"active"})
            if(!staffHasEmp){
                return res.status(404).json({ success: false, message: "Staff is not registered as hospital staff" })
            }
        }
        const isDoctor = await User.findOne({ nh12: reviewedBy, role: 'doctor' })
        if (isDoctor) {
            const hospitalHasDoctor = await StaffEmployement.findOne({ organizationId: headerExists?.hospitalId, userId: isDoctor?._id })
            if (!hospitalHasDoctor) {
                return res.status(404).json({ success: false, message: "Doctor is not registered as hospital staff" })
            }
            data.reviewedBy = isDoctor?._id
        } else if (isStaff) {
            data.reviewedBy = isStaff?._id
        }
        if (isStaff) {
            data.authorActorId = isStaff?._id
        } else {
            return res.status(404).json({ message: "Staff not found", success: false })
        }
        const allotmentExists = await BedAllotment.findById(headerExists?.allotmentId);
        if (!allotmentExists) return res.status(404).json({ success: false, message: "Bed allotment not found" });
        if (allotmentExists.primaryDoctorId?.toString() !== isDoctor?._id?.toString()) {
            return res.status(404).json({ message: ` ${reviewedBy} is not attending doctor of this allotment`, success: false })
        }
        const isAttendingStaff = allotmentExists.attendingStaff.some(
            staff => staff.staffId?.toString() === isStaff._id.toString()
        );

        if (!isAttendingStaff) {
            return res.status(403).json({
                success: false,
                message: `${authorActorNh12} are not attending staff of this allotment`
            });
        }


        const savedData = await IPDSignOff.create(data)

        return res.status(201).json({
            success: true,
            message: "Sign-off created successfully",
            data: savedData
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// GET SINGLE SIGN OFF
export const getSignOffById = async (req, res) => {
    try {

        const data = await IPDSignOff.findOne({ headerId: req.params.id })
            .populate("authorActorId")
            .populate("reviewedByStaff", 'name')
            .populate("reviewedByDoctor", 'name');

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Sign-off record not found"
            });
        }

        res.status(200).json({
            success: true,
            data
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// UPDATE SIGN OFF
export const updateSignOff = async (req, res) => {
    const { headerId, authorActorId, authorSignature, reviewedBy, reviewerSignature, noteVersion, amendmentReason } = req.body;

    try {
        const data = { headerId, authorActorId, authorSignature, reviewerSignature, noteVersion, amendmentReason };

        // 🔎 Validate header exists
        if (headerId) {
            const headerExists = await IPDHeader.findById(headerId);
            if (!headerExists) {
                return res.status(404).json({
                    success: false,
                    message: "IPD Header not found"
                });
            }
        }

        // 🔎 Handle reviewedBy
        if (reviewedBy) {
            const isUser = await User.findOne({ nh12: reviewedBy, role: "staff" });
            data.reviewedBy = isUser._id;

        }
        const hasSignOff = await IPDSignOff.findOne({ headerId: req.body.headerId })
        if (hasSignOff) {
            return res.status(200).json({ message: "You can't edit once the data is saved", success: false })
        }
        const updated = await IPDSignOff.findByIdAndUpdate(
            req.params.id,
            data,
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: "Sign-off record not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Sign-off updated successfully",
            data: updated
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// DELETE SIGN OFF
export const deleteSignOff = async (req, res) => {
    try {

        const deleted = await IPDSignOff.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Sign-off record not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Sign-off deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getDailyNotesByHeader = async (req, res) => {
    try {
        const header = await IPDHeader.findById(req.params.id).populate("patientId doctorId authorId", "name nh12")
        if (!header) {
            return res.status(404).json({ message: "Daily notes not found", success: false })
        }
        const subjective = await IPDSubjective.findOne({ headerId: req.params.id })
        const objective = await IPDObjective.findOne({ headerId: req.params.id })
        const labImaging = await IPDLabImaging.findOne({ headerId: req.params.id })
        const assessment = await IPDAssessment.findOne({ headerId: req.params.id })
        const todayPlan = await IPDTodayPlan.findOne({ headerId: req.params.id })
        const signOff = await IPDSignOff.findOne({ headerId: req.params.id }).populate("reviewedBy authorActorId", "name nh12")
        return res.status(200).json({
            message: "Daily Notes Fetched", success: true, data: {
                header, subjective, objective,
                labImaging, assessment, todayPlan, signOff
            }
        })
    } catch (error) {
        return res.status(500).json({ message: error.message, success: false })
    }
}
export const getLatestAllotmentNotes = async (req, res) => {
    try {
        const header = await IPDHeader.findOne({ allotmentId: req.params.id }).sort({ createdAt: -1 })
            .populate('authorId', 'nh12 -_id').lean()
        if (!header) {
            return res.status(404).json({ message: "Daily notes not found", success: false })
        }
        const subjective = await IPDSubjective.findOne({ headerId: header?._id })
        const objective = await IPDObjective.findOne({ headerId: header?._id })
        const labImaging = await IPDLabImaging.findOne({ headerId: header?._id })
        const assessment = await IPDAssessment.findOne({ headerId: header?._id })
        const todayPlan = await IPDTodayPlan.findOne({ headerId: header?._id })
        const signOff = await IPDSignOff.findOne({ headerId: header?._id }).populate('reviewedBy', 'nh12 -_id').populate('authorActorId', 'nh12 -_id').lean()
        return res.status(200).json({
            message: "Daily Notes Fetched", success: true, data: {
                header, subjective, objective,
                labImaging, assessment, todayPlan, signOff
            }
        })
    } catch (error) {
        return res.status(500).json({ message: error.message, success: false })
    }
}
export const getIpdFeesData = async (req, res) => {
    const { allotmentId, patientId } = req.params
    try {
        const data = await IPDHeader.find({ allotmentId, patientId }).populate("authorId doctorId", "name role")
        return res.status(200).json({ message: "Data fetched", data, success: true })
    } catch (error) {
        return res.status(500).json({ message: error.message, success: false })
    }
}