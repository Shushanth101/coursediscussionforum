import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

export const protectRoute = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const result = await pool.query('SELECT user_id, full_name, email, role FROM users WHERE user_id = $1', [decoded.userId]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: 'Not authorized, token failed or expired' });
  }
};
