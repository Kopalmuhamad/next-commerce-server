// Error Handler Middleware
export const errorHandler = (err, req, res, next) => {
  // Set status code, default to 500 if not already set or if response was successful
  const statusCode =
    res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  // Default error message if none provided
  let message = err.message || "Internal Server Error";

  // Handle Mongoose Validation Error specifically
  if (err.name === "ValidationError") {
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
    statusCode = 400;
  }

  // Handle JWT errors (optional: useful if using authentication)
  if (err.name === "JsonWebTokenError") {
    message = "Invalid token. Please log in again.";
    statusCode = 401;
  } else if (err.name === "TokenExpiredError") {
    message = "Token expired. Please log in again.";
    statusCode = 401;
  }

  // Return error response with message and stack (stack only in development mode)
  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

// 404 Not Found Middleware
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};
