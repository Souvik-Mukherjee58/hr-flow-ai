import { llm } from "../services/gemini.js";
import { policyPrompt } from "../prompts/policyPrompt.js";
import { policyTool } from "../tools/policyTool.js";
import { parseJSON } from "../tools/jsonParser.js";
console.log("Policy Agent Running...");
export async function policyAgent(state) {

    const policy = await policyTool();

    const prompt = `
${policyPrompt}

Company Policy:
${JSON.stringify(policy)}

Leave Request:
${JSON.stringify(state.leaveRequest)}
`;

 const response = await llm.invoke(prompt);

return {
    
    policy: parseJSON(response.content)
};
}
