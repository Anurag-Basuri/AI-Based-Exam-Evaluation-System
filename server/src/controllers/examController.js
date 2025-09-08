import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import Exam from '../models/exam.model.js';

export const createExam = asyncHandler(async (req, res) => {
  const requiredFields = ['title', 'description', 'date', 'startTime', 'endTime', 'durationMinutes', 'year', 'semester', 'batch', 'section', 'department'];
  const missingFields = requiredFields.filter(field => !req.body[field]);
  
  if (missingFields.length > 0) {
    throw ApiError.BadRequest(`Missing required fields: ${missingFields.join(', ')}`);
  }

  // Remove accessCode if it exists in the request
  if (req.body.accessCode !== undefined) {
    delete req.body.accessCode;
  }

  const exam = new Exam({
    ...req.body,
    createdBy: req.user?._id
  });

  await exam.save();
  new ApiResponse(res).success(exam, 'Exam created successfully');
});
