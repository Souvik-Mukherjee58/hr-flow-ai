import express from "express";
import { dbAll, dbGet, dbRun } from "../db.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get active manual policy document attachment
router.get("/policy", async (req, res) => {
  try {
    const policy = await dbGet("SELECT * FROM company_policies ORDER BY id DESC LIMIT 1");
    return res.status(200).json({
      success: true,
      policy: policy || {
        title: "Corporate Leave Policy & Emergency Guidelines v2.4",
        max_standard_days: 3,
        document_name: "Company_Leave_Policy_Doc_2026.pdf",
        content: "Standard employee leave requests are strictly capped at a maximum of 3 days. Leaves > 3 days auto-rejected unless Emergency Exception applies."
      }
    });
  } catch (err) {
    console.error("Error fetching policy:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch policy document", error: err.message });
  }
});

// Update manual policy document attachment
router.post("/policy", async (req, res) => {
  try {
    const { title, maxStandardDays, documentName, content } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, message: "Policy document content is required." });
    }

    const result = await dbRun(
      "INSERT INTO company_policies (title, max_standard_days, document_name, content) VALUES (?, ?, ?, ?)",
      [
        title || "Corporate Leave Policy & Emergency Guidelines v2.4",
        parseInt(maxStandardDays) || 3,
        documentName || "Company_Leave_Policy_Doc_2026.pdf",
        content
      ]
    );

    return res.status(201).json({ success: true, message: "Manual policy document attachment updated successfully.", id: result.id });
  } catch (err) {
    console.error("Error updating policy:", err);
    return res.status(500).json({ success: false, message: "Failed to update policy document", error: err.message });
  }
});

// Get HR Pending Review Queue (Requests requiring human approval)
router.get("/leave/pending-hr", async (req, res) => {
  try {
    const pending = await dbAll("SELECT * FROM leave_requests WHERE hr_decision = 'Pending' ORDER BY created_at DESC");
    return res.status(200).json({ success: true, count: pending.length, pending });
  } catch (err) {
    console.error("Error fetching pending HR queue:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch HR review queue", error: err.message });
  }
});

// Submit Human HR Decision (Approve or Reject override)
router.post("/leave/hr-decision", async (req, res) => {
  try {
    const { workflowId, decision, notes, reviewerName } = req.body; // decision = 'Approved' or 'Rejected'
    if (!workflowId || !decision) {
      return res.status(400).json({ success: false, message: "Workflow ID and Decision (Approved/Rejected) are required." });
    }

    const finalStatus = decision === "Approved" ? "APPROVED_BY_HR" : "REJECTED_BY_HR";

    await dbRun(
      "UPDATE leave_requests SET hr_decision = ?, status = ?, hr_notes = ?, hr_reviewer = ? WHERE workflow_id = ?",
      [decision, finalStatus, notes || "Human HR review decision recorded.", reviewerName || "HR Admin", workflowId]
    );

    await dbRun(
      "INSERT INTO audit_logs (workflow_id, action, details) VALUES (?, ?, ?)",
      [
        workflowId,
        `HUMAN_HR_${decision.toUpperCase()}`,
        JSON.stringify({
          reviewer: reviewerName || "HR Admin",
          decision: decision,
          notes: notes || "Human HR decision applied."
        })
      ]
    );

    return res.status(200).json({
      success: true,
      message: `Human HR Decision successfully recorded: ${decision}`,
      workflowId,
      status: finalStatus
    });
  } catch (err) {
    console.error("Error processing HR decision:", err);
    return res.status(500).json({ success: false, message: "Failed to record HR decision", error: err.message });
  }
});

// Get all employees
router.get("/employees", async (req, res) => {
  try {
    const employees = await dbAll("SELECT * FROM employees ORDER BY name ASC");
    return res.status(200).json({ success: true, count: employees.length, employees });
  } catch (err) {
    console.error("Error fetching employees:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch employees", error: err.message });
  }
});

// Add new employee
router.post("/employees", async (req, res) => {
  try {
    const { name, department, role, email, workload_score, burnout_risk, leave_balance } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: "Name and Email are required" });
    }

    const empId = `EMP-${Math.floor(100 + Math.random() * 900)}`;
    const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "EP";

    await dbRun(
      "INSERT INTO employees (id, name, department, role, email, workload_score, burnout_risk, leave_balance, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [empId, name, department || "General", role || "Team Member", email, workload_score || 50, burnout_risk || "Low", leave_balance || 20, initials]
    );

    return res.status(201).json({ success: true, message: "Employee added successfully", employeeId: empId });
  } catch (err) {
    console.error("Error adding employee:", err);
    return res.status(500).json({ success: false, message: "Failed to add employee", error: err.message });
  }
});

// Get leave history
router.get("/leave/history", async (req, res) => {
  try {
    const history = await dbAll("SELECT * FROM leave_requests ORDER BY created_at DESC");
    return res.status(200).json({ success: true, count: history.length, history });
  } catch (err) {
    console.error("Error fetching leave history:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch leave history", error: err.message });
  }
});

// Get overview analytics
router.get("/analytics", async (req, res) => {
  try {
    const totalEmployees = await dbGet("SELECT COUNT(*) as count FROM employees");
    const leaveCount = await dbGet("SELECT COUNT(*) as count FROM leave_requests");
    const pendingHr = await dbGet("SELECT COUNT(*) as count FROM leave_requests WHERE hr_decision = 'Pending'");
    const highBurnout = await dbGet("SELECT COUNT(*) as count FROM employees WHERE burnout_risk IN ('High', 'Critical')");

    return res.status(200).json({
      success: true,
      analytics: {
        totalEmployees: totalEmployees?.count || 0,
        leaveRequestsCount: leaveCount?.count || 0,
        pendingHrReviewCount: pendingHr?.count || 0,
        highBurnoutRiskCount: highBurnout?.count || 0,
        aiAccuracy: "97.4%",
        averageWorkload: 68
      }
    });
  } catch (err) {
    console.error("Error fetching analytics:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch analytics", error: err.message });
  }
});

export default router;
