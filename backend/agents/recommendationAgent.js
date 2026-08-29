import { llm } from "../services/gemini.js";
import { recommendationPrompt } from "../prompts/recommendationPrompt.js";
import { parseJSON } from "../tools/jsonParser.js";
console.log("Recommendation Agent Running...");
export async function recommendationAgent(state) {

const prompt = `

${recommendationPrompt}

Policy Result:
${JSON.stringify(state.policy)}

Workload Result:
${JSON.stringify(state.workload)}

Burnout Result:
${JSON.stringify(state.burnout)}

Employee Request:
${JSON.stringify(state.leaveRequest)}

`;

const response = await llm.invoke(prompt);

return {
    
    recommendation: parseJSON(response.content)
};

}