import { llm } from "../services/gemini.js";
import { emailPrompt } from "../prompts/emailPrompt.js";
import { parseJSON } from "../tools/jsonParser.js";
console.log("Email Agent Running...");

export async function emailAgent(state){

const prompt = `

${emailPrompt}

Employee:
${JSON.stringify(state.leaveRequest)}

Decision:
${JSON.stringify(state.recommendation)}

`;

const response = await llm.invoke(prompt);

return{
    
    email: parseJSON(response.content)
};

}