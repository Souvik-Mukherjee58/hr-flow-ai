const API_BASE = "http://localhost:5000/api";

// Local state tracking for registered accounts in offline mode
const LOCAL_USERS_KEY = "hrmotion_registered_users";

export const getRegisteredUsers = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || "[]");
  } catch {
    return [];
  }
};

export const saveRegisteredUser = (user) => {
  const users = getRegisteredUsers();
  const existingIndex = users.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase());
  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
};

// Token storage helper
export const getAuthToken = () => localStorage.getItem("hrmotion_token");
export const setAuthToken = (token) => localStorage.setItem("hrmotion_token", token);
export const removeAuthToken = () => localStorage.removeItem("hrmotion_token");

// Base fetch wrapper
async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let res;
  try {
    res = await fetch(`/api${endpoint.startsWith('/api') ? endpoint.slice(4) : endpoint}`, {
      ...options,
      headers,
    });
  } catch (netErr) {
    try {
      res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });
    } catch (e) {
      throw new Error("Unable to connect to backend server. Please ensure backend is running (`cd backend && npm start`).");
    }
  }

  const contentType = res.headers.get("content-type") || "";
  let data;
  if (contentType.includes("application/json")) {
    data = await res.json();
  } else {
    const text = await res.text();
    console.error("Non-JSON response received:", text);
    throw new Error(`Server error (${res.status}). Please ensure backend server is running.`);
  }

  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }

  return data;
}

// Authentication APIs: ONLY REGISTERED USERS CAN SIGN IN
export async function loginUser(email, password, portalType = "hr") {
  const cleanEmail = email.toLowerCase().trim();

  try {
    const data = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: cleanEmail, password, portalType }),
    });
    if (data.token) {
      setAuthToken(data.token);
    }
    return data;
  } catch (err) {
    if (err.message.includes("Unable to connect to backend")) {
      const users = getRegisteredUsers();
      if (cleanEmail === "admin@hrmotion.ai" && password === "admin123") {
        if (portalType === "employee") {
          throw new Error("Account \"admin@hrmotion.ai\" is registered as HR. Please switch to the HR Login portal.");
        }
        const adminUser = {
          id: 1,
          fullName: "Sarah Jenkins",
          email: "admin@hrmotion.ai",
          orgName: "Acme Motion Corp",
          role: "HR Executive Admin",
          avatar: "SJ",
        };
        setAuthToken("demo_token_admin");
        return { success: true, token: "demo_token_admin", user: adminUser };
      }

      if (cleanEmail === "alex.rivera@hrmotion.ai" && password === "admin123") {
        if (portalType === "hr") {
          throw new Error("Account \"alex.rivera@hrmotion.ai\" is registered as Employee. Please switch to the Employee Login portal.");
        }
        const empUser = {
          id: 2,
          fullName: "Alex Rivera",
          email: "alex.rivera@hrmotion.ai",
          orgName: "Acme Motion Corp",
          role: "Employee Lead",
          avatar: "AR",
        };
        setAuthToken("demo_token_alex");
        return { success: true, token: "demo_token_alex", user: empUser };
      }

      const found = users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (!found) {
        throw new Error(`No registered account found for "${cleanEmail}". Only registered accounts can log in. Please register first.`);
      }

      const isHr = found.role && (found.role.includes("HR") || found.role.includes("Admin"));
      if (portalType === "hr" && !isHr) {
        throw new Error(`Account "${cleanEmail}" is registered as Employee. Please switch to the Employee Login portal.`);
      }
      if (portalType === "employee" && isHr) {
        throw new Error(`Account "${cleanEmail}" is registered as HR. Please switch to the HR Login portal.`);
      }

      if (found.password !== password) {
        throw new Error("Incorrect password. Please check your credentials.");
      }
      setAuthToken(`token_${found.id}`);
      return { success: true, token: `token_${found.id}`, user: found };
    }
    throw err;
  }
}

export async function sendOtp(email, portalType = "hr") {
  const cleanEmail = email.toLowerCase().trim();
  try {
    return await request("/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ email: cleanEmail, portalType }),
    });
  } catch (err) {
    if (err.message.includes("Unable to connect to backend")) {
      const users = getRegisteredUsers();
      if (cleanEmail === "admin@hrmotion.ai" || cleanEmail === "alex.rivera@hrmotion.ai" || users.some((u) => u.email.toLowerCase() === cleanEmail)) {
        const mockCode = "742918";
        return {
          success: true,
          message: `OTP code sent to ${cleanEmail}. (Code: ${mockCode})`,
          otpCode: mockCode,
        };
      }
      throw new Error(`No registered account found for "${cleanEmail}". Only registered accounts can receive OTP. Please register first.`);
    }
    throw err;
  }
}

