import express from "express";
import auth from "../../middleware/auth.js";
import {
  getLocations, createLocation,
  getItems, createItem, getInventoryKPIs,
  createGRN, getGRNs, closeGRN,
  issueToPatient, createIndent, getIndents, approveIndent,
  adjustStock, getAssets, createAsset, getStockLedger
} from "../../controller/Hospital/inventory.controller.js";

const router = express.Router();

// Dashboard
router.get("/kpis",                  auth, getInventoryKPIs);

// Locations
router.get("/locations",             auth, getLocations);
router.post("/locations",            auth, createLocation);

// Items
router.get("/items",                 auth, getItems);
router.post("/items",                auth, createItem);

// GRN
router.get("/grn",                   auth, getGRNs);
router.post("/grn",                  auth, createGRN);
router.put("/grn/:id/close",         auth, closeGRN);

// Indents
router.get("/indents",               auth, getIndents);
router.post("/indents",              auth, createIndent);
router.put("/indents/:id/status",    auth, approveIndent);

// Issue & Adjust
router.post("/issue-patient",        auth, issueToPatient);
router.post("/adjust",               auth, adjustStock);

// Ledger
router.get("/ledger",                auth, getStockLedger);

// Assets
router.get("/assets",                auth, getAssets);
router.post("/assets",               auth, createAsset);

export default router;
