const asyncHandler = (fn) => {
    if (typeof fn !== 'function') {
		throw new TypeError('asyncHandler requires a function argument');
	}

	return (req, res, next) => {
		// Create a safe execution context
		const executionPromise = Promise.resolve(fn(req, res, next));

		// Handle errors and process rejections
		executionPromise.catch(error => {
			// Preserve existing error status or default to 500
			if (!error.statusCode) {
				error.statusCode = 500;
			}
			next(error);
		});
	};
}

export default asyncHandler;
