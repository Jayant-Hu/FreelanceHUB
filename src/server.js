import { createServer } from "node:http";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { createApp } from "./app.js";

// Guard against unhandled rejections/exceptions crashing the process
process.on("unhandledRejection", (reason, promise) => {
  console.error("⚠️  Unhandled Promise Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("⚠️  Uncaught Exception:", error);
});

async function main() {
  console.log(`Starting FreelanceHub in ${env.nodeEnv} mode...`);

  try {
    await connectDatabase();
  } catch (err) {
    console.error("⚠️  Database initialization caught error:", err.message);
  }

  console.log("Creating Express app...");
  const app = createApp();
  const server = createServer(app);

  // Railway requires listening on 0.0.0.0 to receive incoming container traffic
  const host = "0.0.0.0";
  server.listen(env.port, host, () => {
    console.log(`🚀 FreelanceHub server listening on http://${host}:${env.port}`);
    console.log(`🌐 Application URL: ${env.appUrl}`);
  });

  const shutdown = () => {
    console.log("Shutting down FreelanceHub gracefully...");
    server.close(() => {
      console.log("HTTP server closed.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((error) => {
  console.error("Fatal startup error:", error);
  process.exit(1);
});
