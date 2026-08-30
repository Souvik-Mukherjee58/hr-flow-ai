export default function Sidebar({ activeTab, setActiveTab, user, portalMode, onOpenPolicyDoc, onLogout }) {
  const isHr = portalMode === "hr";

  const hrNavItems = [
    {
      group: "HUMAN HR GOVERNANCE HUB",
      items: [
        { id: "hr_approvals", label: "Human HR Approvals Queue", icon: "👤", badge: "Pending HR" },
        { id: "dashboard", label: "Workforce Executive Overview", icon: "📊" },
        { id: "calendar", label: "Team Availability Calendar", icon: "📅", badge: "Live" },
        { id: "employees", label: "Employee Directory & Capacity", icon: "👥" },
      ],
    },
    {
      group: "AI MULTI-AGENT GOVERNANCE",
      items: [
        { id: "leave", label: "Leave Intelligence Center", icon: "⚡", badge: "Live AI" },
        { id: "burnout", label: "Burnout Risk & Capacity Monitor", icon: "🔥" },
        { id: "audit", label: "Workflow Audit Logs", icon: "📑" },
      ],
    },
    {
      group: "SYSTEM",
      items: [
        { id: "settings", label: "Organization Policy Settings", icon: "⚙️" },
      ],
    },
  ];

  const employeeNavItems = [
    {
      group: "EMPLOYEE SELF-SERVICE",
      items: [
        { id: "leave", label: "Submit Leave & AI Check", icon: "⚡", badge: "3d Cap" },
        { id: "calendar", label: "Team Availability & PTO", icon: "📅" },
        { id: "dashboard", label: "My Workload Overview", icon: "📊" },
        { id: "burnout", label: "My Capacity & Burnout Score", icon: "🔥" },
      ],
    },
    {
      group: "ACCOUNT",
      items: [
        { id: "settings", label: "My Profile Settings", icon: "⚙️" },
      ],
    },
  ];

  const navItems = isHr ? hrNavItems : employeeNavItems;

  return (
    <aside className={`app-sidebar ${isHr ? "sidebar-hr-mode" : "sidebar-employee-mode"}`}>
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className={`brand-icon ${isHr ? "hr-gradient" : "employee-gradient"}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="brand-titles">
          <span className="app-name">HR Motion</span>
          <span className={`portal-subtitle-badge ${isHr ? "hr" : "employee"}`}>
            {isHr ? "🏢 HR Management Portal" : "👤 Employee Self-Service"}
          </span>
        </div>
      </div>

      {/* Role Verification Status Box */}
      <div className="sidebar-website-switch">
        <div className="switch-title">AUTHENTICATED ROLE:</div>
        <div className="role-locked-pill">
          <span className="dot-active">●</span>
          <span>{isHr ? "🏢 HR Executive Admin (Restricted)" : "👤 Registered Employee (Restricted)"}</span>
        </div>
      </div>

      {/* View Attached Policy Document Button */}
      <button type="button" className="btn-sidebar-policy-doc" onClick={onOpenPolicyDoc}>
        <span>📄 Attached Policy Document</span>
        <small>Ref: POL-2026-v2 • 3-Day Cap</small>
      </button>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        {navItems.map((group, idx) => (
          <div key={idx} className="nav-group">
            <div className="group-title">{group.group}</div>
            {group.items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`nav-btn ${activeTab === item.id ? "active" : ""}`}
                onClick={() => setActiveTab(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom Status Card & Profile Logout */}
      <div className="sidebar-bottom">
        <div className="ai-system-card">
          <div className="status-indicator">
            <span className="pulse-dot"></span>
            <span className="status-text">Multi-Agent AI Active</span>
          </div>
          <small>Policy • Workload • Burnout • Audit</small>
        </div>

        <div className="user-profile-bar">
          <div className="user-avatar">{user?.avatar || "HR"}</div>
          <div className="user-info">
            <span className="user-name">{user?.fullName || "Sarah Jenkins"}</span>
            <span className="user-role">{user?.role || "Administrator"}</span>
          </div>
        </div>

        <button type="button" className="btn-sidebar-logout" onClick={onLogout}>
          <span>🚪</span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
