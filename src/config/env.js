import dotenv from "dotenv";
import crypto from "node:crypto";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

// Safe fallback for JWT_SECRET in production if not explicitly configured in Railway/environment
let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  if (isProduction) {
    console.warn("⚠️  [NOTICE] JWT_SECRET is not set in environment variables.");
    console.warn("⚠️  FreelanceHub is using an auto-generated secret for this session.");
    console.warn("⚠️  TIP: To persist user logins across service restarts, add JWT_SECRET to your Railway variables.");
    jwtSecret = crypto.randomBytes(32).toString("hex");
  } else {
    jwtSecret = "development-only-change-me";
  }
}

// Automatically detect Railway public domain if APP_URL / CLIENT_URL are not manually set
const railwayPublicDomain = process.env.RAILWAY_PUBLIC_DOMAIN
  ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  : process.env.RAILWAY_STATIC_URL
    ? `https://${process.env.RAILWAY_STATIC_URL}`
    : "";

const resolvedPort = Number(process.env.PORT || 3000);
const defaultAppUrl = railwayPublicDomain || `http://localhost:${resolvedPort}`;

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction,
  port: resolvedPort,
  appUrl: process.env.APP_URL || defaultAppUrl,
  clientUrl: process.env.CLIENT_URL || process.env.APP_URL || defaultAppUrl,
  mongoUri: process.env.MONGODB_URI || "",
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  paymentProvider: "demo",
  platformFeePercent: Number(process.env.PLATFORM_FEE_PERCENT || 12),
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.MAIL_FROM || "FreelanceHub <no-reply@freelancehub.local>",
  },
  googleClientId:
    process.env.GOOGLE_CLIENT_ID ||
    "678943507030-1i0os5s8s3o900jhaq6i9q6vf952jtd7.apps.googleusercontent.com",
  openai: {
    apiKey: process.env.OPENAI_API_KEY || "",
    model: process.env.OPENAI_MODEL || "gpt-5.6",
  },
};

export function assertRuntimeConfig() {
  if (!env.mongoUri) {
    console.warn("⚠️  Warning: MONGODB_URI is not set. The app will run in offline/static mode without MongoDB.");
    console.warn("⚠️  To enable full marketplace features, add MONGODB_URI in your Railway project variables.");
  }
}
