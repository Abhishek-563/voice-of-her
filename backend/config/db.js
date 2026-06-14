import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const uri =
      process.env.MONGO_URI || "mongodb://localhost:27017/voiceofher";

    const conn = await mongoose.connect(uri);

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Drop unique indexes on contacts collection if they exist to prevent duplicate key errors
    try {
      await mongoose.connection.db.collection("contacts").dropIndex("email_1");
      console.log("Successfully dropped email_1 unique index on contacts collection.");
    } catch (err) {
      // Index doesn't exist, ignore
    }

    try {
      await mongoose.connection.db.collection("contacts").dropIndex("phone_1");
      console.log("Successfully dropped phone_1 unique index on contacts collection.");
    } catch (err) {
      // Index doesn't exist, ignore
    }

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected. Attempting reconnect...");
    });
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    if (error.message.includes("whitelist") || error.message.includes("IP address")) {
      console.error("MongoDB Atlas network access issue detected. Add your current IP address or 0.0.0.0/0 to Atlas Network Access.");
    }
    process.exit(1);
  }
};

export default connectDB;
