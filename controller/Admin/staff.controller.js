import User from "../../models/Hospital/User.js";
import Staff from "../../models/Staff/Staff.js";
import StaffEmployement from "../../models/Staff/StaffEmployement.js";

export const getStaffs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || "";

        let query = { role: "staff" }
        if (search) {
            query = { ...query, $or: [{ name: new RegExp(search, "i") }, { email: new RegExp(search, "i") }, { contactNumber: new RegExp(search, "i") }, { nh12: search }] }
        }

        const staff = await User.find(query).select('name email nh12 contactNumber staffId').populate("staffId")
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 }).lean();


        const total = await User.countDocuments(query);

        res.json({
            success: true,
            data: staff,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getStaffData = async (req, res) => {
    const { id } = req.params
    try {
        const staffUser = await User.findById(id).select('name email nh12 contactNumber staffId')
        if (!staffUser) {
            return res.status(404).json({ message: "Staff not found", success: false })
        }
        const staffData = await Staff.findById(staffUser.staffId)

        res.status(200).json({
            success: true, staffUser,
            staffData

        })
    } catch (error) {
        return res.status(500).json({ message: error.message, success: false })
    }
}
export const getStaffEmp = async (req, res) => {
    const { id } = req.params
    const { page, limit } = req.query
    try {
        const staffUser = await User.findById(id).select('name email nh12 contactNumber staffId')
        if (!staffUser) {
            return res.status(404).json({ message: "Staff not found", success: false })
        }
        const staffData = await StaffEmployement.find({ userId: staffUser?._id }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
            .populate({
                path: 'organizationId', select: 'name email nh12 role contactNumber doctorId labId pharId hospitalId',
                populate: {
                    path: 'labId pharId',
                    select: 'logo'
                },
                populate: {
                    path: 'hospitalId',
                    select: 'logoFileId'
                },
                populate: {
                    path: 'doctorId',
                    select: 'profileImage'
                }
            })

        const total = await StaffEmployement.countDocuments({ userId: staffUser?._id });
        res.status(200).json({
            success: true,
            data: staffData,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        })
    } catch (error) {
        return res.status(500).json({ message: error.message, success: false })
    }
}
