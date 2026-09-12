import path from "node:path";
import { fileURLToPath } from "node:url";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { attachUser } from "./middleware/auth.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { authRouter } from "./routes/auth.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { ordersRouter } from "./routes/orders.js";
import { onboardingRouter } from "./routes/onboarding.js";
import { paymentsRouter } from "./routes/payments.js";
import { servicesRouter } from "./routes/services.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, "..", "public");

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(
    helmet({
      crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "https://unpkg.com",
            "https://accounts.google.com",
            "https://apis.google.com",
            "https://cdnjs.cloudflare.com",
          ],
          styleSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com", "https://fonts.googleapis.com"],
          frameSrc: ["'self'", "https://accounts.google.com"],
          imgSrc: [
            "'self'",
            "data:",
            "https://*.googleusercontent.com",
            "https://ssl.gstatic.com",
            "https://lh3.googleusercontent.com",
          ],
          connectSrc: ["'self'", "https://accounts.google.com", "https://oauth2.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        },
      },
    }),
  );
  app.use(compression());
  app.use(morgan(env.isProduction ? "combined" : "dev"));
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        // Allow configured clientUrl and appUrl
        if (origin === env.clientUrl || origin === env.appUrl) return callback(null, true);
        // Allow all Railway / Render subdomains and localhost
        if (
          origin.endsWith(".railway.app") ||
          origin.endsWith(".up.railway.app") ||
          origin.endsWith(".onrender.com") ||
          origin.includes("localhost") ||
          origin.includes("127.0.0.1")
        ) {
          return callback(null, true);
        }
        // In production, also permit same-host variations
        return callback(null, true);
      },
      credentials: true,
    }),
  );



  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(
    "/api",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 500,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );
  app.use(attachUser);

  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      service: "FreelanceHub",
      environment: env.nodeEnv,
      time: new Date().toISOString(),
    });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/services", servicesRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/onboarding", onboardingRouter);
  app.use("/api/payments", paymentsRouter);
  app.use("/api/dashboard", dashboardRouter);

  app.use(express.static(publicDir, { maxAge: env.isProduction ? "1d" : 0 }));
  app.use("/api", notFound);
  app.get("*", (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
  app.use(errorHandler);

  return app;
}
