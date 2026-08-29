import { useState, useEffect } from "react";
import { fetchPolicyDocument, updatePolicyDocument } from "../services/api";

export default function PolicyDocumentModal({ onClose, isHrAdmin = false, onPolicyUpdated }) {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("document"); // 'document' | 'rules' | 'edit'
  
  // Edit Form State
  const [editForm, setEditForm] = useState({
    title: "",
    maxStandardDays: 3,
    documentName: "",
    content: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPolicy();
  }, []);

  const loadPolicy = async () => {
    setLoading(true);
    try {
      const res = await fetchPolicyDocument();
      if (res.policy) {
        setPolicy(res.policy);
        setEditForm({
          title: res.policy.title || "Corporate Leave Policy & Emergency Guidelines v2.4",
          maxStandardDays: res.policy.max_standard_days || 3,
          documentName: res.policy.document_name || "Company_Leave_Policy_Doc_2026.pdf",
          content: res.policy.content || "",
        });
      }
    } catch (err) {
      console.error("Failed to load policy attachment:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updatePolicyDocument(editForm);
      await loadPolicy();
      if (onPolicyUpdated) onPolicyUpdated();
      setActiveTab("document");
    } catch (err) {
      alert("Failed to update policy attachment: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card pdf-viewer-modal">
        {/* PDF Reader Toolbar Header */}
        <div className="pdf-toolbar">
          <div className="pdf-title-group">
            <div className="pdf-icon">📄</div>
            <div>
              <h3 className="pdf-filename">{policy?.document_name || "Company_Leave_Policy_Doc_2026.pdf"}</h3>
              <span className="pdf-meta">
                Ref: POL-2026-v2 • Standard Auto-Cap: {policy?.max_standard_days || 3} Days Max • Official Policy Attachment
              </span>
            </div>
          </div>

          <div className="pdf-toolbar-right">
            <div className="pdf-tab-group">
              <button
                type="button"
                className={`pdf-tab ${activeTab === "document" ? "active" : ""}`}
                onClick={() => setActiveTab("document")}
              >
                📄 PDF View
              </button>
              <button
                type="button"
                className={`pdf-tab ${activeTab === "rules" ? "active" : ""}`}
                onClick={() => setActiveTab("rules")}
              >
                ⚡ Policy Rules Matrix
              </button>
              {isHrAdmin && (
                <button
                  type="button"
                  className={`pdf-tab ${activeTab === "edit" ? "active" : ""}`}
                  onClick={() => setActiveTab("edit")}
                >
                  ✏️ Edit Attachment
                </button>
              )}
            </div>

            <button type="button" className="btn-close-pdf" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="pdf-modal-body">
          {loading ? (
            <div className="pdf-loading">
              <div className="loader-spinner"></div>
              <p>Loading attached policy document PDF...</p>
            </div>
          ) : activeTab === "document" ? (
            /* Document Page Reader View */
            <div className="pdf-page-canvas">
              <div className="pdf-page-header">
                <div className="watermark">OFFICIAL ATTACHMENT</div>
                <div className="doc-header-titles">
                  <h2>{policy?.title || "Corporate Leave Policy & Emergency Guidelines v2.4"}</h2>
                  <div className="doc-badge-pill">📌 Active Policy Attached to AI Engine</div>
                </div>
              </div>

              <div className="pdf-page-content">
                <pre className="policy-text-display">{policy?.content}</pre>
              </div>

              <div className="pdf-page-footer">
                <span>HR Motion Multi-Agent Policy Rule System • Document ID: POL-2026-v2</span>
                <span>Page 1 of 1</span>
              </div>
            </div>
          ) : activeTab === "rules" ? (
            /* Policy Rules Matrix View */
            <div className="rules-matrix-container">
              <div className="matrix-hero-card">
                <h4>🛡️ Enforced Policy Rules Summary</h4>
                <p>
                  This manual policy document is attached directly to the AI Policy Agent. The rule engine enforces these criteria for every submitted leave request.
                </p>
              </div>

              <div className="rules-grid">
                <div className="rule-card">
                  <div className="rule-badge cap">Rule 1: Standard Cap</div>
                  <h5>Maximum 3 Days Auto-Cap</h5>
                  <p>
                    Employees are allowed a maximum of <strong>3 days</strong> of standard leave per request. Leave requests under or equal to 3 days pass policy check.
                  </p>
                </div>

                <div className="rule-card danger">
                  <div className="rule-badge reject">Rule 2: 5-Day Auto-Reject</div>
                  <h5>5 Days Leave Request Auto-Rejection</h5>
                  <p>
                    If an employee requests <strong>5 days</strong> (or any duration &gt; 3 days) without an emergency flag, the request is <strong>AUTOMATICALLY REJECTED</strong>.
                  </p>
                </div>

                <div className="rule-card warning">
                  <div className="rule-badge emergency">Rule 3: Emergency Exception</div>
                  <h5>Emergency Approval Exception</h5>
                  <p>
                    Requests exceeding 3 days (e.g. 5 days) are approved ONLY in case of verified <strong>Emergency</strong> (medical, casualty, hospitalization).
                  </p>
                </div>

                <div className="rule-card info">
                  <div className="rule-badge human">Rule 4: Human-in-the-Loop</div>
                  <h5>Human HR Binding Decision</h5>
                  <p>
                    When AI approves or grants an Emergency Exception, the request is forwarded to the <strong>Human HR Website</strong> where an HR Manager makes the final binding approval.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Edit Attachment Form View (HR Admin Only) */
            <form onSubmit={handleSave} className="pdf-edit-form">
              <div className="form-field">
                <label>Document Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-field">
                  <label>Max Standard Days Cap</label>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={editForm.maxStandardDays}
                    onChange={(e) => setEditForm({ ...editForm, maxStandardDays: parseInt(e.target.value) || 3 })}
                    required
                  />
                  <small className="field-hint">Defines standard leave cap before auto-rejection triggers (Default: 3 days)</small>
                </div>

                <div className="form-field">
                  <label>Attachment Filename</label>
                  <input
                    type="text"
                    value={editForm.documentName}
                    onChange={(e) => setEditForm({ ...editForm, documentName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-field">
                <label>Manual Policy Document Content (Markdown / Text)</label>
                <textarea
                  rows="10"
                  value={editForm.content}
                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                  required
                ></textarea>
              </div>

              <div className="form-actions-right">
                <button type="button" className="btn-cancel" onClick={() => setActiveTab("document")}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Saving Policy Attachment..." : "💾 Save & Re-attach Policy Document"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
