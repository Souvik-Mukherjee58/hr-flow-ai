import express from "express";
import { graph } from "../graph/graph.js";
import { dbRun } from "../db.js";

const router = express.Router();

router.post("/leave", async (req, res) => {
  const start = Date.now();
  const workflowId = `WF-${Date.now()}`;

  try {
    const result = await graph.invoke({
      leaveRequest: req.body,
    });

    const end = Date.now();

    const policy = result.policy || {};
    const rec = result.recommendation || {};

    const isAutoRejected = policy.autoRejected === true || policy.approved === false;
    const isEmergency = policy.isEmergency === true ? 1 : 0;
    const requiresHuman = isAutoRejected ? 0 : 1;
    const hrStatus = isAutoRejected ? "AUTO_REJECTED" : "Pending";

    // Save to SQLite database
    try {
      await dbRun(
        "INSERT INTO leave_requests (workflow_id, employee_id, employee_name, leave_type, days, reason, status, recommendation, max_policy_days, is_emergency, requires_human_approval, hr_decision) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          workflowId,
          result.leaveRequest?.employeeId || "EMP-101",
          result.leaveRequest?.employeeName || "Employee",
          result.leaveRequest?.leaveType || "Vacation",
          result.leaveRequest?.days || 1,
          result.leaveRequest?.reason || "Leave request",
          hrStatus,
          rec.finalDecision || (isAutoRejected ? "REJECTED" : "PENDING_HR_DECISION"),
          policy.maxStandardDays || 3,
          isEmergency,
          requiresHuman,
          hrStatus,
        ]
      );

      await dbRun(
        "INSERT INTO audit_logs (workflow_id, action, details) VALUES (?, ?, ?)",
        [
          workflowId,
          isAutoRejected ? "AUTO_REJECTED_POLICY_CAP" : "FORWARDED_HUMAN_HR_REVIEW",
          JSON.stringify({
            policyMatch: policy.policyMatched,
            days: result.leaveRequest?.days,
            isEmergency: Boolean(isEmergency),
            autoRejected: isAutoRejected,
            requiresHumanApproval: Boolean(requiresHuman),
          }),
        ]
      );
    } catch (dbErr) {
      console.error("DB log error:", dbErr.message);
    }

    res.status(200).json({
      success: true,
      workflowId,
      message: isAutoRejected
        ? "Leave request auto-rejected per 3-day policy document rule"
        : "Leave request evaluated by AI & queued for Human HR Review",
      processingTime: `${end - start} ms`,
      employee: result.leaveRequest,
      policy: result.policy,
      workload: result.workload,
      burnout: result.burnout,
      recommendation: result.recommendation,
      email: result.email,
      audit: result.audit,
    });
  } catch (err) {
    console.error("AI Workflow Error:", err);
    res.status(500).json({
      success: false,
      workflowId,
      message: "Failed to process leave request",
      error: err.message,
    });
  }
});

export default router;