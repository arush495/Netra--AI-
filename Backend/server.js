const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "15mb" }));

// Frontend files serve karne ke liye
app.use(express.static(path.join(__dirname, "../Frontend")));

// Google Gen AI setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Prompts for different modes
const PROMPT_TEMPLATES = {
  currency: "Identify the Indian currency note or coin in this image. State the exact denomination clearly in one direct sentence. If counterfeit suspected or note is partially torn, mention it.",
  medicine: "Identify the medicine name, its main use, and its expiry date if visible. Give a 2-sentence direct answer. Include safety note to take only as prescribed by doctor.",
  food: "Is this food item vegetarian (green dot) or non-vegetarian (red/brown dot)? State the product name and expiry date if visible in 2 short sentences.",
  scene: "Describe the main objects, obstacles, stairs, or people directly in front of the camera in 2 short sentences to help a visually impaired person walk safely."
};

// API Endpoint: /api/analyze
app.post("/api/analyze", async (req, res) => {
  try {
    const { imageBase64, mode, language } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ success: false, message: "Image data nahi mila." });
    }

    const selectedPrompt = PROMPT_TEMPLATES[mode] || PROMPT_TEMPLATES.currency;
    const targetLang = language || "Hindi";

    const fullInstruction = `
      You are 'Netra AI', a compassionate, crystal-clear audio assistant for a visually impaired person.
      Language: ${targetLang}.
      Task: ${selectedPrompt}
      Strict Rules:
      1. Be concise, direct, and factual (strictly under 30 words).
      2. Do NOT use markdown symbols like * or #.
      3. Speak naturally as if whispering directly into the user's ear.
    `;

    // Base64 header strip karein agar mojood ho
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const modelName = process.env.GEMMA_MODEL_NAME || "gemma-2-27b-it";
    const model = genAI.getGenerativeModel({ model: modelName });

    const result = await model.generateContent([
      fullInstruction,
      {
        inlineData: {
          data: cleanBase64,
          mimeType: "image/jpeg"
        }
      }
    ]);

    const responseText = result.response.text();
    const cleanSpeech = responseText.replace(/[*#"\n]/g, " ").trim();

    return res.json({
      success: true,
      text: cleanSpeech,
      mode: mode,
      lang: targetLang
    });

  } catch (error) {
    console.error("Gemma API Error:", error);
    return res.status(500).json({
      success: false,
      message: "AI analysis failed.",
      error: error.message
    });
  }
});

// Server Start
app.listen(PORT, () => {
  console.log(`🚀 Netra-AI Server running on http://localhost:${PORT}`);
});