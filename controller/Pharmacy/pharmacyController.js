
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
import MedicalHistory from '../../models/Patient/medicalHistory.model.js';
import PatientDemographic from '../../models/Patient/demographic.model.js';
import Prescriptions from '../../models/Prescriptions.js';
import Patient from '../../models/Patient/patient.model.js';
import PatientPrescriptions from '../../models/Patient/prescription.model.js';
import User from '../../models/Hospital/User.js';
import Permission from '../../models/Permission.js';
import bcrypt from 'bcryptjs';
import Doctor from '../../models/Doctor/doctor.model.js';
import BedAllotment from '../../models/Hospital/BedAllotment.js';
import HospitalAudit from '../../models/Hospital/HospitalAudit.js';
import PharmacyAudit from '../../models/Pharmacy/PharmacyAudit.model.js';
import PaymentInfo from '../../models/PaymentInfo.js';

const addInventry = async (req, res) => {
    const { pharId } = req.body;
    try {
        const isExist = await User.findById(pharId)
        if (!isExist) return res.status(200).json({ message: "Pharmacy not found", success: false })
        const isBatchExist = await Inventory.findOne({ batchNumber: req?.body?.batchNumber })
        if (isBatchExist) {
            return res.status(200).json({ message: "Batch number already exits", success: false })
        }
        let data;

        if (req.body.schedule == 'H1') {
            data = {
                ...req.body,
                status: 'Pending'
            }
        } else {
            data = {
                ...req.body,
                status: 'Approved'
            }
        }
        if (isExist.role == 'hospital') {
            data.hospitalId = pharId
            data.type = 'hospital'
        } else {
            data.pharId = pharId
            data.type = 'pharmacy'
        }
        const item = await Inventory.create(data);
        if (req?.user?.loginUser && data?.hospitalId) {
            await HospitalAudit.create({
                hospitalId: data?.hospitalId, actionUser: req?.user?.loginUser,
                note: `An inventory item ${req?.body?.medicineName} was added.`
            })
        }
        const id = req.user.id || req.user.userId
        if (id && req.user.type == "pharmacy") {
            if (req.user.loginUser) {
                await PharmacyAudit.create({ pharId: id, actionUser: req.user.loginUser, note: `${req?.body?.medicineName} medicine was added in inventory.` })
            } else {
                await PharmacyAudit.create({ pharId: id, note: `${req?.body?.medicineName} medicine was added in inventory.` })
            }
        }

        return res.status(200).json({ success: true, message: "Inventory added successfully" });

    } catch (error) {
        console.log(error)
        res.status(400).json({ success: false, error: error.message });
    }
}
const inventoryList = async (req, res) => {
    try {
        const ownerId = req.user.id || req.user.userId

        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const user = await User.findById(ownerId)

        // Search filters
        const { search, schedule, status, type = user.role, expiry = '' } = req.query;

        let filter = {};
        if (type === 'hospital') {
            filter.hospitalId = new mongoose.Types.ObjectId(ownerId);
            filter.type = 'hospital';

        } else {
            // default → lab
            filter.pharId = new mongoose.Types.ObjectId(ownerId);
            // filter.type = 'pharmacy';
        }
        if (expiry === "No") {
            filter.expDate = { $gt: new Date() }
        }
        // Search by name (medicineName)
        if (search) {
            filter.medicineName = { $regex: search, $options: "i" };
        }
        if (status) {
            filter.status = status;
        }
        const sortOption = expiry
            ? { expDate: 1 }      // expiry wale case me
            : { createdAt: -1 };

        // Search by schedule
        if (schedule !== 'all') {
            filter.schedule = schedule; // exact match
        }
        // Fetch data
        const [items, total] = await Promise.all([
            Inventory.find(filter)
                .sort(sortOption)
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
            const updated = await Inventory.findOne({ customId: id, pharId: req.user.userId });

            if (!updated) {
                return res.status(200).json({ success: false, message: "Inventory item not found" });
            }

            res.status(200).json({ success: true, message: "Inventory get successfully", data: updated });
        } else {

            const updated = await Inventory.findOne({ _id: id, pharId: req.user.userId });

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
        const isExist = await Inventory.findById(inventoryId)
        if (!isExist) return res.status(200).json({ success: false, message: "Inventory not found" })
        const isBatchExist = await Inventory.findOne({ batchNumber: req?.body?.batchNumber, _id: { $ne: inventoryId } })
        if (isBatchExist) {
            return res.status(200).json({ message: "Batch number already exits", success: false })
        }
        if (isExist.sellCount > req.body.quantity) {
            return res.status(200).json({ success: false, message: `You already Sell ${isExist.sellCount} so we cant update your quantity less then ${isExist?.sellCount}` });
        }
        const updated = await Inventory.findOneAndUpdate(
            { _id: inventoryId, pharId: req.body.pharId },
            req.body,
            { new: true }
        );

        if (!updated) {
            return res.status(200).json({ success: false, message: "Inventory item not found" });
        }

        if (req?.user?.loginUser && isExist?.hospitalId) {
            await HospitalAudit.create({
                hospitalId: isExist?.hospitalId, actionUser: req?.user?.loginUser,
                note: `An inventory item ${req?.body?.medicineName} was updated.`
            })
        }
        const id = req.user.id || req.user.userId
        if (id && req.user.type == "pharmacy") {
            if (req.user.loginUser) {
                await PharmacyAudit.create({ pharId: id, actionUser: req.user.loginUser, note: `${req?.body?.medicineName} records was updated.` })
            } else {
                await PharmacyAudit.create({ pharId: id, note: `${req?.body?.medicineName} records was updated.` })
            }
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
        const pharId = req.params.pharId;

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            Inventory.find({ medicineName: name, pharId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),

            Inventory.countDocuments({ medicineName: name })
        ]);
        const inventoryIds = items.map(item => item._id);
        const inventoryValue = await items.reduce(
            (sum, item) => sum + (item.totalStockPrice || 0),
            0
        );
        const totalStock = await items.reduce(
            (sum, item) => sum + (item.quantity || 0),
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
        const salesData = await Sell.aggregate([
            { $unwind: "$products" },
            {
                $match: {
                    "products.inventoryId": { $in: inventoryIds }
                }
            },
            {
                $group: {
                    _id: null,
                    totalSalesAmount: {
                        $sum: "$products.price"
                    },
                    totalSoldQuantity: {
                        $sum: "$products.quantity"
                    }
                }
            }
        ]);

        const totalSales = salesData[0]?.totalSalesAmount || 0;


        return res.status(200).json({
            success: true,
            data: items,
            inventoryValue,
            expiringSoonCount,
            totalStock, totalSales,
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
        const ownerId = req.user.id || req.user.userId
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit) || 10, 100);
        const search = req.query.search?.trim();
        const status = req.query.status;
        const { type = 'pharmacy' } = req.query

        // ✅ Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(ownerId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid pharmacy id"
            });
        }

        const skip = (page - 1) * limit;

        // ✅ Base match
        const matchStage = {
        };
        if (type === 'hospital') {
            matchStage.hospitalId = new mongoose.Types.ObjectId(ownerId);
            matchStage.type = 'hospital';

        } else {
            // default → lab
            matchStage.pharId = new mongoose.Types.ObjectId(ownerId);
            // matchStage.type = 'pharmacy';
        }

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
        const { medicineId, quantity, message, pharId, schedule, hospitalId, type } = req.body;

        // Check medicine exists and is H1 schedule
        const medicine = await Inventory.findOne({ _id: medicineId, schedule });
        if (!medicine) return res.status(200).json({ success: false, message: "Medicine not found or not H1 schedule" });

        const newRequest = await MedicineRequest.create({
            pharId,
            medicineId,
            quantity,
            hospitalId,
            message,
            success: 'Pending', type
        });


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
        const { supplierId, deliveryDate, note, products, pharId, hospitalId } = req.body;

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
            deliveryDate, hospitalId,
            note,
            products
        });

        res.json({ success: true, message: "PO Created", data: newPO });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

