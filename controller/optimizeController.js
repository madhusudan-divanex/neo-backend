import PatientBanner from "../models/Admin/PatientBanner.js";
import Queries from "../models/Admin/Queries.js";
import DoctorAbout from "../models/Doctor/addressAbout.model.js";
import City from "../models/Hospital/City.js";
import HospitalAddress from "../models/Hospital/HospitalAddress.js";
import HospitalBasic from "../models/Hospital/HospitalBasic.js";
import User from "../models/Hospital/User.js";
import LabAppointment from "../models/LabAppointment.js";
import LabAddress from "../models/Laboratory/labAddress.model.js";
import PatientDemographic from "../models/Patient/demographic.model.js";
import MedicalHistory from "../models/Patient/medicalHistory.model.js";
import Patient from "../models/Patient/patient.model.js";
import PatientPrescriptions from "../models/Patient/prescription.model.js";
import Rating from "../models/Rating.js";
import Speciality from "../models/Speciality.js";
import StaffEmployement from "../models/Staff/StaffEmployement.js";
import TestCategory from "../models/TestCategory.js";
import TestReport from "../models/testReport.js";

const getPatientDashboard = async (req, res) => {
    try {
        const { page = 1, limit = 10, location } = req.query;

        const [doctors, labs] = await Promise.all([

            // 👨‍⚕️ Doctors
            getUserWithDetails({
                role: "doctor",
                addressModel: DoctorAbout,
                addressPopulate: 'specialty',
                ratingField: "doctorId",
                page,
                limit,
                location
            }),

            // 🧪 Labs
            getUserWithDetails({
                role: "lab",
                addressModel: LabAddress,
                addressPopulate: 'cityId',
                ratingField: "labId",
                page,
                limit,
                location
            })

        ]);
        const users = await User.find({role:"hospital"}).select('name hospitalId ').populate('hospitalId','logoFileId')
            .limit(limit)
            .skip((page - 1) * limit)
            .lean();
        const hospitalIds = users.map(item => item.hospitalId?._id)
        const userHospitalIds = users.map(item => item._id)
        const address = await HospitalAddress.find({ hospitalId: { $in: hospitalIds } }).select('fullAddress hospitalId')
        const addressMap = {};
        address.forEach(addr => {
            addressMap[addr.hospitalId.toString()] = addr;
        });
        // 3️⃣ Fetch rating stats (AVG + COUNT)
        const ratingStats = await Rating.aggregate([
            {
                $match: {
                    hospitalId: { $in: userHospitalIds }
                }
            },
            {
                $group: {
                    _id: "$hospitalId",
                    avgRating: { $avg: "$star" },
                    totalReviews: { $sum: 1 }
                }
            }
        ]);

        const ratingMap = {};
        ratingStats.forEach(r => {
            ratingMap[r._id.toString()] = {
                avgRating: Number(r.avgRating.toFixed(1)),
                totalReviews: r.totalReviews
            };
        });

        // 4️⃣ Merge everything
        const finalData = users.map(user => ({
            ...user,logo:user?.hospitalId?.logoFileId?`api/file/${user?.hospitalId?.logoFileId}`:null,
            address: addressMap[user.hospitalId?._id.toString()] || null,
            avgRating: ratingMap[user._id.toString()]?.avgRating || 0,
            totalReviews: ratingMap[user._id.toString()]?.totalReviews || 0
        }));

        const specialityData = await Speciality.find().sort({ createdAt: -1 }).limit(10)
        const banner = await PatientBanner.find()
        const category = await TestCategory.find()
        return res.status(200).json({
            success: true,
            data: {
                doctors,
                labs, hospitals: finalData, speciality: specialityData, banner, category
            }
        });

    } catch (error) {
        return res.status(500).json({
            message: error?.message,
            success: false
        });
    }
};
const getLabAptData = async (req, res) => {
    const appointmentId = req.params.id;
    try {
        let isExist = await LabAppointment.findById(appointmentId).populate({ path: 'subCatId', select: 'subCategory' })
                .populate({ path: 'labId', select: 'name email contactNumber nh12 labId role', populate: ({ path: 'labId', select: 'name logo gstNumber' }) }).lean()
                .populate({ path: 'doctorId', select: 'name email contactNumber nh12 doctorId' })
        
        const labAddress = await LabAddress.findOne({ userId: isExist?.labId?._id }).select('fullAddress')
        const labReports = await TestReport.find({ appointmentId: isExist?._id }).select('upload createdAt testId subCatId').populate('subCatId','subCategory')
        if (!isExist) return res.status(200).json({ message: 'Appointment not exist' });
        return res.status(200).json({ message: "Appointment fetch successfully", data: isExist, labAddress, labReports,  success: true })
    } catch (err) {
        console.log(err)
        return res.status(200).json({ message: 'Server Error' });
    }
}

