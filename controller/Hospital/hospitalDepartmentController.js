// hospitalDepartmentController
import HospitalDepartment from "../../models/Hospital/HospitalDepartment.js";

const createDepartment = async (req, res) => {
  try {
    const hospitalId = req.user.id; // from auth middleware

    const {
      departmentName,
      type,
      headOfDepartment,
      employees
    } = req.body;

    if (!departmentName || !type) {
      return res.status(400).json({
        success: false,
        message: "Department name and type are required"
      });
    }

    const department = await HospitalDepartment.create({
      hospitalId,
      departmentName,
      type,
      headOfDepartment,
      employees
    });

    res.json({
      success: true,
      message: "Department added successfully",
      data: department
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
const getDepartments = async (req, res) => {
  try {
    const hospitalId = req.user.id;

    const {
      page = 1,
      limit = 10,
      search = "",
      type,
      status
    } = req.query;

    const skip = (page - 1) * limit;

    // 🔹 FILTER QUERY
    const query = { hospitalId };

    // Search by department name
    if (search) {
      query.departmentName = { $regex: search, $options: "i" };
    }

    // OPD / IPD filter
    if (type) {
      query.type = type;
    }

    // Status filter (if you have status field)
    if (status !== undefined) {
      query.status = status;
    }

    // 🔹 DATA + COUNT
    const [departments, total] = await Promise.all([
      HospitalDepartment.find(query)
        .populate({
          path: "headOfDepartment",
          select: "personalInfo.name personalInfo.profileImage"
        })
        .populate({
          path: "employees.employeeId",
          select: "personalInfo.name"
        })
        .sort({ createdAt: -1 })
        .skip(Number(skip))
        .limit(Number(limit)),

      HospitalDepartment.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: departments,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const hospitalId = req.user.id;

    const department = await HospitalDepartment.findOne({
      _id: id,
      hospitalId
    })
      .populate("headOfDepartment")
      .populate("employees.employeeId");

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }

    res.json({
      success: true,
      data: department
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const hospitalId = req.user.id;

    const updated = await HospitalDepartment.findOneAndUpdate(
      { _id: id, hospitalId },
      req.body,
      { new: true }
    );

    res.json({
      success: true,
      message: "Department updated successfully",
      data: updated
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const hospitalId = req.user.id;

    await HospitalDepartment.findOneAndDelete({
      _id: id,
      hospitalId
    });

    res.json({
      success: true,
      message: "Department deleted successfully"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export {createDepartment,getDepartments,getDepartmentById,updateDepartment,deleteDepartment}
