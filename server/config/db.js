const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10s timeout
      socketTimeoutMS: 45000,          // 45s inactivity timeout
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection failed!");

    // Handle common connection errors more specifically
    if (error.name === "MongooseServerSelectionError") {
      console.error("🔍 Could not reach MongoDB server. Check network or server status.");
    } else if (error.name === "MongoParseError") {
      console.error("⚠️ Invalid MongoDB URI format. Check your MONGO_URI in .env file.");
    } else if (error.name === "MongoNetworkError") {
      console.error("🌐 Network issue while connecting to MongoDB.");
    } else if (error.name === "MongooseError") {
      console.error("⚙️ General Mongoose error occurred.");
    } else {
      console.error("💥 Unexpected error:", error);
    }

    console.error("📋 Error details:", error.message);

    // Exit only in non-test environments
    if (process.env.NODE_ENV !== "test") {
      process.exit(1);
    }
  }

  // Handle connection events (optional, for debugging)
  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ MongoDB disconnected. Retrying...");
  });

  mongoose.connection.on("reconnected", () => {
    console.log("🔁 MongoDB reconnected successfully!");
  });

  mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB runtime error:", err);
  });
};

module.exports = connectDB;
