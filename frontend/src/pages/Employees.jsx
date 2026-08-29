import { useState, useEffect } from "react";
import { fetchEmployees, addEmployee } from "../services/api";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [newEmp, setNewEmp] = useState({
    name: "",
    department: "Engineering",
    role: "",
    email: "",
    workload_score: 50,
    burnout_risk: "Low",
    leave_balance: 20,
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetchEmployees();
      setEmployees(res.employees || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await addEmployee(newEmp);
      setShowModal(false);
      setNewEmp({
        name: "",
        department: "Engineering",
        role: "",
        email: "",
        workload_score: 50,
        burnout_risk: "Low",
        leave_balance: 20,
      });
      loadEmployees();
    } catch (err) {
      alert("Failed to add employee: " + err.message);
    }
  };

  const filtered = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase()) ||
      emp.role.toLowerCase().includes(search.toLowerCase());
    const matchesDept = filterDept === "All" || emp.department === filterDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="employees-container">
      {/* Controls Header */}
      <div className="panel-controls">
        <div className="controls-left">
          <input
            type="text"
            className="search-input"
            placeholder="Search employee by name, email, or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="filter-select"
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
          >
            <option value="All">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Product">Product</option>
            <option value="Data Science">Data Science</option>
            <option value="People Operations">People Operations</option>
            <option value="Sales">Sales</option>
            <option value="Design">Design</option>
          </select>
        </div>

        <button type="button" className="btn-primary" onClick={() => setShowModal(true)}>
          + Add Employee
        </button>
      </div>

      {/* Directory Table */}
      <div className="panel-card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Role / Title</th>
                <th>Workload Capacity</th>
                <th>Burnout Index</th>
                <th>Leave Balance</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">Loading directory...</td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <div className="user-cell">
                        <div className="avatar-circle">{emp.avatar || emp.name.slice(0, 2).toUpperCase()}</div>
                        <div>
                          <strong>{emp.name}</strong>
                          <small>{emp.email}</small>
                        </div>
                      </div>
                    </td>
                    <td><span className="dept-tag">{emp.department}</span></td>
                    <td>{emp.role}</td>
                    <td>
                      <div className="workload-mini-bar">
                        <span>{emp.workload_score}%</span>
                        <div className="bar-bg">
                          <div
                            className={`bar-fill ${emp.workload_score > 80 ? "high" : emp.workload_score > 60 ? "med" : "low"}`}
                            style={{ width: `${emp.workload_score}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`risk-badge ${emp.burnout_risk.toLowerCase()}`}>
                        {emp.burnout_risk}
                      </span>
                    </td>
                    <td><strong>{emp.leave_balance} Days</strong></td>
                    <td>
                      <button type="button" className="btn-table-action">
                        View Analytics
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-4">No employees matched your filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>Add New Team Member</h3>
            <p>Save new employee profile to SQLite database</p>
            <form onSubmit={handleCreate}>
              <div className="form-field">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Jordan Miller"
                  value={newEmp.name}
                  onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-field">
                <label>Work Email</label>
                <input
                  type="email"
                  placeholder="jordan.m@company.com"
                  value={newEmp.email}
                  onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-field">
                  <label>Department</label>
                  <select
                    value={newEmp.department}
                    onChange={(e) => setNewEmp({ ...newEmp, department: e.target.value })}
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Product">Product</option>
                    <option value="Data Science">Data Science</option>
                    <option value="People Operations">People Operations</option>
                    <option value="Sales">Sales</option>
                    <option value="Design">Design</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Role Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior QA Engineer"
                    value={newEmp.role}
                    onChange={(e) => setNewEmp({ ...newEmp, role: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save to DB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
