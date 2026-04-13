// middleware/admin.js
export default async function admin(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'unauth' });
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'admin only' });
  next();
};
