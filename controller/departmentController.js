import Department from "../models/Department.js"

async function createDepartment(req,res) {
    const userId=req.user.id || req.user.userId
    try {
        const {departmentName,type,headOfDepartment,employees}=req.body
        const deptData=await Department.create({userId,departmentName,type,headOfDepartment,employees})
        if(deptData){
            return res.status(200).json({message:"Department created",success:true})
        }
        return res.status(400).json({message:"Department not created",success:false}) 
    } catch (error) {
        return res.status(200).json({message:error?.message,success:false})
    }
}
async function updateDepartment(req,res) {
    const userId=req.user.id || req.user.userId
    try {
        const {departmentId,departmentName,type,headOfDepartment,employees}=req.body
        const deptData=await Department.findByIdAndUpdate(departmentId,{userId,departmentName,type,headOfDepartment,employees},{new:true})
        if(deptData){
            return res.status(200).json({message:"Department updated",success:true})
        }
        return res.status(400).json({message:"Department not updated",success:false}) 
    } catch (error) {
        return res.status(200).json({message:error?.message,success:false})
    }
}
async function getDepartment(req, res) {
    const userId = req.user.id || req.user.userId;
    let { type, page = 1, search, limit = 10 } = req.query;

    // Convert page and limit to numbers
    page = parseInt(page);
    limit = parseInt(limit);

    try {
        let filter = { userId };

        if (type) {
            filter.type = type;
        }
        if (search) {
            filter.departmentName = { $regex: search, $options: 'i' }; // partial match, case-insensitive
        }

        // Pagination calculation
        const skip = (page - 1) * limit;

        // Fetch data with pagination
        const deptData = await Department.find(filter).populate("headOfDepartment","name")
            .skip(skip)
            .limit(limit);

        // Get total count for pagination info
        const total = await Department.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);

        return res.status(200).json({
            message: "Departments fetched",
            success: true,
            data: deptData,
            pagination: {
                total,
                page,
                totalPages,
                limit
            }
        });
    } catch (error) {
        return res.status(500).json({ message: error?.message, success: false });
    }
}
export {getDepartment,createDepartment,updateDepartment}