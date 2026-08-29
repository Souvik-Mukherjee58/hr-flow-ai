import { useState, useEffect } from "react";
import { fetchEmployees } from "../services/api";

export default function Intelligence() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees()
      .then((res) => setEmployees(res.employees || []))
      .finally(() => setLoading(false));
  }, []);

  const criticals = employees.filter((e) => e.burnout_risk === "Critical" || e.burnout_risk === "High");
  const moderates = employees.filter((e) => e.burnout_risk === "Moderate");
  const lows = employees.filter((e) => e.burnout_risk === "Low");

  return (
    <div className="intelligence-container">
      {/* Risk Summary Cards */}
      <div className="metrics-grid">
        <div className="metric-card gradient-red">
          <div className="metric-header">
            <span className="metric-icon">🚨</span>
            <span className="metric-badge warning">Urgent Attention</span>
          </div>
          <div className="metric-value">{criticals.length}</div>
          <div className="metric-label">High / Critical Burnout Alerts</div>
        </div>

        <div className="metric-card gradient-orange">
          <div className="metric-header">
            <span className="metric-icon">⚠️</span>
            <span className="metric-badge">Monitor Closely</span>
          </div>
          <div className="metric-value">{moderates.length}</div>
          <div className="metric-label">Moderate Risk Capacity</div>
        </div>

        <div className="metric-card gradient-green">
          <div className="metric-header">
            <span className="metric-icon">✅</span>
            <span className="metric-badge positive">Healthy</span>
          </div>
          <div className="metric-value">{lows.length}</div>
          <div className="metric-label">Optimal Balance Staff</div>
        </div>
      </div>

      {/* Burnout Risk Matrix Panel */}
      <div className="panel-card">
        <div className="panel-header">
          <div>
            <h3>🔥 Employee Capacity & Burnout Radar</h3>
            <p>Calculated using overtime velocity, leave history, and workload distribution</p>
          </div>
        </div>

        <div className="burnout-grid">
          {employees.map((emp) => (
            <div key={emp.id} className={`burnout-card risk-border-${emp.burnout_risk.toLowerCase()}`}>
              <div className="burnout-card-top">
                <div className="avatar-circle">{emp.avatar}</div>
                <div>
                  <h4>{emp.name}</h4>
                  <small>{emp.role} • {emp.department}</small>
                </div>
                <span className={`risk-tag ${emp.burnout_risk.toLowerCase()}`}>
                  {emp.burnout_risk} Risk
                </span>
              </div>

              <div className="burnout-metrics">
                <div className="metric-row">
                  <span>Workload Intensity</span>
                  <strong>{emp.workload_score}/100</strong>
                </div>
                <div className="bar-bg">
                  <div
                    className={`bar-fill ${emp.workload_score > 80 ? "high" : emp.workload_score > 60 ? "med" : "low"}`}
                    style={{ width: `${emp.workload_score}%` }}
                  ></div>
                </div>

                <div className="metric-row mt-2">
                  <span>Remaining Vacation</span>
                  <strong>{emp.leave_balance} Days</strong>
                </div>
              </div>

              <div className="ai-recommendation-box">
                <span className="ai-label">🤖 AI Recommendation:</span>
                <p>
                  {emp.workload_score > 85
                    ? "Recommend mandating 3 days wellness leave within the next 14 days to prevent attrition."
                    : emp.workload_score > 65
                    ? "Schedule workload redistribution with department manager."
                    : "Workload is within healthy parameters."}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
