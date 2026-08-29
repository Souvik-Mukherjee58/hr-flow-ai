import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { dbGet, dbRun } from "../db.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "hrmotion_super_secret_jwt_key_2026";

// Strict OTP Rate Limiter (Max 15 requests per 15 mins per IP)
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many OTP requests from this IP address. Anti-spam rate limit triggered. Please wait 15 minutes."
  }
});

// Strict Auth Rate Limiter (Max 20 attempts per 15 mins per IP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts from this IP address. Brute-force protection activated. Please wait 15 minutes."
  }
});

// In-memory OTP Store for fast, secure OTP session management
// Format: email -> { otp: string, expiresAt: number, role: string }
const otpStore = new Map();

// Helper: Check if user role is HR
function checkIsHrRole(roleStr) {
  if (!roleStr) return false;
  const lower = roleStr.toLowerCase();
  return lower.includes("hr") || lower.includes("admin") || lower.includes("people") || lower.includes("director");
}

// --------------------------------------------------------------------------
// 1. REGISTER ROUTE - Saves new user into SQLite database
// --------------------------------------------------------------------------
router.post("/register", authLimiter, async (req, res) => {
  try {
    const { fullName, email, password, orgName, role, portalType } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: "Full Name, Email, and Password are required for registration." });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists in database
    const existing = await dbGet("SELECT id FROM users WHERE email = ?", [cleanEmail]);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `An account with "${cleanEmail}" is already registered. Please sign in instead.`
      });
    }

    // Determine role based on selected portal type or explicit role selection
    let assignedRole = role || "HR Executive Admin";
    if (portalType === "employee" && (!role || role.includes("HR"))) {
      assignedRole = "Employee Lead";
    } else if (portalType === "hr" && (!role || role === "Employee")) {
      assignedRole = "HR Executive Admin";
    }

    // Hash password securely
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate initials avatar
    const initials = fullName
      .trim()
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "HR";

    // Insert new registered user into SQLite
    const result = await dbRun(
      "INSERT INTO users (full_name, email, password_hash, org_name, role, avatar) VALUES (?, ?, ?, ?, ?, ?)",
      [fullName.trim(), cleanEmail, passwordHash, orgName || "Acme Motion Corp", assignedRole, initials]
    );

    const user = {
      id: result.id,
      fullName: fullName.trim(),
      email: cleanEmail,
      orgName: orgName || "Acme Motion Corp",
      role: assignedRole,
      avatar: initials
    };

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    return res.status(201).json({
      success: true,
      message: "Registration successful! Account is active.",
      token,
      user
    });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ success: false, message: "Internal server error during registration.", error: err.message });
  }
});

// --------------------------------------------------------------------------
// 2. PASSWORD LOGIN ROUTE - Strict check against registered SQLite users
// --------------------------------------------------------------------------
router.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password, portalType } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Please enter both email and password." });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Query database for registered user
    const row = await dbGet("SELECT * FROM users WHERE email = ?", [cleanEmail]);

    // STRICT RULE: Only registered users can sign in!
    if (!row) {
      return res.status(401).json({
        success: false,
        isNotRegistered: true,
        message: `No registered account found for "${cleanEmail}". Only registered accounts can log in. Please register first.`
      });
    }

    // STRICT ROLE CHECK: HR Portal vs Employee Portal
    const isHrUser = checkIsHrRole(row.role);
    if (portalType === "hr" && !isHrUser) {
      return res.status(403).json({
        success: false,
        isRoleMismatch: true,
        message: `Account "${cleanEmail}" is registered as an Employee. Please switch to the Employee Login portal.`
      });
    }
    if (portalType === "employee" && isHrUser) {
      return res.status(403).json({
        success: false,
        isRoleMismatch: true,
        message: `Account "${cleanEmail}" is registered as HR. Please switch to the HR Login portal.`
      });
    }

    // Check password hash match
    const isMatch = await bcrypt.compare(password, row.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password. Please verify your credentials."
      });
    }

    const user = {
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      orgName: row.org_name,
      role: row.role,
      avatar: row.avatar
    };

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    return res.status(200).json({
      success: true,
      message: "Logged in successfully.",
      token,
      user
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "Internal server error during login.", error: err.message });
  }
});

