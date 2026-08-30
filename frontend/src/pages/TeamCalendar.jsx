import { useState, useEffect } from "react";
import { fetchCalendarEvents, fetchEmployees, processLeaveRequest } from "../services/api";

export default function TeamCalendar({ user, portalMode, onApplyLeaveClick }) {
  const [loading, setLoading] = useState(true);
  const [calendarData, setCalendarData] = useState({
    events: [],
    overlaps: [],
    departmentCoverage: [],
    summary: {
      totalEvents: 0,
      onLeaveToday: 0,
      totalEmployees: 6,
      overallAvailability: "100%",
      totalCollisions: 0,
    },
  });

  const [employees, setEmployees] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("month"); // 'month' | 'week' | 'heatmap'
  const [deptFilter, setDeptFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modals & Drawers
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [bookingDate, setBookingDate] = useState(null);
  const [submittingLeave, setSubmittingLeave] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    employeeId: user?.id ? `EMP-${user.id}` : "EMP-101",
    employeeName: user?.fullName || "Alex Rivera",
    leaveType: "Vacation",
    days: 2,
    startDate: new Date().toISOString().split("T")[0],
    isEmergency: false,
    reason: "Scheduled personal time off",
  });

  const isHr = portalMode === "hr";

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [calRes, empRes] = await Promise.all([
        fetchCalendarEvents().catch(() => null),
        fetchEmployees().catch(() => ({ employees: [] })),
      ]);

      if (calRes && calRes.success) {
        setCalendarData(calRes);
      }
      setEmployees(empRes.employees || []);
    } catch (err) {
      console.error("Error loading team calendar:", err);
    } finally {
      setLoading(false);
    }
  };

  // Month navigation
  const prevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Date calculation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const currentMonthName = monthNames[month];

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const todayStr = new Date().toISOString().split("T")[0];

  // Filter events
  const filteredEvents = calendarData.events.filter((ev) => {
    if (deptFilter !== "All" && ev.department !== deptFilter) return false;
    if (statusFilter === "Approved" && ev.status !== "APPROVED_BY_HR" && ev.recommendation !== "APPROVED") return false;
    if (statusFilter === "Pending" && ev.status !== "Pending" && ev.hr_decision !== "Pending") return false;
    if (statusFilter === "Emergency" && !ev.is_emergency) return false;
    return true;
  });

  // Check if a specific date string ("YYYY-MM-DD") falls between event start and end
  const isDateInEvent = (dateStr, ev) => {
    return dateStr >= ev.start_date && dateStr <= ev.end_date;
  };

  // Get events on a specific day
  const getEventsForDay = (dateStr) => {
    return filteredEvents.filter((ev) => isDateInEvent(dateStr, ev));
  };

  // Get overlaps for a specific day
  const getOverlapsForDay = (dateStr) => {
    return calendarData.overlaps.filter((ov) => ov.date === dateStr);
  };

  // Quick leave submission handler
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setSubmittingLeave(true);
    try {
      await processLeaveRequest({
        ...bookingForm,
        startDate: bookingForm.startDate,
        days: Number(bookingForm.days),
      });
      setBookingDate(null);
      await loadData();
    } catch (err) {
      alert("Failed to submit leave request: " + err.message);
    } finally {
      setSubmittingLeave(false);
    }
  };

  const openBookingForDate = (dateStr) => {
    setBookingForm((prev) => ({
      ...prev,
      startDate: dateStr,
    }));
    setBookingDate(dateStr);
  };

  // Departments list
  const departments = ["All", "Engineering", "Product", "Data Science", "People Operations", "Sales", "Design"];

  // Weekly View Calculations
  const getWeekDays = () => {
    const current = new Date(currentDate);
    const dayOfWeek = current.getDay(); // 0 is Sunday
    const startOfWeek = new Date(current);
    startOfWeek.setDate(current.getDate() - dayOfWeek);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      weekDays.push(d);
    }
    return weekDays;
  };

  const weekDays = getWeekDays();

  return (
    <div className="team-calendar-container">
      {/* Top Banner & KPI Summary Strip */}
      <div className="calendar-kpi-strip">
        <div className="kpi-block kpi-gradient-blue">
          <div className="kpi-icon-pill">👥</div>
          <div className="kpi-info">
            <span className="kpi-value">{calendarData.summary?.overallAvailability || "88%"}</span>
            <span className="kpi-label">Workforce Available</span>
          </div>
        </div>

        <div className="kpi-block kpi-gradient-purple">
          <div className="kpi-icon-pill">🏖️</div>
          <div className="kpi-info">
            <span className="kpi-value">{calendarData.summary?.totalEvents || filteredEvents.length}</span>
            <span className="kpi-label">Scheduled Leaves</span>
          </div>
        </div>

        <div className="kpi-block kpi-gradient-orange">
          <div className="kpi-icon-pill">🚨</div>
          <div className="kpi-info">
            <span className="kpi-value">{calendarData.overlaps?.length || 0}</span>
            <span className="kpi-label">Department Collisions</span>
          </div>
        </div>

        <div className="kpi-block kpi-gradient-green">
          <div className="kpi-icon-pill">⚡</div>
          <div className="kpi-info">
            <span className="kpi-value">{calendarData.summary?.onLeaveToday || 0}</span>
            <span className="kpi-label">Away Today</span>
          </div>
        </div>
      </div>

      {/* Collision Alerts Warning Banner (if any) */}
      {calendarData.overlaps?.length > 0 && (
        <div className="calendar-collision-banner">
          <div className="collision-badge-pill">⚠️ AI COLLISION RADAR</div>
          <div className="collision-text">
            <strong>{calendarData.overlaps.length} Department Overlap Collision(s) Detected:</strong>{" "}
            {calendarData.overlaps.map((ov, idx) => (
              <span key={idx} className="collision-detail-tag">
                {ov.department} on {ov.date} ({ov.employees.join(" & ")})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main Calendar Navigation & Filters Toolbar */}
      <div className="calendar-toolbar-card">
        <div className="toolbar-left">
          <div className="month-stepper">
            <button type="button" className="btn-stepper" onClick={prevMonth} title="Previous Month">
              ◀
            </button>
            <h2 className="current-month-heading">
              {currentMonthName} {year}
            </h2>
            <button type="button" className="btn-stepper" onClick={nextMonth} title="Next Month">
              ▶
            </button>
            <button type="button" className="btn-stepper-today" onClick={goToToday}>
              Today
            </button>
          </div>

          {/* View Mode Switcher */}
          <div className="view-mode-tabs">
            <button
              type="button"
              className={`view-tab-btn ${viewMode === "month" ? "active" : ""}`}
              onClick={() => setViewMode("month")}
            >
              📅 Month Grid
            </button>
            <button
              type="button"
              className={`view-tab-btn ${viewMode === "week" ? "active" : ""}`}
              onClick={() => setViewMode("week")}
            >
              📊 Weekly Gantt
            </button>
            <button
              type="button"
              className={`view-tab-btn ${viewMode === "heatmap" ? "active" : ""}`}
              onClick={() => setViewMode("heatmap")}
            >
              🔥 Capacity Heatmap
            </button>
          </div>
        </div>

        <div className="toolbar-right">
          {/* Department Filter Pills */}
          <div className="dept-filter-group">
            <span className="filter-label">Dept:</span>
            <select
              className="dept-select"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Schedule Leave Button */}
          <button
            type="button"
            className="btn-quick-schedule-leave"
            onClick={() => openBookingForDate(todayStr)}
          >
            <span>+ Schedule Leave</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. MONTHLY CALENDAR GRID VIEW */}
      {/* ========================================================================= */}
      {viewMode === "month" && (
        <div className="calendar-grid-card">
          {/* Weekday Header */}
          <div className="calendar-weekdays-row">
            {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, i) => (
              <div key={i} className={`weekday-col-header ${i === 0 || i === 6 ? "weekend" : ""}`}>
                <span className="full-name">{day}</span>
                <span className="short-name">{day.slice(0, 3)}</span>
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="calendar-days-grid">
            {/* Previous Month Days */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => {
              const prevDateNum = daysInPrevMonth - firstDayOfMonth + i + 1;
              return (
                <div key={`prev-${i}`} className="calendar-day-cell other-month">
                  <div className="day-number-header">
                    <span className="day-num">{prevDateNum}</span>
                  </div>
                </div>
              );
            })}

            {/* Current Month Days */}
            {Array.from({ length: daysInCurrentMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              const isToday = dateStr === todayStr;
              const dayEvents = getEventsForDay(dateStr);
              const dayOverlaps = getOverlapsForDay(dateStr);
              const isWeekend = (firstDayOfMonth + i) % 7 === 0 || (firstDayOfMonth + i) % 7 === 6;

              return (
                <div
                  key={`cur-${dayNum}`}
                  className={`calendar-day-cell ${isToday ? "cell-today" : ""} ${isWeekend ? "cell-weekend" : ""} ${dayOverlaps.length > 0 ? "cell-overlap" : ""}`}
                  onClick={() => openBookingForDate(dateStr)}
                >
                  <div className="day-number-header">
                    <span className={`day-num ${isToday ? "today-badge" : ""}`}>{dayNum}</span>
                    {isToday && <span className="today-label">TODAY</span>}

                    {dayOverlaps.length > 0 && (
                      <span className="collision-indicator-dot" title="Department Leave Collision!">
                        ⚠️ {dayOverlaps[0].department}
                      </span>
                    )}
                  </div>

                  {/* Leave Chips Container */}
                  <div className="day-events-container">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <div
                        key={ev.workflow_id}
                        className={`calendar-event-chip dept-${(ev.department || "eng").toLowerCase().replace(/\s+/g, "-")} ${ev.is_emergency ? "chip-emergency" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(ev);
                        }}
                      >
                        <span className="event-chip-avatar">{ev.avatar || "EM"}</span>
                        <span className="event-chip-name">{ev.employee_name}</span>
                        {ev.is_emergency ? (
                          <span className="event-chip-badge emergency">EMERGENCY</span>
                        ) : (
                          <span className="event-chip-type">{ev.leave_type}</span>
                        )}
                      </div>
                    ))}

                    {dayEvents.length > 3 && (
                      <div className="more-events-badge">
                        +{dayEvents.length - 3} more away
                      </div>
                    )}
                  </div>

                  {/* Add Leave Shortcut on Hover */}
                  <div className="cell-hover-action">
                    <span>+ Book</span>
                  </div>
                </div>
              );
            })}

            {/* Next Month Filler Days */}
            {Array.from({
              length: (7 - ((firstDayOfMonth + daysInCurrentMonth) % 7)) % 7,
            }).map((_, i) => (
              <div key={`next-${i}`} className="calendar-day-cell other-month">
                <div className="day-number-header">
                  <span className="day-num">{i + 1}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. WEEKLY GANTT TIMELINE VIEW */}
      {/* ========================================================================= */}
      {viewMode === "week" && (
        <div className="weekly-gantt-card">
          <div className="gantt-header-row">
            <div className="gantt-emp-col-header">Employee & Department</div>
            <div className="gantt-days-columns">
              {weekDays.map((d, idx) => {
                const dStr = d.toISOString().split("T")[0];
                const isToday = dStr === todayStr;
                return (
                  <div key={idx} className={`gantt-day-col ${isToday ? "today" : ""}`}>
                    <span className="gantt-day-name">{d.toLocaleDateString("en-US", { weekday: "short" })}</span>
                    <span className="gantt-day-num">{d.getDate()}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="gantt-body">
            {employees.map((emp) => {
              const empEvents = filteredEvents.filter((ev) => ev.employee_id === emp.id);

              return (
                <div key={emp.id} className="gantt-emp-row">
                  <div className="gantt-emp-info">
                    <div className="emp-avatar-circle">{emp.avatar || "EM"}</div>
                    <div className="emp-meta">
                      <strong>{emp.name}</strong>
                      <small>{emp.role} • {emp.department}</small>
                    </div>
                  </div>

                  <div className="gantt-track-cols">
                    {weekDays.map((d, colIdx) => {
                      const dStr = d.toISOString().split("T")[0];
                      const activeEvent = empEvents.find((ev) => isDateInEvent(dStr, ev));
                      const isToday = dStr === todayStr;

                      return (
                        <div key={colIdx} className={`gantt-cell ${isToday ? "today-cell" : ""}`}>
                          {activeEvent && (
                            <div
                              className={`gantt-leave-bar ${activeEvent.is_emergency ? "emergency" : "standard"}`}
                              onClick={() => setSelectedEvent(activeEvent)}
                              title={`${emp.name}: ${activeEvent.leave_type} (${activeEvent.start_date} to ${activeEvent.end_date})`}
                            >
                              <span>{activeEvent.leave_type}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DEPARTMENT CAPACITY & COVERAGE HEATMAP */}
      {/* ========================================================================= */}
      {viewMode === "heatmap" && (
        <div className="heatmap-view-card">
          <div className="heatmap-header">
            <h3>🏢 Department Capacity & Coverage Radar</h3>
            <p>Real-time workforce availability metrics and automated AI coverage risk analysis</p>
          </div>

          <div className="heatmap-departments-grid">
            {calendarData.departmentCoverage?.map((dept, idx) => (
              <div key={idx} className={`dept-coverage-card status-${dept.status.toLowerCase()}`}>
                <div className="dept-coverage-top">
                  <div>
                    <h4>{dept.department}</h4>
                    <small>{dept.totalStaff} Total Staff Members</small>
                  </div>
                  <span className={`status-pill ${dept.status.toLowerCase()}`}>
                    {dept.status}
                  </span>
                </div>

                <div className="coverage-meter-container">
                  <div className="meter-labels">
                    <span>Available Capacity</span>
                    <strong>{dept.coveragePct}%</strong>
                  </div>
                  <div className="meter-track">
                    <div
                      className={`meter-fill ${dept.status.toLowerCase()}`}
                      style={{ width: `${dept.coveragePct}%` }}
                    ></div>
                  </div>
                </div>

                <div className="dept-stats-row">
                  <div className="stat-pill">
                    <span className="label">Active on Duty:</span>
                    <strong>{dept.availableStaff}</strong>
                  </div>
                  <div className="stat-pill">
                    <span className="label">Scheduled Off:</span>
                    <strong>{dept.currentlyAway}</strong>
                  </div>
                </div>

                <div className="ai-coverage-tip">
                  <span className="ai-sparkle">🤖 AI Insight:</span>
                  <p>
                    {dept.coveragePct < 60
                      ? `Critical shortage. Recommend pausing optional PTO or requesting peer coverage for ${dept.department}.`
                      : dept.coveragePct < 85
                      ? `Moderate capacity. Ensure critical on-call shifts are handed over smoothly.`
                      : `Optimal operating capacity with healthy peer redundancy.`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LEAVE EVENT DETAILS DRAWER / MODAL */}
      {/* ========================================================================= */}
      {selectedEvent && (
        <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="modal-content leave-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="event-detail-header-left">
                <div className="avatar-huge">{selectedEvent.avatar || "EM"}</div>
                <div>
                  <h3>{selectedEvent.employee_name}</h3>
                  <p>{selectedEvent.role} • {selectedEvent.department}</p>
                </div>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setSelectedEvent(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Status Alert Pill */}
              <div className={`status-banner ${selectedEvent.is_emergency ? "banner-emergency" : "banner-info"}`}>
                <span className="banner-icon">{selectedEvent.is_emergency ? "🚨" : "📅"}</span>
                <div>
                  <strong>
                    {selectedEvent.is_emergency ? "Emergency Policy Exception Leave" : "Standard Leave Request"}
                  </strong>
                  <p>Workflow Reference: {selectedEvent.workflow_id}</p>
                </div>
              </div>

              {/* Leave Meta Details */}
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Leave Type</span>
                  <span className="detail-value">{selectedEvent.leave_type}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Total Duration</span>
                  <span className="detail-value">{selectedEvent.days} Days</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Start Date</span>
                  <span className="detail-value highlight">{selectedEvent.start_date}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">End Date</span>
                  <span className="detail-value highlight">{selectedEvent.end_date}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">HR Governance Status</span>
                  <span className={`status-badge ${selectedEvent.status?.toLowerCase().replace(/_/g, "-")}`}>
                    {selectedEvent.status || "Approved"}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Employee Burnout Risk</span>
                  <span className={`risk-tag ${(selectedEvent.burnout_risk || "Low").toLowerCase()}`}>
                    {selectedEvent.burnout_risk || "Low"} Risk
                  </span>
                </div>
              </div>

              {/* Stated Reason */}
              <div className="stated-reason-box">
                <span className="reason-label">Employee Stated Reason:</span>
                <p>"{selectedEvent.reason}"</p>
              </div>

              {/* HR Notes (if available) */}
              {selectedEvent.hr_notes && (
                <div className="hr-notes-box">
                  <span className="notes-label">🛡️ HR Decision Record:</span>
                  <p>{selectedEvent.hr_notes}</p>
                  {selectedEvent.hr_reviewer && (
                    <small>Reviewed by: {selectedEvent.hr_reviewer}</small>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSelectedEvent(null)}
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUICK LEAVE APPLICATION / BOOKING MODAL */}
      {/* ========================================================================= */}
      {bookingDate && (
        <div className="modal-overlay" onClick={() => setBookingDate(null)}>
          <div className="modal-content schedule-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>⚡ Schedule Leave & AI Verification</h3>
                <p>Selected Date: <strong>{bookingDate}</strong></p>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setBookingDate(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="modal-body">
              <div className="form-group">
                <label>Employee Name & Role</label>
                <select
                  value={bookingForm.employeeId}
                  onChange={(e) => {
                    const emp = employees.find((x) => x.id === e.target.value);
                    setBookingForm((prev) => ({
                      ...prev,
                      employeeId: e.target.value,
                      employeeName: emp ? emp.name : "Alex Rivera",
                    }));
                  }}
                  required
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} — {emp.role} ({emp.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Leave Type</label>
                  <select
                    value={bookingForm.leaveType}
                    onChange={(e) => setBookingForm({ ...bookingForm, leaveType: e.target.value })}
                  >
                    <option value="Vacation">Vacation / PTO</option>
                    <option value="Casual Leave">Casual Leave</option>
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Emergency Leave">Emergency Medical / Family</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={bookingForm.days}
                    onChange={(e) => setBookingForm({ ...bookingForm, days: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={bookingForm.startDate}
                  onChange={(e) => setBookingForm({ ...bookingForm, startDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group-checkbox">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={bookingForm.isEmergency}
                    onChange={(e) => setBookingForm({ ...bookingForm, isEmergency: e.target.checked })}
                  />
                  <span>🚨 Request Emergency Policy Exception (Bypasses 3-day rule for Human HR Review)</span>
                </label>
              </div>

              <div className="form-group">
                <label>Reason for Leave</label>
                <textarea
                  rows="3"
                  value={bookingForm.reason}
                  onChange={(e) => setBookingForm({ ...bookingForm, reason: e.target.value })}
                  placeholder="Provide brief context for AI evaluation..."
                  required
                ></textarea>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setBookingDate(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submittingLeave}
                >
                  {submittingLeave ? "Evaluating Multi-Agent Graph..." : "🚀 Run AI Evaluation & Book"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
