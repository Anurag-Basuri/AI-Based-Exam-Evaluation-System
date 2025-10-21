import axios from 'axios';
import { ApiError } from '../utils/ApiError.js';

const api = process.env.HF_API_URL;
const apiKey = process.env.HF_API_KEY;

// Prompt builder when reference answer is provided
function buildPromptWithReference(question, studentAnswer, referenceAnswer) {
	return `Based on the following question, reference answer, and student's answer, evaluate the student's answer on a scale of 0 to 100 and provide a brief review.
  Question: "${question}"
  Reference Answer: "${referenceAnswer}"
  Student's Answer: "${studentAnswer}"
  Your response must be a valid JSON object with two keys: "score" (a number from 0 to 100) and "review" (a string). Example: {"score": 85, "review": "The answer is mostly correct but misses a key detail."}`;
}

// Prompt builder when no reference is provided
function buildPromptWithoutReference(question, studentAnswer) {
	return `Based on the following question and student's answer, evaluate the student's answer on a scale of 0 to 100 for correctness, relevance, and completeness, and provide a brief review.
  Question: "${question}"
  Student's Answer: "${studentAnswer}"
  Your response must be a valid JSON object with two keys: "score" (a number from 0 to 100) and "review" (a string). Example: {"score": 75, "review": "The answer is relevant but lacks depth."}`;
}

/**
 * Extracts a JSON object from a raw string, which might be wrapped in other text or markdown.
 * @param {string} rawOutput - The raw string from the AI model.
 * @returns {object} The parsed JSON object.
 */
function extractJson(rawOutput) {
	console.log('[EVAL_SERVICE_EXTRACT] Attempting to find JSON in raw output.');
	// Find the first '{' and the last '}' to get the JSON block.
	const firstBrace = rawOutput.indexOf('{');
	const lastBrace = rawOutput.lastIndexOf('}');

	if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
		console.error('[EVAL_SERVICE_EXTRACT] No valid JSON object boundaries found.');
		throw new ApiError(500, 'No valid JSON object found in model response', { rawOutput });
	}

	const jsonString = rawOutput.substring(firstBrace, lastBrace + 1);
	console.log(`[EVAL_SERVICE_EXTRACT] Extracted potential JSON string: ${jsonString}`);

	try {
		// Clean up common formatting issues before parsing.
		const cleanedJsonString = jsonString
			.replace(/,\s*\]/g, ']') // remove trailing comma in array
			.replace(/,\s*\}/g, '}'); // remove trailing comma in object

		return JSON.parse(cleanedJsonString);
	} catch (e) {
		console.error(`[EVAL_SERVICE_EXTRACT] JSON parsing failed: ${e.message}`);
		throw new ApiError(500, 'Model returned invalid JSON', {
			originalError: e.message,
			jsonString,
		});
	}
}

export async function evaluateAnswer(question, studentAnswer, referenceAnswer = null, weight = 1) {
	console.log(
		`[EVAL_SERVICE] Starting evaluation for question: "${question.substring(0, 50)}..."`,
	);
	const prompt = referenceAnswer
		? buildPromptWithReference(question, studentAnswer, referenceAnswer)
		: buildPromptWithoutReference(question, studentAnswer);

	console.log(`[EVAL_SERVICE] Generated prompt. Length: ${prompt.length}`);

	try {
		const response = await axios.post(
			api,
			{ inputs: prompt, parameters: { max_new_tokens: 150 } },
			{ headers: { Authorization: `Bearer ${apiKey}` } },
		);

		console.log('[EVAL_SERVICE] Received raw response from AI model.');
		let rawOutput = '';
		const responseData = response.data;

		// Handle various possible response structures from the AI service
		if (typeof responseData === 'string') {
			rawOutput = responseData;
		} else if (Array.isArray(responseData) && responseData.length > 0) {
			rawOutput = responseData[0]?.generated_text || JSON.stringify(responseData[0]);
		} else if (typeof responseData === 'object' && responseData !== null) {
			rawOutput = responseData.generated_text || JSON.stringify(responseData);
		} else {
			console.error('[EVAL_SERVICE] Unexpected response format from AI:', responseData);
			throw new ApiError(
				500,
				'Received an unexpected response format from evaluation service',
			);
		}
		console.log(`[EVAL_SERVICE] Normalized raw output: ${rawOutput}`);

		const parsed = extractJson(rawOutput);
		console.log('[EVAL_SERVICE] Successfully parsed JSON:', parsed);

		let score = Number(parsed.score);
		if (isNaN(score)) {
			console.warn(
				`[EVAL_SERVICE] Warning: Parsed score "${parsed.score}" is not a number. Defaulting to 0.`,
			);
			score = 0;
		}
		score = Math.max(0, Math.min(100, Math.round(score)));

		const finalMarks = Math.round(score * weight);
		const review =
			typeof parsed.review === 'string' && parsed.review.trim().length > 0
				? parsed.review.trim()
				: 'No review provided';

		console.log(
			`[EVAL_SERVICE] Evaluation successful. Final marks: ${finalMarks}, Review: "${review}"`,
		);
		return { score: finalMarks, review };
	} catch (error) {
		console.error(
			`[EVAL_SERVICE] CRITICAL: Full evaluation failed for a question. Error: ${error.message}`,
		);
		// Re-throw the error so the controller can handle it gracefully.
		throw error;
	}
}
