import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/db.js";
import bookRoutes from "./routes/bookRoutes.js";
import { checkDbConnection } from "./middleware/checkDb.js";

// Load .env variables
dotenv.config();

const app = express();

// Allow frontend to communicate with backend
app.use(cors());

// Read JSON & Form data request bodies up to 10MB
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Book API routes with database check middleware
app.use("/api/books", checkDbConnection, bookRoutes);

// Simple health check route
app.get("/", (req, res) => {
  res.send("Book Library API is running...");
});

// Handle Multer and general server errors
app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.status || 400).json({
    message: error.message || "Something went wrong",
  });
});

const PORT = process.env.PORT || 5000;

// Start DB first, then start listening
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
};

startServer();
