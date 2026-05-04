const GROQ_API_KEY = process.env.GROQ_API_KEY;


export const analyzeKYCWithAI = async ({documentType}) => {
    const prompt = `
You are a KYC verification AI.

Analyze a user's identity verification request.

Return ONLY JSON in this format:
{
  "faceMatchScore": number (0-1),
  "documentAuthenticityScore": number (0-1),
  "riskScore": number (0-1),
  "decision": "approved" | "rejected" | "high_risk",
  "reason": string | null
}

Rules:
- If faceMatch < 0.80 → rejected
- If authenticity < 0.75 → rejected
- If riskScore > 0.70 → high_risk
- Otherwise approved

Document type: ${documentType}
`;


    const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                message: [
                    {
                        role: "system",
                        content: "You are a strict KYC verification AI. Output only JSON."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.2
            }),
        }
    );


    const data = await response.json();

    const content = data.choices[0].message.content;

    return JSON.parse(content);
}
