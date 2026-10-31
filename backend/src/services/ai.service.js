const { GoogleGenerativeAI } = require("@google/generative-ai");

if (!process.env.GOOGLE_GEMINI_KEY) {
    console.error("❌ GOOGLE_GEMINI_KEY missing hai. backend/.env file banao (backend/.env.example dekho).");
    process.exit(1);
}

const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-3.5-flash";

const SYSTEM_PROMPT = `
You are an expert code reviewer with 7+ years of development experience.
Analyze the code the developer sends and help them improve it.

Focus on:
- Code quality: clean, maintainable, well-structured code
- Best practices and consistency (naming, formatting, DRY, SOLID)
- Bugs, logical flaws and security risks (e.g. SQL injection, XSS, CSRF)
- Performance and scalability
- Readability, documentation and test coverage

Guidelines:
- Be precise and constructive; explain WHY a change is needed.
- Show a refactored version of the code when possible.
- Assume the developer is competent, balance strictness with encouragement,
  and mention strengths too.

Reply in Markdown using this structure:
### ❌ Issues
(bullet list of problems found)
### ✅ Recommended Fix
(corrected code in a fenced code block with the language name)
### 💡 Improvements
(short bullet list of what got better and further suggestions)

Do not ask follow-up questions and do not add any closing remarks.
`;

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_KEY);

const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL; // optional

function buildModel(name) {
    return genAI.getGenerativeModel({
        model: name,
        systemInstruction: SYSTEM_PROMPT,
    });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 503 (server busy) aur 429 (rate limit) temporary hote hain, inhe dobara try karna theek hai
const isRetryable = (err) => err.status === 503 || err.status === 429;

async function tryModel(name, prompt, attempts = 3) {
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
