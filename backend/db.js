import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "database.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Failed to connect to SQLite database:", err.message);
  } else {
    console.log("Connected to SQLite database at", dbPath);
  }
});

// Helper for promise-based queries
export function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

export function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Initialize tables and seed initial demo data
export async function initDb() {
  await dbRun(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      org_name TEXT,
      role TEXT DEFAULT 'HR Manager',
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      department TEXT NOT NULL,
      role TEXT NOT NULL,
      email TEXT NOT NULL,
      workload_score INTEGER DEFAULT 50,
      burnout_risk TEXT DEFAULT 'Low',
      leave_balance INTEGER DEFAULT 20,
      avatar TEXT
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS company_policies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      max_standard_days INTEGER DEFAULT 3,
      document_name TEXT,
      content TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS leave_requests (
      workflow_id TEXT PRIMARY KEY,
      employee_id TEXT,
      employee_name TEXT,
      leave_type TEXT,
      days INTEGER,
      reason TEXT,
      status TEXT DEFAULT 'Processed',
      recommendation TEXT,
      max_policy_days INTEGER DEFAULT 3,
      is_emergency INTEGER DEFAULT 0,
      requires_human_approval INTEGER DEFAULT 0,
      hr_decision TEXT DEFAULT 'Pending',
      hr_notes TEXT,
      hr_reviewer TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workflow_id TEXT,
      action TEXT,
      details TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migrate table columns safely if table already existed without new columns
  try {
    await dbRun("ALTER TABLE leave_requests ADD COLUMN max_policy_days INTEGER DEFAULT 3");
  } catch (e) {}
  try {
    await dbRun("ALTER TABLE leave_requests ADD COLUMN is_emergency INTEGER DEFAULT 0");
  } catch (e) {}
  try {
    await dbRun("ALTER TABLE leave_requests ADD COLUMN requires_human_approval INTEGER DEFAULT 0");
  } catch (e) {}
  try {
    await dbRun("ALTER TABLE leave_requests ADD COLUMN hr_decision TEXT DEFAULT 'Pending'");
  } catch (e) {}
  try {
    await dbRun("ALTER TABLE leave_requests ADD COLUMN hr_notes TEXT");
  } catch (e) {}
  try {
    await dbRun("ALTER TABLE leave_requests ADD COLUMN hr_reviewer TEXT");
  } catch (e) {}

  // Seed default policy document attachment if empty
  const policyCount = await dbGet("SELECT COUNT(*) as count FROM company_policies");
  if (policyCount && policyCount.count === 0) {
    await dbRun(
      "INSERT INTO company_policies (title, max_standard_days, document_name, content) VALUES (?, ?, ?, ?)",
      [
        "Corporate Leave Policy & Emergency Guidelines v2.4",
        3,
        "Company_Leave_Policy_Doc_2026.pdf",
        `MANUAL COMPANY POLICY DOCUMENT (Ref: POL-2026-v2)

1. STANDARD LEAVE DURATION CAP: Standard employee leave requests are strictly capped at a maximum of 3 days. Any standard leave request exceeding 3 days (e.g. 5 days) MUST be automatically REJECTED by default.

2. EMERGENCY EXCEPTION CLAUSE: If a leave request exceeding 3 days is explicitly flagged or justified as an EMERGENCY (e.g. medical emergency, family crisis, hospital admission, urgent casualty), the policy limit exception applies. The request is passed to Human HR Review.

3. HUMAN-IN-THE-LOOP DECISION GOVERNANCE: If AI evaluation approves a request or grants an Emergency Exception, the final binding decision MUST be reviewed and approved by a Human HR Manager in the HR Review Interface.`
      ]
    );
  }

  // Seed default admin and employee users if not exists
  const admin = await dbGet("SELECT * FROM users WHERE email = ?", ["admin@hrmotion.ai"]);
  if (!admin) {
    const defaultHash = await bcrypt.hash("admin123", 10);
    await dbRun(
      "INSERT INTO users (full_name, email, password_hash, org_name, role, avatar) VALUES (?, ?, ?, ?, ?, ?)",
      ["Sarah Jenkins", "admin@hrmotion.ai", defaultHash, "Acme Motion Corp", "HR Executive Admin", "SJ"]
    );
  }

  const empUser = await dbGet("SELECT * FROM users WHERE email = ?", ["alex.rivera@hrmotion.ai"]);
  if (!empUser) {
    const defaultHash = await bcrypt.hash("admin123", 10);
    await dbRun(
      "INSERT INTO users (full_name, email, password_hash, org_name, role, avatar) VALUES (?, ?, ?, ?, ?, ?)",
      ["Alex Rivera", "alex.rivera@hrmotion.ai", defaultHash, "Acme Motion Corp", "Employee Lead", "AR"]
    );
  }

  // Seed default employees if empty
  const empCount = await dbGet("SELECT COUNT(*) as count FROM employees");
  if (empCount && empCount.count === 0) {
    const seedEmployees = [
      { id: "EMP-101", name: "Alex Rivera", department: "Engineering", role: "Senior Frontend Engineer", email: "alex.rivera@hrmotion.ai", workload_score: 88, burnout_risk: "High", leave_balance: 14, avatar: "AR" },
      { id: "EMP-102", name: "Jessica Taylor", department: "Product", role: "Principal Product Manager", email: "jessica.t@hrmotion.ai", workload_score: 65, burnout_risk: "Moderate", leave_balance: 18, avatar: "JT" },
      { id: "EMP-103", name: "David Chen", department: "Data Science", role: "AI Research Lead", email: "david.chen@hrmotion.ai", workload_score: 92, burnout_risk: "Critical", leave_balance: 5, avatar: "DC" },
      { id: "EMP-104", name: "Sophia Patel", department: "People Operations", role: "HR Operations Lead", email: "sophia.p@hrmotion.ai", workload_score: 42, burnout_risk: "Low", leave_balance: 22, avatar: "SP" },
      { id: "EMP-105", name: "Marcus Vance", department: "Sales", role: "Enterprise Account Exec", email: "marcus.vance@hrmotion.ai", workload_score: 74, burnout_risk: "Moderate", leave_balance: 12, avatar: "MV" },
      { id: "EMP-106", name: "Emily Watson", department: "Design", role: "Lead Product Designer", email: "emily.w@hrmotion.ai", workload_score: 55, burnout_risk: "Low", leave_balance: 19, avatar: "EW" }
    ];

    for (const emp of seedEmployees) {
      await dbRun(
        "INSERT INTO employees (id, name, department, role, email, workload_score, burnout_risk, leave_balance, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [emp.id, emp.name, emp.department, emp.role, emp.email, emp.workload_score, emp.burnout_risk, emp.leave_balance, emp.avatar]
      );
    }
  }
}

// Call init on module import
initDb().catch((err) => console.error("Database initialization error:", err));

export default db;
