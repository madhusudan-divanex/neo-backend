// middleware/auth.js
import jwt from 'jsonwebtoken';
import User from '../models/Hospital/User.js';

export default async function auth(req, res, next) {
  const auth = req.headers.authorization || req.header('Token');
  if (!auth) return res.status(401).json({ message: 'No token' });
  const token = req.header('Token')?auth: auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id?payload.id:payload.user);
    if (!user) return res.status(401).json({ message: 'Invalid token' });
    req.user = user;
    next();
  } catch (err) {
    console.log(err)
    return res.status(401).json({ message: 'Token error', error: err.message });
  }
};
