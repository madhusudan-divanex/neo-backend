import Supplier from "../../models/Pharmacy/supplier.model.js";

/* ======================================
   GET SUPPLIERS (ADMIN)
====================================== */

export const getSuppliers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const search = req.query.search || "";
    const type = req.query.type || ""; // pharmacy / hospital
    const skip = (page - 1) * limit;

    const filter = {};

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    if (type) {
      filter.type = type;
    }

    const [suppliers, total] = await Promise.all([
      Supplier.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Supplier.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: suppliers,
      totalPages: Math.ceil(total / limit),
      total,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to load suppliers",
    });
  }
};


/* ======================================
   ADD SUPPLIER (ADMIN)
====================================== */

export const addSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.create(req.body);

    res.json({
      success: true,
      message: "Supplier added successfully",
      data: supplier,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to add supplier",
    });
  }
};


/* ======================================
   UPDATE SUPPLIER
====================================== */

export const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({
      success: true,
      message: "Supplier updated",
      data: supplier,
    });

  } catch {
    res.status(500).json({
      success: false,
      message: "Update failed",
    });
  }
};


/* ======================================
   DELETE SUPPLIER
====================================== */

export const deleteSupplier = async (req, res) => {
  try {
    await Supplier.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Supplier deleted",
    });

  } catch {
    res.status(500).json({
      success: false,
      message: "Delete failed",
    });
  }
};


/* ======================================
   GET SINGLE SUPPLIER
====================================== */

export const getSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    res.json({
      success: true,
      data: supplier,
    });

  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to load supplier",
    });
  }
};