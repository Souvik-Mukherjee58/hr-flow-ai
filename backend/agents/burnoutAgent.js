import { llm } from "../services/gemini.js";
import { burnoutPrompt } from "../prompts/burnoutPrompt.js";
import { analyticsTool } from "../tools/analyticsTool.js";
import { parseJSON } from "../tools/jsonParser.js";

console.log("Burnout Agent Running...");

export async function burnoutAgent(state) {

    const analytics = await analyticsTool(state.leaveRequest.employeeId);

    const prompt = `
${burnoutPrompt}

Employee Analytics:
${JSON.stringify(analytics)}
`;

    const response = await llm.invoke(prompt);

    return {
        burnout: parseJSON(response.content)
    };
}