import { useState } from "react";

export default function Settings({ user }) {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    orgName: user?.orgName || "Acme Motion Corp",
    adminEmail: user?.email || "admin@hrmotion.ai",
    burnoutThreshold: 80,
    maxLeaveDaysPerRequest: 14,
    autoEmailNotifications: true,
    strictPolicyCheck: true,
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="settings-container">
      <div className="panel-card">
        <div className="panel-header">
          <div>
            <h3>⚙️ Workspace & AI Governance Settings</h3>
            <p>Manage enterprise rules, multi-agent sensitivity, and security defaults</p>
          </div>
        </div>

        {saved && (
          <div className="auth-alert success">
            ✅ Settings saved successfully!
          </div>
        )}

        <form onSubmit={handleSave} className="settings-form">
          <div className="form-section">
            <h4>🏢 Organization Details</h4>
            <div className="form-row-2">
              <div className="form-field">
                <label>Company / Workspace Name</label>
                <input
                  type="text"
                  value={settings.orgName}
                  onChange={(e) => setSettings({ ...settings, orgName: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>System Administrator Email</label>
                <input
                  type="email"
                  value={settings.adminEmail}
                  onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h4>🤖 AI Agent Sensitivity & Thresholds</h4>
            <div className="form-row-2">
              <div className="form-field">
                <label>Burnout Risk Trigger Threshold (Score 1-100)</label>
                <input
                  type="number"
                  min="50"
                  max="95"
                  value={settings.burnoutThreshold}
                  onChange={(e) => setSettings({ ...settings, burnoutThreshold: parseInt(e.target.value) || 80 })}
                />
                <small>Employees exceeding this score will be flagged for high burnout alert.</small>
              </div>

              <div className="form-field">
                <label>Max Consecutive Leave Days (Auto-Policy Rule)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={settings.maxLeaveDaysPerRequest}
                  onChange={(e) => setSettings({ ...settings, maxLeaveDaysPerRequest: parseInt(e.target.value) || 14 })}
                />
              </div>
            </div>

            <div className="checkbox-group">
              <label className="custom-toggle">
                <input
                  type="checkbox"
                  checked={settings.autoEmailNotifications}
                  onChange={(e) => setSettings({ ...settings, autoEmailNotifications: e.target.checked })}
                />
                <span>Enable Automated Email Notifications (EmailAgent)</span>
              </label>

              <label className="custom-toggle">
                <input
                  type="checkbox"
                  checked={settings.strictPolicyCheck}
                  onChange={(e) => setSettings({ ...settings, strictPolicyCheck: e.target.checked })}
                />
                <span>Enforce Strict Policy Entitlement Verification (PolicyAgent)</span>
              </label>
            </div>
          </div>

          <button type="submit" className="btn-primary">
            Save Configuration Changes
          </button>
        </form>
      </div>
    </div>
  );
}