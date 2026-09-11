import mongoose from "mongoose";

// Connect the backend application to MongoDB
const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    console.warn(
      "Server running without database connection. Check IP Whitelist on MongoDB Atlas."
    );
  }
};

export default connectDB;