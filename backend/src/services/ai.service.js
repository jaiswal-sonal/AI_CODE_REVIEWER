const { GoogleGenerativeAI } = require("@google/generative-ai");

if (!process.env.GOOGLE_GEMINI_KEY) {
    console.error("❌ GOOGLE_GEMINI_KEY missing hai. backend/.env file banao (backend/.env.example dekho).");
    process.exit(1);
}

const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-3.5-flash";

const SYSTEM_PROMPT = `
You are an expert software code reviewer.

Analyze the submitted code for:

1. Bugs and logical errors
2. Security vulnerabilities
3. Performance issues
4. Coding best practices

Provide:
- Critical issues first
- Short explanations
- Corrected code only when necessary
- Practical improvement suggestions

Avoid unnecessary explanations.
Keep the response concise and beginner-friendly.

Use Markdown formatting.
`;
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_KEY);

const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL; // optional

function buildModel(name) {
    return genAI.getGenerativeModel({
        model: name,

        systemInstruction: SYSTEM_PROMPT,

        generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1200
        }
    });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 503 (server busy) aur 429 (rate limit) temporary hote hain, inhe dobara try karna theek hai
const isRetryable = (err) => err.status === 503 || err.status === 429;

async function tryModel(name, prompt, attempts = 2) {
    const model = buildModel(name);
    let lastError;
    for (let i = 0; i < attempts; i++) {
        try {
            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (error) {
            lastError = error;
            if (!isRetryable(error) || i === attempts - 1) break;
            const wait = 1500 * 2 ** i; // 1.5s, 3s, ...
            console.warn(`⚠️ ${name}: status ${error.status}, ${wait}ms baad retry (${i + 1}/${attempts})`);
            await sleep(wait);
        }
    }
    throw lastError;
}

async function generateContent(prompt) {
    try {
        return await tryModel(MODEL_NAME, prompt);
    } catch (error) {
        if (FALLBACK_MODEL && isRetryable(error)) {
            console.warn(`⚠️ ${MODEL_NAME} fail hua, ${FALLBACK_MODEL} try kar raha hoon`);
            try {
                return await tryModel(FALLBACK_MODEL, prompt, 2);
            } catch (fallbackError) {
                console.error("❌ Fallback model bhi fail:", fallbackError.message);
                throw fallbackError;
            }
        }
        console.error("❌ Error generating content:", error.message);
        throw error; // status code controller tak jaye
    }
}

module.exports = generateContent;
