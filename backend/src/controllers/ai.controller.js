const generateContent = require("../services/ai.service");

const MAX_CODE_LENGTH = 20000;

module.exports.getReview = async (req, res) => {
    try {
        const code = req.body && req.body.code;

        if (typeof code !== "string" || !code.trim()) {
            return res.status(400).send("Code is required");
        }
        if (code.length > MAX_CODE_LENGTH) {
            return res
                .status(413)
                .send(`Code is too long (max ${MAX_CODE_LENGTH} characters)`);
        }

        const response = await generateContent(code);
        res.send(response);
    } catch (error) {
        console.error(error);
        const messages = {
            429: "Gemini ki limit/quota khatam ho gayi. Thodi der baad try karo.",
            503: "Gemini server abhi busy hai. 1-2 minute baad dobara Review dabao.",
        };
        const status = messages[error.status] ? error.status : 500;
        res.status(status).send(messages[status] || "Internal Server Error");
    }
};
