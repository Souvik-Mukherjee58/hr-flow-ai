import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "database.db");

const db = new Database(dbPath);
console.log("Connected to SQLite database at", dbPath);

// Helper for promise-based queries (better-sqlite3 is synchronous, wrapping for compatibility)
export function dbRun(sql, params = []) {
  const stmt = db.prepare(sql);
  const result = stmt.run(params);
  return Promise.resolve({ id: result.lastInsertRowid, changes: result.changes });
}

export function dbGet(sql, params = []) {
  const stmt = db.prepare(sql);
  const result = stmt.get(params);
  return Promise.resolve(result);
}

export function dbAll(sql, params = []) {
  const stmt = db.prepare(sql);
  const result = stmt.all(params);
  return Promise.resolve(result);
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
      start_date TEXT,
      end_date TEXT,
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
  try {
    await dbRun("ALTER TABLE leave_requests ADD COLUMN start_date TEXT");
  } catch (e) {}
  try {
    await dbRun("ALTER TABLE leave_requests ADD COLUMN end_date TEXT");
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

  // Seed default leave requests for calendar display if empty
  const leaveCount = await dbGet("SELECT COUNT(*) as count FROM leave_requests");
  if (leaveCount && leaveCount.count === 0) {
    const today = new Date();
    const fmt = (d) => d.toISOString().split("T")[0];
    const addDays = (d, n) => {
      const copy = new Date(d);
      copy.setDate(copy.getDate() + n);
      return copy;
    };

    const seedLeaves = [
      {
        workflow_id: "WF-CAL-101",
        employee_id: "EMP-101",
        employee_name: "Alex Rivera",
        leave_type: "Vacation",
        days: 3,
        reason: "Mid-year mental refresh & family visit",
        status: "APPROVED_BY_HR",
        recommendation: "APPROVED",
        max_policy_days: 3,
        is_emergency: 0,
        requires_human_approval: 1,
        hr_decision: "Approved",
        hr_notes: "Approved by HR Admin. Team coverage confirmed.",
        hr_reviewer: "Sarah Jenkins",
        start_date: fmt(addDays(today, 1)),
        end_date: fmt(addDays(today, 3)),
      },
      {
        workflow_id: "WF-CAL-102",
        employee_id: "EMP-103",
        employee_name: "David Chen",
        leave_type: "Emergency Leave",
        days: 4,
        reason: "Medical surgery and recovery",
        status: "APPROVED_BY_HR",
        recommendation: "APPROVED_EMERGENCY_EXCEPTION",
        max_policy_days: 3,
        is_emergency: 1,
        requires_human_approval: 1,
        hr_decision: "Approved",
        hr_notes: "Emergency policy exception granted per doctor's certification.",
        hr_reviewer: "Sarah Jenkins",
        start_date: fmt(addDays(today, 2)),
        end_date: fmt(addDays(today, 5)),
      },
      {
        workflow_id: "WF-CAL-103",
        employee_id: "EMP-102",
        employee_name: "Jessica Taylor",
        leave_type: "Casual Leave",
        days: 2,
        reason: "Personal family event",
        status: "APPROVED_BY_HR",
        recommendation: "APPROVED",
        max_policy_days: 3,
        is_emergency: 0,
        requires_human_approval: 1,
        hr_decision: "Approved",
        hr_notes: "Sprint roadmap milestone concluded.",
        hr_reviewer: "Sarah Jenkins",
        start_date: fmt(addDays(today, 7)),
        end_date: fmt(addDays(today, 8)),
      },
      {
        workflow_id: "WF-CAL-104",
        employee_id: "EMP-105",
        employee_name: "Marcus Vance",
        leave_type: "Sick Leave",
        days: 2,
        reason: "Seasonal flu recovery",
        status: "APPROVED_BY_HR",
        recommendation: "APPROVED",
        max_policy_days: 3,
        is_emergency: 0,
        requires_human_approval: 1,
        hr_decision: "Approved",
        hr_notes: "Approved.",
        hr_reviewer: "Sarah Jenkins",
        start_date: fmt(addDays(today, -3)),
        end_date: fmt(addDays(today, -2)),
      },
      {
        workflow_id: "WF-CAL-105",
        employee_id: "EMP-106",
        employee_name: "Emily Watson",
        leave_type: "Vacation",
        days: 3,
        reason: "Annual design conference & PTO",
        status: "Pending",
        recommendation: "FORWARDED_TO_HR",
        max_policy_days: 3,
        is_emergency: 0,
        requires_human_approval: 1,
        hr_decision: "Pending",
        hr_notes: null,
        hr_reviewer: null,
        start_date: fmt(addDays(today, 10)),
        end_date: fmt(addDays(today, 12)),
      },
      {
        workflow_id: "WF-CAL-106",
        employee_id: "EMP-104",
        employee_name: "Sophia Patel",
        leave_type: "Personal Leave",
        days: 1,
        reason: "Personal appointment",
        status: "APPROVED_BY_HR",
        recommendation: "APPROVED",
        max_policy_days: 3,
        is_emergency: 0,
        requires_human_approval: 1,
        hr_decision: "Approved",
        hr_notes: "Approved.",
        hr_reviewer: "Sarah Jenkins",
        start_date: fmt(addDays(today, 14)),
        end_date: fmt(addDays(today, 14)),
      }
    ];

    for (const l of seedLeaves) {
      await dbRun(
        `INSERT INTO leave_requests (
          workflow_id, employee_id, employee_name, leave_type, days, reason, 
          status, recommendation, max_policy_days, is_emergency, requires_human_approval, 
          hr_decision, hr_notes, hr_reviewer, start_date, end_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          l.workflow_id, l.employee_id, l.employee_name, l.leave_type, l.days, l.reason,
          l.status, l.recommendation, l.max_policy_days, l.is_emergency, l.requires_human_approval,
          l.hr_decision, l.hr_notes, l.hr_reviewer, l.start_date, l.end_date
        ]
      );
    }
  }
}

// Call init on module import
initDb().catch((err) => console.error("Database initialization error:", err));

export default db;
