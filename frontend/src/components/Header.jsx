import { useState } from "react";

export default function Header({ activeTab, user, portalMode, setPortalMode, onNewRequestClick, onOpenPolicyDoc, onLogout }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [unread, setUnread] = useState([
    { id: 1, text: "🚨 Emergency Leave Exception (5 days) requested — Pending HR Approval", time: "Just now", type: "alert" },
    { id: 2, text: "❌ Leave Request WF-1049 Auto-Rejected per Attached 3-Day Policy Cap", time: "5m ago", type: "ai" },
    { id: 3, text: "David Chen flagged with High Burnout Risk score 92", time: "15m ago", type: "alert" },
  ]);

  const hrTitleMap = {
    hr_approvals: "Human HR Approvals Hub & Governance Center",
    dashboard: "Workforce Executive Overview & AI Analytics",
    calendar: "Team Availability Calendar & Overlap Radar",
    employees: "Employee Directory & Capacity Radar",
    leave: "AI Leave Intelligence & Policy Verification",
    burnout: "Burnout Risk & Workload Monitor",
    audit: "Multi-Agent Workflow Audit Logs",
    settings: "Workspace Settings & Policy Management",
  };

  const employeeTitleMap = {
    leave: "Apply for Leave & AI Policy Verification",
    calendar: "Team Schedule & PTO Availability Calendar",
    dashboard: "My Personal Workforce Overview",
    burnout: "My Capacity & Burnout Health Monitor",
    settings: "Account & Profile Settings",
  };

  const isHr = portalMode === "hr";
  const titleMap = isHr ? hrTitleMap : employeeTitleMap;

  return (
    <header className={`app-header ${isHr ? "header-hr-theme" : "header-employee-theme"}`}>
      <div className="header-left">
        <div className="breadcrumb">
          <span className="portal-indicator-tag">
            {isHr ? "🏢 HR MANAGEMENT PORTAL" : "👤 EMPLOYEE SELF-SERVICE"}
          </span>{" "}
          / <span className="current">{activeTab.toUpperCase()}</span>
        </div>
        <h1 className="header-title">{titleMap[activeTab] || "HR Motion Platform"}</h1>
      </div>

      <div className="header-right">
        {/* View Attached Policy Document Button */}
        <button type="button" className="btn-header-policy" onClick={onOpenPolicyDoc}>
          📄 Policy Doc (3d Cap)
        </button>

        {/* Role Authenticated Tag */}
        <div className={`portal-badge ${isHr ? "hr" : "employee"}`}>
          {isHr ? "🛡️ HR Administrator View" : "👤 Employee Self-Service View"}
        </div>

        {/* Action Button */}
        <button type="button" className="btn-quick-action" onClick={onNewRequestClick}>
          <span>+ Apply for Leave</span>
        </button>

        {/* Notifications Icon */}
        <div className="notification-wrapper">
          <button
            type="button"
            className="icon-btn"
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setProfileMenuOpen(false);
            }}
            title="Notifications"
          >
            🔔
            {unread.length > 0 && <span className="notification-badge">{unread.length}</span>}
          </button>

          {notificationsOpen && (
            <div className="notifications-dropdown">
              <div className="dropdown-header">
                <h4>System Notifications</h4>
                <button type="button" className="clear-btn" onClick={() => setUnread([])}>
                  Mark all read
                </button>
              </div>
              <div className="dropdown-list">
                {unread.length === 0 ? (
                  <div className="empty-notif">No unread notifications</div>
                ) : (
                  unread.map((n) => (
                    <div key={n.id} className="notif-item">
                      <span className={`notif-icon ${n.type}`}>✦</span>
                      <div className="notif-content">
                        <p>{n.text}</p>
                        <small>{n.time}</small>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu with Logout */}
        <div className="profile-menu-wrapper">
          <button
            type="button"
            className="user-profile-button"
            onClick={() => {
              setProfileMenuOpen(!profileMenuOpen);
              setNotificationsOpen(false);
            }}
          >
            <div className="avatar-header">{user?.avatar || "HR"}</div>
            <div className="user-header-details">
              <span className="user-header-name">{user?.fullName || "Sarah Jenkins"}</span>
              <small className="user-header-role">{user?.role || "HR Executive Admin"}</small>
            </div>
            <span className="arrow-down">▾</span>
          </button>

          {profileMenuOpen && (
            <div className="profile-dropdown-menu">
              <div className="profile-dropdown-header">
                <strong>{user?.fullName || "Sarah Jenkins"}</strong>
                <small>{user?.email || "admin@hrmotion.ai"}</small>
                <div className="org-badge-pill">🏢 {user?.orgName || "Acme Motion Corp"}</div>
              </div>

              <div className="dropdown-divider"></div>

              <button
                type="button"
                className="dropdown-logout-btn"
                onClick={() => {
                  setProfileMenuOpen(false);
                  onLogout();
                }}
              >
                <span>🚪</span>
                <span>Sign Out of Workspace</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
