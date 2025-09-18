import Submission from '../models/submission.model.js';
import Exam from '../models/exam.model.js';
import Question from '../models/question.model.js';
import evaluateAnswer from '../services/evaluation.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// Submit answers for an exam (automatically evaluates after saving)
const submitAnswers = asyncHandler(async (req, res) => {
    const studentId = req.student?._id || req.user?.id;
    const { examId, answers } = req.body;

    if (!examId || !Array.isArray(answers) || answers.length === 0) {
        throw ApiError.BadRequest('Exam ID and answers are required');
    }

    const exam = await Exam.findById(examId).populate('questions');
    if (!exam) throw ApiError.NotFound('Exam not found');
    if (exam.status !== 'active') {
        throw ApiError.Forbidden('Exam is not active');
    }

    // Validate answers: each must reference a question in the exam
    const examQuestionIds = exam.questions.map(q => q._id.toString());
    for (const ans of answers) {
        if (!ans.question || !examQuestionIds.includes(ans.question)) {
            throw ApiError.BadRequest('Answer references invalid question');
        }
    }

    // Prevent duplicate submission
    const existing = await Submission.findOne({ exam: examId, student: studentId });
    if (existing) throw ApiError.Conflict('Submission already exists for this exam');

    const submission = new Submission({
        exam: examId,
        student: studentId,
        answers,
    });

    await submission.save();

    // --- Automated Evaluation ---
    const evaluations = [];
    for (const ans of submission.answers) {
        const questionDoc = await Question.findById(ans.question);
        if (!questionDoc) continue;

        let marks = 0;
        let remarks = '';
        if (questionDoc.type === 'multiple-choice') {
            // MCQ: compare selected option
            if (ans.responseOption && questionDoc.options) {
                const correctOption = questionDoc.options.find(opt => opt.isCorrect);
                marks = ans.responseOption.toString() === correctOption?._id.toString() ? questionDoc.max_marks : 0;
                remarks = marks > 0 ? 'Correct answer' : 'Incorrect answer';
            }
        } else {
            // Subjective: use AI evaluation
            const refAnswer = questionDoc.answer || null;
            const weight = questionDoc.max_marks / 100;
            const evalResult = await evaluateAnswer(
                questionDoc.text,
                ans.responseText || '',
                refAnswer,
                weight
            );
            marks = evalResult.score;
            remarks = evalResult.review;
        }

        evaluations.push({
            question: questionDoc._id,
            evaluation: {
                evaluator: 'ai',
                marks,
                remarks,
                evaluatedAt: new Date(),
            },
        });
    }

    submission.evaluations = evaluations;
    submission.evaluatedAt = new Date();
    await submission.save();

    return ApiResponse.success(res, submission, 'Submission saved and evaluated', 201);
});

// Teacher can update evaluation and review for a submission answer
const updateEvaluation = asyncHandler(async (req, res) => {
    const submissionId = req.params.id;
    const { evaluations } = req.body; // [{ question, marks, remarks }]

    if (!Array.isArray(evaluations) || evaluations.length === 0) {
        throw ApiError.BadRequest('Evaluations array required');
    }

    const submission = await Submission.findById(submissionId);
    if (!submission) throw ApiError.NotFound('Submission not found');

    // Only allow teacher to update
    const teacherId = req.teacher?._id || req.user?.id;
    if (!teacherId) throw ApiError.Forbidden('Only teachers can update evaluations');

    // Update evaluations for provided questions
    for (const update of evaluations) {
        const idx = submission.evaluations.findIndex(ev => ev.question.toString() === update.question);
        if (idx !== -1) {
            submission.evaluations[idx].evaluation.marks = update.marks;
            submission.evaluations[idx].evaluation.remarks = update.remarks;
            submission.evaluations[idx].evaluation.evaluator = 'teacher';
            submission.evaluations[idx].evaluation.evaluatedAt = new Date();
        }
    }
    submission.evaluatedBy = teacherId;
    submission.evaluatedAt = new Date();
    await submission.save();

    return ApiResponse.success(res, submission, 'Evaluation updated by teacher');
});

// Evaluate a submission (manual trigger, if needed)
const evaluateSubmission = asyncHandler(async (req, res) => {
    const submissionId = req.params.id;

    const submission = await Submission.findById(submissionId)
        .populate('exam')
        .populate({
            path: 'answers.question',
            model: 'Question',
        });

    if (!submission) throw ApiError.NotFound('Submission not found');
    if (submission.evaluations && submission.evaluations.length > 0) {
        throw ApiError.Conflict('Submission already evaluated');
    }

    // Evaluate each answer
    const evaluations = [];
    for (const ans of submission.answers) {
        const questionDoc = await Question.findById(ans.question);
        if (!questionDoc) continue;

        let marks = 0;
        let remarks = '';
        if (questionDoc.type === 'multiple-choice') {
            // MCQ: compare selected option
            if (ans.responseOption && questionDoc.options) {
                const correctOption = questionDoc.options.find(opt => opt.isCorrect);
                marks = ans.responseOption.toString() === correctOption?._id.toString() ? questionDoc.max_marks : 0;
                remarks = marks > 0 ? 'Correct answer' : 'Incorrect answer';
            }
        } else {
            // Subjective: use AI evaluation
            const refAnswer = questionDoc.answer || null;
            const weight = questionDoc.max_marks / 100;
            const evalResult = await evaluateAnswer(
                questionDoc.text,
                ans.responseText || '',
                refAnswer,
                weight
            );
            marks = evalResult.score;
            remarks = evalResult.review;
        }

        evaluations.push({
            question: questionDoc._id,
            evaluation: {
                evaluator: 'ai',
                marks,
                remarks,
                evaluatedAt: new Date(),
            },
        });
    }

    submission.evaluations = evaluations;
    submission.evaluatedAt = new Date();
    await submission.save();

    return ApiResponse.success(res, submission, 'Submission evaluated');
});

// Get a student's submission for an exam
const getSubmission = asyncHandler(async (req, res) => {
    const { examId, studentId } = req.query;
    if (!examId || !studentId) {
        throw ApiError.BadRequest('Exam ID and student ID are required');
    }
    const submission = await Submission.findOne({ exam: examId, student: studentId })
        .populate('exam')
        .populate({
            path: 'answers.question',
            model: 'Question',
        })
        .lean();

    if (!submission) throw ApiError.NotFound('Submission not found');
    return ApiResponse.success(res, submission, 'Submission fetched');
});

// Get all submissions for an exam (for teacher)
const getExamSubmissions = asyncHandler(async (req, res) => {
    const examId = req.params.id;
    if (!examId) throw ApiError.BadRequest('Exam ID required');
    const submissions = await Submission.find({ exam: examId })
        .populate('student', 'username fullname email')
        .populate({
            path: 'answers.question',
            model: 'Question',
        })
        .lean();

    return ApiResponse.success(res, submissions, 'Exam submissions fetched');
});

export {
    submitAnswers,
    evaluateSubmission,
    updateEvaluation,
    getSubmission,
    getExamSubmissions,
};
