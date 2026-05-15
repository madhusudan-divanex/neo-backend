import Permission from "../models/Permission.js";
import jwt from 'jsonwebtoken';
export const checkPermission = (module, action) => {
  return async (req, res, next) => {
    const auth = req.headers.authorization || req.header('Token');

    const token = req.header('Token') ? auth : auth.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ OWNER → FULL ACCESS
    if (payload.isOwner === true) {
      return next();
    }

    // ❌ STAFF without permissionId
    if (!payload.permissionId) {
      return res.status(200).json({ message: "Permission denied", success: false });
    }

    const permission = await Permission.findById(payload.permissionId);

    if (!permission) {
      return res.status(200).json({ message: "Permission not found" });
    }

    const panelType = payload.type; // lab / doctor / hospital / pharmacy

    // 🔍 Check permission
    const hasPermission =
      permission?.[panelType]?.[module]?.[action] === true ||
      permission?.[panelType]?.[action] === true;

    if (!hasPermission) {
      return res.status(200).json({ message: "Permission denied" });
    }

    next();
  };
};
