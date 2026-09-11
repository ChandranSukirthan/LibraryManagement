import mongoose from "mongoose";

// Middleware to verify active database connection before processing API requests
export const checkDbConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message:
        "Database is not connected. Please check your MongoDB connection and Atlas IP Whitelist.",
    });
  }
  next();
};
