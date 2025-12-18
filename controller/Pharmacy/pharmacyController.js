
import Inventory from '../../models/Pharmacy/inventory.model.js';
import MedicineRequest from '../../models/Pharmacy/medicineRequest.model.js';
import PharPermission from '../../models/Pharmacy/permission.model.js';
import Pharmacy from '../../models/Pharmacy/pharmacy.model.js';
import EmpAccess from "../../models/Pharmacy/empAccess.model.js";
import EmpEmployement from "../../models/Pharmacy/employement.model.js";
import EmpProfesional from "../../models/Pharmacy/empProffesional.js";
import PharStaff from "../../models/Pharmacy/PharEmpPerson.model.js";
import Supplier from "../../models/Pharmacy/supplier.model.js"
import PurchaseOrder from '../../models/Pharmacy/purchaseOrder.model.js';
import Return from '../../models/Pharmacy/return.model.js'
import fs, { stat } from 'fs'
import safeUnlink, { checkStockAvailability, updateInventoryStock } from '../../utils/globalFunction.js';
import mongoose from 'mongoose';
import Sell from '../../models/Pharmacy/sell.model.js';

const addInventry = async (req, res) => {
    const { pharId } = req.body;
    try {
        const isExist = await Pharmacy.findById(pharId)
        if (!isExist) return res.status(200).json({ message: "Pharmacy not found", success: false })
        let data;
        const isLast = await Inventory.findOne()?.sort({ createdAt: -1 })
        const nextId = isLast
            ? String(Number(isLast.customId) + 1).padStart(4, '0')
            : '0001';
        if (req.body.schedule == 'H1') {
            data = {
                ...req.body,
                customId: 'MED-' + nextId,
                status: 'Pending'
            }
        } else {
            data = {
                ...req.body,
                customId: 'MED-' + nextId,
                status: 'Approved'
            }
        }
        const item = await Inventory.create(data);

        return res.status(200).json({ success: true, message: "Inventory added successfully" });

    } catch (error) {
        console.log(error)
        res.status(400).json({ success: false, error: error.message });
    }
}
const inventoryList = async (req, res) => {
    try {
        const pharId = req.params.id;

        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Search filters
        const { search, schedule, status } = req.query;

        let filter = { pharId };

        // Search by name (medicineName)
        if (search) {
            filter.medicineName = { $regex: search, $options: "i" };
        }
        if (status) {
            filter.status = status;
        }

        // Search by schedule
        if (schedule !== 'all') {
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
        if (id?.length < 24) {
            const updated = await Inventory.findOne({ customId: id, pharId: req.user.user });

            if (!updated) {
                return res.status(200).json({ success: false, message: "Inventory item not found" });
            }

            res.status(200).json({ success: true, message: "Inventory get successfully", data: updated });
        } else {

            const updated = await Inventory.findOne({ _id: id, pharId: req.user.user });

            if (!updated) {
                return res.status(200).json({ success: false, message: "Inventory item not found" });
            }

            res.status(200).json({ success: true, message: "Inventory get successfully", data: updated });
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}
const inventoryUpdate = async (req, res) => {
    try {
        const { inventoryId } = req.body;
        const updated = await Inventory.findOneAndUpdate(
            { _id: inventoryId, pharId: req.body.pharId },
            req.body,
            { new: true }
        );

        if (!updated) {
            return res.status(200).json({ success: false, message: "Inventory item not found" });
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

        const deleted = await Inventory.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(200).json({
                success: false,
                message: "Item not found"
            });
        }

        await PurchaseOrder.updateMany(
            { "products.inventoryId": id },
            { $pull: { products: { inventoryId: id } } }
        );

        await Return.updateMany(
            { "products.inventoryId": id },
            { $pull: { products: { inventoryId: id } } }
        );

        res.status(200).json({
            success: true,
            message: "Inventory deleted and removed from related documents"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const medicineData = async (req, res) => {
    try {
        const name = req.params.name;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            Inventory.find({ medicineName: name })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),

            Inventory.countDocuments({ medicineName: name })
        ]);
        const inventoryValue = await items.reduce(
            (sum, item) => sum + (item.totalStockPrice || 0),
            0
        );
        const now = new Date();

        // next 1 month ki last date
        const nextMonth = new Date();
        nextMonth.setMonth(now.getMonth() + 1);

        const expiringSoonCount = items.reduce((count, item) => {
            if (!item?.expDate) return count;

            const expDate = new Date(item.expDate);

            if (expDate >= now && expDate <= nextMonth) {
                return count + 1;
            }

            return count;
        }, 0);


        return res.status(200).json({
            success: true,
            data: items,
            inventoryValue,
            expiringSoonCount,
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
const getMedicineRequestsList = async (req, res) => {
    try {
        const pharId = req.params.id;
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit) || 10, 100);
        const search = req.query.search?.trim();
        const status = req.query.status;

        // ✅ Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(pharId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid pharmacy id"
            });
        }

        const skip = (page - 1) * limit;

        // ✅ Base match
        const matchStage = {
            pharId: new mongoose.Types.ObjectId(pharId)
        };

        if (status && status !== "all") {
            matchStage.status = status;
        }

        // ✅ Aggregation pipeline
        const pipeline = [
            { $match: matchStage },

            // 🔹 Lookup inventory
            {
                $lookup: {
                    from: "inventories",
                    localField: "medicineId",
                    foreignField: "_id",
                    as: "medicine"
                }
            },

            // 🔹 Safe unwind
            {
                $unwind: {
                    path: "$medicine",
                    preserveNullAndEmptyArrays: false
                }
            }
        ];

        // 🔍 Search by medicine name (optimized)
        if (search) {
            pipeline.push({
                $match: {
                    "medicine.medicineName": {
                        $regex: search,
                        $options: "i"
                    }
                }
            });
        }

        // 🔹 Pagination + total count
        pipeline.push(
            { $sort: { _id: -1 } },
            {
                $facet: {
                    data: [
                        { $skip: skip },
                        { $limit: limit }
                    ],
                    total: [
                        { $count: "count" }
                    ]
                }
            }
        );

        const result = await MedicineRequest.aggregate(pipeline);

        const data = result[0]?.data || [];
        const total = result[0]?.total[0]?.count || 0;

        // ✅ Final response
        return res.status(200).json({
            success: true,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            data: data.map(item => ({
                _id: item._id,
                medicineName: item.medicine.medicineName,
                message: item.message || "",
                quantity: item.medicine.quantity,
                status: item.status,
                createdAt: item.createdAt
            }))
        });

    } catch (error) {
        console.error("getMedicineRequestsList error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


const sendMedicineRequest = async (req, res) => {
    try {
        const { medicineId, quantity, message, pharId, schedule } = req.body;

        // Check medicine exists and is H1 schedule
        const medicine = await Inventory.findOne({ _id: medicineId, pharId, schedule });
        if (!medicine) return res.status(200).json({ success: false, message: "Medicine not found or not H1 schedule" });

        const newRequest = new MedicineRequest({
            pharId,
            medicineId,
            quantity,
            message,
            success: 'Pending'
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
            return res.status(200).json({ success: false, message: "Request not found" });
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
                success: item.status,
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
        const { supplierId, deliveryDate, note, products, pharId } = req.body;

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

        res.json({ success: true, message: "PO Created", data: newPO });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

const getPOList = async (req, res) => {
    try {
        let { page = 1, limit = 10, search = "" } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);

        const matchStage = { pharId: new mongoose.Types.ObjectId(req.params.id) };

        if (search) {
            matchStage["supplier.name"] = { $regex: search, $options: "i" };
        }

        const pipeline = [
            {
                $lookup: {
                    from: "suppliers",
                    localField: "supplierId",
                    foreignField: "_id",
                    as: "supplier"
                }
            },
            { $unwind: "$supplier" },
            { $match: matchStage },
            // 👇 populate jaisa behaviour
            {
                $addFields: {
                    supplierId: {
                        _id: "$supplier._id",
                        name: "$supplier.name",
                        mobileNumber: "$supplier.mobileNumber"
                    }
                }
            },

            { $project: { supplier: 0 } }, // extra field remove

            { $sort: { createdAt: -1 } },

            {
                $facet: {
                    data: [
                        { $skip: (page - 1) * limit },
                        { $limit: limit }
                    ],
                    totalCount: [
                        { $count: "count" }
                    ]
                }
            }
        ];

        const result = await PurchaseOrder.aggregate(pipeline);
        const total = result[0].totalCount[0]?.count || 0;

        return res.status(200).json({
            success: true,
            data: result[0].data,
            pagination: {
                total,
                page,
                limit,
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
        const { id } = req.params;  // PO ID
        const { supplierId, deliveryDate, note, products, pharId } = req.body;

        const po = await PurchaseOrder.findOne({ _id: id, pharId });
        if (!po) {
            return res.status(200).json({ success: false, message: "PO not found" });
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
        const res = await PurchaseOrder.findByIdAndDelete(req.params.id);
        return res.status(200).json({ success: true, message: "PO Deleted" })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

const receivePO = async (req, res) => {
    try {
        const po = await PurchaseOrder.findById(req.params.poId);
        if (!po) return res.status(200).json({ success: false, message: "PO not found" });

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
        const isExist = await Supplier.findOne({ email: req.body.email })
        if (isExist) return res.status(200).json({ message: "Already exists", success: false })
        const supplier = await Supplier.create(req.body);

        return res.status(200).json({ success: true, message: "Supplier added successfully", supplier });
    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: error.message })
    }
}

const getSupplier = async (req, res) => {
    const pharId = req.params.id;
    try {
        const { name = "", sort = "score" } = req.query;

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const filter = {
            pharId,
            name: { $regex: name, $options: "i" }
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
            return res.status(200).json({ success: false, message: "Supplier not found" });
        }

        res.status(200).json({ success: true, data: supplier });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// UPDATE SUPPLIER
const updateSupplier = async (req, res) => {
    const { supplierId } = req.body
    try {
        const supplier = await Supplier.findOneAndUpdate(
            { _id: supplierId, pharId: req.body.pharId },
            req.body,
            { new: true }
        );

        if (!supplier) {
            return res.status(200).json({ success: false, message: "Supplier not found" });
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
            _id: req.params.id
        });

        if (!supplier) {
            return res.status(200).json({ success: false, message: "Supplier not found" });
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
        const { supplierId, deliveryDate, products, reason, pharId, status } = req.body;


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
            reason, status
        });

        res.status(201).json({ success: true, data: ret, message: "Return generated" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

const listReturns = async (req, res) => {
    try {
        const pharId = req.params.id;
        const { page = 1, limit = 10, status, search } = req.query;
        const matchStage = { pharId: new mongoose.Types.ObjectId(req.params.id) };
        if (status !== 'all') query.status = status;
        if (search) {
            matchStage["supplier.name"] = { $regex: search, $options: "i" };
        }
        const pipeline = [
            // Lookup supplier
            {
                $lookup: {
                    from: "suppliers",
                    localField: "supplierId",
                    foreignField: "_id",
                    as: "supplier"
                }
            },
            { $unwind: "$supplier" },

            // Lookup inventory for each product inside products array
            {
                $lookup: {
                    from: "inventories", // MongoDB collection name (usually plural lowercase)
                    localField: "products.inventoryId",
                    foreignField: "_id",
                    as: "inventoriesData"
                }
            },

            // Add medicineName to each product from inventoriesData
            {
                $addFields: {
                    products: {
                        $map: {
                            input: "$products",
                            as: "product",
                            in: {
                                $mergeObjects: [
                                    "$$product",
                                    {
                                        medicineName: {
                                            $let: {
                                                vars: {
                                                    matchedInventory: {
                                                        $arrayElemAt: [
                                                            {
                                                                $filter: {
                                                                    input: "$inventoriesData",
                                                                    cond: { $eq: ["$$this._id", "$$product.inventoryId"] }
                                                                }
                                                            },
                                                            0
                                                        ]
                                                    }
                                                },
                                                in: "$$matchedInventory.medicineName"
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            },

            { $project: { inventoriesData: 0 } }, // Remove temporary lookup field

            // Filter stage
            { $match: matchStage },

            // Add supplier info as embedded object instead of just ID
            {
                $addFields: {
                    supplierId: {
                        _id: "$supplier._id",
                        name: "$supplier.name",
                        mobileNumber: "$supplier.mobileNumber"
                    }
                }
            },

            { $project: { supplier: 0 } }, // Remove extra field

            { $sort: { createdAt: -1 } },

            {
                $facet: {
                    data: [
                        { $skip: (page - 1) * limit },
                        { $limit: limit }
                    ],
                    totalCount: [
                        { $count: "count" }
                    ]
                }
            }
        ];

        const result = await Return.aggregate(pipeline)

        const total = result[0].totalCount[0]?.count || 0;
        return res.status(200).json({
            success: true, data: result[0].data,
            pagination: {
                total,
                page: Number(page),
                totalPages: Math.ceil(total / limit)
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

        if (!doc) return res.status(200).json({ success: false, message: "Return not found" });

        return res.status(200).json({ success: true, data: doc });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

// UPDATE RETURN (only while Pending)
const updateReturn = async (req, res) => {
    try {
        const { supplierId, deliveryDate, status, products, reason, pharId, returnId } = req.body;

        const ret = await Return.findOne({ _id: returnId, pharId });
        if (!ret) return res.status(200).json({ success: false, message: "Return not found" });

        // If products changed, validate availability
        if (products) {
            const validation = await validateProductsAvailability(pharId, products);
            if (!validation.ok) return res.status(400).json({ success: false, message: validation.message });
            ret.products = products;
        }

        if (deliveryDate) ret.deliveryDate = deliveryDate;
        if (reason) ret.reason = reason;
        if (supplierId) ret.supplierId = supplierId;
        if (status) ret.status = status;


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
        if (!ret) return res.status(200).json({ success: false, message: "Return not found" });
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
        const id = req.params.id;

        const ret = await Return.findOne({ _id: id });
        if (!ret) return res.status(200).json({ success: false, message: "Return not found" });
        if (ret.status !== "Pending") return res.status(200).json({ success: false, message: "Only pending returns can be deleted" });

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

        const pharmacy = await Pharmacy.findById(id);

        if (!pharmacy) {
            return res.status(200).json({
                message: "Pharmacy not found",
                success: false
            });
        }

        const total = await PharPermission.countDocuments(filter);
        const permissions = await PharPermission.find(filter)
            .skip((page - 1) * limit)
            .limit(limit).lean();
        const usedPermission = await Promise.all(permissions?.map(async (item) => {
            const totalUsed = await PharStaff.countDocuments({ permissionId: item?._id }) || 0
            return {
                ...item,
                totalUsed
            }
        }))

        return res.status(200).json({
            message: "Pharmacy permissions fetched successfully",
            data: usedPermission,
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
        if (!isExist) return res.status(200).json({ message: "Pharmacy not found", success: false })


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
        if (!isExist) return res.status(200).json({ message: "Pharmacy not found", success: false })
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
        if (!isLabExist) return res.status(200).json({ message: "Pharmacy not found", success: false })
        const isExist = await PharPermission.findById(permissionId);
        if (!isExist) return res.status(200).json({ message: "Pharmacy permission not found", success: false })

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

const savePharStaff = async (req, res) => {
    const { name, address, dob, state, city, pinCode, pharId, empId, gender } = req.body
    const contactInformation = JSON.parse(req.body.contactInformation)
    const profileImage = req.files?.['profileImage']?.[0]?.path
    try {
        const isExist = await Pharmacy.findById(pharId);
        if (!isExist) return res.status(200).json({ message: "Pharmacy  not found", success: false })

        const isStaff = await PharStaff.findById(empId);

        if (profileImage && isStaff) {
            safeUnlink(isStaff.profileImage)
        }
        if (isStaff) {
            await PharStaff.findByIdAndUpdate(empId, { name, address, dob, state, gender, city, pinCode, contactInformation, pharId, profileImage: profileImage || isStaff.profileImage }, { new: true })
            return res.status(200).json({
                success: true,
                message: "Staff updated",
            });
        } else {
            const staf = await PharStaff.create({ name, address, dob, state, gender, city, pinCode, contactInformation, pharId, profileImage });
            return res.status(200).json({
                success: true,
                message: "Staff created",
                empId: staf._id
            });
        }


    } catch (error) {
        if (profileImage && fs.existsSync(profileImage)) {
            safeUnlink(profileImage)
        }
        return res.status(500).json({ success: false, message: error.message });
    }
};
const saveEmpEmployement = async (req, res) => {
    const { id, empId, pharId, position, joinDate, onLeaveDate, contractStart, contractEnd, salary, note } = req.body;

    try {
        // Check if employee exists
        let employee = await PharStaff.findById(empId);
        if (!employee) return res.status(200).json({ success: false, message: "Employee not found" });

        let data;
        if (id) {
            data = await EmpEmployement.findByIdAndUpdate(id, { empId, pharId, position, joinDate, onLeaveDate, contractStart, contractEnd, salary, note }, { new: true });
            if (!data) return res.status(200).json({ success: false, message: "Employment record not found" });

            return res.status(200).json({
                success: true,
                message: "Employee employment updated",
                data
            });
        } else {
            // Create new
            data = await EmpEmployement.create({ empId, pharId, position, joinDate, onLeaveDate, contractStart, contractEnd, salary, note });
            employee.employmentId = data?._id
            await employee.save()
            return res.status(200).json({
                success: true,
                message: "Employee employment created",
                data
            });
        }

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
const deleteSubEmpProffesional = async (req, res) => {
    const { id, empId, type } = req.body;

    try {
        // Check if employee exists
        const employee = await PharStaff.findById(empId);
        if (!employee) {
            return res.status(200).json({ success: false, message: "Employee not found" });
        }

        // Build pull query based on type
        let pullQuery = {};

        if (type === "education") {
            pullQuery = { $pull: { education: { _id: id } } };
        } else if (type === "cert") {
            const data = await EmpProfesional.findOne({ empId }).select('pharCert')
            safeUnlink(data.pharCert.certFile)
            pullQuery = { $pull: { pharCert: { _id: id } } };
        } else {
            return res.status(400).json({ success: false, message: "Invalid type" });
        }

        const data = await EmpProfesional.findOneAndUpdate(
            { empId },
            pullQuery,
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: "Sub-document deleted successfully",
            data
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
const saveEmpProfessional = async (req, res) => {
    const { id, empId, profession, specialization, totalExperience, professionalBio, education } = req.body;
    const certMeta = JSON.parse(req.body.pharCert || "[]");
    try {
        const employee = await PharStaff.findById(empId);
        if (!employee) return res.status(200).json({ success: false, message: "Employee not found" });
        const uploadedFiles = req.files?.certFile || [];
        const pharCert = certMeta.map((meta, idx) => ({
            certName: meta.certName,
            certFile: uploadedFiles[idx] ? uploadedFiles[idx].path : "",
        }));
        const isExist = await EmpProfesional.findOne({ empId })
        let data;
        if (isExist) {
            const existing = await EmpProfesional.findById(isExist._id);
            if (!existing) return res.status(200).json({ success: false, message: "Professional record not found" });

            if (pharCert.length > 0 && existing.pharCert?.length) {
                existing.pharCert.forEach(cert => safeUnlink(cert.certFile));
            }

            data = await EmpProfesional.findByIdAndUpdate(
                isExist._id,
                {
                    profession,
                    specialization,
                    totalExperience,
                    professionalBio,
                    education: JSON.parse(education || "[]"), // assuming education comes as JSON string
                    pharCert: pharCert.length > 0 ? pharCert : existing.pharCert
                },
                { new: true }
            );

            return res.status(200).json({
                success: true,
                message: "Employee professional updated"
            });

        } else {
            // Create new record
            data = await EmpProfesional.create({
                empId,
                profession,
                specialization,
                totalExperience,
                professionalBio,
                education: JSON.parse(education || "[]"),
                pharCert
            });
            employee.proffesionId = data?._id
            await employee.save()
            return res.status(200).json({
                success: true,
                message: "Employee professional created"
            });
        }

    } catch (error) {
        // if (pharCertFiles.length > 0) {
        //     pharCertFiles.forEach(file => safeUnlink(file.path));
        // }
        return res.status(500).json({ success: false, message: error.message });
    }
};
const saveEmpAccess = async (req, res) => {
    const { id, empId, userName, email, password, permissionId } = req.body;
    try {
        const employee = await PharStaff.findById(empId);
        if (!employee) return res.status(200).json({ success: false, message: "Employee not found" });

        const permission = await PharPermission.findById(permissionId);
        if (!permission) return res.status(200).json({ success: false, message: "Permission not found" });

        const isExist = await EmpAccess.findOne({ empId: empId });
        let data;
        await PharStaff.findByIdAndUpdate(empId, { permissionId }, { new: true })
        if (isExist) {
            data = await EmpAccess.findOneAndUpdate({ empId: empId }, { userName, email, password, permissionId }, { new: true });
            if (!data) return res.status(200).json({ success: false, message: "Access record not found" });
            return res.status(200).json({
                success: true,
                message: "Employee access updated",
                data
            });
        } else {
            data = await EmpAccess.create(req.body);
            employee.accessId = data?._id
            await employee.save()
            return res.status(200).json({
                success: true,
                message: "Employee access created",
                data
            });
        }

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
const pharStaffData = async (req, res) => {
    const id = req.params.id
    try {
        const isExist = await PharStaff.findById(id);
        if (!isExist) return res.status(200).json({ message: "Employee  not found", success: false })

        const employment = await EmpEmployement.findOne({ empId: id })
        const professional = await EmpProfesional.findOne({ empId: id })
        const empAccess = await EmpAccess.findOne({ empId: id })?.populate({ path: 'permissionId', select: 'name' })

        return res.status(200).json({
            success: true,
            message: "Staff fetched",
            employee: isExist, employment, professional, empAccess

        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
const pharStaffAction = async (req, res) => {
    const { empId, status } = req.body
    try {
        const isExist = await PharStaff.findById(empId);
        if (!isExist) return res.status(200).json({ message: "Employee  not found", success: false })

        const employment = await PharStaff.findByIdAndUpdate(empId, { status }, { new: true })

        return res.status(200).json({
            success: true,
            message: "Staff status updated"

        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
const pharStaff = async (req, res) => {
    const id = req.params.id;
    let { page, limit, name, status } = req.query;

    const pageNumber = parseInt(page) > 0 ? parseInt(page) : 1;
    const limitNumber = parseInt(limit) > 0 ? parseInt(limit) : 10;

    try {
        const isExist = await Pharmacy.findById(id);
        if (!isExist) {
            return res.status(200).json({ message: "Pharmacy not found", success: false });
        }

        const filter = { pharId: id };
        if (name) {
            filter.name = { $regex: name, $options: "i" };
        }
        if (status && status !== "undefined") {
            filter.status = status;
        }


        const total = await PharStaff.countDocuments(filter);
        const employee = await PharStaff.find(filter)
            .populate({ path: "permissionId", select: 'name' })
            .populate({ path: "employmentId", select: 'position joinDate' })
            .sort({ createdAt: -1 })
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber)
            .lean();

        return res.status(200).json({
            success: true,
            message: "Staff fetched",
            data: employee,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                total,
                totalPages: Math.ceil(total / limitNumber)
            },
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
const deleteStaffData = async (req, res) => {
    const id = req.params.id;

    try {
        const employee = await PharStaff.findById(id);
        if (!employee) return res.status(200).json({ success: false, message: "Employee not found" });

        safeUnlink(employee.profileImage);

        // Find related professional data
        const professional = await EmpProfesional.findOne({ empId: id });
        if (professional?.pharCert?.length) {
            professional.pharCert.forEach(cert => safeUnlink(cert.certFile));
        }

        // Find employment and access records
        const employment = await EmpEmployement.findOne({ empId: id });
        const empAccess = await EmpAccess.findOne({ empId: id });

        // Delete all related records
        await EmpProfesional.deleteMany({ empId: id });
        await EmpEmployement.deleteMany({ empId: id });
        await EmpAccess.deleteMany({ empId: id });
        await PharStaff.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Employee and related data deleted successfully"
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
const pharDashboardData = async (req, res) => {
    const pharId = req.params.id;
    try {
        const isExist = await Pharmacy.findById(pharId);
        if (!isExist) return res.status(200).json({ message: 'Lab not exist' });
        const items = await Inventory.find({ pharId })
        const inventoryValue = await items.reduce(
            (sum, item) => sum + (item.totalStockPrice || 0),
            0
        );
        const now = new Date();
        const nextMonth = new Date();
        nextMonth.setMonth(now.getMonth() + 1);
        const expiringSoonCount = items.reduce((count, item) => {
            if (!item?.expDate) return count;
            const expDate = new Date(item.expDate);
            if (expDate >= now && expDate <= nextMonth) {
                return count + 1;
            }
            return count;
        }, 0);

        return res.status(200).json({
            message: "Dashboard data fetch successfully", inventoryValue,
            expiringSoonCount, success: true
        })

    } catch (err) {
        console.log(err)
        return res.status(200).json({ message: 'Server Error' });
    }
}
const sellMedicine = async (req, res) => {
    const { pharId, patientId, doctorId, prescriptionId, sellId } = req.body;
    const prescriptionFile = req.files?.['prescriptionFile']?.[0]?.path;
    const products = JSON.parse(req.body.products || "[]");
    try {
        const pharmacy = await Pharmacy.findById(pharId);
        if (!pharmacy) {
            return res.status(404).json({ success: false, message: "Pharmacy not found" });
        }

        const isSell = sellId ? await Sell.findById(sellId) : null;

        if (isSell) {
            await updateInventoryStock(isSell.products, "increase");

            // 2️⃣ New stock check
            const stockCheck = await checkStockAvailability(pharId, products);
            if (!stockCheck.success) {
                // rollback old stock
                await updateInventoryStock(isSell.products, "decrease");
                return res.status(400).json(stockCheck);
            }

            await updateInventoryStock(products, "decrease");

            if (prescriptionFile && isSell.prescriptionFile) {
                safeUnlink(isSell.prescriptionFile);
            }

            await Sell.findByIdAndUpdate(
                sellId,
                {
                    patientId,
                    doctorId,
                    prescriptionId,
                    products,
                    prescriptionFile: prescriptionFile || isSell.prescriptionFile
                },
                { new: true }
            );

            return res.status(200).json({ success: true, message: "Sell updated successfully" });
        }

        const stockCheck = await checkStockAvailability(pharId, products);
        if (!stockCheck.success) {
            return res.status(400).json(stockCheck);
        }

        await updateInventoryStock(products, "decrease");

        await Sell.create({
            pharId,
            patientId,
            doctorId,
            prescriptionId,
            products,
            prescriptionFile
        });

        return res.status(201).json({ success: true, message: "Sell created successfully" });

    } catch (error) {
        if (prescriptionFile && fs.existsSync(prescriptionFile)) {
            safeUnlink(prescriptionFile);
        }
        console.log(error)
        return res.status(500).json({ success: false, message: error.message });
    }
};
const getSellMedicine = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            sort,
            inventoryId,
            search,
            page = 1,
            limit = 10
        } = req.query;

        let filter = {};

        // 📅 Date Range Filter
        if (startDate && startDate !== 'undefined' && endDate && endDate !== 'undefined') {
            filter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        // 💊 Inventory / Medicine Filter
        if (inventoryId) {
            filter["products.inventoryId"] = inventoryId;
        }

        // 🔍 Search Filter (Patient / Doctor)
        if (search) {
            console.log(search)
            filter.$or = [
                { "patientId.name": { $regex: search, $options: "i" } },
                { "doctorId.name": { $regex: search, $options: "i" } }
            ];
        }

        const skip = (page - 1) * limit;

        const sells = await Sell.aggregate([
            {
                $lookup: {
                    from: "patients",
                    localField: "patientId",
                    foreignField: "_id",
                    as: "patient"
                }
            },
            { $unwind: "$patient" },

            {
                $lookup: {
                    from: "doctors",
                    localField: "doctorId",
                    foreignField: "_id",
                    as: "doctor"
                }
            },
            { $unwind: "$doctor" },

            {
                $match: {
                    $or: [
                        { "patient.name": { $regex: search, $options: "i" } },
                        { "doctor.name": { $regex: search, $options: "i" } }
                    ]
                }
            },

            { $sort: { createdAt: sort === "newest" ? -1 : 1 } },
            { $skip: skip },
            { $limit: Number(limit) }
        ]);


        const total = await Sell.countDocuments(filter);

        return res.status(200).json({
            success: true,
            message: "Sell list fetched successfully",
            total,
            page: Number(page),
            totalPages: Math.ceil(total / limit),
            data: sells
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
const getSellData = async (req, res) => {
    try {
        const sellId = req.params.id;
        const sell = await Sell.findById(sellId).populate({ path: "patientId", select: "name contactNumber" })
            .populate({ path: "doctorId", select: "name" })
            .populate({ path: "products.inventoryId", select: "medicineName batchNumber schedule" });
        if (!sell) {
            return res.status(200).json({ success: false, message: "Sell record not found" });
        }
        return res.status(200).json({ success: true, sell, message: "Sell record deleted successfully" });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}
const deleteSellData = async (req, res) => {
    try {
        const sellId = req.params.id;
        const sell = await Sell.findOne({ _id: sellId, pharId: req.user.user });
        if (!sell) {
            return res.status(200).json({ success: false, message: "Sell record not found" });
        }
        if (sell.prescriptionFile) {
            safeUnlink(sell.prescriptionFile);
        }
        // Restore inventory stock
        await updateInventoryStock(sell.products, "increase");
        await Sell.findByIdAndDelete(sellId);
        return res.status(200).json({ success: true, message: "Sell record deleted successfully" });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

export { deleteStaffData, pharStaff, pharStaffAction, pharStaffData, saveEmpAccess, saveEmpProfessional, deleteSubEmpProffesional, saveEmpEmployement, savePharStaff }
export {
    getAllMedicineRequestsForAdmin, getMedicineRequestsList, getPODetails, getPOList, getReturnById, getSupplier, getSupplierById,
    addInventry, inventoryUpdate, inventoryDelete, inventoryGetById, inventoryList, changeRequestStatus, sendMedicineRequest,
    addSupplier, updatePO, updateSupplier, deleteSupplier, createReturn, listReturns, completeReturn, updateReturn, deletePO, deleteReturn,
    createPO, receivePO, addPharPermission, updatePharPermission, deletePharPermission, getAllPharPermission, medicineData, pharDashboardData,
    sellMedicine, getSellMedicine, deleteSellData, getSellData
}
