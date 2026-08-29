import { useState } from "react";
import { loginUser, registerUser, sendOtp, verifyOtp } from "../services/api";

export default function AuthPage({ onLoginSuccess }) {
  // Portal Mode: 'hr' | 'employee'
  const [portalType, setPortalType] = useState("hr");
  
  // Auth Mode: 'login' | 'register'
  const [isRegister, setIsRegister] = useState(false);

  // Login Method: 'password' | 'otp'
  const [authMethod, setAuthMethod] = useState("password");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // OTP State
  const [otpStep, setOtpStep] = useState(1); // 1 = enter email, 2 = enter otp
  const [otpCode, setOtpCode] = useState("");
  const [receivedOtp, setReceivedOtp] = useState(""); // For demo quick fill

  // Forgot Password Modal State
  const [forgotModal, setForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  // Form Data State
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    orgName: "Acme Motion Corp",
    role: "HR Executive Admin",
    remember: true,
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setSuccessMsg("");
  };

  // Password strength logic
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, text: "", color: "transparent" };
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score++;

    if (score === 1) return { score: 25, text: "Weak", color: "#f87171" };
    if (score === 2) return { score: 50, text: "Fair", color: "#fbbf24" };
    if (score === 3) return { score: 75, text: "Strong", color: "#34d399" };
    return { score: 100, text: "Enterprise Grade", color: "#60a5fa" };
  };

  const passStrength = getPasswordStrength(formData.password);

  // Handle Switching Portals (HR vs Employee)
  const handlePortalSwitch = (type) => {
    setPortalType(type);
    setError("");
    setSuccessMsg("");
    setOtpStep(1);
    setOtpCode("");
    setReceivedOtp("");
    setFormData((prev) => ({
      ...prev,
      role: type === "hr" ? "HR Executive Admin" : "Employee Lead",
    }));
  };

  // Password Login & Registration Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (isRegister) {
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match. Please re-enter passwords.");
          setLoading(false);
          return;
        }

        const defaultRole = portalType === "hr" ? "HR Executive Admin" : "Employee Lead";
        const res = await registerUser({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          orgName: formData.orgName,
          role: formData.role || defaultRole,
          portalType: portalType,
        });

        onLoginSuccess(res.user);
      } else {
        // Standard Password Login
        const res = await loginUser(formData.email, formData.password, portalType);
        onLoginSuccess(res.user);
      }
    } catch (err) {
      setError(err.message || "Authentication failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  // OTP Step 1: Send OTP
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!formData.email) {
      setError("Please enter a valid registered work email address.");
      return;
    }
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await sendOtp(formData.email, portalType);
      setSuccessMsg(res.message);
      if (res.otpCode) {
        setReceivedOtp(res.otpCode);
      }
      setOtpStep(2);
    } catch (err) {
      setError(err.message || "Failed to send OTP code.");
    } finally {
      setLoading(false);
    }
  };

  // OTP Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode) {
      setError("Please enter the 6-digit verification OTP code.");
      return;
    }
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await verifyOtp(formData.email, otpCode, portalType);
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Login Handler
  const handleQuickDemo = async (demoEmail, demoPass) => {
    setFormData((prev) => ({ ...prev, email: demoEmail, password: demoPass }));
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await loginUser(demoEmail, demoPass, portalType);
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || "Demo login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (forgotEmail) {
      setForgotSent(true);
      setTimeout(() => {
        setForgotModal(false);
        setForgotSent(false);
        setForgotEmail("");
      }, 2500);
    }
  };

  return (
    <div className="auth-container">
      {/* Dynamic Background Visual Accents */}
      <div className="auth-mesh-bg"></div>
      <div className={`auth-glow glow-1 ${portalType === "hr" ? "hr-glow" : "emp-glow"}`}></div>
      <div className="auth-glow glow-2"></div>

      <div className="auth-wrapper">
        {/* LEFT PANEL: Enterprise Platform Branding */}
        <div className="auth-left-panel">
          <div className="brand-header">
            <div className={`brand-logo-icon ${portalType === "hr" ? "hr-gradient" : "employee-gradient"}`}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="brand-text">
              <h2>HR Motion</h2>
              <span className="brand-badge">Hackathon & Production Edition</span>
            </div>
          </div>

          <div className="hero-text-block">
            <div className="hero-pill">
              <span className="sparkle">✦</span> AI Multi-Agent Workforce Intelligence
            </div>
            <h1>
              {portalType === "hr" ? (
                <>Automated HR Governance & <span>Workload Control</span></>
              ) : (
                <>Employee Self-Service & <span>Leave Center</span></>
              )}
            </h1>
            <p>
              {portalType === "hr"
                ? "Manage approvals, monitor burnout risks, enforce 3-day leave caps, and review policy exceptions with multi-agent precision."
                : "Submit instant leave requests, track real-time AI policy checks, and monitor your personal workload & capacity score."}
            </p>

            <div className="hero-stats">
              <div className="stat-pill">
                <strong>98.6%</strong>
                <span>AI Accuracy</span>
              </div>
              <div className="stat-pill">
                <strong>&lt; 50ms</strong>
                <span>Agent Processing</span>
              </div>
              <div className="stat-pill">
                <strong>100%</strong>
                <span>Strict Security</span>
              </div>
            </div>

            <div className="hero-features">
              <div className="hero-feature-item">
                <div className="feature-icon-box">🔒</div>
                <div>
                  <h4>Role-Based View Lock</h4>
                  <p>Strict HR vs Employee view isolation & verification</p>
                </div>
              </div>
              <div className="hero-feature-item">
                <div className="feature-icon-box">📲</div>
                <div>
                  <h4>Multi-Factor OTP Login</h4>
                  <p>Fast & secure 6-digit One-Time Password verification</p>
                </div>
              </div>
            </div>
          </div>

          <div className="auth-left-footer">
            <span>© 2026 HR Motion AI. SQLite Persisted • SOC2 Certified Architecture</span>
          </div>
        </div>

        {/* RIGHT PANEL: Auth Form Card */}
        <div className="auth-right-panel">
          <div className="auth-card">
            
            {/* PORTAL SELECTION TABS: HR vs Employee */}
            <div className="portal-select-container">
              <span className="portal-select-title">SELECT LOGIN PORTAL:</span>
              <div className="portal-select-tabs">
                <button
                  type="button"
                  className={`portal-tab ${portalType === "hr" ? "active-hr" : ""}`}
                  onClick={() => handlePortalSwitch("hr")}
                >
                  <span className="portal-tab-icon">🏢</span>
                  <div className="portal-tab-labels">
                    <strong>HR Management</strong>
                    <small>Admins & Managers</small>
                  </div>
                </button>
                <button
                  type="button"
                  className={`portal-tab ${portalType === "employee" ? "active-emp" : ""}`}
                  onClick={() => handlePortalSwitch("employee")}
                >
                  <span className="portal-tab-icon">👤</span>
                  <div className="portal-tab-labels">
                    <strong>Employee Portal</strong>
                    <small>Staff & Team Members</small>
                  </div>
                </button>
              </div>
            </div>

            {/* AUTH MODE TABS: Sign In vs Create Account */}
            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-tab ${!isRegister ? "active" : ""}`}
                onClick={() => {
                  setIsRegister(false);
                  setError("");
                  setSuccessMsg("");
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`auth-tab ${isRegister ? "active" : ""}`}
                onClick={() => {
                  setIsRegister(true);
                  setError("");
                  setSuccessMsg("");
                }}
              >
                Create Account
              </button>
            </div>

            {/* SUB-TABS: Password vs OTP (Only shown during Sign In) */}
            {!isRegister && (
              <div className="method-subtabs">
                <button
                  type="button"
                  className={`subtab-btn ${authMethod === "password" ? "active" : ""}`}
                  onClick={() => {
                    setAuthMethod("password");
                    setError("");
                    setSuccessMsg("");
                  }}
                >
                  🔑 Password Login
                </button>
                <button
                  type="button"
                  className={`subtab-btn ${authMethod === "otp" ? "active" : ""}`}
                  onClick={() => {
                    setAuthMethod("otp");
                    setError("");
                    setSuccessMsg("");
                    setOtpStep(1);
                  }}
                >
                  📲 OTP System Login
                </button>
              </div>
            )}

            {/* HEADER TEXT */}
            <div className="auth-header">
              <h3>
                {isRegister
                  ? `Register for ${portalType === "hr" ? "HR Portal" : "Employee Portal"}`
                  : authMethod === "otp"
                  ? `OTP Login — ${portalType === "hr" ? "HR Management" : "Employee Portal"}`
                  : `Sign In — ${portalType === "hr" ? "HR Management" : "Employee Portal"}`}
              </h3>
              <p>
                {isRegister
                  ? "Register a new verified account stored in the database"
                  : authMethod === "otp"
                  ? "Receive a secure 6-digit OTP code to log in without a password"
                  : `Access your registered ${portalType === "hr" ? "HR workspace" : "Employee portal"}`}
              </p>
            </div>

            {/* ALERTS: Error / Warning / Success */}
            {error && (
              <div className="auth-alert error">
                <span className="alert-icon">⚠️</span>
                <div className="alert-text-group">
                  <span>{error}</span>
                  {!isRegister && (
                    <button
                      type="button"
                      className="switch-register-link"
                      onClick={() => {
                        setIsRegister(true);
                        setError("");
                      }}
                    >
                      Not registered? Click here to Create Account ➔
                    </button>
                  )}
                </div>
              </div>
            )}

            {successMsg && (
              <div className="auth-alert success">
                <span className="alert-icon">✅</span>
                <div className="alert-text-group">
                  <span>{successMsg}</span>
                  {receivedOtp && (
                    <button
                      type="button"
                      className="btn-quick-autofill-otp"
                      onClick={() => setOtpCode(receivedOtp)}
                    >
                      ⚡ Hackathon Auto-fill Code: <strong>{receivedOtp}</strong>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* FORM AREA */}
            {/* ------------------------------------------------------------- */}
            {/* OPTION A: OTP LOGIN SYSTEM FLOW */}
            {/* ------------------------------------------------------------- */}
            {!isRegister && authMethod === "otp" ? (
              <div className="otp-flow-wrapper">
                {otpStep === 1 ? (
                  <form onSubmit={handleSendOtp} className="auth-form">
                    <div className="form-field">
                      <label>Registered Work Email Address</label>
                      <div className="input-icon-wrapper">
                        <span className="field-icon">✉️</span>
                        <input
                          type="email"
                          name="email"
                          placeholder={portalType === "hr" ? "admin@hrmotion.ai" : "alex.rivera@hrmotion.ai"}
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <small className="field-help">
                        Only registered accounts in SQLite can receive an OTP code.
                      </small>
                    </div>

                    <button type="submit" className="auth-submit-btn" disabled={loading}>
                      {loading ? <span className="spinner"></span> : "Send 6-Digit Verification Code →"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="auth-form">
                    <div className="form-field">
                      <label>Enter 6-Digit OTP Code sent to {formData.email}</label>
                      <div className="input-icon-wrapper">
                        <span className="field-icon">🔢</span>
                        <input
                          type="text"
                          maxLength="6"
                          placeholder="e.g. 742918"
                          value={otpCode}
                          onChange={(e) => {
                            setOtpCode(e.target.value);
                            setError("");
                          }}
                          className="otp-input-highlight"
                          required
                        />
                      </div>
                    </div>

                    <div className="otp-actions-row">
                      <button
                        type="button"
                        className="btn-link-action"
                        onClick={() => {
                          setOtpStep(1);
                          setError("");
                        }}
                      >
                        ← Change Email
                      </button>
                      <button
                        type="button"
                        className="btn-link-action"
                        onClick={handleSendOtp}
                      >
                        🔄 Resend OTP
                      </button>
                    </div>

                    <button type="submit" className="auth-submit-btn" disabled={loading}>
                      {loading ? <span className="spinner"></span> : "Verify OTP & Enter Portal →"}
                    </button>
                  </form>
                )}
              </div>
            ) : (
              /* ------------------------------------------------------------- */
              /* OPTION B: STANDARD PASSWORD LOGIN OR REGISTER FORM */
              /* ------------------------------------------------------------- */
              <form onSubmit={handleSubmit} className="auth-form">
                {isRegister && (
                  <>
                    <div className="form-field">
                      <label>Full Name</label>
                      <div className="input-icon-wrapper">
                        <span className="field-icon">👤</span>
                        <input
                          type="text"
                          name="fullName"
                          placeholder="e.g. Sarah Jenkins"
                          value={formData.fullName}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-field">
                      <label>Organization / Company Name</label>
                      <div className="input-icon-wrapper">
                        <span className="field-icon">🏢</span>
                        <input
                          type="text"
                          name="orgName"
                          placeholder="e.g. Acme Motion Corp"
                          value={formData.orgName}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-field">
                      <label>Account Role Category</label>
                      <div className="input-icon-wrapper">
                        <span className="field-icon">💼</span>
                        <select
                          name="role"
                          value={formData.role}
                          onChange={handleChange}
                        >
                          {portalType === "hr" ? (
                            <>
                              <option value="HR Executive Admin">HR Executive Admin</option>
                              <option value="HR Manager">HR Manager</option>
                              <option value="People Operations Director">People Operations Director</option>
                            </>
                          ) : (
                            <>
                              <option value="Employee Lead">Employee Lead</option>
                              <option value="Senior Frontend Engineer">Senior Frontend Engineer</option>
                              <option value="Staff Member">Staff Member</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <div className="form-field">
                  <label>Work Email Address</label>
                  <div className="input-icon-wrapper">
                    <span className="field-icon">✉️</span>
                    <input
                      type="email"
                      name="email"
                      placeholder={portalType === "hr" ? "admin@hrmotion.ai" : "alex.rivera@hrmotion.ai"}
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label>Password</label>
                  <div className="input-icon-wrapper">
                    <span className="field-icon">🔒</span>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="••••••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className="toggle-pass-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>

                  {isRegister && formData.password && (
                    <div className="pass-strength-bar">
                      <div className="bar-bg">
                        <div
                          className="bar-fill"
                          style={{
                            width: `${passStrength.score}%`,
                            backgroundColor: passStrength.color,
                          }}
                        ></div>
                      </div>
                      <span style={{ color: passStrength.color }}>
                        {passStrength.text}
                      </span>
                    </div>
                  )}
                </div>

                {isRegister && (
                  <div className="form-field">
                    <label>Confirm Password</label>
                    <div className="input-icon-wrapper">
                      <span className="field-icon">🔒</span>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="confirmPassword"
                        placeholder="••••••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                )}

                {!isRegister && (
                  <div className="form-options">
                    <label className="remember-checkbox">
                      <input
                        type="checkbox"
                        name="remember"
                        checked={formData.remember}
                        onChange={(e) =>
                          setFormData({ ...formData, remember: e.target.checked })
                        }
                      />
                      <span>Remember this device</span>
                    </label>
                    <button
                      type="button"
                      className="forgot-pass-link"
                      onClick={() => setForgotModal(true)}
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  {loading ? (
                    <span className="spinner"></span>
                  ) : isRegister ? (
                    `Create ${portalType === "hr" ? "HR" : "Employee"} Account →`
                  ) : (
                    `Sign In to ${portalType === "hr" ? "HR Workspace" : "Employee Portal"} →`
                  )}
                </button>
              </form>
            )}

            {/* QUICK DEMO ACCESS FOR HACKATHON TESTING */}
            {!isRegister && (
              <div className="demo-credentials">
                <p className="demo-title">⚡ Quick Hackathon Demo Access ({portalType === "hr" ? "HR" : "Employee"})</p>
                <div className="demo-btns">
                  {portalType === "hr" ? (
                    <button
                      type="button"
                      className="demo-btn admin"
                      onClick={() => handleQuickDemo("admin@hrmotion.ai", "admin123")}
                    >
                      🏢 Demo Login as Registered HR (Sarah Jenkins)
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="demo-btn employee"
                      onClick={() => handleQuickDemo("alex.rivera@hrmotion.ai", "admin123")}
                    >
                      👤 Demo Login as Registered Employee (Alex Rivera)
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="security-notice">
              <span className="lock-icon">🔒</span>
              <span>256-bit SSL • Registered Accounts Only • Strict View Isolation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>Reset Password</h3>
            <p>Enter your registered work email to receive password reset instructions.</p>
            {forgotSent ? (
              <div className="auth-alert success">
                ✅ Password reset link sent to <strong>{forgotEmail}</strong>.
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit}>
                <div className="form-field">
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setForgotModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Send Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