const getUserWithDetails = async ({
    role,
    addressModel,
    addressPopulate,
    ratingField,
    page = 1,
    limit = 10,
    location
}) => {

    // 1️⃣ Users
    const users = await User.find({ role })
        .select('name email contactNumber')
        .populate(`${role}Id`, 'profileImage logo')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    const userIds = users.map(u => u._id);

    // 2️⃣ Location Filter
    let cityId = null;
    if (location) {
        const city = await City.findOne({
            name: new RegExp(`^${location}$`, 'i')
        });
        if (city) cityId = city._id;
    }

    // 3️⃣ Address
    const addressFilter = { userId: { $in: userIds } };
    if (cityId) addressFilter.cityId = cityId;

    const addresses = await addressModel.find(addressFilter).select('userId fullAddress cityId')
        .populate(addressPopulate, 'name')
        .lean();

    const addressMap = {};
    addresses.forEach(a => {
        addressMap[a.userId.toString()] = a;
    });

    // 4️⃣ Ratings
    const ratings = await Rating.aggregate([
        { $match: { [ratingField]: { $in: userIds } } },
        {
            $group: {
                _id: `$${ratingField}`,
                avgRating: { $avg: "$star" },
                totalReviews: { $sum: 1 }
            }
        }
    ]);

    const ratingMap = {};
    ratings.forEach(r => {
        ratingMap[r._id.toString()] = {
            avgRating: Number(r.avgRating.toFixed(1)),
            totalReviews: r.totalReviews
        };
    });

    // 5️⃣ Merge
    return users.map(u => ({
        ...u,
        address: addressMap[u._id.toString()] || null,
        avgRating: ratingMap[u._id.toString()]?.avgRating || 0,
        totalReviews: ratingMap[u._id.toString()]?.totalReviews || 0
    }));
};
const getHospitalDoctor=async(req,res)=>{
    const hospitalId=req.user.id || req.user.userId
    const {status}=req.query
    try {
        let filter={
            organizationId:hospitalId,
            userRole:"doctor",
            status:"active"
        }
        if(status){
            filter.status=status
        }
        const staffEmp=await StaffEmployement.find(filter).select('userId fees').populate('userId','name')
        return res.status(200).json({message:"Doctor Fetched",success:true,doctors:staffEmp})
    } catch (error) {
        return res.status(500).json({message:error?.message,success:false})
    }
}
const saveFrotnendQuery=async(req,res)=>{
    try {
        const data=await Queries.create(req.body)
        if(data){
            return res.status(200).json({message:"Message sent",success:true})
        }
        return res.status(200).json({message:"Message not sent",success:false})
    } catch (error) {
        return res.status(500).json({message:error?.message,success:false})
    }
}
const getScanUserData=async(req,res)=>{
    try {
        const isUser=await User.findOne({nh12:req.params.id}).select('-passwordHash -fcmToken')
        if(!isUser){
            return res.status(404).json({message:"User not found",success:false})
        }
        const userId=isUser._id
        if(isUser.role=="patient"){
            const patient=await Patient.findById(isUser.patientId)
            const ptDemo=await PatientDemographic.findOne({userId})
            const medicalHistory=await MedicalHistory.findOne({userId})
            const prescriptions=await PatientPrescriptions.findOne({userId})
        }
    } catch (error) {
        return res.status(500).json({message:error?.message,success:false})
    }
}
export { getPatientDashboard,getLabAptData,getScanUserData ,getHospitalDoctor,saveFrotnendQuery}