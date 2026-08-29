import { useState, useEffect } from "react";
import AuthPage from "./pages/AuthPage";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import LeaveRequests from "./pages/LeaveRequests";
import HrApprovals from "./pages/HrApprovals";
import Intelligence from "./pages/Intelligence";
import AuditLogs from "./pages/AuditLogs";
import Settings from "./pages/Settings";
import Chatbot from "./components/Chatbot";
import PolicyDocumentModal from "./components/PolicyDocumentModal";
import { fetchCurrentUser, removeAuthToken, getAuthToken } from "./services/api";
import "./App.css";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portalMode, setPortalMode] = useState("hr"); // 'hr' or 'employee'
  const [activeTab, setActiveTab] = useState("hr_approvals");
  const [showGlobalPolicyModal, setShowGlobalPolicyModal] = useState(false);

  // Helper to determine if user is HR
  const isHrUser = (u) => {
    if (!u || !u.role) return false;
    const r = u.role.toLowerCase();
    return r.includes("hr") || r.includes("admin") || r.includes("people") || r.includes("director");
  };

  const applyUserRolePermissions = (u) => {
    if (isHrUser(u)) {
      setPortalMode("hr");
      setActiveTab((prev) => (["hr_approvals", "dashboard", "employees", "leave", "burnout", "audit", "settings"].includes(prev) ? prev : "hr_approvals"));
    } else {
      setPortalMode("employee");
      setActiveTab((prev) => (["leave", "dashboard", "burnout", "settings"].includes(prev) ? prev : "leave"));
    }
  };

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      fetchCurrentUser()
        .then((res) => {
          if (res.user) {
            setUser(res.user);
            applyUserRolePermissions(res.user);
          } else {
            removeAuthToken();
          }
        })
        .catch(() => removeAuthToken())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    removeAuthToken();
    setUser(null);
    setActiveTab("hr_approvals");
    setPortalMode("hr");
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader-spinner"></div>
        <p>Loading HR Motion AI Enterprise Platform...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthPage
        onLoginSuccess={(u) => {
          setUser(u);
          applyUserRolePermissions(u);
        }}
      />
    );
  }

  const isHr = portalMode === "hr";

  return (
    <div className={`app-layout portal-theme-${portalMode}`}>
      {/* Top Banner Role Indicator Bar (Strictly locked to user role view) */}
      <div className="global-website-switcher-bar">
        <div className="website-brand-pill">
          <span className="brand-dot">●</span>
          <strong>{isHr ? "🏢 HR EXECUTIVE MANAGEMENT PORTAL" : "👤 EMPLOYEE SELF-SERVICE PORTAL"}</strong>
        </div>

        <div className="website-toggle-container">
          <span className="toggle-label">Authenticated Account:</span>
          <span className="user-logged-badge">
            {isHr ? "🛡️ HR Admin" : "👤 Employee Staff"}: <strong>{user.fullName}</strong> ({user.role})
          </span>
        </div>

        <button
          type="button"
          className="btn-attached-policy-shortcut"
          onClick={() => setShowGlobalPolicyModal(true)}
        >
          📄 Policy Doc (3d Cap)
        </button>
      </div>

      {/* Main Layout Area */}
      <div className="app-body-container">
        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={user}
          portalMode={portalMode}
          onOpenPolicyDoc={() => setShowGlobalPolicyModal(true)}
          onLogout={handleLogout}
        />

        {/* Main Content Viewport */}
        <div className="main-viewport">
          <Header
            activeTab={activeTab}
            user={user}
            portalMode={portalMode}
            onNewRequestClick={() => setActiveTab("leave")}
            onOpenPolicyDoc={() => setShowGlobalPolicyModal(true)}
            onLogout={handleLogout}
          />

          <main className="content-area">
            {/* HR Only Views - Hidden and Guarded from Employee Role */}
            {activeTab === "hr_approvals" && (isHr ? <HrApprovals user={user} /> : <LeaveRequests />)}
            {activeTab === "employees" && (isHr ? <Employees /> : <LeaveRequests />)}
            {activeTab === "audit" && (isHr ? <AuditLogs /> : <LeaveRequests />)}

            {/* Shared / Persona-Adapted Views */}
            {activeTab === "dashboard" && <Dashboard onNavigateToLeave={() => setActiveTab("leave")} />}
            {activeTab === "leave" && <LeaveRequests />}
            {activeTab === "burnout" && <Intelligence />}
            {activeTab === "settings" && <Settings user={user} />}
          </main>
        </div>
      </div>

      {/* Floating AI Chatbot Assistant */}
      <Chatbot />

      {/* Global Attached Policy Document Modal */}
      {showGlobalPolicyModal && (
        <PolicyDocumentModal
          onClose={() => setShowGlobalPolicyModal(false)}
          isHrAdmin={portalMode === "hr"}
        />
      )}
    </div>
  );
}