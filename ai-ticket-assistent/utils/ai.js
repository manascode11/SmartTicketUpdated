import { GoogleGenAI, Type } from "@google/genai";
import "dotenv/config";

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey });

const analyzeTicket = async (ticket) => {
  try {
    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY environment variable inside your .env file");
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze this technical support ticket:
      Title: ${ticket.title}
      Description: ${ticket.description}`,
      config: {
        systemInstruction: `You are a senior engineer triaging support tickets. Be concise and direct.

        Rules:
        - summary: One clear sentence describing the problem.
        - priority: low, medium, or high based on user impact.
        - helpfulNotes: Exactly 3-4 lines. State the root cause, the fix, and one key thing to watch out for. No headers, no code blocks, no bullet points — plain sentences only.
        - relatedSkills: 2-4 short tech tags relevant to the issue.

        Keep everything brief. Do not over-explain.`,

        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "One sentence describing the core issue.",
            },
            priority: {
              type: Type.STRING,
              enum: ["low", "medium", "high"],
            },
            helpfulNotes: {
              type: Type.STRING,
              description: "3-4 plain sentences: root cause, fix, and a watchout.",
            },
            relatedSkills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "2-4 short tech tags, e.g. 'Node.js', 'Memory Leak'.",
            },
          },
          required: ["summary", "priority", "helpfulNotes", "relatedSkills"],
        },
      },
    });

    const rawText = response.text;
    return JSON.parse(rawText);

  } catch (err) {
    console.error(" Gemini API Triage Failed:", err.message);
    return {
      summary: "Failed to analyze ticket due to an AI engine error.",
      priority: "high",
      helpfulNotes: "The AI engine could not process this ticket. Check your API key and network connection. Review the ticket manually until the issue is resolved.",
      relatedSkills: ["Debugging", "API"],
    };
  }
};

export default analyzeTicket;