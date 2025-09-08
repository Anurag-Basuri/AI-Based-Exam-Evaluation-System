const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({
                status: 'error',
                message: 'Validation Error',
                details: error.details
            });
        }
        next();
    };
};

export { validateRequest };