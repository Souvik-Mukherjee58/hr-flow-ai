import { initDb, dbGet, dbAll } from "./db.js";

async function runTests() {
  console.log("🚀 Running Backend CI Test Suite...");
  
  try {
    // Test 1: Database Initialization
    console.log("▶ Test 1: Database initialization and tables check...");
    await initDb();
    const employees = await dbAll("SELECT * FROM employees");
    if (!employees || employees.length === 0) {
      throw new Error("Employees table empty or failed to seed.");
    }
    console.log(`  ✓ Database ready. ${employees.length} employees verified.`);

    // Test 2: Policy Document Integrity
    console.log("▶ Test 2: Policy document check...");
    const policy = await dbGet("SELECT * FROM company_policies ORDER BY id DESC LIMIT 1");
    if (!policy || policy.max_standard_days !== 3) {
      throw new Error("Default policy not found or 3-day cap missing.");
    }
    console.log(`  ✓ Policy verified: ${policy.title} (Cap: ${policy.max_standard_days} days).`);

    // Test 3: Leave Requests & Calendar Date Ranges
    console.log("▶ Test 3: Leave requests & calendar schema check...");
    const leaves = await dbAll("SELECT * FROM leave_requests");
    if (!leaves || leaves.length === 0) {
      throw new Error("No leave requests found in DB.");
    }
    console.log(`  ✓ Leave records verified (${leaves.length} records).`);

    console.log("✅ All Backend CI tests passed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ CI Test Failed:", err.message);
    process.exit(1);
  }
}

runTests();
