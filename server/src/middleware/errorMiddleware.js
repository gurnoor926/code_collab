const notFound = (req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
};

const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || err.status || 500;
    let message = err.message || "Internal server error";

    // Mongoose validation error
    if (err.name === "ValidationError") {
        statusCode = 400;
        message = "Validation failed";
    }

    // Invalid MongoDB ObjectId
    else if (err.name === "CastError") {
        statusCode = 400;
        message = "Invalid resource ID";
    }

    // MongoDB duplicate key
    else if (err.code === 11000) {
        statusCode = 409;
        message = "Resource already exists";
    }

    // JWT errors
    else if (
        err.name === "JsonWebTokenError" ||
        err.name === "NotBeforeError"
    ) {
        statusCode = 401;
        message = "Invalid authentication token";
    }

    else if (err.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Authentication token expired";
    }

    // Prevent invalid HTTP status codes
    if (
        !Number.isInteger(statusCode) ||
        statusCode < 400 ||
        statusCode > 599
    ) {
        statusCode = 500;
    }

    // Log error details
    if (process.env.NODE_ENV !== "production") {
        console.error(err);
    } else {
        console.error(
            `[${statusCode}] ${req.method} ${req.originalUrl}: ${err.message}`
        );
    }

    res.status(statusCode).json({
        success: false,
        message:
            process.env.NODE_ENV === "production" && statusCode === 500
                ? "Internal server error"
                : message
    });
};

module.exports = {
    notFound,
    errorHandler
};
