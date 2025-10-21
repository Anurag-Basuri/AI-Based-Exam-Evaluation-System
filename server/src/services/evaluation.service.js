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
	// Find the first '{' and the last '}' to get the JSON block.
	const firstBrace = rawOutput.indexOf('{');
	const lastBrace = rawOutput.lastIndexOf('}');

	if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
		throw new ApiError(500, 'No valid JSON object found in model response', { rawOutput });
	}

	const jsonString = rawOutput.substring(firstBrace, lastBrace + 1);

	try {
		// The model might return JSON with trailing commas, which is invalid.
		// A common fix is to use a more lenient parser or clean the string.
		// For this, we'll remove trailing commas before parsing.
		const cleanedJsonString = jsonString
			.replace(/,\s*\]/g, ']') // remove trailing comma in array
			.replace(/,\s*\}/g, '}'); // remove trailing comma in object

		return JSON.parse(cleanedJsonString);
	} catch (e) {
		throw new ApiError(500, 'Model returned invalid JSON', {
			originalError: e.message,
			rawOutput,
		});
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

		// --- ROBUST RESPONSE PARSING ---
		let rawOutput = '';
		const responseData = response.data;

		if (typeof responseData === 'string') {
			rawOutput = responseData;
		} else if (Array.isArray(responseData) && responseData.length > 0) {
			// Handle formats like [{ "generated_text": "..." }]
			rawOutput = responseData[0]?.generated_text || JSON.stringify(responseData[0]);
		} else if (typeof responseData === 'object' && responseData !== null) {
			// Handle formats like { "generated_text": "..." } or direct JSON { "score": ... }
			rawOutput = responseData.generated_text || JSON.stringify(responseData);
		} else {
			throw new ApiError(
				500,
				'Received an unexpected response format from evaluation service',
			);
		}
		// --- END ROBUST RESPONSE PARSING ---

		const parsed = extractJson(rawOutput);

		// Validate score
		let score = Number(parsed.score);
		if (isNaN(score)) score = 0;
		score = Math.max(0, Math.min(100, Math.round(score)));

		// Apply weight (e.g., scale to max marks of question)
		const finalMarks = Math.round(score * weight);

		const review =
			typeof parsed.review === 'string' && parsed.review.trim().length > 0
				? parsed.review.trim()
				: 'No review provided';

		return { score: finalMarks, review };
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
