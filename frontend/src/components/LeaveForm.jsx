import { useState } from "react";
import api from "../services/api";
import ResultCard from "./ResultCard";

export default function LeaveForm({ onResult }) {
  const [formData, setFormData] = useState({
    employeeId: "",
    employeeName: "",
    leaveType: "Medical",
    days: "",
    reason: "",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const submit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const res = await api.post("/leave", formData);

      setResult(res.data);

      if (onResult) {
        onResult(res.data);
      }
    } catch (err) {
      console.error(err);
      alert("Unable to connect to backend.");
    }

    setLoading(false);
  };

  return (
    <div className="leave-form-container">

      {/* FORM HEADER */}

      <div className="leave-form-title">
        <div className="leave-form-icon">
          📅
        </div>

        <div>
          <h3>Submit Leave Request</h3>

          <p>
            Enter employee details and let the AI agents
            analyze the request.
          </p>
        </div>
      </div>

      {/* FORM */}

      <form onSubmit={submit} className="leave-form">

        <div className="form-grid">

          {/* EMPLOYEE ID */}

          <div className="form-group">

            <label>
              Employee ID
            </label>

            <div className="form-input-wrapper">
              <span>🪪</span>

              <input
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                placeholder="e.g. EMP-1024"
                required
              />
            </div>

          </div>

          {/* EMPLOYEE NAME */}

          <div className="form-group">

            <label>
              Employee Name
            </label>

            <div className="form-input-wrapper">
              <span>👤</span>

              <input
                name="employeeName"
                value={formData.employeeName}
                onChange={handleChange}
                placeholder="Enter employee name"
                required
              />
            </div>

          </div>

          {/* LEAVE TYPE */}

          <div className="form-group">

            <label>
              Leave Type
            </label>

            <div className="form-input-wrapper">

              <span>📋</span>

              <select
                name="leaveType"
                value={formData.leaveType}
                onChange={handleChange}
              >
                <option>Medical</option>
                <option>Casual</option>
                <option>Emergency</option>
                <option>Earned</option>
              </select>

            </div>

          </div>

          {/* DAYS */}

          <div className="form-group">

            <label>
              Leave Days
            </label>

            <div className="form-input-wrapper">

              <span>📅</span>

              <input
                name="days"
                type="number"
                min="1"
                value={formData.days}
                onChange={handleChange}
                placeholder="Number of days"
                required
              />

            </div>

          </div>

        </div>

        {/* REASON */}

        <div className="form-group reason-group">

          <label>
            Reason for Leave
          </label>

          <div className="textarea-wrapper">

            <span>💬</span>

            <textarea
              name="reason"
              rows="4"
              value={formData.reason}
              onChange={handleChange}
              placeholder="Explain the reason for leave..."
              required
            />

          </div>

        </div>

        {/* BUTTON */}

        <button
          type="submit"
          className="analyze-button"
          disabled={loading}
        >

          {loading ? (
            <>
              <span className="spinner"></span>
              AI Agents Analyzing...
            </>
          ) : (
            <>
              🧠
              Analyze Leave Request
              <span>→</span>
            </>
          )}

        </button>

        <div className="form-security">
          🔒 AI analysis • Policy compliant • Secure HR workflow
        </div>

      </form>

      {/* FALLBACK RESULT */}

      {result && (
        <div className="legacy-results">

          <ResultCard title="👤 Employee">
            <p>
              <b>ID:</b> {result.employee.employeeId}
            </p>

            <p>
              <b>Name:</b> {result.employee.employeeName}
            </p>

            <p>
              <b>Leave:</b> {result.employee.leaveType}
            </p>

            <p>
              <b>Days:</b> {result.employee.days}
            </p>
          </ResultCard>

        </div>
      )}

    </div>
  );
}