const getPOList = async (req, res) => {
    const id = req.user.id || req.user.userId
    try {
        let { page = 1, limit = 10, search = "" } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        let matchStage = {};
        const user = await User.findById(id)
        if (user.role == "hospital") {
            matchStage.hospitalId = new mongoose.Types.ObjectId(id)
        } else if (user.role == "pharmacy") {
            matchStage.pharId = new mongoose.Types.ObjectId(id)
        }


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
        const po = await PurchaseOrder.findById({ _id: req.params.id, });
        res.status(200).json({ success: true, data: po })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

const updatePO = async (req, res) => {
    try {
        const { id } = req.params;  // PO ID
        const { supplierId, deliveryDate, note, products, pharId, hospitalId } = req.body;

        const po = await PurchaseOrder.findOne({ _id: id, $or: [{ pharId }, { hospitalId }] });
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
    const id = req.user.id || req.user.userId
    try {
        const res = await PurchaseOrder.findOneAndDelete({ _id: req.params.id, $or: [{ pharId: id }, { hospitalId: id }] });
        return res.status(200).json({ success: true, message: "PO Deleted" })
    } catch (error) {
        console.log(error)
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
        const isExist = await Supplier.findOne({ email: req.body.email, pharId: req.user.userId || req.user.id })
        if (isExist) return res.status(200).json({ message: "Already exists", success: false })
        const supplier = await Supplier.create(req.body);
        const id = req.user.id || req.user.userId
        if (id && req.user.type == "pharmacy") {
            if (req.user.loginUser) {
                await PharmacyAudit.create({ pharId: id, actionUser: req.user.loginUser, note: `${req.body.name} supplier added.` })
            } else {
                await PharmacyAudit.create({ pharId: id, note: `${req.body.name} supplier added.` })
            }
        }

        return res.status(200).json({ success: true, message: "Supplier added successfully", supplier });
    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: error.message })
    }
}

const getSupplier = async (req, res) => {
    const ownerId = req.user.id || req.user.userId;
    try {
        const { name = "", sort = "score", type = 'pharmacy' } = req.query;

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const filter = {
            name: { $regex: name, $options: "i" }
        };
        if (type == 'pharmacy') {
            filter.pharId = ownerId
        } else {
            filter.hospitalId = ownerId
        }

        // Get total count of suppliers matching the filter
        const total = await Supplier.countDocuments(filter);

        // Fetch suppliers
        const suppliers = await Supplier
            .find(filter)
            .sort({ [sort]: -1 })
            .skip(skip)
            .limit(limit);

        // Fetch Purchase Orders and calculate the total quantity per supplier
        const supplierData = await Promise.all(
            suppliers.map(async (supplier) => {
                const purchaseOrders = type === 'hospital' ?
                    await PurchaseOrder.find({
                        supplierId: supplier._id,
                        hospitalId: ownerId,
                        // status: "received" // Only include received orders
                    })
                    : await PurchaseOrder.find({
                        supplierId: supplier._id,
                        pharId: ownerId,
                        // status: "received" // Only include received orders
                    });
                const totalQuantity = purchaseOrders.reduce((sum, order) => {
                    return sum + order.products.reduce((productSum, product) => productSum + product.quantity, 0);
                }, 0);

                return {
                    ...supplier.toObject(),
                    totalQuantity
                };
            })
        );

        // Return the response with suppliers and total quantities
        res.status(200).json({
            success: true,
            data: supplierData,
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
        const id = req.user.id || req.user.userId
        if (id && req.user.type == "pharmacy") {
            if (req.user.loginUser) {
                await PharmacyAudit.create({ pharId: id, actionUser: req.user.loginUser, note: `${req.body.name} supplier records updated.` })
            } else {
                await PharmacyAudit.create({ pharId: id, note: `${req.body.name} supplier recores updated.` })
            }
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
async function validateHospitalProductsAvailability(hospitalId, products) {
    for (const p of products) {
        const inv = await Inventory.findOne({ _id: p.inventoryId, hospitalId });
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
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const { supplierId, deliveryDate, products, reason, pharId, status, type, hospitalId } = req.body;

        if (!supplierId || !Array.isArray(products) || products.length === 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: "supplierId and products are required" });
        }

        // ✅ Supplier check
        let supplier;
        if (pharId) {
            supplier = await Supplier.findOne({ _id: supplierId, pharId }).session(session);
            if (!supplier) throw new Error("Supplier not found");

            const validation = await validateProductsAvailability(pharId, products);
            if (!validation.ok) throw new Error(validation.message);

        } else {
            supplier = await Supplier.findOne({ _id: supplierId, hospitalId }).session(session);
            if (!supplier) throw new Error("Supplier not found");

            const validation = await validateHospitalProductsAvailability(hospitalId, products);
            if (!validation.ok) throw new Error(validation.message);
        }

        // ✅ Audit log
        const id = req.user.id || req.user.userId;
        if (id && req.user.type === "pharmacy") {
            await PharmacyAudit.create([{
                pharId: id,
                actionUser: req.user.loginUser || undefined,
                note: `A new return created for reason ${reason}.`
            }], { session });
        }

        // 🔥 Deduct inventory safely
        for (const p of products) {
            const filter = pharId
                ? { _id: p.inventoryId, pharId, quantity: { $gte: p.quantity } }
                : { _id: p.inventoryId, hospitalId, quantity: { $gte: p.quantity } };

            const updated = await Inventory.findOneAndUpdate(
                filter,
                { $inc: { quantity: -p.quantity } },
                { new: true, session }
            );

            if (!updated) {
                throw new Error(`Insufficient stock or invalid inventory for ${p.inventoryId}`);
            }
        }

        // ✅ Create return
        const ret = await Return.create([{
            pharId,
            supplierId,
            deliveryDate,
            products,
            reason,
            status,
            type,
            hospitalId
        }], { session });

        // ✅ Commit
        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({
            success: true,
            data: ret[0],
            message: "Return generated"
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const listReturns = async (req, res) => {
    try {
        const ownerId = req.user.id || req.user.userId;
        const { page = 1, limit = 10, status, search, type = 'pharmacy' } = req.query;
        const matchStage = {};
        if (type === 'hospital') {
            matchStage.hospitalId = new mongoose.Types.ObjectId(ownerId);
            matchStage.type = 'hospital';

        } else {
            // default → lab
            matchStage.pharId = new mongoose.Types.ObjectId(ownerId);
            // matchStage.type = 'pharmacy';
        }
        if (status) matchStage.status = status;
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
        console.log(error)
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
        const { supplierId, deliveryDate, status, products, reason, pharId, returnId, hospitalId } = req.body;

        const ret = await Return.findOne({ _id: returnId });
        if (!ret) return res.status(200).json({ success: false, message: "Return not found" });

        // If products changed, validate availability
        if (products) {
            if (pharId) {
                const validation = await validateProductsAvailability(pharId, products);
                if (!validation.ok) return res.status(200).json({ success: false, message: validation.message });
                ret.products = products;
            }
            if (hospitalId) {
                const validation = await validateHospitalProductsAvailability(hospitalId, products);
                if (!validation.ok) return res.status(200).json({ success: false, message: validation.message });
                ret.products = products;
            }
        }

        if (deliveryDate) ret.deliveryDate = deliveryDate;
        if (reason) ret.reason = reason;
        if (supplierId) ret.supplierId = supplierId;
        if (status) ret.status = status;

        await ret.save();
        const id = req.user.id || req.user.userId
        if (id && req.user.type == "pharmacy") {
            if (req.user.loginUser) {
                await PharmacyAudit.create({ pharId: id, actionUser: req.user.loginUser, note: `A return was updated for reason ${reason}.` })
            } else {
                await PharmacyAudit.create({ pharId: id, note: `A return was updated for reason ${reason}.` })
            }
        }
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

        const pharmacy = await User.findById(id);

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
        const isExist = await User.findById(pharId);
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
        const isExist = await User.findById(pharId);
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
        const isLabExist = await User.findById(pharId);
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
        const isExist = await User.findById(pharId);
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
                empId
            });
        } else {
            const isContactNumber = await PharStaff.findOne({ 'contactInformation.contactNumber': contactInformation.contactNumber })
            if (isContactNumber) {
                safeUnlink(profileImage)
                return res.status(200).json({ message: "Contact number already taken", success: false })
            }
            const isEmail = await PharStaff.findOne({ 'contactInformation.email': contactInformation.email })
            if (isEmail) {
                safeUnlink(profileImage)
                return res.status(200).json({ message: "Email already taken", success: false })
            }
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
    const { id, empId, pharId, position, joinDate, onLeaveDate, contractStart, contractEnd, salary, note, status } = req.body;

    try {
        // Check if employee exists
        let employee = await PharStaff.findById(empId);
        if (!employee) return res.status(200).json({ success: false, message: "Employee not found" });

        let data;
        if (id) {
            data = await EmpEmployement.findByIdAndUpdate(id, { empId, pharId, position, status, joinDate, onLeaveDate, contractStart, contractEnd, salary, note }, { new: true });
            if (!data) return res.status(200).json({ success: false, message: "Employment record not found" });

            return res.status(200).json({
                success: true,
                message: "Employee employment updated",
                data
            });
        } else {
            // Create new
            data = await EmpEmployement.create({ empId, pharId, position, joinDate, status, onLeaveDate, contractStart, contractEnd, salary, note });
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

        const permission = await Permission.findById(permissionId);
        if (!permission) return res.status(200).json({ success: false, message: "Permission not found" });

        const isExist = await EmpAccess.findOne({ empId: empId });
        let data;
        await PharStaff.findByIdAndUpdate(empId, { permissionId }, { new: true })
        if (isExist) {
            const alreadyEmail = await EmpAccess.countDocuments({ email })
            if (alreadyEmail > 1) {
                return res.status(200).json({
                    success: true,
                    message: "Email already exists",
                });
            }
            data = await EmpAccess.findOneAndUpdate({ empId: empId }, { userName, email, password, permissionId }, { new: true });
            if (!data) return res.status(200).json({ success: false, message: "Access record not found" });
            return res.status(200).json({
                success: true,
                message: "Employee access updated",
                data
            });
        } else {
            const alreadyEmail = await EmpAccess.findOne({ email })
            if (alreadyEmail) {
                return res.status(200).json({
                    success: true,
                    message: "Email already exists",
                });
            }
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
        const empAccess = await EmpAccess.findOne({ empId: id })?.populate('permissionId')
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
        const isExist = await User.findById(id);
        if (!isExist) {
            return res.status(200).json({ message: "Pharmacy not found", success: false });
        }

        const filter = { pharId: id };
        if (name) {
            filter.name = { $regex: name, $options: "i" };
        }


        const total = await PharStaff.countDocuments(filter);
        const employee = await PharStaff.find(filter)
            .populate({ path: "permissionId", select: "name" })
            .populate({
                path: "employmentId",
                select: "position joinDate status",
                match: status ? { status: status } : {}
            })
            .sort({ createdAt: -1 })
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber)
            .lean();
        const filteredEmployee = status
            ? employee.filter(emp => emp.employmentId !== null)
            : employee;

        return res.status(200).json({
            success: true,
            message: "Staff fetched",
            data: filteredEmployee,
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
    const pharId = req.user.id || req.user.userId;
    try {
        const isExist = await User.findById(pharId);
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

        const h1Compliance = await Inventory.countDocuments({ schedule: 'H1', pharId })
        const xCompliance = await Inventory.aggregate([
            {
                $match: { schedule: 'X' },
            },
            {
                $group: {
                    _id: null,
                    totalQuantity: { $sum: "$quantity" }
                }
            },
        ])
        const categoryStock = await Inventory.aggregate([
            {
                $match: {
                    pharId: new mongoose.Types.ObjectId(pharId) // ✅ convert
                }
            },
            {
                $group: {
                    _id: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$schedule", "H1"] }, then: "H1" },
                                { case: { $eq: ["$schedule", "H"] }, then: "H" },
                                { case: { $eq: ["$schedule", "X"] }, then: "X" },
                            ],
                            default: "Other"
                        }
                    },
                    totalQuantity: { $sum: "$quantity" }
                }
            }
        ]);
        const stockMap = {
            H1: 0,
            H: 0,
            X: 0,
            OTHER: 0
        };

        categoryStock.forEach(item => {
            stockMap[item._id] = item.totalQuantity;
        });
        const totalXQuantity = xCompliance[0]?.totalQuantity || 0;

        const hCompliance = await Inventory.aggregate([
            {
                $match: { schedule: 'H', pharId },
            },
            {
                $group: {
                    _id: null,
                    totalQuantity: { $sum: "$quantity" }
                }
            },
        ])
        const totalHQuantity = hCompliance[0]?.totalQuantity || 0;
        const h1ComplianceData = await Inventory.aggregate([
            {
                $match: { schedule: 'H1', pharId },
            },
            {
                $group: {
                    _id: null,
                    totalQuantity: { $sum: "$quantity" }
                }
            },
        ])
        const totalH1Quantity = h1ComplianceData[0]?.totalQuantity || 0;
        const otherComplianceData = await Inventory.aggregate([
            {
                $match: { schedule: 'Other', pharId },
            },
            {
                $group: {
                    _id: null,
                    totalQuantity: { $sum: "$quantity" }
                }
            },
        ])
        const totalOtherQuantity = otherComplianceData[0]?.totalQuantity || 0;
        const marginAnalysis = await Inventory.find({ pharId }).sort({ margin: -1 }).limit(5)
        const inventory = await Inventory.find({ pharId, sellCount: { $gt: 0 } }).sort({ sellCount: -1 }).limit(5)
        const suppliers = await Supplier.find({ pharId }).sort({ createdAt: -1 }).limit(5)
        const supplierData = await Promise.all(
            suppliers.map(async (supplier) => {
                const purchaseOrders = await PurchaseOrder.find({
                    supplierId: supplier._id,
                    pharId: pharId,
                    // status: "received" // Only include received orders
                });
                const totalQuantity = purchaseOrders.reduce((sum, order) => {
                    return sum + order.products.reduce((productSum, product) => productSum + product.quantity, 0);
                }, 0);

                return {
                    ...supplier.toObject(),
                    totalQuantity
                };
            })
        );
        // 🔥 LAST 1 MONTH SALES AGGREGATION
        const lastYear = new Date();
        lastYear.setMonth(now.getMonth() - 12);

        const salesData = await Sell.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: lastYear,
                        $lte: now
                    }
                }
            },
            { $unwind: "$products" },
            {
                $group: {
                    _id: null,
                    totalSalesAmount: {
                        $sum: { $ifNull: ["$products.totalAmount", 0] } // ✅ direct use
                    },
                    totalSoldQuantity: {
                        $sum: { $ifNull: ["$products.quantity", 0] }
                    }
                }
            }
        ]);

        const totalSales = salesData[0]?.totalSalesAmount || 0;
        const totalSoldQuantity = salesData[0]?.totalSoldQuantity || 0;

        return res.status(200).json({
            message: "Dashboard data fetch successfully", inventoryValue, inventory, totalSales, stockMap, totalOtherQuantity,
            expiringSoonCount, h1Compliance, totalH1Quantity, totalHQuantity, totalXQuantity, marginAnalysis, supplierData, success: true
        })

    } catch (err) {
        console.log(err)
        return res.status(200).json({ message: 'Server Error' });
    }
}
const sellMedicine = async (req, res) => {
    const { pharId, prescriptionId, sellId, hospitalId, ptMob, ptName, dtMob, dtName, paymentStatus, note, paymentMethod, deliveryType } = req.body;
    const prescriptionFile = req.files?.['prescriptionFile']?.[0]?.path;
    const products = JSON.parse(req.body.products || "[]");
    let patientId = req.body.patientId
    let doctorId = req.body.doctorId || null
    let ptData;
    try {
        const paymentData = await PaymentInfo.findOne({ userId: pharId || hospitalId })
        const userId = pharId || hospitalId
        const pharmacy = await User.findById(userId);
        if (!pharmacy) {
            return res.status(200).json({ success: false, message: "User not found" });
        }
        if (patientId) {
            // Existing patient by ID
            const patient = await User.findById(patientId);
            if (!patient) {
                return res.status(400).json({ success: false, message: "Invalid Patient ID" });
            }
        } else {
            // Find by mobile
            ptData = await User.findOne({ contactNumber: ptMob });

            if (ptData) {
                patientId = ptData._id;
            } else {
                // Create new patient
                const rawPassword = ptMob.slice(-4) + "@123";
                const passwordHash = await bcrypt.hash(rawPassword, 10);
                const user = new User({
                    name: ptName,
                    role: "patient",
                    passwordHash,
                    created_by: pharmacy.role,
                    created_by_id: pharmacy._id
                });
                await user.save({ validateBeforeSave: false });

                const patient = new Patient({
                    userId: user._id,
                    name: ptName,
                    contactNumber: ptMob
                });

                await patient.save({ validateBeforeSave: false });
                user.patientId = patient._id
                await user.save()
                patientId = user._id;
            }
        }
        if (doctorId) {
            // Doctor ID provided → validate
            const doctor = await User.findById(doctorId);
            if (!doctor) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid Doctor ID"
                });
            }
        }
        // Doctor ID nahi hai BUT name + mobile dono aaye hain
        else if (dtName && dtMob) {
            let dtData = await Doctor.findOne({ contactNumber: dtMob });

            if (dtData) {
                doctorId = dtData.userId;
            } else {
                const rawPassword = dtMob.slice(-4) + "@123";
                const passwordHash = await bcrypt.hash(rawPassword, 10);

                const user = new User({
                    name: dtName,
                    role: "doctor",
                    passwordHash,
                    created_by: pharmacy.role,
                    created_by_id: pharmacy._id
                });
                await user.save({ validateBeforeSave: false });


                const doctor = new Doctor({
                    userId: user._id,
                    name: dtName,
                    contactNumber: dtMob
                });
                await doctor.save({ validateBeforeSave: false })
                user.doctorId = doctor._id
                await user.save()
                doctorId = user._id;
            }
        }
        let data = {
            patientId, doctorId, prescriptionId, products, paymentStatus, note, paymentInfoId: paymentData?._id || null,
            paymentMethod, deliveryType
        }
        if (sellId) {
            data.sellId = sellId
        }
        if (prescriptionFile) {
            data.prescriptionFile = prescriptionFile
        }
        if (pharmacy.role == 'hospital') {
            data.hospitalId = hospitalId
        } else {
            data.pharId = pharId
        }

        const isSell = sellId ? await Sell.findById(sellId) : null;

        if (isSell) {
            await updateInventoryStock(isSell.products, "increase");

            // 2️⃣ New stock check
            const stockCheck = await checkStockAvailability(userId, products);
            if (!stockCheck.success) {
                // rollback old stock
                await updateInventoryStock(isSell.products, "decrease");
                return res.status(200).json(stockCheck);
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
                    products, paymentMethod, deliveryType,
                    prescriptionFile: prescriptionFile || isSell.prescriptionFile
                },
                { new: true }
            );
            if (id && req.user.type == "pharmacy") {
                if (req.user.loginUser) {
                    await PharmacyAudit.create({ pharId: id, actionUser: req.user.loginUser, note: `A sell reocrd was updated  ${ptData?.name}.` })
                } else {
                    await PharmacyAudit.create({ pharId: id, note: `A sell record was updated for patient  ${ptData?.name}.` })
                }
            }
            if (id && req.user.type == "hospital") {
                if (req.user.loginUser) {
                    await HospitalAudit.create({ hospitalId, actionUser: req?.user?.loginUser, note: `A sell record was updated for patient ${ptData?.name}.` })
                } else {
                    await HospitalAudit.create({ hospitalId, note: `A sell record was updated for patient ${ptData?.name}.` })
                }
            }

            return res.status(200).json({ success: true, message: "Sell updated successfully" });
        }

        const stockCheck = await checkStockAvailability(userId, products);
        if (!stockCheck.success) {
            return res.status(200).json(stockCheck);
        }

        await updateInventoryStock(products, "decrease");

        await Sell.create(data);
        const id = req.user.id || req.user.userId
        if (id && req.user.type == "pharmacy") {
            if (req.user.loginUser) {
                await PharmacyAudit.create({ pharId: id, actionUser: req.user.loginUser, note: `A new sell was created  ${ptData?.name}.` })
            } else {
                await PharmacyAudit.create({ pharId: id, note: `A new sell was created for patient  ${ptData?.name}.` })
            }
        }
        if (id && req.user.type == "hospital") {
            if (req.user.loginUser) {
                await HospitalAudit.create({ hospitalId, actionUser: req?.user?.loginUser, note: `A new sell record was created for patient ${ptData?.name}.` })
            } else if(hospitalId) {
                await HospitalAudit.create({ hospitalId, note: `A new sell record was created for patient ${ptData?.name}.` })
            }
        }

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
    const id = req.user.id || req.user.userId;
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

        const skip = (page - 1) * limit;

        let matchStage = {
            $or: [
                { pharId: new mongoose.Types.ObjectId(id) },
                { hospitalId: new mongoose.Types.ObjectId(id) }
            ]
        };

        // 📅 Date filter
        if (startDate && endDate && startDate) {
            matchStage.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        // 💊 Inventory filter
        if (inventoryId) {
            matchStage["products.inventoryId"] = new mongoose.Types.ObjectId(inventoryId);
        }
        const sells = await Sell.aggregate([
            { $match: matchStage },

            // Lookup patient
            {
                $lookup: {
                    from: "users",
                    let: { patientId: "$patientId" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$_id", "$$patientId"] }
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                nh12: 1
                            }
                        }
                    ],
                    as: "patient"
                }
            },
            { $unwind: { path: "$patient", preserveNullAndEmptyArrays: true } },

            // Lookup doctor
            {
                $lookup: {
                    from: "users",
                    let: { doctorId: "$doctorId" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$_id", "$$doctorId"] }
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                nh12: 1
                            }
                        }
                    ],
                    as: "doctor"
                }
            },
            { $unwind: { path: "$doctor", preserveNullAndEmptyArrays: true } },

            // Lookup inventory details (all inventories related to any product)
            {
                $lookup: {
                    from: "inventories",
                    localField: "products.inventoryId",
                    foreignField: "_id",
                    as: "inventoryDetails"
                }
            },

            // Map inventory details into each product item
            {
                $addFields: {
                    products: {
                        $map: {
                            input: "$products",
                            as: "prod",
                            in: {
                                $mergeObjects: [
                                    "$$prod",
                                    {
                                        inventoryDetail: {
                                            $arrayElemAt: [
                                                {
                                                    $filter: {
                                                        input: "$inventoryDetails",
                                                        as: "inv",
                                                        cond: { $eq: ["$$inv._id", "$$prod.inventoryId"] }
                                                    }
                                                },
                                                0
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            },

            // Optional: Remove the separate inventoryDetails array (if you want)
            {
                $project: {
                    inventoryDetails: 0
                }
            },

            // Search filter if provided
            ...(search ? [{
                $match: {
                    $or: [
                        { "patient.name": { $regex: search, $options: "i" } },
                        { "patient.nh12": { $regex: search, $options: "i" } },
                        { "doctor.name": { $regex: search, $options: "i" } },
                        { "doctor.nh12": { $regex: search, $options: "i" } }
                    ]
                }
            }] : []),

            { $sort: { createdAt: sort === "newest" ? -1 : 1 } },
            { $skip: skip },
            { $limit: Number(limit) }
        ]);


        const total = await Sell.countDocuments(matchStage);

        res.status(200).json({
            success: true,
            message: "Sell list fetched successfully",
            total,
            page: Number(page),
            totalPages: Math.ceil(total / limit),
            data: sells
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getSellData = async (req, res) => {
    try {
        const sellId = req.params.id;
        const sell = await Sell.findById(sellId).populate({ path: "patientId", select: "name nh12", populate: { path: "patientId" } })
            .populate({ path: "doctorId", select: "name nh12", populate: { path: "doctorId" } }).populate('paymentInfoId')
            .populate({ path: "products.inventoryId", select: "medicineName batchNumber schedule salePrice" });
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
        const sell = await Sell.findOne({
            _id: sellId, $or: [
                { pharId: req.user.userId },
                { hospitalId: req.user.userId }
            ]
        });
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
const getPatientPrescriptionData = async (req, res) => {
    const userId = req.params.id
    try {
        let user;
        if (userId?.length < 24) {
            user = await User.findOne({ nh12: userId, role: 'patient' }).select('-passwordHash').lean();
        } else {
            user = await User.findById(userId).select('-passwordHash').lean();
        }
        if (!user) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }
        const fullId = await userId.length < 24 ? user._id : userId
        const patient = await Patient.findById(user.patientId).lean()
        const medicalHistory = await MedicalHistory.findOne({ userId: fullId }).sort({ createdAt: -1 })
        const demographic = await PatientDemographic.findOne({ userId: fullId }).sort({ createdAt: -1 })
        const prescription = await Prescriptions.find({ patientId: fullId }).sort({ createdAt: -1 })
            .populate({ path: 'doctorId', select: 'name nh12 ', populate: { path: 'doctorId', select: 'profileImage' } })
            .populate({ path: 'appointmentId', select: 'customId' })
        const patientPrescription = await PatientPrescriptions.findOne({ userId: fullId }).sort({ createdAt: -1 })


        return res.status(200).json({
            success: true, user:
                { ...user, ...patient }, patientPrescription,
            demographic, prescription, medicalHistory
        });
    } catch (err) {
        console.log(err)
        return res.status(500).json({ success: false, message: err.message });
    }
};

const patientHospitalAllotment = async (req, res) => {
    const { patientId, hospitalId } = req.params
    try {
        const isUser = await User.findOne({ _id: patientId, role: "patient" });
        if (!isUser) {
            return res.status(200).json({ message: "Patient not found" })
        }
        const isHospital = await User.findOne({ _id: hospitalId, role: "hospital" });
        if (!isHospital) {
            return res.status(200).json({ message: "Hospital not found" })
        }
        const allotments = await BedAllotment.find({ patientId, hospitalId })
            .populate({ path: "patientId", select: "name email unique_id", populate: { path: "patientId", select: "contactNumber profileImage" } })
            .populate("dischargeId", "createdAt").populate("primaryDoctorId", "unique_id name")
            .populate({
                path: "bedId",
                populate: [
                    { path: "floorId", select: "floorName" },
                    { path: "departmentId", select: "departmentName" },
                    { path: "roomId", select: "roomName" }
                ]
            }).sort({ createdAt: -1 });

        return res.status(200).json({ success: true, message: "Patient allotment fetched", allotments });
    } catch (err) {
        console.error("deleteReturn:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};
export const addPatient = async (req, res) => {
    const { name, dob, gender, contactNumber, email, address, countryId, stateId, cityId, pinCode, contact } = req.body
    const id = req.user.id || req.user.userId
    try {
        const doctorId = req.user._id;
        const data = req.body;
        if (!name || !dob || !gender || !contactNumber) {
            return res.status(400).json({
                success: false,
                message: "Required fields missing"
            });
        }
        const isExist = await User.findOne({ email }) || await User.findOne({ contactNumber });
        if (isExist) {
            return res.status(200).json({
                success: false,
                message: "Patient already exists"
            });
        }
        // ✅ CREATE PATIENT
        const patient = await Patient.create({ name, gender, contactNumber, email });
        if (patient) {
            const rawPassword = contactNumber.slice(-4) + "@123";
            const passwordHash = await bcrypt.hash(rawPassword, 10);
            const pt = await User.create({
                name, contactNumber, patientId: patient._id, email, role: 'patient',
                created_by: "pharmacy", created_by_id: id, passwordHash
            })
            await PatientDemographic.create({ userId: pt._id, dob, contact, address, pinCode, countryId, stateId, cityId })
            await Patient.findByIdAndUpdate(patient._id, { userId: pt._id }, { new: true })
            return res.status(200).json({
                success: true,
                message: "Patient added successfully",
                data: pt
            });
        }
        return res.status(200).json({
            success: false,
            message: "Patient not added ",
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
export const getPrescriptionMedicine = async (req, res) => {
    const id = req.user.id || req.user.userId;
    const { medicineNames } = req.body;

    try {
        if (!medicineNames || medicineNames.length === 0) {
            return res.status(400).json({
                message: "medicineNames array is required",
                success: false
            });
        }

        const medicines = await Inventory.find({
            medicineName: {
                $in: medicineNames.map(name => new RegExp(`^${name}$`, 'i')) // ✅ case-insensitive
            }, expDate: { $gt: new Date() },
            $or: [
                { pharId: id },
                { hospitalId: id }
            ], status: "Approved"
        });

        if (medicines.length > 0) {
            return res.status(200).json({
                message: "Medicine found",
                success: true,
                data: medicines
            });
        } else {
            return res.status(404).json({
                message: "No medicine found related to the prescriptions",
                success: false
            });
        }
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server error",
            success: false
        });
    }
};
export const getAuditLog = async (req, res) => {
    try {
        const pharId = req.user.id || req.user.userId;

        // Get page & limit from query (defaults)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const skip = (page - 1) * limit;

        // Fetch paginated data
        const audit = await PharmacyAudit
            .find({ pharId }).populate('actionUser')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Total count for frontend pagination
        const total = await PharmacyAudit.countDocuments({ pharId });

        res.status(200).json({
            message: 'Audit fetched successfully',
            data: audit,
            success: true,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: error.message });
    }
};
export const getEODSale = async (req, res) => {
    const id = req.user.id || req.user.userId;
    const userId = typeof id === "string"
        ? new mongoose.Types.ObjectId(id)
        : id;
    try {
        const startOfDay = new Date();
        startOfDay.setUTCHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setUTCHours(23, 59, 59, 999);

        const result = await Sell.aggregate([
            {
                $match: {
                    $or: [
                        { pharId: userId },
                        { hospitalId: userId }
                    ],
                    createdAt: {
                        $gte: startOfDay,
                        $lte: endOfDay
                    }
                }
            },
            { $unwind: "$products" }, // 🔥 important
            {
                $group: {
                    _id: null,

                    totalSales: {
                        $sum: { $ifNull: ["$products.totalAmount", 0] }
                    },

                    cashSales: {
                        $sum: {
                            $cond: [
                                { $eq: ["$paymentMethod", "CASH"] },
                                { $ifNull: ["$products.totalAmount", 0] },
                                0
                            ]
                        }
                    },

                    cardSales: {
                        $sum: {
                            $cond: [
                                { $eq: ["$paymentMethod", "CARD"] },
                                { $ifNull: ["$products.totalAmount", 0] },
                                0
                            ]
                        }
                    },

                    onlineSales: {
                        $sum: {
                            $cond: [
                                { $eq: ["$paymentMethod", "ONLINE"] },
                                { $ifNull: ["$products.totalAmount", 0] },
                                0
                            ]
                        }
                    },

                    pendingAmount: {
                        $sum: {
                            $cond: [
                                { $eq: ["$paymentStatus", "Pending"] },
                                { $ifNull: ["$products.totalAmount", 0] },
                                0
                            ]
                        }
                    }
                }
            }
        ]);
        const data = result[0] || {
            totalSales: 0,
            cashSales: 0,
            cardSales: 0,
            onlineSales: 0,
            pendingAmount: 0
        };

        return res.status(200).json({
            success: true,
            message: "EOD sales fetched",
            data
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error?.message
        });
    }
};

export const customerReturn = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const id = req.user.id || req.user.userId;
        const { sellId, returnProducts } = req.body;

        // 🔹 Validation: sellId exists
        if (!sellId) {
            throw new Error("Sell ID is required");
        }

        // 🔹 Validation: returnProducts is not empty
        if (!returnProducts || !Array.isArray(returnProducts) || returnProducts.length === 0) {
            throw new Error("No return products provided");
        }

        const sell = await Sell.findOne({
            _id: sellId,
            $or: [{ pharId: id }, { hospitalId: id }]
        }).session(session);
        const ptData=await User.findById(sell.patientId)
        if (!sell) {
            throw new Error("Sell record not found");
        }

        // 🔹 Validation: Ensure return quantities do not exceed sold quantities
        for (const item of returnProducts) {
            const soldProduct = sell.products.find(p => p.inventoryId.toString() === item.inventoryId);

            if (!soldProduct) {
                throw new Error(`Product with ID ${item.inventoryId} not found in this sale`);
            }

            if (item.quantity <= 0) {
                throw new Error(`Return quantity must be greater than 0 for product ${item.inventoryId}`);
            }

            if (item.quantity > soldProduct.quantity) {
                throw new Error(
                    `Return quantity (${item.quantity}) exceeds sold quantity (${soldProduct.quantity}) for product ${item.inventoryId}`
                );
            }
        }

        // 🔥 Update inventory
        for (const item of returnProducts) {
            const filter = sell.pharId
                ? { _id: item.inventoryId, pharId: sell.pharId }
                : { _id: item.inventoryId, hospitalId: sell.hospitalId };

            const updated = await Inventory.findOneAndUpdate(
                filter,
                {
                    $inc: {
                        quantity: item.quantity,     // ➕ add back to stock
                        sellCount: -item.quantity   // ➖ reduce sold count
                    }
                },
                { new: true, session }
            );

            if (!updated) {
                throw new Error(`Inventory not found for product ${item.inventoryId}`);
            }
        }

        // ✅ Save returnProducts to Sell document
        const existingReturnProducts = sell.returnProducts || [];

        await Sell.findByIdAndUpdate(
            sellId,
            { returnProducts: [...existingReturnProducts, ...returnProducts] },
            { new: true, session }
        );
        if (id && req.user.type == "pharmacy") {
            if (req.user.loginUser) {
                await PharmacyAudit.create({ pharId: id, actionUser: req.user.loginUser, note: `A return record was updated for patient ${ptData?.name}.` })
            } else {
                await PharmacyAudit.create({ pharId: id, note: `A return was created for patient ${ptData?.name}.` })
            }
        }
        if (id && req.user.type == "hospital") {
            if (req.user.loginUser) {
                await HospitalAudit.create({ hospitalId, actionUser: req?.user?.loginUser, note: `A return record was created for patient ${ptData?.name}.` })
            } else {
                await HospitalAudit.create({ hospitalId, note: `A return was created for patient ${ptData?.name}.` })
            }
        }

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({
            success: true,
            message: "Return updated successfully"
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export { deleteStaffData, pharStaff, pharStaffAction, pharStaffData, saveEmpAccess, saveEmpProfessional, deleteSubEmpProffesional, saveEmpEmployement, savePharStaff }
export {
    getAllMedicineRequestsForAdmin, getMedicineRequestsList, getPODetails, getPOList, getReturnById, getSupplier, getSupplierById,
    addInventry, inventoryUpdate, inventoryDelete, inventoryGetById, inventoryList, changeRequestStatus, sendMedicineRequest,
    addSupplier, updatePO, updateSupplier, deleteSupplier, createReturn, listReturns, completeReturn, updateReturn, deletePO, deleteReturn,
    createPO, receivePO, addPharPermission, updatePharPermission, deletePharPermission, getAllPharPermission, medicineData, pharDashboardData,
    sellMedicine, getSellMedicine, deleteSellData, getSellData, getPatientPrescriptionData, patientHospitalAllotment
}
