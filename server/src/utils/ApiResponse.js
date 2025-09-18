class ApiResponse {
    static success(res, data = null, message = 'Success', statusCode = 200) {
        return res.status(statusCode).json({
            status: 'success',
            message,
            data,
        });
    }

    static error(res, error, statusCode = null) {
        return res.status(statusCode || error.statusCode || 500).json({
            status: 'error',
            message: error.message || 'Internal Server Error',
            details: error.details || null,
            ...(process.env.NODE_ENV === 'development' && error.stack ? { stack: error.stack } : {})
        });
    }

    static paginated(res, data, pagination, message = 'Success', statusCode = 200) {
        return res.status(statusCode).json({
            status: 'success',
            message,
            data,
            pagination,
        });
    }
}

export { ApiResponse };