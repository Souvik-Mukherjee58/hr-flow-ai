import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "hrmotion_super_secret_jwt_key_2026";

// Require Authentication Middleware (JWT Validation)
export function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access Denied: Authentication token is missing or invalid. Please sign in."
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Access Denied: Invalid or expired authentication token. Please sign in again."
    });
  }
}

// XSS and Malicious Input Sanitizer Helper
function sanitizeString(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "[REMOVED_SCRIPT]")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/javascript:[^\s"]*/gi, "")
    .replace(/<[^>]*>/g, (tag) => {
      return tag.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    });
}

function sanitizeObject(obj) {
  if (!obj || typeof obj !== "object") return obj;
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === "string") {
      obj[key] = sanitizeString(obj[key]);
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
  return obj;
}

// Input Sanitization Middleware
export function sanitizeInputMiddleware(req, res, next) {
  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);
  next();
}
