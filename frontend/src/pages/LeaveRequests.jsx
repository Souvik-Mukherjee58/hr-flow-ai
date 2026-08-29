import { useState, useEffect } from "react";
import { processLeaveRequest, fetchEmployees, fetchLeaveHistory, fetchPolicyDocument } from "../services/api";
import PolicyDocumentModal from "../components/PolicyDocumentModal";

export default function LeaveRequests() {
  const [employees, setEmployees] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [policy, setPolicy] = useState(null);
  const [showPolicyDoc, setShowPolicyDoc] = useState(false);

  // Leave Form State
  const [formData, setFormData] = useState({
    employeeId: "EMP-101",
    employeeName: "Alex Rivera",
    leaveType: "Vacation",
    days: 5,
    isEmergency: false,
    reason: "Applying for 5 days personal vacation time",
  });

  const [activeStep, setActiveStep] = useState(0); // For live multi-agent DAG visualizer
  const [result, setResult] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [empRes, histRes, polRes] = await Promise.all([
        fetchEmployees().catch(() => ({ employees: [] })),
        fetchLeaveHistory().catch(() => ({ history: [] })),
        fetchPolicyDocument().catch(() => ({ policy: null })),
      ]);
      setEmployees(empRes.employees || []);
      setHistory(histRes.history || []);
      if (polRes.policy) setPolicy(polRes.policy);
    } catch (err) {
      console.error("Error loading leave center data:", err);
    }
  };

  const agents = [
    { name: "Policy Agent", icon: "🛡️", desc: "Checking attached 3-day policy document & emergency exception rules" },
    { name: "Workload Agent", icon: "📊", desc: "Calculating team capacity & workload disruption impact" },
    { name: "Burnout Agent", icon: "🔥", desc: "Evaluating employee burnout risk score & fatigue index" },
    { name: "Recommendation Agent", icon: "🧠", desc: "Synthesizing multi-agent reasoning & decision criteria" },
    { name: "Email Agent", icon: "✉️", desc: "Formatting automated email notification & HR routing digest" },
    { name: "Audit Agent", icon: "📑", desc: "Writing immutable audit trail into SQLite database" },
  ];

  const maxPolicyDays = policy?.max_standard_days || 3;
  const isOverPolicy = formData.days > maxPolicyDays;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setActiveStep(1);

    // Animated step-by-step progress
    const timer = setInterval(() => {
      setActiveStep((prev) => {
        if (prev >= agents.length) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, 400);

    try {
      const res = await processLeaveRequest(formData);
      clearInterval(timer);
      setActiveStep(6);
      setResult(res);
      fetchLeaveHistory().then((h) => setHistory(h.history || []));
    } catch (err) {
      clearInterval(timer);
      setActiveStep(0);
      alert("Error processing leave request: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="leave-center-container">
      {/* Top Banner: Policy Document Info & Viewer Modal Trigger */}
      <div className="policy-doc-attached-bar">
        <div className="policy-doc-info">
          <span className="policy-badge-icon">📄 ATTACHED POLICY DOC</span>
          <div>
            <h4>{policy?.title || "Corporate Leave Policy & Emergency Guidelines v2.4"}</h4>
            <p>
              Standard Leave Cap: <strong>{maxPolicyDays} Days Max</strong> • Requests exceeding {maxPolicyDays} days (e.g. 5 days) are <strong>AUTOMATICALLY REJECTED</strong> unless Emergency Exception applies.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn-view-pdf-doc"
          onClick={() => setShowPolicyDoc(true)}
        >
          🔍 View Attached Policy PDF
        </button>
      </div>

      <div className="leave-main-grid">
        {/* Left: Interactive Submission Form */}
        <div className="panel-card leave-form-panel">
          <div className="panel-header">
            <div>
              <h3>⚡ Apply for Leave & AI Policy Verification</h3>
              <p>Triggers real-time LangGraph multi-agent decision flow</p>
            </div>
            <span className="live-pill">Live Rules Engine</span>
          </div>

          <form onSubmit={handleSubmit} className="leave-form">
            <div className="form-field">
              <label>Select Team Member</label>
              <select
                value={formData.employeeId}
                onChange={(e) => {
                  const sel = employees.find((emp) => emp.id === e.target.value);
                  setFormData({
                    ...formData,
                    employeeId: e.target.value,
                    employeeName: sel ? sel.name : formData.employeeName,
                  });
                }}
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} — {emp.role} ({emp.department})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row-2">
              <div className="form-field">
                <label>Leave Category</label>
                <select
                  value={formData.leaveType}
                  onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                >
                  <option value="Vacation">Annual Paid Vacation</option>
                  <option value="Sick Leave">Sick / Medical Leave</option>
                  <option value="Paternity">Family / Parental Leave</option>
                  <option value="Mental Health">Mental Health Reset</option>
                  <option value="Emergency">Emergency Leave</option>
                </select>
              </div>

              <div className="form-field">
                <label>Duration (Days)</label>
                <div className="days-input-wrapper">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.days}
                    onChange={(e) => setFormData({ ...formData, days: parseInt(e.target.value) || 1 })}
                  />
                  <span className="days-label">Days</span>
                </div>
              </div>
            </div>

            {/* Modern Priority / Urgency Protocol Switch Card */}
            <div className={`priority-protocol-card ${formData.isEmergency ? "active" : ""}`}>
              <div className="priority-header">
                <div className="priority-title-group">
                  <div className="priority-icon-wrapper">
                    <span className="priority-pulse-icon">⚡</span>
                  </div>
                  <div className="priority-text">
                    <strong>Priority & Urgent Escalation Protocol</strong>
                    <p>Enable priority routing for urgent medical, family emergency, or critical situations</p>
                  </div>
                </div>
                <label className="custom-switch" title="Toggle Priority Escalation">
                  <input
                    type="checkbox"
                    checked={formData.isEmergency}
                    onChange={(e) => setFormData({ ...formData, isEmergency: e.target.checked })}
                  />
                  <span className="switch-slider"></span>
                </label>
              </div>
            </div>

            {/* AI Policy Compliance Radar Card */}
            <div className={`policy-radar-card ${isOverPolicy ? (formData.isEmergency ? "priority-override" : "cap-exceeded") : "cap-verified"}`}>
              {isOverPolicy ? (
                formData.isEmergency ? (
                  <div className="radar-content">
                    <div className="radar-header-row">
                      <span className="radar-status-badge priority">
                        <span className="badge-dot">●</span> PRIORITY EXCEPTION ROUTE ACTIVE
                      </span>
                      <span className="radar-metric">{formData.days} Days &gt; {maxPolicyDays}d Limit</span>
                    </div>
                    <div className="radar-details">
                      <h4>Accelerated HR Approval Pathway</h4>
                      <p>
                        Duration of <strong>{formData.days} Days</strong> exceeds standard limit ({maxPolicyDays}d max). Priority Escalation is active — AI grants priority exception and routes to Human HR review.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="radar-content">
                    <div className="radar-header-row">
                      <span className="radar-status-badge alert">
                        <span className="badge-dot">●</span> POLICY CAP THRESHOLD EXCEEDED
                      </span>
                      <span className="radar-metric">{formData.days} Days &gt; {maxPolicyDays}d Limit</span>
                    </div>
                    <div className="radar-details">
                      <h4>Automatic Policy Rejection Alert</h4>
                      <p>
                        Requested duration (<strong>{formData.days} Days</strong>) exceeds the standard company limit of {maxPolicyDays} days. Request will auto-reject unless Priority Protocol is enabled.
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <div className="radar-content">
                  <div className="radar-header-row">
                    <span className="radar-status-badge verified">
                      <span className="badge-dot">●</span> STANDARD POLICY VERIFIED
                    </span>
                    <span className="radar-metric">{formData.days} / {maxPolicyDays} Days Max</span>
                  </div>
                  <div className="radar-details">
                    <h4>Compliant Duration Limit</h4>
                    <p>
                      Request is within standard policy limits and clear for multi-agent workload and capacity evaluation.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="form-field">
              <label>Reason / Detailed Justification</label>
              <textarea
                rows="3"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Describe reason for leave..."
                required
              ></textarea>
            </div>

            {/* Quick Demo Test Scenario Buttons */}
            <div className="demo-preset-buttons">
              <span className="preset-title">⚡ Quick Demo Test Scenarios:</span>
              <div className="preset-btn-group">
                <button
                  type="button"
                  className="btn-preset reject"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      days: 5,
                      isEmergency: false,
                      reason: "Taking 5 days leave for personal vacation travel.",
                    })
                  }
                >
                  🔴 Test 5 Days (Auto-Reject)
                </button>

                <button
                  type="button"
                  className="btn-preset emergency"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      days: 5,
                      isEmergency: true,
                      reason: "Urgent medical emergency hospitalization and casualty care required.",
                    })
                  }
                >
                  🚨 Test 5 Days (Emergency Exception)
                </button>

                <button
                  type="button"
                  className="btn-preset approve"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      days: 2,
                      isEmergency: false,
                      reason: "2 days short leave for routine doctor checkup.",
                    })
                  }
                >
                  🟢 Test 2 Days (Standard Compliant)
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary-gradient" disabled={loading}>
              {loading ? "Multi-Agent Graph Pipeline Processing..." : "Execute AI Policy Decision Workflow ➔"}
            </button>
          </form>
        </div>

        {/* Right: Live Agent Pipeline Execution Visualizer */}
        <div className="panel-card pipeline-panel">
          <div className="panel-header">
            <div>
              <h3>🤖 Multi-Agent Directed Execution Graph</h3>
              <p>LangGraph Real-Time Agent Execution Pipeline</p>
            </div>
          </div>

          <div className="agents-pipeline-list">
            {agents.map((agent, idx) => {
              const isDone = activeStep > idx + 1 || (result && activeStep === 6);
              const isActive = activeStep === idx + 1;
              return (
                <div
                  key={idx}
                  className={`pipeline-step ${isDone ? "completed" : isActive ? "active" : "pending"}`}
                >
                  <div className="step-icon">{agent.icon}</div>
                  <div className="step-content">
                    <div className="step-name">{agent.name}</div>
                    <small>{agent.desc}</small>
                  </div>
                  <div className="step-status">
                    {isDone ? (
                      <span className="status-check">✅</span>
                    ) : isActive ? (
                      <span className="spinner-sm"></span>
                    ) : (
                      <span className="status-lock">🔒</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Result Card Display */}
      {result && (
        <div className="results-wrapper">
          <div className={`result-main-banner ${result.policy?.autoRejected ? "rejected-banner" : result.policy?.isEmergency ? "emergency-banner" : "approved-banner"}`}>
            <div className="result-banner-left">
              <span className="workflow-id-pill">Workflow #{result.workflowId}</span>
              <h2>
                {result.policy?.autoRejected
                  ? "🔴 Request Auto-Rejected by Company Policy"
                  : result.policy?.isEmergency
                  ? "🚨 Emergency Exception Granted ➔ Forwarded to HR"
                  : "🟢 AI Approved ➔ Queued for Human HR Decision"}
              </h2>
              <p className="result-reason-detail">{result.policy?.reason}</p>
            </div>
            <div className="processing-badge">⚡ Processed in {result.processingTime}</div>
          </div>

          <div className="results-grid">
            <div className="result-card">
              <h4>🛡️ Policy Agent Evaluation</h4>
              <div className={`result-val ${result.policy?.approved ? "text-green" : "text-red"}`}>
                {result.policy?.approved ? "Policy Pass" : "Auto-Rejected"}
              </div>
              <p>Document: {result.policy?.documentName || "Company_Leave_Policy_Doc_2026.pdf"}</p>
              <small>{result.policy?.reason}</small>
            </div>

            <div className="result-card">
              <h4>📊 Workload Agent Analysis</h4>
              <div className="result-val">Score: {result.workload?.workloadScore}/100</div>
              <p>Capacity Impact: {result.workload?.impact}</p>
              <small>Disruption Risk: {result.workload?.risk}</small>
            </div>

            <div className="result-card">
              <h4>🔥 Burnout Risk Agent</h4>
              <div className="result-val">Score: {result.burnout?.score}/100</div>
              <p>Burnout Level: {result.burnout?.burnoutRisk}</p>
              <small>{result.burnout?.reason}</small>
            </div>

            <div className="result-card">
              <h4>👤 Human HR Website Action</h4>
              <div className="result-val">
                {result.policy?.autoRejected ? "No HR Action Needed" : "Pending Human HR Decision"}
              </div>
              <p>{result.policy?.autoRejected ? "Auto-Rejected at Policy Layer" : "Queued in HR Review Portal"}</p>
              <small>HR Decision Hub available in HR Website view.</small>
            </div>
          </div>
        </div>
      )}

      {/* Persistent History Table */}
      <div className="panel-card history-panel mt-4">
        <div className="panel-header">
          <div>
            <h3>📑 Submitted Leave Requests History</h3>
            <p>Real-time records stored in SQLite database</p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Workflow ID</th>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>Days Requested</th>
                <th>Policy & Emergency Status</th>
                <th>Human HR Decision</th>
                <th>Submitted At</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? (
                history.map((row) => {
                  const exceedsLimit = row.days > maxPolicyDays;
                  const isEmergency = row.is_emergency === 1;
                  const isAutoRejected = row.status === "AUTO_REJECTED";
                  return (
                    <tr key={row.workflow_id}>
                      <td><code>{row.workflow_id}</code></td>
                      <td><strong>{row.employee_name}</strong></td>
                      <td>{row.leave_type}</td>
                      <td>
                        <strong className={exceedsLimit ? "text-red" : "text-green"}>
                          {row.days} Days
                        </strong>
                      </td>
                      <td>
                        {isAutoRejected ? (
                          <span className="badge-auto-rejected">❌ Auto-Rejected (5d &gt; 3d Cap)</span>
                        ) : isEmergency ? (
                          <span className="badge-emergency">🚨 Emergency Exception</span>
                        ) : (
                          <span className="badge-policy-ok">✅ Standard Limit (&le;3d)</span>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge-pill ${row.status.toLowerCase()}`}>
                          {row.status === "AUTO_REJECTED"
                            ? "Auto Rejected"
                            : row.status === "APPROVED_BY_HR"
                            ? "Approved by HR"
                            : row.status === "REJECTED_BY_HR"
                            ? "Rejected by HR"
                            : "Pending HR Review"}
                        </span>
                      </td>
                      <td><small>{new Date(row.created_at).toLocaleString()}</small></td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-4">No requests found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Policy Document Modal Viewer */}
      {showPolicyDoc && (
        <PolicyDocumentModal
          onClose={() => setShowPolicyDoc(false)}
          isHrAdmin={false}
        />
      )}
    </div>
  );
}
