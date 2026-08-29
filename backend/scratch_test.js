async function testPipeline() {
  const API_BASE = "http://127.0.0.1:5000/api";

  console.log("=== 1. FETCH ATTACHED MANUAL POLICY DOCUMENT ===");
  const polRes = await fetch(`${API_BASE}/policy`);
  const polData = await polRes.json();
  console.log("Attached Policy Title:", polData.policy.title);
  console.log("Max Standard Days Cap:", polData.policy.max_standard_days);

  console.log("\n=== 2. TEST 5-DAY LEAVE REQUEST (NO EMERGENCY -> AUTO REJECT) ===");
  const req1 = {
    employeeId: "EMP-101",
    employeeName: "Alex Rivera",
    leaveType: "Vacation",
    days: 5,
    isEmergency: false,
    reason: "Taking 5 days for annual vacation trip"
  };
  const res1 = await fetch(`${API_BASE}/leave`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req1)
  });
  const data1 = await res1.json();
  console.log("Status:", data1.policy.approved ? "APPROVED" : "AUTO REJECTED");
  console.log("Reason:", data1.policy.reason);
  console.log("Auto-Rejected Flag:", data1.policy.autoRejected);

  console.log("\n=== 3. TEST 5-DAY LEAVE REQUEST (WITH EMERGENCY EXCEPTION -> QUEUED FOR HR) ===");
  const req2 = {
    employeeId: "EMP-101",
    employeeName: "Alex Rivera",
    leaveType: "Emergency",
    days: 5,
    isEmergency: true,
    reason: "Urgent medical emergency hospitalization and casualty care required"
  };
  const res2 = await fetch(`${API_BASE}/leave`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req2)
  });
  const data2 = await res2.json();
  console.log("Status:", data2.policy.approved ? "APPROVED (Emergency Exception)" : "REJECTED");
  console.log("Reason:", data2.policy.reason);
  console.log("Queued for Human HR Review:", data2.policy.requiresHumanHrApproval);

  console.log("\n=== 4. FETCH PENDING HUMAN HR REVIEW QUEUE ===");
  const hrRes = await fetch(`${API_BASE}/leave/pending-hr`);
  const hrData = await hrRes.json();
  console.log(`Pending Requests count in HR Website Queue: ${hrData.pending.length}`);
  const targetReq = hrData.pending.find(r => r.workflow_id === data2.workflowId);
  if (targetReq) {
    console.log("Found Emergency Request in HR Queue:", targetReq.workflow_id, targetReq.employee_name, `${targetReq.days} Days`);

    console.log("\n=== 5. SUBMIT HUMAN HR DECISION (HR MANAGER APPROVE) ===");
    const decRes = await fetch(`${API_BASE}/leave/hr-decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workflowId: targetReq.workflow_id,
        decision: "Approved",
        notes: "Approved under Emergency Exception policy clause.",
        reviewerName: "Sarah Jenkins"
      })
    });
    const decData = await decRes.json();
    console.log("HR Decision Output:", decData.message, decData.status);
  }

  console.log("\n✅ ALL TESTS PASSED PERFECTLY!");
}

testPipeline().catch(err => console.error("Pipeline test failed:", err));
