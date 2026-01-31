console.log("-------------------- SERVER STARTING --------------------");
// Polyfill for DOMMatrix issues in some pdf-parse environments
if (typeof DOMMatrix === 'undefined') {
    global.DOMMatrix = class DOMMatrix { };
}

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const pdf = require("pdf-parse");

console.log("Modules loaded");

const app = express();
app.use(cors());
app.use(express.json());

// Configure Multer
const upload = multer({ storage: multer.memoryStorage() });

const MONGO_URL = process.env.MONGO_URL || "mongodb://mongo:27017/tasksdb";

mongoose.connect(MONGO_URL)
    .then(() => console.log("MongoDB connected successfully"))
    .catch(err => console.error("MongoDB connection error:", err));

const CheckSchema = new mongoose.Schema({
    jobTitle: String,
    fileName: String,
    score: Number,
    missingKeywords: [String],
    date: { type: Date, default: Date.now }
});

const ResumeCheck = mongoose.model("ResumeCheck", CheckSchema);

const extractKeywords = (text) => {
    if (!text) return [];
    // Improve keyword extraction: remove numbers, small words, common stopwords
    const stopWords = new Set(["and", "the", "for", "with", "you", "that", "this", "from", "have", "are", "but"]);
    return [...new Set(
        text.toLowerCase()
            .split(/[\W_]+/)
            .filter(w => w.length > 2 && !stopWords.has(w) && isNaN(w))
    )];
};

app.get("/api/checks", async (req, res) => {
    try {
        const history = await ResumeCheck.find().sort({ date: -1 }).limit(10);
        res.json(history);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post("/api/analyze", upload.single("resume"), async (req, res) => {
    console.log("Received upload request");
    try {
        const { jobDescription, jobTitle } = req.body;
        let resumeText = "";

        if (req.file) {
            console.log("Processing file:", req.file.originalname, req.file.mimetype);

            if (req.file.mimetype === "application/pdf") {
                try {
                    const pdfData = await pdf(req.file.buffer);
                    resumeText = pdfData.text;
                    console.log("PDF parsed successfully, length:", resumeText.length);
                } catch (pdfErr) {
                    console.error("PDF Parse Error:", pdfErr);
                    return res.status(400).json({ error: "Failed to read PDF file. Please try a different PDF or convert to simple text." });
                }
            } else {
                // Fallback for text files
                resumeText = req.file.buffer.toString("utf8");
            }
        } else {
            return res.status(400).json({ error: "No resume file uploaded" });
        }

        if (!resumeText || resumeText.trim().length === 0) {
            return res.status(400).json({ error: "Could not extract text from the file. It might be an image-only PDF." });
        }

        const resumeWords = new Set(extractKeywords(resumeText));
        const jdWords = extractKeywords(jobDescription);

        if (jdWords.length === 0) {
            return res.status(400).json({ error: "Job description is too short or empty." });
        }

        const matched = jdWords.filter(word => resumeWords.has(word));
        const missing = jdWords.filter(word => !resumeWords.has(word));

        const score = Math.round((matched.length / jdWords.length) * 100);

        const check = new ResumeCheck({
            jobTitle: jobTitle || "Untitled Job",
            fileName: req.file.originalname,
            score,
            missingKeywords: missing.slice(0, 15)
        });

        await check.save();

        res.json({
            score,
            missingKeywords: missing,
            fileName: req.file.originalname,
            checkId: check._id
        });

    } catch (error) {
        console.error("Analyze error:", error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend running on port ${PORT}`);
});
