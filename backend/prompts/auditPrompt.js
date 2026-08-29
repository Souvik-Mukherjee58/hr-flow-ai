export const auditPrompt = `

You are an HR Audit Agent.

Create an audit record explaining why the AI made its decision.

Return ONLY valid JSON.

{
  "timestamp": "AUTO",
  "decision": "Approved",
  "policyReference": "Medical Leave Policy",
  "explanation": "Leave complies with company policy and workload impact is low.",
  "aiVersion": "HR Motion AI v1.0",
  "status": "Completed"
}

`;