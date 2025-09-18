import express from 'express';
import { addQuestion } from '../controllers/questionController.js';
import auth from '../middlewares/authmiddleware.js';

const router = express.Router();

router.post('/:examId/questions', auth, addQuestion);

export default router;
