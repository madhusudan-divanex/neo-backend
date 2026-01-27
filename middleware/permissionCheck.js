import Permission from "../models/Permission.js";

export const checkPermission = (module, action) => {
  return async (req, res, next) => {

    // ✅ OWNER → FULL ACCESS
    if (req.user.isOwner === true) {
      return next();
    }

    // ❌ STAFF without permissionId
    if (!req.user.permissionId) {
      return res.status(200).json({ message: "Permission denied" ,success:false});
    }

    const permission = await Permission.findById(req.user.permissionId);

    if (!permission) {
      return res.status(200).json({ message: "Permission not found" });
    }

    const panelType = req.user.type; // lab / doctor / hospital / pharmacy

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
