/**
 * adminAuth middleware — reads admin from User table (role: "admin")
 * Token contains: { id, role: "admin" }
 */
import jwt from "jsonwebtoken";
import User from "../models/Hospital/User.js";

const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const legacyToken = req.headers.token; // for old routes using Token header

    const rawToken = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : legacyToken;

    if (!rawToken) {
      return res.status(401).json({ message: "Unauthorized — no token" });
    }

    const decoded = jwt.verify(rawToken, process.env.JWT_SECRET);

    // Look in User table with role admin
    const admin = await User.findOne({ _id: decoded.id, role: "admin" });

    if (!admin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    req.admin = admin;  // full User doc
    req.user  = admin;  // some controllers use req.user
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default adminAuth;
