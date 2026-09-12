import mongoose from "mongoose";
import { env, assertRuntimeConfig } from "./env.js";

// Event listeners to keep process alive on transient DB errors
mongoose.connection.on("error", (err) => {
  console.error("⚠️  MongoDB runtime connection error:", err.message);
});

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️  MongoDB disconnected.");
});

mongoose.connection.on("reconnected", () => {
  console.log("✅ MongoDB reconnected successfully.");
});

export async function connectDatabase() {
  assertRuntimeConfig();

  if (!env.mongoUri) {
    return null;
  }

  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(env.mongoUri, {
      autoIndex: !env.isProduction,
      serverSelectionTimeoutMS: 6000,
    });
    console.log("✅ Connected to MongoDB Atlas successfully.");
    return mongoose.connection;
  } catch (err) {
    console.error("⚠️  MongoDB connection failed:", err.message);
    console.warn("⚠️  The server will continue running. Static and offline pages will remain available.");
    console.warn("⚠️  HINT: If using MongoDB Atlas, make sure you allowed IP 0.0.0.0/0 under 'Network Access' in your Atlas dashboard.");
    return null;
  }
}

