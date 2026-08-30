import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

import aiRoutes from "./routes/aiRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import dataRoutes from "./routes/dataRoutes.js";
import { sanitizeInputMiddleware } from "./middleware/authMiddleware.js";
import "./db.js";

dotenv.config();

const app = express();

// Disable powered-by header to conceal stack details
app.disable("x-powered-by");

// Trust proxy header if running behind reverse proxy
app.set("trust proxy", 1);

// Enterprise HTTP Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self' https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https: http://localhost:* http://127.0.0.1:*;"
  );
  next();
});

// Configure CORS and JSON Body Payload Protection (10kb Limit)
app.use(cors());
app.use(express.json({ limit: "10kb" }));

// XSS and SQL Injection String Sanitization
app.use(sanitizeInputMiddleware);

// Global API DDoS Prevention Rate Limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 200, // Limit each IP to 200 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP address. Anti-DDoS rate limit triggered. Please try again in 15 minutes."
  }
});

// AI Process Rate Limiter (Max 30 execution requests per 15 minutes)
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "AI Graph rate limit exceeded. Please wait a few minutes before submitting new AI workflows."
  }
});

// Apply rate limiters to routes
app.use("/api", globalLimiter);
app.use("/api/leave/request", aiLimiter);

app.get("/", (req, res) => {
    res.json({
        success: true,
        project: "HR Motion AI Backend",
        status: "Running",
        database: "SQLite Connected",
        security: "Enterprise Shield Active (Rate Limiting, Anti-DDoS, Helmet Headers, XSS Sanitizer, JWT Protection)"
    });
});

app.use("/api/auth", authRoutes);
app.use("/api", dataRoutes);
app.use("/api", aiRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on ${PORT} with Enterprise Security Shield active`);
});