// --------------------------------------------------------------------------
// 3. SEND OTP ROUTE - Generates & sends 6-digit OTP to registered accounts
// --------------------------------------------------------------------------
router.post("/send-otp", otpLimiter, async (req, res) => {
  try {
    const { email, portalType } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required to request an OTP code." });
    }

    const cleanEmail = email.toLowerCase().trim();

    // STRICT RULE: Must be a registered account in SQLite
    const row = await dbGet("SELECT * FROM users WHERE email = ?", [cleanEmail]);
    if (!row) {
      return res.status(401).json({
        success: false,
        isNotRegistered: true,
        message: `No registered account found for "${cleanEmail}". Only registered accounts can receive OTP. Please register first.`
      });
    }

    // ROLE CHECK: Verify user account matches requested portal type
    const isHrUser = checkIsHrRole(row.role);
    if (portalType === "hr" && !isHrUser) {
      return res.status(403).json({
        success: false,
        isRoleMismatch: true,
        message: `"${cleanEmail}" is registered as an Employee account. Please switch to the Employee Login portal to request OTP.`
      });
    }
    if (portalType === "employee" && isHrUser) {
      return res.status(403).json({
        success: false,
        isRoleMismatch: true,
        message: `"${cleanEmail}" is registered as an HR account. Please switch to the HR Login portal to request OTP.`
      });
    }

    // Generate 6-digit random numeric OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // Code valid for 5 minutes

    otpStore.set(cleanEmail, { otp: otpCode, expiresAt, role: row.role });

    console.log(`[SECURITY OTP GENERATED] Email: ${cleanEmail} | OTP: ${otpCode} | Portal: ${portalType || "general"}`);

    return res.status(200).json({
      success: true,
      message: `OTP code successfully sent to ${cleanEmail}. (Code valid for 5 minutes)`,
      otpCode: otpCode, // Included for instant hackathon demo & auto-fill support
    });
  } catch (err) {
    console.error("Send OTP error:", err);
    return res.status(500).json({ success: false, message: "Internal server error generating OTP.", error: err.message });
  }
});

// --------------------------------------------------------------------------
// 4. VERIFY OTP ROUTE - Validates 6-digit OTP & signs user in
// --------------------------------------------------------------------------
router.post("/verify-otp", authLimiter, async (req, res) => {
  try {
    const { email, otp, portalType } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Both Email address and 6-digit OTP code are required." });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    // STRICT RULE: Must be a registered account
    const row = await dbGet("SELECT * FROM users WHERE email = ?", [cleanEmail]);
    if (!row) {
      return res.status(401).json({
        success: false,
        isNotRegistered: true,
        message: `No registered account found for "${cleanEmail}". Please register your account first.`
      });
    }

    // Check OTP in store
    const storedData = otpStore.get(cleanEmail);
    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: "No active OTP request found for this email. Please click 'Send OTP' to get a code."
      });
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(cleanEmail);
      return res.status(400).json({
        success: false,
        message: "OTP code has expired. Please click 'Resend OTP' to generate a new code."
      });
    }

    if (storedData.otp !== cleanOtp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP code. Please enter the correct 6-digit code sent to your email."
      });
    }

    // Clear OTP after successful validation
    otpStore.delete(cleanEmail);

    // ROLE CHECK: Ensure portal matches role
    const isHrUser = checkIsHrRole(row.role);
    if (portalType === "hr" && !isHrUser) {
      return res.status(403).json({
        success: false,
        isRoleMismatch: true,
        message: `"${cleanEmail}" is registered as an Employee account. Access to HR Portal denied.`
      });
    }
    if (portalType === "employee" && isHrUser) {
      return res.status(403).json({
        success: false,
        isRoleMismatch: true,
        message: `"${cleanEmail}" is registered as HR. Access to Employee Portal denied.`
      });
    }

    const user = {
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      orgName: row.org_name,
      role: row.role,
      avatar: row.avatar
    };

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully. Welcome back!",
      token,
      user
    });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return res.status(500).json({ success: false, message: "Internal server error verifying OTP.", error: err.message });
  }
});

// --------------------------------------------------------------------------
// 5. CURRENT USER ROUTE - Token session verification
// --------------------------------------------------------------------------
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No authentication token provided." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const row = await dbGet("SELECT id, full_name, email, org_name, role, avatar FROM users WHERE id = ?", [decoded.userId]);
    if (!row) {
      return res.status(404).json({ success: false, message: "User account not found." });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: row.id,
        fullName: row.full_name,
        email: row.email,
        orgName: row.org_name,
        role: row.role,
        avatar: row.avatar
      }
    });
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired session token." });
  }
});

export default router;
