import Question from '../models/question.model.js';

export const addQuestion = async (req, res) => {
  try {
    const { questionType, questionText, options, correctAnswer, modelAnswer } = req.body;
    const { examId } = req.params;

    const question = new Question({
      examId,
      questionType,
      questionText,
      options: questionType === 'mcq' ? options : undefined,
      correctAnswer: questionType === 'mcq' ? correctAnswer : undefined,
      modelAnswer: questionType === 'subjective' ? modelAnswer : undefined
    });

    await question.save();
    res.status(201).json({ message: 'Question added', question });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
