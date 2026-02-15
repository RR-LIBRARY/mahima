import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';

const JWT_SECRET = process.env.JWT_SECRET || 'mahima-secret-key-change-in-production';

// Generate JWT token
export const generateToken = (userId, email, role = 'student') => {
  return jwt.sign(
    { userId, email, role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Verify JWT token middleware
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.split(' ')[1];

    // Try to verify as Supabase token first
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (user && !error) {
      // Supabase token is valid
      req.user = { 
        userId: user.id, 
        email: user.email,
        isSupabaseAuth: true 
      };
      
      // Fetch user role from user_roles table
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      req.user.role = roleData?.role || 'student';
      return next();
    }

    // Try as custom JWT
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role || 'student',
        isSupabaseAuth: false
      };
      return next();
    } catch (jwtError) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

// Check if user is admin
export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      error: 'Admin access required',
      code: 'ADMIN_REQUIRED'
    });
  }
  next();
};

// Check if user is admin or teacher
export const requireAdminOrTeacher = (req, res, next) => {
  if (!['admin', 'teacher'].includes(req.user?.role)) {
    return res.status(403).json({ 
      success: false, 
      error: 'Admin or teacher access required',
      code: 'STAFF_REQUIRED'
    });
  }
  next();
};

export default { generateToken, verifyToken, requireAdmin, requireAdminOrTeacher };
