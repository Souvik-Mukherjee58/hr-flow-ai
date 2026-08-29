export function parseJSON(text) {
  try {
    // If response is already an object
    if (typeof text === "object") return text;

    // Convert to string
    let cleaned = String(text).trim();

    // Remove ```json
    cleaned = cleaned.replace(/```json/gi, "");

    // Remove ```
    cleaned = cleaned.replace(/```/g, "");

    // Trim again
    cleaned = cleaned.trim();

    return JSON.parse(cleaned);
  } catch (error) {
    return {
      raw: text,
      parsed: false,
    };
  }
}