import { useState, useEffect } from "react";
import { fetchPendingHrRequests, submitHrDecision, fetchPolicyDocument, fetchLeaveHistory } from "../services/api";
import PolicyDocumentModal from "../components/PolicyDocumentModal";

export default function HrApprovals({ user }) {
  const [pendingList, setPendingList] = useState([]);
  const [allHistory, setAllHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [policyDoc, setPolicyDoc] = useState(null);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [filterTab, setFilterTab] = useState("pending"); // 'pending' | 'auto_rejected' | 'approved' | 'all'

  // Human HR Decision Modal state
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [hrNotes, setHrNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pendingRes, historyRes, policyRes] = await Promise.all([
        fetchPendingHrRequests().catch(() => ({ pending: [] })),
        fetchLeaveHistory().catch(() => ({ history: [] })),
        fetchPolicyDocument().catch(() => ({ policy: null })),
      ]);
      setPendingList(pendingRes.pending || []);
      setAllHistory(historyRes.history || []);
      if (policyRes.policy) setPolicyDoc(policyRes.policy);
    } catch (err) {
      console.error("Error loading HR Review Queue data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (decision) => {
    if (!selectedRequest) return;
    setSubmitting(true);
    try {
      await submitHrDecision({
        workflowId: selectedRequest.workflow_id,
        decision: decision, // 'Approved' or 'Rejected'
        notes: hrNotes || `Decision (${decision}) issued by HR Manager ${user?.fullName || "Sarah Jenkins"}`,
        reviewerName: user?.fullName || "Sarah Jenkins",
      });
      setSelectedRequest(null);
      setHrNotes("");
      await loadData();
    } catch (err) {
      alert("Error processing HR decision: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const maxDays = policyDoc?.max_standard_days || 3;

  // Filtered lists for HR tabs
  const autoRejectedList = allHistory.filter((item) => item.status === "AUTO_REJECTED");
  const approvedList = allHistory.filter((item) => item.status === "APPROVED_BY_HR" || item.recommendation === "APPROVED");
  const displayList =
    filterTab === "pending"
      ? pendingList
      : filterTab === "auto_rejected"
      ? autoRejectedList
      : filterTab === "approved"
      ? approvedList
      : allHistory;

  return (
    <div className="hr-approvals-container">
      {/* Top Banner: Attached Manual Policy Attachment Bar */}
      <div className="policy-banner-card">
        <div className="policy-banner-left">
          <div className="policy-doc-badge">📄 ATTACHED MANUAL POLICY DOCUMENT</div>
          <h3>{policyDoc?.title || "Corporate Leave Policy & Emergency Guidelines v2.4"}</h3>
          <p>
            Standard Auto-Cap: <strong>{maxDays} Days Max</strong> • Requests &gt; {maxDays} days (e.g. 5 days) auto-reject unless Emergency Exception is verified.
          </p>
        </div>
        <button type="button" className="btn-secondary" onClick={() => setShowPolicyModal(true)}>
          ⚙️ Manage Policy Attachment & PDF Rules
        </button>
      </div>

      {/* Main HR Governance Review Panel */}
      <div className="panel-card">
        <div className="panel-header">
          <div>
            <h3>👤 Human HR Decision Center & Governance Portal</h3>
            <p>Review leave requests, override AI decisions, and manage Emergency Policy Exceptions</p>
          </div>
          <span className="queue-count-pill">
            {pendingList.length} Pending HR Review{pendingList.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Tab Navigation Filter Bar */}
        <div className="hr-tabs-bar">
          <button
            type="button"
            className={`hr-tab-btn ${filterTab === "pending" ? "active" : ""}`}
            onClick={() => setFilterTab("pending")}
          >
            ⏳ Pending Human HR Review ({pendingList.length})
          </button>

          <button
            type="button"
            className={`hr-tab-btn ${filterTab === "auto_rejected" ? "active" : ""}`}
            onClick={() => setFilterTab("auto_rejected")}
          >
            ❌ Auto-Rejected by 3-Day Cap ({autoRejectedList.length})
          </button>

          <button
            type="button"
            className={`hr-tab-btn ${filterTab === "approved" ? "active" : ""}`}
            onClick={() => setFilterTab("approved")}
          >
            🟢 Approved Requests ({approvedList.length})
          </button>

          <button
            type="button"
            className={`hr-tab-btn ${filterTab === "all" ? "active" : ""}`}
            onClick={() => setFilterTab("all")}
          >
            📑 All History Log ({allHistory.length})
          </button>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Workflow ID</th>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>Duration</th>
                <th>Policy & Emergency Evaluation</th>
                <th>AI Status</th>
                <th>Human HR Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    <div className="loader-spinner spinner-inline"></div> Loading HR Queue...
                  </td>
                </tr>
              ) : displayList.length > 0 ? (
                displayList.map((req) => {
                  const exceedsLimit = req.days > maxDays;
                  const isEmergency = req.is_emergency === 1;
                  const isPending = req.hr_decision === "Pending" && req.status !== "AUTO_REJECTED";
                  return (
                    <tr key={req.workflow_id}>
                      <td><code>{req.workflow_id}</code></td>
                      <td><strong>{req.employee_name}</strong></td>
                      <td>{req.leave_type}</td>
                      <td>
                        <strong className={exceedsLimit ? "text-red" : "text-green"}>
                          {req.days} Days
                        </strong>
                      </td>
                      <td>
                        {exceedsLimit ? (
                          isEmergency ? (
                            <span className="emergency-badge">🚨 Emergency Exception (5d &gt; 3d Cap)</span>
                          ) : (
                            <span className="violation-badge">❌ Auto-Rejected (5d &gt; 3d Cap)</span>
                          )
                        ) : (
                          <span className="policy-ok-badge">✅ Standard Limit (&le;{maxDays}d)</span>
                        )}
                      </td>
                      <td>
                        <span className={`ai-rec-pill ${req.status.toLowerCase()}`}>
                          {req.status === "AUTO_REJECTED"
                            ? "Auto Rejected"
                            : req.status === "APPROVED_BY_HR"
                            ? "HR Approved"
                            : req.status === "REJECTED_BY_HR"
                            ? "HR Rejected"
                            : req.recommendation || "Pending HR"}
                        </span>
                      </td>
                      <td>
                        {isPending ? (
                          <button
                            type="button"
                            className="btn-review-action"
                            onClick={() => setSelectedRequest(req)}
                          >
                            Review & Decide ➔
                          </button>
                        ) : (
                          <span className="text-muted-sm">
                            {req.hr_reviewer ? `Reviewed by ${req.hr_reviewer}` : "Policy Handled"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    🎉 No records found for this category!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Human Decision Review Modal */}
      {selectedRequest && (
        <div className="modal-backdrop">
          <div className="modal-card review-modal-card">
            <div className="modal-header-bar">
              <div>
                <h3>Human HR Decision Interface</h3>
                <span className="modal-sub">Binding Human-in-the-Loop Governance</span>
              </div>
              <span className="workflow-tag">#{selectedRequest.workflow_id}</span>
            </div>

            <div className="review-details-box">
              <div className="review-row">
                <span>Employee Name:</span>
                <strong>{selectedRequest.employee_name}</strong>
              </div>
              <div className="review-row">
                <span>Leave Type & Duration:</span>
                <strong>{selectedRequest.leave_type} — {selectedRequest.days} Days Requested</strong>
              </div>
              <div className="review-row">
                <span>Attached Policy Cap Check:</span>
                <span className={selectedRequest.days > maxDays ? "policy-warning" : "policy-pass"}>
                  {selectedRequest.days > maxDays
                    ? `⚠️ Requested ${selectedRequest.days} days exceeds Attached Policy Cap (${maxDays} Days)`
                    : `✅ Within Standard Policy Limit (${maxDays} Days)`}
                </span>
              </div>
              <div className="review-row">
                <span>Emergency Justification:</span>
                <strong>
                  {selectedRequest.is_emergency === 1
                    ? "🚨 YES - Emergency Exception Flagged"
                    : "No Emergency Flag"}
                </strong>
              </div>
              <div className="review-row">
                <span>Employee Reason:</span>
                <p className="reason-text">"{selectedRequest.reason}"</p>
              </div>
            </div>

            <div className="form-field mt-3">
              <label>Human HR Manager Review Notes</label>
              <textarea
                rows="3"
                placeholder="Enter rationale for HR decision..."
                value={hrNotes}
                onChange={(e) => setHrNotes(e.target.value)}
              ></textarea>
            </div>

            <div className="hr-decision-actions">
              <button
                type="button"
                className="btn-hr-reject"
                disabled={submitting}
                onClick={() => handleDecision("Rejected")}
              >
                🔴 Reject Leave Request (HR Override)
              </button>

              <button
                type="button"
                className="btn-hr-approve"
                disabled={submitting}
                onClick={() => handleDecision("Approved")}
              >
                🟢 Approve Leave Request (HR Override)
              </button>
            </div>

            <button type="button" className="btn-close-modal" onClick={() => setSelectedRequest(null)}>
              Close Review Window
            </button>
          </div>
        </div>
      )}

      {/* Policy Attachment Management Modal */}
      {showPolicyModal && (
        <PolicyDocumentModal
          onClose={() => setShowPolicyModal(false)}
          isHrAdmin={true}
          onPolicyUpdated={loadData}
        />
      )}
    </div>
  );
}
