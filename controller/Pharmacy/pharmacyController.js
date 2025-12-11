
import Inventory from '../../models/Pharmacy/inventory.model.js';
import MedicineRequest from '../../models/Pharmacy/medicineRequest.model.js';
import PharPermission from '../../models/Pharmacy/permission.model.js';
import Pharmacy from '../../models/Pharmacy/pharmacy.model.js';

const addInventry = async (req, res) => {
    try {
        const pharId = req.user.pharId;
        const item = await Inventory.create({ pharId, ...req.body });

        return res.status(200).json({ success: true, message: "Inventory added successfully" });

    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
}
const inventoryList = async (req, res) => {
    try {
        const pharId = req.user.pharId;

        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Search filters
        const { search, schedule } = req.query;

        let filter = { pharId };

        // Search by name (medicineName)
        if (search) {
            filter.medicineName = { $regex: search, $options: "i" };
        }

        // Search by schedule
        if (schedule) {
            filter.schedule = schedule; // exact match
        }

        // Fetch data
        const [items, total] = await Promise.all([
            Inventory.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),

            Inventory.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            data: items,
            pagiantion: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            }
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};
const inventoryGetById = async (req, res) => {
    try {
        const id = req.params.id
        const updated = await Inventory.findById({ _id: id, pharId: req.user.pharId });

        if (!updated) {
            return res.status(404).json({ success: false, message: "Inventory item not found" });
        }

        res.status(200).json({ success: true, message: "Inventory get successfully", data: updated });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}
const inventoryUpdate = async (req, res) => {
    try {
        const id = req.params.id
        const updated = await Inventory.findOneAndUpdate(
            { _id: id, pharId: req.user.pharId },
            req.body,
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ success: false, message: "Inventory item not found" });
        }

        res.status(200).json({ success: true, message: "Inventory updated" });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}
const inventoryDelete = async (req, res) => {
    try {
        const id = req.params.id;
        const deleted = await Inventory.findOneAndDelete({ _id: id, pharId: req.user.pharId });

        if (!deleted) {
            return res.status(404).json({ success: false, message: "Item not found" });
        }

        res.status(200).json({ success: true, message: "Inventory deleted" });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}
const getMedicineRequestsList = async (req, res) => {
    try {
        const pharId = req.user.pharId;
        const { page = 1, limit = 10, search, status } = req.query;

        const filter = { pharId };
        if (status) filter.status = status;

        const query = MedicineRequest.find(filter).populate({
            path: 'medicineId',
            match: search ? { medicineName: { $regex: search, $options: 'i' } } : {},
            select: 'medicineName description quantity'
        });

        const skip = (page - 1) * limit;
        query.skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 });

        const [data, total] = await Promise.all([
            query.exec(),
            MedicineRequest.countDocuments(filter)
        ]);

        // Filter out null populated medicineId due to search mismatch
        const filteredData = data.filter(item => item.medicineId !== null);

        res.json({
            success: true,
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit),
            data: filteredData.map(item => ({
                _id: item._id,
                medicineName: item.medicineId.medicineName,
                date: item.createdAt,
                description: item.medicineId.description || "",
                stock: item.medicineId.quantity,
                status: item.status
            }))
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
const sendMedicineRequest = async (req, res) => {
    try {
        const pharId = req.user.pharId;
        const { medicineId, quantity, message } = req.body;

        // Check medicine exists and is H1 schedule
        const medicine = await Inventory.findOne({ _id: medicineId, pharId, schedule: 'H1' });
        if (!medicine) return res.status(404).json({ success: false, message: "Medicine not found or not H1 schedule" });

        const newRequest = new MedicineRequest({
            pharId,
            medicineId,
            quantity,
            message,
            status: 'Pending'
        });

        await newRequest.save();

        res.json({ success: true, message: "Request sent successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};
const changeRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status value" });
        }

        const request = await MedicineRequest.findById(id);
        if (!request) {
            return res.status(404).json({ success: false, message: "Request not found" });
        }

        request.status = status;
        await request.save();

        res.json({ success: true, message: `Request ${status.toLowerCase()} successfully` });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};
const getAllMedicineRequestsForAdmin = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, status } = req.query;

        const filter = {};

        if (status) filter.status = status;

        const query = MedicineRequest.find(filter).populate({
            path: 'medicineId',
            match: search ? { medicineName: { $regex: search, $options: 'i' } } : {},
            select: 'medicineName description quantity'
        }).populate({
            path: 'pharId',
            select: 'pharmacyDetails.name pharmacyDetails.mobile pharmacyDetails.email'
        });

        const skip = (page - 1) * limit;
        query.skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 });

        const [data, total] = await Promise.all([
            query.exec(),
            MedicineRequest.countDocuments(filter)
        ]);

        // Filter out null populated medicineId due to search mismatch
        const filteredData = data.filter(item => item.medicineId !== null);

        res.json({
            success: true,
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit),
            data: filteredData.map(item => ({
                _id: item._id,
                medicineName: item.medicineId.medicineName,
                date: item.createdAt,
                description: item.medicineId.description || "",
                stock: item.medicineId.quantity,
                status: item.status,
                pharmacy: item.pharId ? {
                    _id: item.pharId._id,
                    name: item.pharId.name,
                    email: item.pharId.email
                } : null
            }))
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: error.message });
    }
};

