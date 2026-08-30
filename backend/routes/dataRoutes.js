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

// Get Calendar Events & Team Availability Overlap Analysis
router.get("/calendar/events", async (req, res) => {
  try {
    const rawLeaves = await dbAll(`
      SELECT 
        l.workflow_id, l.employee_id, l.employee_name, l.leave_type, l.days,
        l.reason, l.status, l.recommendation, l.max_policy_days, l.is_emergency,
        l.requires_human_approval, l.hr_decision, l.hr_notes, l.hr_reviewer,
        l.start_date, l.end_date, l.created_at,
        e.department, e.role, e.avatar, e.workload_score, e.burnout_risk, e.leave_balance, e.email
      FROM leave_requests l
      LEFT JOIN employees e ON l.employee_id = e.id
      ORDER BY l.start_date ASC, l.created_at DESC
    `);

    const employees = await dbAll("SELECT * FROM employees ORDER BY name ASC");

    const todayStr = new Date().toISOString().split("T")[0];

    // Normalize dates if missing in older records
    const events = rawLeaves.map((item, idx) => {
      let start = item.start_date;
      let end = item.end_date;
      if (!start) {
        const d = new Date();
        d.setDate(d.getDate() + ((idx % 7) + 1));
        start = d.toISOString().split("T")[0];
      }
      if (!end) {
        const d = new Date(start);
        d.setDate(d.getDate() + Math.max(0, (item.days || 1) - 1));
        end = d.toISOString().split("T")[0];
      }

      return {
        ...item,
        start_date: start,
        end_date: end,
        department: item.department || "Engineering",
        role: item.role || "Team Member",
        avatar: item.avatar || (item.employee_name ? item.employee_name.slice(0, 2).toUpperCase() : "EM"),
        burnout_risk: item.burnout_risk || "Low",
        workload_score: item.workload_score || 50,
      };
    });

    // Detect Department Overlaps & Collisions by Date
    const dateDeptMap = {}; // { "YYYY-MM-DD": { "Engineering": [empName1, empName2] } }
    events.forEach((ev) => {
      // Only consider approved or pending leaves
      if (ev.status === "AUTO_REJECTED" || ev.hr_decision === "Rejected") return;

      const cur = new Date(ev.start_date);
      const end = new Date(ev.end_date);
      // Loop across date span
      while (cur <= end) {
        const dStr = cur.toISOString().split("T")[0];
        if (!dateDeptMap[dStr]) dateDeptMap[dStr] = {};
        if (!dateDeptMap[dStr][ev.department]) dateDeptMap[dStr][ev.department] = [];
        dateDeptMap[dStr][ev.department].push({
          id: ev.employee_id,
          name: ev.employee_name,
          workflowId: ev.workflow_id,
          role: ev.role,
        });
        cur.setDate(cur.getDate() + 1);
      }
    });

    const overlaps = [];
    Object.keys(dateDeptMap).forEach((dStr) => {
      const depts = dateDeptMap[dStr];
      Object.keys(depts).forEach((dept) => {
        const emps = depts[dept];
        if (emps.length >= 2) {
          const totalInDept = employees.filter((e) => e.department === dept).length || 2;
          const capacityLostPct = Math.min(100, Math.round((emps.length / totalInDept) * 100));
          overlaps.push({
            date: dStr,
            department: dept,
            count: emps.length,
            employees: emps.map((e) => e.name),
            capacityLostPct,
            severity: capacityLostPct >= 50 ? "Critical" : "Warning",
            description: `${emps.length} ${dept} members scheduled off simultaneously (${emps.map((e) => e.name).join(", ")}). Capacity down by ${capacityLostPct}%.`,
          });
        }
      });
    });

    // Department Capacity & Coverage Summary
    const departments = [...new Set(employees.map((e) => e.department))];
    const departmentCoverage = departments.map((dept) => {
      const totalStaff = employees.filter((e) => e.department === dept).length;
      const deptLeaves = events.filter(
        (ev) =>
          ev.department === dept &&
          ev.status !== "AUTO_REJECTED" &&
          ev.hr_decision !== "Rejected" &&
          todayStr >= ev.start_date &&
          todayStr <= ev.end_date
      );
      const onLeaveCount = deptLeaves.length;
      const availableStaff = Math.max(0, totalStaff - onLeaveCount);
      const coveragePct = totalStaff > 0 ? Math.round((availableStaff / totalStaff) * 100) : 100;

      return {
        department: dept,
        totalStaff,
        currentlyAway: onLeaveCount,
        availableStaff,
        coveragePct,
        status: coveragePct < 60 ? "Critical" : coveragePct < 85 ? "Warning" : "Optimal",
      };
    });

    // Summary KPIs
    const onLeaveTodayCount = events.filter(
      (ev) =>
        ev.status !== "AUTO_REJECTED" &&
        ev.hr_decision !== "Rejected" &&
        todayStr >= ev.start_date &&
        todayStr <= ev.end_date
    ).length;

    const totalStaffCount = employees.length || 1;
    const overallAvailability = Math.max(0, Math.round(((totalStaffCount - onLeaveTodayCount) / totalStaffCount) * 100));

    return res.status(200).json({
      success: true,
      summary: {
        totalEvents: events.length,
        onLeaveToday: onLeaveTodayCount,
        totalEmployees: totalStaffCount,
        overallAvailability: `${overallAvailability}%`,
        totalCollisions: overlaps.length,
      },
      departmentCoverage,
      overlaps,
      events,
    });
  } catch (err) {
    console.error("Error generating calendar events:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch calendar events", error: err.message });
  }
});

export default router;

