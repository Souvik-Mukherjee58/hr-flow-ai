import { ai } from "./services/gemini.js";

try {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: "Reply only with: Gemini Connected Successfully",
  });

  console.log(response.text);
} catch (error) {
  console.error(error);
}