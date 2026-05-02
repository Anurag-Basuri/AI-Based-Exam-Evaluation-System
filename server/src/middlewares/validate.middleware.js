import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

// Validate Middleware
export const validate = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const messages = errors
			.array({ onlyFirstError: true })
			.map(e => e.msg)
			.join(', ');
		throw ApiError.BadRequest(messages, errors.array());
	}
	next();
};
