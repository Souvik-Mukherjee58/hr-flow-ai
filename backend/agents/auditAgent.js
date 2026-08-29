import { llm } from "../services/gemini.js";
import { auditPrompt } from "../prompts/auditPrompt.js";
import { parseJSON } from "../tools/jsonParser.js";
console.log("Audit Agent Running...");
export async function auditAgent(state){

const prompt = `

${auditPrompt}

Employee:
${JSON.stringify(state.leaveRequest)}

Policy:
${JSON.stringify(state.policy)}

Workload:
${JSON.stringify(state.workload)}

Burnout:
${JSON.stringify(state.burnout)}

Recommendation:
${JSON.stringify(state.recommendation)}

`;

const response = await llm.invoke(prompt);

return{
    
    audit: parseJSON(response.content)
};

}