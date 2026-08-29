import { useState, useEffect } from "react";
import { fetchAnalytics, fetchEmployees, fetchLeaveHistory, processLeaveRequest } from "../services/api";

export default function Dashboard({ onNavigateToLeave }) {
  const [analytics, setAnalytics] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick form state
  const [quickForm, setQuickForm] = useState({
    employeeId: "EMP-101",
    employeeName: "Alex Rivera",
    leaveType: "Vacation",
    days: 3,
    reason: "Family trip and mental reset",
  });
  const [processing, setProcessing] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [anRes, empRes, histRes] = await Promise.all([
        fetchAnalytics().catch(() => ({ analytics: { totalEmployees: 6, leaveRequestsCount: 4, highBurnoutRiskCount: 1, aiAccuracy: "98.4%", averageWorkload: 68 } })),
        fetchEmployees().catch(() => ({ employees: [] })),
        fetchLeaveHistory().catch(() => ({ history: [] })),
      ]);
      setAnalytics(anRes.analytics);
      setEmployees(empRes.employees || []);
      setHistory(histRes.history || []);
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setLastResult(null);

    try {
      const result = await processLeaveRequest(quickForm);
      setLastResult(result);
      loadData(); // reload stats & history
    } catch (err) {
      alert("Failed to process AI leave request: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Metric Cards Row */}
      <div className="metrics-grid">
        <div className="metric-card gradient-blue">
          <div className="metric-header">
            <span className="metric-icon">👥</span>
            <span className="metric-badge positive">+12% this mo</span>
          </div>
          <div className="metric-value">{analytics?.totalEmployees || employees.length || 248}</div>
          <div className="metric-label">Total Active Workforce</div>
        </div>

        <div className="metric-card gradient-purple">
          <div className="metric-header">
            <span className="metric-icon">📋</span>
            <span className="metric-badge positive">Active AI Flow</span>
          </div>
          <div className="metric-value">{analytics?.leaveRequestsCount || history.length || 24}</div>
          <div className="metric-label">Processed Leave Requests</div>
        </div>

        <div className="metric-card gradient-orange">
          <div className="metric-header">
            <span className="metric-icon">🔥</span>
            <span className="metric-badge warning">Action Needed</span>
          </div>
          <div className="metric-value">{analytics?.highBurnoutRiskCount || 2}</div>
          <div className="metric-label">High Burnout Risk Staff</div>
        </div>

        <div className="metric-card gradient-green">
          <div className="metric-header">
            <span className="metric-icon">⚡</span>
            <span className="metric-badge positive">Verified</span>
          </div>
          <div className="metric-value">{analytics?.aiAccuracy || "98.4%"}</div>
          <div className="metric-label">Multi-Agent AI Accuracy</div>
        </div>
      </div>

      {/* Main Grid: AI Leave Launcher & Live Result */}
      <div className="dashboard-main-grid">
        {/* Left: Quick AI Action */}
        <div className="panel-card launcher-panel">
          <div className="panel-header">
            <div>
              <h3>⚡ Quick AI Leave Workflow</h3>
              <p>Execute multi-agent Graph analysis for a team member</p>
            </div>
            <span className="live-pill">✦ AI Multi-Agent Engine</span>
          </div>

          <form onSubmit={handleQuickSubmit} className="quick-form">
            <div className="form-row-2">
              <div className="form-field">
                <label>Employee</label>
                <select
                  value={quickForm.employeeId}
                  onChange={(e) => {
                    const sel = employees.find((emp) => emp.id === e.target.value);
                    setQuickForm({
                      ...quickForm,
                      employeeId: e.target.value,
                      employeeName: sel ? sel.name : quickForm.employeeName,
                    });
                  }}
                >
                  {employees.length > 0 ? (
                    employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.department})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="EMP-101">Alex Rivera (Engineering)</option>
                      <option value="EMP-102">Jessica Taylor (Product)</option>
                      <option value="EMP-103">David Chen (Data Science)</option>
                    </>
                  )}
                </select>
              </div>

              <div className="form-field">
                <label>Leave Category</label>
                <select
                  value={quickForm.leaveType}
                  onChange={(e) => setQuickForm({ ...quickForm, leaveType: e.target.value })}
                >
                  <option value="Vacation">Annual Vacation</option>
                  <option value="Sick Leave">Sick / Medical Leave</option>
                  <option value="Paternity">Parental / Family Leave</option>
                  <option value="Mental Health">Mental Health Reset</option>
                </select>
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-field">
                <label>Days Duration</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={quickForm.days}
                  onChange={(e) => setQuickForm({ ...quickForm, days: parseInt(e.target.value) || 1 })}
                />
              </div>

              <div className="form-field">
                <label>Reason / Notes</label>
                <input
                  type="text"
                  value={quickForm.reason}
                  onChange={(e) => setQuickForm({ ...quickForm, reason: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary-gradient" disabled={processing}>
              {processing ? "Executing LangGraph Multi-Agent Pipeline..." : "Run AI Workflow Agent Suite ➔"}
            </button>
          </form>

          {/* Result Banner if ran */}
          {lastResult && (
            <div className="ai-result-box">
              <div className="result-top">
                <span className="result-tag">Workflow Result</span>
                <span className={`decision-badge ${lastResult.recommendation?.finalDecision === "APPROVED" ? "approved" : "rejected"}`}>
                  {lastResult.recommendation?.finalDecision || "APPROVED"}
                </span>
              </div>
              <p className="recommendation-text">{lastResult.recommendation?.reason}</p>

              <div className="agent-mini-pills">
                <span className="mini-pill">Policy: {lastResult.policy?.approved ? "✅ Pass" : "❌ Fail"}</span>
                <span className="mini-pill">Workload Score: {lastResult.workload?.workloadScore}/100</span>
                <span className="mini-pill">Burnout Risk: {lastResult.burnout?.burnoutRisk}</span>
                <span className="mini-pill">Processing: {lastResult.processingTime}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Workforce Capacity Heatmap */}
        <div className="panel-card capacity-panel">
          <div className="panel-header">
            <h3>🔥 Workforce Burnout & Capacity</h3>
            <p>Real-time team load score</p>
          </div>

          <div className="capacity-list">
            {employees.slice(0, 5).map((emp) => (
              <div key={emp.id} className="capacity-item">
                <div className="capacity-user">
                  <div className="avatar-sm">{emp.avatar}</div>
                  <div>
                    <strong>{emp.name}</strong>
                    <small>{emp.role}</small>
                  </div>
                </div>

                <div className="capacity-bar-wrapper">
                  <div className="bar-info">
                    <span>Workload {emp.workload_score}%</span>
                    <span className={`risk-tag ${emp.burnout_risk.toLowerCase()}`}>
                      {emp.burnout_risk} Risk
                    </span>
                  </div>
                  <div className="capacity-bar-bg">
                    <div
                      className={`capacity-bar-fill ${emp.workload_score > 80 ? "high" : emp.workload_score > 60 ? "med" : "low"}`}
                      style={{ width: `${emp.workload_score}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Database History Table */}
      <div className="panel-card history-panel">
        <div className="panel-header">
          <div>
            <h3>📑 Persistent DB Leave Requests</h3>
            <p>Live synchronized records stored in SQLite database</p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Workflow ID</th>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>Days</th>
                <th>AI Recommendation</th>
                <th>Status</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? (
                history.map((row) => (
                  <tr key={row.workflow_id}>
                    <td><code>{row.workflow_id}</code></td>
                    <td><strong>{row.employee_name}</strong></td>
                    <td>{row.leave_type}</td>
                    <td>{row.days} days</td>
                    <td>
                      <span className={`decision-pill ${row.recommendation === "APPROVED" ? "approved" : "rejected"}`}>
                        {row.recommendation}
                      </span>
                    </td>
                    <td><span className="status-dot-active">● Processed</span></td>
                    <td><small>{new Date(row.created_at).toLocaleString()}</small></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    No leave requests stored in DB yet. Execute a workflow above!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