export async function verifyOtp(email, otp, portalType = "hr") {
  const cleanEmail = email.toLowerCase().trim();
  try {
    const data = await request("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email: cleanEmail, otp, portalType }),
    });
    if (data.token) {
      setAuthToken(data.token);
    }
    return data;
  } catch (err) {
    if (err.message.includes("Unable to connect to backend")) {
      if (cleanEmail === "admin@hrmotion.ai") {
        const user = { id: 1, fullName: "Sarah Jenkins", email: "admin@hrmotion.ai", orgName: "Acme Motion Corp", role: "HR Executive Admin", avatar: "SJ" };
        setAuthToken("demo_token_admin");
        return { success: true, token: "demo_token_admin", user };
      }
      if (cleanEmail === "alex.rivera@hrmotion.ai") {
        const user = { id: 2, fullName: "Alex Rivera", email: "alex.rivera@hrmotion.ai", orgName: "Acme Motion Corp", role: "Employee Lead", avatar: "AR" };
        setAuthToken("demo_token_alex");
        return { success: true, token: "demo_token_alex", user };
      }
      const users = getRegisteredUsers();
      const found = users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (found) {
        setAuthToken(`token_${found.id}`);
        return { success: true, token: `token_${found.id}`, user: found };
      }
      throw new Error(`No registered account found for "${cleanEmail}". Please register first.`);
    }
    throw err;
  }
}

export async function registerUser(userData) {
  const cleanEmail = userData.email.toLowerCase().trim();

  try {
    const data = await request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ ...userData, email: cleanEmail }),
    });
    if (data.token) {
      setAuthToken(data.token);
    }
    saveRegisteredUser({ ...data.user, password: userData.password });
    return data;
  } catch (err) {
    if (err.message.includes("Unable to connect to backend")) {
      const users = getRegisteredUsers();
      const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (existing) {
        throw new Error(`An account with email "${cleanEmail}" is already registered. Please sign in instead.`);
      }

      const assignedRole = userData.role || (userData.portalType === "employee" ? "Employee Lead" : "HR Executive Admin");

      const newUser = {
        id: Date.now(),
        fullName: userData.fullName.trim(),
        email: cleanEmail,
        password: userData.password,
        orgName: userData.orgName || "Acme Motion Corp",
        role: assignedRole,
        avatar: (userData.fullName || "HR").slice(0, 2).toUpperCase(),
      };
      saveRegisteredUser(newUser);
      setAuthToken(`token_${newUser.id}`);
      return { success: true, token: `token_${newUser.id}`, user: newUser };
    }
    throw err;
  }
}

export async function fetchCurrentUser() {
  try {
    return await request("/auth/me");
  } catch (err) {
    const token = getAuthToken();
    if (token) {
      const users = getRegisteredUsers();
      const user = users.find((u) => `token_${u.id}` === token) || {
        id: 1,
        fullName: "Sarah Jenkins",
        email: "admin@hrmotion.ai",
        orgName: "Acme Motion Corp",
        role: "HR Executive Admin",
        avatar: "SJ",
      };
      return { success: true, user };
    }
    throw err;
  }
}

// Policy Document APIs
export async function fetchPolicyDocument() {
  return await request("/policy");
}

export async function updatePolicyDocument(policyData) {
  return await request("/policy", {
    method: "POST",
    body: JSON.stringify(policyData),
  });
}

// HR Human Review Queue APIs
export async function fetchPendingHrRequests() {
  return await request("/leave/pending-hr");
}

export async function submitHrDecision(decisionData) {
  return await request("/leave/hr-decision", {
    method: "POST",
    body: JSON.stringify(decisionData),
  });
}

// Employees APIs
export async function fetchEmployees() {
  return await request("/employees");
}

export async function addEmployee(employeeData) {
  return await request("/employees", {
    method: "POST",
    body: JSON.stringify(employeeData),
  });
}

// Leave AI Request API
export async function processLeaveRequest(leaveData) {
  return await request("/leave", {
    method: "POST",
    body: JSON.stringify(leaveData),
  });
}

// Leave History & Analytics
export async function fetchLeaveHistory() {
  return await request("/leave/history");
}

export async function fetchAnalytics() {
  return await request("/analytics");
}