const createPO = async (req, res) => {
    try {
        const pharId = req.user.pharId;
        const { supplierId, deliveryDate, note, products } = req.body;

        const supplier = await Supplier.findById(supplierId);
        if (!supplier) {
            res.status(400).json({ success: false, message: "supplier not found" });
        }
        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({
                success: false, message: "Products are required"
            });
        }

        const newPO = await PurchaseOrder.create({
            pharId,
            supplierId,
            deliveryDate,
            note,
            products
        });

        res.json({ status: true, message: "PO Created", data: newPO });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

const getPOList = async (req, res) => {
    try {
        let { page = 1, limit = 10, search = "" } = req.query;

        page = parseInt(page);
        limit = parseInt(limit);

        const pharId = req.user.pharId;

        const query = { pharId };
        if (search) {
            const regex = new RegExp(search, "i");

            query.$or = [
                { note: regex },                // search note
                { deliveryDate: regex },        // search by date
                { status: regex },              // search by status
            ];
        }

        const total = await PurchaseOrder.countDocuments(query);

        const POs = await PurchaseOrder.find(query)
            .populate("supplierId", "supplierName mobile email") // optional fields
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: POs,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getPODetails = async (req, res) => {
    try {
        const po = await PurchaseOrder.findById({ _id: req.params.id, pharId: req.user.pharId });
        res.status(200).json({ success: true, data: po })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

const updatePO = async (req, res) => {
    try {
        const pharId = req.user.pharId;
        const { id } = req.params;  // PO ID
        const { supplierId, deliveryDate, note, products } = req.body;

        const po = await PurchaseOrder.findOne({ _id: id, pharId });
        if (!po) {
            return res.status(404).json({ success: false, message: "PO not found" });
        }

        if (supplierId) {
            const supplier = await Supplier.findById(supplierId);
            if (!supplier) {
                return res.status(400).json({ success: false, message: "Supplier not found" });
            }
        }

        // If products are provided → validate
        if (products && (!Array.isArray(products) || products.length === 0)) {
            return res.status(400).json({ success: false, message: "Products must be a non-empty array" });
        }

        const updatedPO = await PurchaseOrder.findByIdAndUpdate(
            id,
            {
                supplierId: supplierId || PurchaseOrder.supplierId,
                deliveryDate: deliveryDate || PurchaseOrder.deliveryDate,
                note: note || PurchaseOrder.note,
                products: products || PurchaseOrder.products
            },
            { new: true }
        );

        res.status(200).json({ success: true, message: "PO updated successfully", data: updatedPO });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deletePO = async (req, res) => {
    try {
        const res = await PurchaseOrder.findByIdAndDelete({ _id: req.params.id, pharId: req.user.pharId });
        res.status(200).json({ success: true, message: "PO Deleted" })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

const receivePO = async (req, res) => {
    try {
        const po = await PurchaseOrder.findById(req.params.poId);
        if (!po) return res.status(404).json({ success: false, message: "PO not found" });

        if (PurchaseOrder.status === "received")
            return res.status(400).json({ success: false, message: "Already received" });

        for (let item of PurchaseOrder.products) {
            const existing = await Inventory.findOne({
                pharId: PurchaseOrder.pharId,
                medicineName: item.productName,
                batchNumber: item.batchNumber
            });

            if (existing) {
                // Increase Quantity
                existing.quantity += item.quantity;
                existing.totalStockPrice = existing.quantity * existing.purchasePrice;
                await existing.save();
            } else {
                // Create new Inventory entry
                await Inventory.create({
                    pharId: PurchaseOrder.pharId,
                    medicineName: item.productName,
                    schedule: item.schedule,
                    batchNumber: item.batchNumber,
                    expDate: item.expDate,
                    quantity: item.quantity,
                    purchasePrice: 0, // pharmacy will add later
                    totalStockPrice: 0,
                    avgMargin: 0,
                    highMargin: 0,
                    lowMargin: 0,
                    manufacturerBarcode: "",
                    internalBarcode: Date.now().toString(),
                    internalBarcodeImage: ""
                });
            }
        }

        PurchaseOrder.status = "received";
        await PurchaseOrder.save();

        res.status(200).json({ success: true, message: "PO received & inventory updated" });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const addSupplier = async (req, res) => {
    try {
        const pharId = req.user.pharId;
        const supplier = await Supplier.create({ pharId, ...req.body });

        res.status(200).json({ success: true, message: "Supplier added successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

const getSupplier = async (req, res) => {
    try {
        const pharId = req.user.pharId;
        const { search = "", sort = "score" } = req.query;

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const filter = {
            pharId,
            name: { $regex: search, $options: "i" }
        };

        // Get total count
        const total = await Supplier.countDocuments(filter);

        // Fetch suppliers
        const suppliers = await Supplier
            .find(filter)
            .sort({ [sort]: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            data: suppliers,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// GET SUPPLIER BY ID
const getSupplierById = async (req, res) => {
    try {
        const supplier = await Supplier.findOne({
            _id: req.params.id,
            pharId: req.user.pharId
        });

        if (!supplier) {
            return res.status(404).json({ success: false, message: "Supplier not found" });
        }

        res.status(200).json({ success: true, data: supplier });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// UPDATE SUPPLIER
const updateSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findOneAndUpdate(
            { _id: req.params.id, pharId: req.user.pharId },
            req.body,
            { new: true }
        );

        if (!supplier) {
            return res.status(404).json({ success: false, message: "Supplier not found" });
        }

        res.status(200).json({ success: true, message: "Supplier updated" });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// DELETE SUPPLIER
const deleteSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findOneAndDelete({
            _id: req.params.id,
            pharId: req.user.pharId
        });

        if (!supplier) {
            return res.status(404).json({ success: false, message: "Supplier not found" });
        }

        res.status(200).json({ success: true, message: "Supplier deleted successfully" });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
async function validateProductsAvailability(pharId, products) {
    for (const p of products) {
        const inv = await Inventory.findOne({ _id: p.inventoryId, pharId });
        if (!inv) {
            return { ok: false, message: `Inventory item not found for id ${p.inventoryId}` };
        }
        if (inv.quantity < p.quantity) {
            return { ok: false, message: `Insufficient stock for ${inv.medicineName}` }
        }
    }
    return { ok: true }
}

const createReturn = async (req, res) => {
    try {
        const pharId = req.user.pharId;
        const { supplierId, deliveryDate, products, reason } = req.body;

        if (!supplierId || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ success: false, message: "supplierId and products are required" });
        }
        // Optional: check supplier exists
        const supplier = await Supplier.findOne({ _id: supplierId, pharId });
        if (!supplier) return res.status(400).json({ success: false, message: "Supplier not found" });

        // Validate inventory and availability
        const validation = await validateProductsAvailability(pharId, products);
        if (!validation.ok) return res.status(400).json({ success: false, message: validation.message });

        const ret = await Return.create({
            pharId,
            supplierId,
            deliveryDate,
            products,
            reason
        });

        res.status(201).json({ success: true, data: ret, message: "Return generated" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

const listReturns = async (req, res) => {
    try {
        const pharId = req.user.pharId;
        const { page = 1, limit = 10, status, search } = req.query;
        const query = { pharId };
        if (status) query.status = status;
        if (search) {
            // naive search: supplier name or product name
            query.$or = [
                { reason: { $regex: search, $options: "i" } },
            ];
        }

        const docs = await Return.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .populate("supplierId", "name mobileNumber")
            .populate("products.inventoryId", "medicineName batchNumber");

        const total = await Return.countDocuments(query);

        return res.status(200).json({
            success: true, data: docs,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

const getReturnById = async (req, res) => {
    try {
        const pharId = req.user.pharId;
        const id = req.params.id;

        const doc = await Return.findOne({ _id: id, pharId })
            .populate("supplierId", "name mobileNumber")
            .populate("products.inventoryId", "medicineName quantity batchNumber");

        if (!doc) return res.status(404).json({ success: false, message: "Return not found" });

        return res.status(200).json({ success: true, data: doc });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

// UPDATE RETURN (only while Pending)
const updateReturn = async (req, res) => {
    try {
        const pharId = req.user.pharId;
        const id = req.params.id;
        const updates = req.body;

        const ret = await Return.findOne({ _id: id, pharId });
        if (!ret) return res.status(404).json({ success: false, message: "Return not found" });
        if (ret.status !== "Pending") return res.status(400).json({ success: false, message: "Only pending returns can be updated" });

        // If products changed, validate availability
        if (updates.products) {
            const validation = await validateProductsAvailability(pharId, updates.products);
            if (!validation.ok) return res.status(400).json({ success: false, message: validation.message });
            ret.products = updates.products;
        }

        if (updates.deliveryDate) ret.deliveryDate = updates.deliveryDate;
        if (updates.reason) ret.reason = updates.reason;
        if (updates.supplierId) ret.supplierId = updates.supplierId;

        await ret.save();
        return res.status(200).json({ success: true, data: ret, message: "Return Updated" });
    } catch (err) {
        console.error("updateReturn:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// COMPLETE RETURN -> deduct inventory quantities
const completeReturn = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const pharId = req.user.pharId;
        const id = req.params.id;

        const ret = await Return.findOne({ _id: id, pharId }).session(session);
        if (!ret) return res.status(404).json({ success: false, message: "Return not found" });
        if (ret.status !== "Pending") return res.status(400).json({ success: false, message: "Only pending returns can be completed" });

        // Start transaction (if your MongoDB supports it)
        session.startTransaction();

        for (const p of ret.products) {
            const inv = await Inventory.findOne({ _id: p.inventoryId, pharId }).session(session);
            if (!inv) {
                await session.abortTransaction();
                return res.status(400).json({ success: false, message: `Inventory item not found for ${p.inventoryId}` });
            }
            if (inv.quantity < p.quantity) {
                await session.abortTransaction();
                return res.status(400).json({ success: false, message: `Insufficient stock for ${inv.medicineName}` });
            }
            // Deduct
            inv.quantity = inv.quantity - p.quantity;
            await inv.save({ session });
        }

        // Mark return completed
        ret.status = "Completed";
        await ret.save({ session });

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({ success: true, message: "Return completed and inventory updated", data: ret });
    } catch (err) {
        await session.abortTransaction().catch(() => { });
        session.endSession();
        console.error("completeReturn:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE RETURN (only if pending)
const deleteReturn = async (req, res) => {
    try {
        const pharId = req.user.pharId;
        const id = req.params.id;

        const ret = await Return.findOne({ _id: id, pharId });
        if (!ret) return res.status(404).json({ success: false, message: "Return not found" });
        if (ret.status !== "Pending") return res.status(400).json({ success: false, message: "Only pending returns can be deleted" });

        await Return.deleteOne({ _id: id });
        return res.status(200).json({ success: true, message: "Return deleted" });
    } catch (err) {
        console.error("deleteReturn:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

const getAllPharPermission = async (req, res) => {
    const id = req.params.id;
    let { page = 1, limit = 10, name } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    try {
        const filter = { pharId: id };
        if (name && name !== 'null') {
            filter.name = { $regex: name, $options: "i" };
        }

        const laboratory = await Pharmacy.findById(id);

        if (!laboratory) {
            return res.status(200).json({
                message: "Laboratory not found",
                success: false
            });
        }

        const total = await PharPermission.countDocuments(filter);

        const permissions = await PharPermission.find(filter)
            .skip((page - 1) * limit)
            .limit(limit);

        return res.status(200).json({
            message: "Laboratory permissions fetched successfully",
            data: permissions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            },
            success: true
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: 'Server Error',
            success: false
        });
    }
};

const addPharPermission = async (req, res) => {
    try {
        const { name, pharId, ...permissions } = req.body;
        const isExist = await Pharmacy.findById(pharId);
        if (!isExist) return res.status(200).json({ message: "Laboratory not found", success: false })


        if (!name || !pharId) {
            return res.status(400).json({
                success: false,
                message: "name and pharId are required"
            });
        }

        const existing = await PharPermission.findOne({ name, pharId });

        if (existing) {
            const updated = await PharPermission.findByIdAndUpdate(
                existing._id,
                { ...permissions },
                { new: true }
            );

            return res.status(200).json({
                success: true,
                message: "Permission updated successfully",
                data: updated
            });
        }

        const created = await PharPermission.create({
            name,
            pharId,
            ...permissions
        });

        return res.status(200).json({
            success: true,
            message: "Permission created successfully",
            data: created
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
const updatePharPermission = async (req, res) => {
    try {
        const { name, permissionId, pharId, ...permissions } = req.body;
        const isExist = await Pharmacy.findById(pharId);
        if (!isExist) return res.status(200).json({ message: "Laboratory not found", success: false })
        const isPermExist = await PharPermission.findById(permissionId);
        if (!isPermExist) return res.status(200).json({ message: "Permission not found", success: false })

        if (!name || !pharId) {
            return res.status(400).json({
                success: false,
                message: "name and pharId are required"
            });
        }
        const updated = await PharPermission.findByIdAndUpdate(
            isPermExist._id,
            { ...permissions, name },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: "Permission updated successfully",
            data: updated
        });


    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
const deletePharPermission = async (req, res) => {
    const { permissionId, pharId } = req.body;
    try {
        const isLabExist = await Pharmacy.findById(pharId);
        if (!isLabExist) return res.status(200).json({ message: "Laboratory not found", success: false })
        const isExist = await PharPermission.findById(permissionId);
        if (!isExist) return res.status(200).json({ message: "Laboratory permission not found", success: false })

        const delPerm = await PharPermission.findByIdAndDelete(permissionId);

        if (delPerm) {
            return res.status(200).json({
                success: true,
                message: "Permission deleted successfully",
            });
        }
        return res.status(200).json({
            success: false,
            message: "Permission not deleted"
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}
export {getAllMedicineRequestsForAdmin,getMedicineRequestsList,getPODetails,getPOList,getReturnById,getSupplier,getSupplierById,
    addInventry,inventoryUpdate,inventoryDelete,inventoryGetById,inventoryList,changeRequestStatus,sendMedicineRequest,
addSupplier,updatePO,updateSupplier,deleteSupplier,createReturn,listReturns,completeReturn,updateReturn,deletePO,deleteReturn,
createPO,receivePO,addPharPermission,updatePharPermission,deletePharPermission,getAllPharPermission}
