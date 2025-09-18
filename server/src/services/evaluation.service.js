import axios from 'axios';
import { ApiError } from '../utils/ApiError.js';

const api = process.env.HF_API_URL;
const apiKey = process.env.HF_API_KEY;

// Prompt builder when reference answer is provided
function buildPromptWithReference(question, studentAnswer, referenceAnswer) {
	return `
You are an exam evaluator. Compare the student's answer to the reference answer.

Rules:
- Score between 0 and 100.
- Award full marks if meaning matches, even with different wording.
- Be consistent and deterministic.
- Keep review short (<100 words).
- Respond ONLY with valid JSON.

Question: ${question}
Reference Answer: ${referenceAnswer}
Student's Answer: ${studentAnswer}

Expected JSON:
{
  "score": <0-100>,
  "review": "<short review>"
}`;
}

// Prompt builder when no reference is provided
function buildPromptWithoutReference(question, studentAnswer) {
	return `
You are an exam evaluator. Evaluate the student's answer.

Rules:
- Score between 0 and 100 based on completeness, relevance, correctness.
- Be consistent and deterministic.
- Keep review short (<100 words).
- Respond ONLY with valid JSON.

Question: ${question}
Student's Answer: ${studentAnswer}

Expected JSON:
{
  "score": <0-100>,
  "review": "<short review>"
}`;
}

function extractJson(rawOutput) {
	// Try to extract JSON object from output using regex
	const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
	if (!jsonMatch) {
		throw ApiError.UnprocessableEntity('No JSON found in model response', rawOutput);
	}
	try {
		return JSON.parse(jsonMatch[0]);
	} catch (e) {
		throw ApiError.UnprocessableEntity('Model returned invalid JSON', rawOutput);
	}
}

export async function evaluateAnswer(question, studentAnswer, referenceAnswer = null, weight = 1) {
	const prompt = referenceAnswer
		? buildPromptWithReference(question, studentAnswer, referenceAnswer)
		: buildPromptWithoutReference(question, studentAnswer);

	try {
		const response = await axios.post(
			api,
			{
				inputs: prompt,
				parameters: {
					temperature: 0,
					top_p: 1,
					top_k: 1,
					max_new_tokens: 200,
				},
			},
			{
				headers: {
					Authorization: `Bearer ${apiKey}`,
					'Content-Type': 'application/json',
				},
				timeout: 15000,
			},
		);

		// Handle various output formats
		let rawOutput = '';
		if (typeof response.data === 'string') {
			rawOutput = response.data;
		} else if (Array.isArray(response.data)) {
			rawOutput = response.data[0]?.generated_text || '';
		} else if (response.data?.generated_text) {
			rawOutput = response.data.generated_text;
		} else if (response.data?.score !== undefined && response.data?.review !== undefined) {
			// Direct JSON response
			rawOutput = JSON.stringify(response.data);
		} else {
			rawOutput = JSON.stringify(response.data);
		}

		let parsed;
		try {
			parsed = extractJson(rawOutput);
		} catch (err) {
			// Log for debugging
			console.error('JSON extraction error:', err.message, rawOutput);
			throw err;
		}

		// Validate score
		let score = Number(parsed.score);
		if (isNaN(score)) score = 0;
		score = Math.max(0, Math.min(100, Math.round(score)));

		// Apply weight (e.g., scale to max marks of question)
		score = Math.round(score * weight);

		const review =
			typeof parsed.review === 'string' && parsed.review.trim().length > 0
				? parsed.review.trim()
				: 'No review provided';

		return { score, review };
	} catch (error) {
		// Axios error handling
		let details = error.response?.data || error.message;
		if (error.code === 'ECONNABORTED') {
			throw ApiError.InternalServerError('Evaluation service timed out', { details });
		}
		if (error.response?.status === 401) {
			throw ApiError.Unauthorized('Invalid or missing API key', { details });
		}
		if (error.response?.status === 429) {
			throw ApiError.UnprocessableEntity('Evaluation service rate limit exceeded', {
				details,
			});
		}
		console.error('Evaluation error:', details);
		throw ApiError.InternalServerError('Error evaluating answer', { details });
	}
}
