import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import jwt from 'jsonwebtoken';
import Student from '../models/student.model.js';
import Teacher from '../models/teacher.model.js';
import { ROLES } from '../middlewares/authmiddleware.js';

// Helper function to generate JWT token
const generateToken = (user, role) => {
    return jwt.sign(
      { id: user._id, email: user.email, role: role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );
};

// Student Registration
export const registerStudent = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, rollNumber, registrationID, ...otherData } = req.body;

  const requiredFields = ['email', 'password', 'firstName', 'lastName', 'rollNumber', 'registrationID'];
  const missingFields = requiredFields.filter(field => !req.body[field]);
  if (missingFields.length > 0) {
    throw ApiError.BadRequest(`Missing required fields: ${missingFields.join(', ')}`);
  }

  const existingStudent = await Student.findOne({ $or: [{ email: email.toLowerCase() }, { rollNumber: rollNumber.toUpperCase() }, { registrationID }] });
  if (existingStudent) {
    const conflictField = existingStudent.email === email.toLowerCase() ? 'email' : existingStudent.rollNumber === rollNumber.toUpperCase() ? 'rollNumber' : 'registrationID';
    throw ApiError.BadRequest(`${conflictField} already in use`);
  }

  const student = await Student.create({ email: email.toLowerCase(), password, firstName, lastName, rollNumber: rollNumber.toUpperCase(), registrationID, ...otherData });
  const token = generateToken(student, ROLES.STUDENT);
  
  const studentResponse = student.toObject();
  delete studentResponse.password;
  
  return new ApiResponse(res).success(201, { user: { ...studentResponse, role: ROLES.STUDENT }, token }, 'Student registration successful');
});

// Teacher Registration
export const registerTeacher = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, employeeID, ...otherData } = req.body;
  if (!email || !password || !firstName || !lastName || !employeeID) {
    throw ApiError.BadRequest('All required fields must be provided');
  }

  const existingTeacher = await Teacher.findOne({ $or: [{ email: email.toLowerCase() }, { employeeID: employeeID.toUpperCase() }] });
  if (existingTeacher) {
    throw ApiError.BadRequest('Email or Employee ID already in use');
  }

  const teacher = await Teacher.create({ email: email.toLowerCase(), password, firstName, lastName, employeeID: employeeID.toUpperCase(), ...otherData });
  const token = generateToken(teacher, ROLES.TEACHER);

  const teacherResponse = teacher.toObject();
  delete teacherResponse.password;
  
  return new ApiResponse(res).success(201, { user: { ...teacherResponse, role: ROLES.TEACHER }, token }, 'Teacher registration successful');
});

// Login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required');

  let user = await Student.findOne({ email: email.toLowerCase() }).select('+password');
  let userRole = 'student';

  if (!user) {
    user = await Teacher.findOne({ email: email.toLowerCase() }).select('+password');
    userRole = 'teacher';
  }

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = generateToken(user, userRole === 'student' ? ROLES.STUDENT : ROLES.TEACHER);
  const userObj = user.toObject();
  delete userObj.password;
  userObj.role = userRole;

  return new ApiResponse(res).success(200, { user: userObj, token: token }, 'Login successful');
});

// Get current user
export const getMe = asyncHandler(async (req, res) => {
  // ✅ FIXED: The user object from verifyToken middleware already has the role.
  // No need to access req.role separately.
  const userWithRole = req.user;
  
  // The user object is already a plain object from the middleware
  delete userWithRole.password;

  return new ApiResponse(res).success(200, { user: userWithRole }, 'User data retrieved successfully');
});
