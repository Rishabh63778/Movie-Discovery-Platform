const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err)
    }

    let statusCode = err.statusCode || err.status || 500
    let message = err.message || "Something went wrong"
    let errors = Array.isArray(err.errors) ? err.errors : []

    if (err.name === "ValidationError") {
        statusCode = 400
        message = Object.values(err.errors)
            .map((validationError) => validationError.message)
            .join(", ") || "Validation failed"
        errors = Object.values(err.errors).map((validationError) => ({
            field: validationError.path,
            message: validationError.message
        }))
    }

    if (err.code === 11000) {
        statusCode = 409
        message = "A record with these details already exists"
        errors = [{
            field: Object.keys(err.keyPattern || {})[0] || "unknown",
            message
        }]
    }

    if (statusCode >= 500) {
        console.error(err)
    }

    return res.status(statusCode).json({
        statuscode: statusCode,
        success: false,
        message,
        data: null,
        errors
    })
}

const notFound = (req, res) => {
    return res.status(404).json({
        statuscode: 404,
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
        data: null,
        errors: []
    })
}

export { errorHandler, notFound }
