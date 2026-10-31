const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const aiRoutes = require("./routes/ai.routes");

const app = express();

// FRONTEND_URL set hai to sirf wahi allowed, warna (local dev) sab allowed
const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map((o) => o.trim())
    : true;

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "100kb" }));

// Gemini quota ko abuse se bachane ke liye
app.use(
    "/ai",
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 30,
        standardHeaders: true,
        legacyHeaders: false,
        message: "Too many requests, please try again later.",
    })
);

app.get("/", (req, res) => {
    res.send("AI Code Reviewer API is running");
});

app.use("/ai", aiRoutes);

module.exports = app;
