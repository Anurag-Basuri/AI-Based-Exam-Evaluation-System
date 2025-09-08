import jwt from 'jsonwebtoken';
import { promisify } from 'util';

import Student from '../models/student.model.js';
import Teacher from '../models/teacher.model.js';

const verifyAsync = promisify(jwt.verify);

// Role constants
export const ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher'
};

// Role-based authorization middleware
export const authorize = (...roles) => {
  return (req, res, next) => {
    // Debug log
    console.log('Authorization check - User:', {
      userId: req.user?._id,
      userRole: req.user?.role,
      requiredRoles: roles,
      headers: req.headers
    });

    if (!req.user) {
      console.error('No user attached to request');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Normalize roles for case-insensitive comparison
    const userRole = req.user.role?.toLowerCase();
    const hasPermission = roles.some(role => 
      role.toLowerCase() === userRole
    );

    if (!hasPermission) {
      console.error(`Access denied. User role: ${userRole}, Required: ${roles.join(', ')}`);
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action',
        debug: {
          userRole,
          requiredRoles: roles
        }
      });
    }

    console.log('Authorization granted for role:', userRole);
    next();
  };
};

// Middleware to verify JWT and attach user info
// In authmiddleware.js, update the verifyToken function:

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No authorization token provided'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization header format'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      let user = null;
      if (decoded.role === ROLES.STUDENT) {
        user = await Student.findById(decoded.id);
      } else if (decoded.role === ROLES.TEACHER) {
        user = await Teacher.findById(decoded.id);
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      // Attach user with role to request
      req.user = {
        ...user.toObject(),
        role: decoded.role
      };

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Role-based access middleware
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.role || !roles.includes(req.role)) {
      return res.status(403).json({ 
        success: false,
        message: 'Forbidden: Insufficient permissions' 
      });
    }
    next();
  };
};

// Check if user is the owner of the resource
export const isOwner = (model, idField = '_id') => {
  return async (req, res, next) => {
    try {
      const doc = await model.findById(req.params[idField]);
      
      if (!doc) {
        return res.status(404).json({ 
          success: false,
          message: 'Resource not found' 
        });
      }

      if (doc.createdBy && doc.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ 
          success: false,
          message: 'Not authorized to access this resource' 
        });
      }

      req.doc = doc;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default verifyToken;