import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Inventory from '../models/Pharmacy/inventory.model.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const safeUnlink = (filePath) => {
  try {
    // Convert relative path to absolute
    const absolutePath = path.join(__dirname, '..', filePath);


    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      console.log('File deleted successfully');
    } else {
      console.warn('File not found:', absolutePath);
    }
  } catch (err) {
    console.error('Error deleting file:', filePath, err);
  }
};
const updateInventoryStock = async (products, type = "decrease") => {
    for (let item of products) {
        const inventory = await Inventory.findById(item.inventoryId);
        if (type === "decrease") {
            inventory.quantity -= Number(item.quantity);
            inventory.sellCount +=Number(item.quantity);
        } else {
            inventory.quantity += Number(item.quantity);
            inventory.sellCount-=Number(item.quantity);

        }
        await inventory.save();
    }
};
const checkStockAvailability = async (pharId,products) => {
    for (let item of products) {
        const inventory = await Inventory.findOne({ _id: item.inventoryId, pharId });
        if (!inventory) {
            return { success: false, message: "Inventory not found" };
        }
        if (inventory.quantity < item.quantity) {
            return {
                success: false,
                message: `Insufficient stock for ${inventory._id}`
            };
        }
    }
    return { success: true };
};
const capitalizeFirst = (str = "") =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

export { updateInventoryStock, checkStockAvailability,capitalizeFirst };
export default safeUnlink;
