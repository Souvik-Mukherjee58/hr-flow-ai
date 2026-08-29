import { llm } from "../services/gemini.js";
import { workloadPrompt } from "../prompts/workloadPrompt.js";
import { analyticsTool } from "../tools/analyticsTool.js";
import { parseJSON } from "../tools/jsonParser.js";
console.log("Workload Agent Running...");

export async function workloadAgent(state) {

    const analytics = await analyticsTool(state.leaveRequest.employeeId);

    const prompt = `
${workloadPrompt}

Employee Analytics:
${JSON.stringify(analytics)}
`;

   const response = await llm.invoke(prompt);

return {
    
  workload: parseJSON(response.content)
};
}