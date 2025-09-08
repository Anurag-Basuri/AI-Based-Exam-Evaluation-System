import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import Exam from '../models/exam.model.js';
import Question from '../models/question.model.js';
import Submission from '../models/submission.model.js';
import fetch from 'node-fetch';

export const createExamWithQuestions = asyncHandler(async (req, res) => {
    const { examDetails, questions } = req.body;
    if (!examDetails || !questions || !Array.isArray(questions) || questions.length === 0) {
        throw new ApiError(400, 'Exam details and at least one question are required.');
    }

    const newExam = await Exam.create({ ...examDetails, createdBy: req.user._id });
    
    const questionDocs = questions.map(q => ({ ...q, exam: newExam._id, createdBy: req.user._id }));
    const createdQuestions = await Question.insertMany(questionDocs);

    // ✅ ADDED: Calculate the total marks by summing up marks from all questions.
    const totalMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

    // ✅ MODIFIED: Update the exam with the question IDs and the calculated total marks.
    newExam.questions = createdQuestions.map(q => q._id);
    newExam.totalMarks = totalMarks;
    await newExam.save();

    const populatedExam = await Exam.findById(newExam._id).populate('questions');
    return new ApiResponse(res).success(201, populatedExam, 'Exam created successfully');
});

// ... (the rest of your teacherController.js file remains the same)
export const getTeacherExams = asyncHandler(async (req, res) => {
    const exams = await Exam.find({ createdBy: req.user._id }).select('-questions').sort({ createdAt: -1 });
    return new ApiResponse(res).success(200, exams, 'Exams fetched successfully');
});

export const getExamDetails = asyncHandler(async (req, res) => {
    const { examId } = req.params;
    const exam = await Exam.findOne({ _id: examId, createdBy: req.user._id }).populate('questions');
    if (!exam) throw new ApiError(404, 'Exam not found or you are not authorized.');
    return new ApiResponse(res).success(200, exam, 'Exam details fetched successfully.');
});

export const deleteExam = asyncHandler(async (req, res) => {
    const { examId } = req.params;
    const exam = await Exam.findOne({ _id: examId, createdBy: req.user._id });
    if (!exam) throw new ApiError(404, 'Exam not found or you are not authorized.');
    await Question.deleteMany({ exam: examId });
    await Exam.findByIdAndDelete(examId);
    return new ApiResponse(res).success(200, { deletedExamId: examId }, 'Exam deleted successfully.');
});

export const getExamSubmissions = asyncHandler(async (req, res) => {
    const { examId } = req.params;
    const exam = await Exam.findOne({ _id: examId, createdBy: req.user._id });
    if (!exam) {
        throw new ApiError(404, 'Exam not found or you are not authorized to view its submissions.');
    }
    const submissions = await Submission.find({ exam: examId })
        .populate('student', 'firstName lastName rollNumber')
        .populate({
            path: 'exam',
            populate: {
                path: 'questions'
            }
        });
    return new ApiResponse(res).success(200, submissions, 'Submissions fetched successfully.');
});

