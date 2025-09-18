class ApiError extends Error {
    constructor(statusCode, message, details = null) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }

    toJSON() {
        return {
            name: this.name,
            statusCode: this.statusCode,
            message: this.message,
            ...(this.details && { details: this.details }),
            stack: process.env.NODE_ENV === 'development' ? this.stack : undefined,
        };
    }

    static BadRequest(message = 'Bad Request', details = null) {
        return new ApiError(400, message, details);
    }

    static Unauthorized(message = 'Unauthorized', details = null) {
        return new ApiError(401, message, details);
    }

    static Forbidden(message = 'Forbidden', details = null) {
        return new ApiError(403, message, details);
    }

    static NotFound(message = 'Not Found', details = null) {
        return new ApiError(404, message, details);
    }

    static Conflict(message = 'Conflict', details = null) {
        return new ApiError(409, message, details);
    }

    static UnprocessableEntity(message = 'Unprocessable Entity', details = null) {
        return new ApiError(422, message, details);
    }

    static InternalServerError(message = 'Internal Server Error', details = null) {
        return new ApiError(500, message, details);
    }
}

export { ApiError };