export const evaluateAnswerWithAI = asyncHandler(async (req, res) => {
    const { submissionId, questionId } = req.body;

    if (!submissionId || !questionId) {
        throw new ApiError(400, 'Submission ID and Question ID are required.');
    }

    const submission = await Submission.findById(submissionId).populate({
        path: 'exam',
        populate: {
            path: 'questions'
        }
    });

    if (!submission) {
        throw new ApiError(404, 'Submission not found.');
    }

    const question = submission.exam.questions.find(q => q._id.toString() === questionId);
    const studentAnswerObject = submission.answers.find(ans => ans.question.toString() === questionId);

    if (!question || !studentAnswerObject) {
        throw new ApiError(404, 'Question or Answer not found within this submission.');
    }
    
    const studentAnswerText = studentAnswerObject.response;

    let prompt;
    const hasModelAnswer = question.modelAnswer && question.modelAnswer.trim() !== '';
    const outputFormat = 'Provide your response in a strict JSON format with two keys: "marks" (a number out of ' + question.marks + ') and "feedback" (a string in markdown format explaining the evaluation).';

    if (hasModelAnswer) {
        prompt = `You are an expert examiner. The question is worth ${question.marks} marks. Original Question: "${question.text}". Model Answer: "${question.modelAnswer}". Student's Answer: "${studentAnswerText}". Evaluate the student's answer based on the model answer. ${outputFormat}`;
    } else {
        prompt = `You are an expert examiner. The question is worth ${question.marks} marks. The Question is: "${question.text}". The Student's Answer is: "${studentAnswerText}". Based on your expert knowledge, evaluate the student's answer. ${outputFormat}`;
    }

    let aiResponse;
    try {
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            throw new ApiError(500, 'GEMINI_API_KEY is not configured on the server.');
        }
        
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Gemini API Error Response:", errorBody);
            throw new ApiError(500, `Error from Gemini API: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0].content.parts[0].text) {
            throw new ApiError(500, "Received an invalid response structure from Gemini API.");
        }

        const rawText = data.candidates[0].content.parts[0].text;
        
        try {
            const jsonText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            aiResponse = JSON.parse(jsonText);
        } catch (parseError) {
            console.error("Failed to parse JSON from Gemini response:", parseError);
            aiResponse = {
                marks: 0,
                feedback: `AI response could not be parsed correctly. Raw AI output: ${rawText}`
            };
        }

    } catch (error) {
        console.error("Gemini API Call Error:", error);
        throw new ApiError(500, "Failed to get a response from the AI evaluation service.");
    }

    studentAnswerObject.marksAwarded = aiResponse.marks;
    studentAnswerObject.feedback = aiResponse.feedback;

    submission.totalMarks = submission.answers.reduce((total, ans) => {
        return total + (ans.marksAwarded || 0);
    }, 0);
    
    submission.status = 'evaluated';
    submission.evaluatedBy = req.user._id;
    submission.evaluatedAt = new Date();
    submission.markModified('answers');
    await submission.save();
    
    const updatedSubmission = await Submission.findById(submissionId).populate({ path: 'exam', populate: { path: 'questions' } });

    return new ApiResponse(res).success(200, updatedSubmission, 'Answer evaluated by AI successfully.');
});

export const publishResults = asyncHandler(async (req, res) => {
    const { examId } = req.params;
    const teacherId = req.user._id;

    const exam = await Exam.findOne({ _id: examId, createdBy: teacherId });
    if (!exam) {
        throw new ApiError(404, 'Exam not found or you are not authorized.');
    }

    const result = await Submission.updateMany(
        { exam: examId, status: 'evaluated' },
        { $set: { status: 'published' } }
    );

    if (result.modifiedCount === 0) {
        throw new ApiError(400, 'No evaluated submissions were found to publish.');
    }

    return new ApiResponse(res).success(200, { modifiedCount: result.modifiedCount }, `${result.modifiedCount} result(s) published successfully.`);
});


// ✅ NEW FUNCTION: To create a timetable entry without questions
export const createTimetableEntry = asyncHandler(async (req, res) => {
    const { title, description, department, year, semester, section, batch, date, startTime, endTime, durationMinutes } = req.body;

    const requiredFields = ['title', 'department', 'year', 'semester', 'section', 'batch', 'date', 'startTime', 'endTime', 'durationMinutes'];
    for (const field of requiredFields) {
        if (!req.body[field]) {
            throw new ApiError(400, `${field} is required.`);
        }
    }

    const examData = {
        ...req.body,
        createdBy: req.user._id,
        // Ensure this entry is treated as a schedule, not a draft exam
        status: 'scheduled', 
        questions: [], // No questions for a simple timetable entry
        totalMarks: 0, // No marks
    };

    const newEntry = await Exam.create(examData);

    return new ApiResponse(res).success(201, newEntry, 'Timetable entry created successfully.');
});




