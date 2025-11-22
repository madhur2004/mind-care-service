import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

// Available models in order of preference
const MODELS = [
  "gemini-2.0-flash-001",
  "gemini-2.0-flash", 
  "gemini-2.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-pro",
  "gemma-2-27b-it"
];

async function getAIResponse(message) {
  // Check if API key is available
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY_NOT_CONFIGURED");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  let lastError = null;

  for (const modelName of MODELS) {
    try {
      console.log(`🧠 Trying model: ${modelName}`);
      
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
          temperature: 0.8,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 1024,
        }
      });

      const prompt = `You are Mindful Companion, a compassionate mental wellness AI assistant. Your role is to provide empathetic, supportive, and understanding responses to users seeking mental health support.

Guidelines:
- Be warm, empathetic, and non-judgmental
- Keep responses conversational but meaningful
- Offer practical suggestions when appropriate
- Validate user's feelings
- Avoid clinical diagnosis
- Be concise but thorough

User message: "${message}"

Please respond as a supportive companion:`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (text && text.trim()) {
        console.log(`✅ Success with model: ${modelName}`);
        return text.trim();
      }
    } catch (err) {
      lastError = err;
      console.log(`❌ Model ${modelName} failed:`, err.message);
    }
  }

  throw lastError || new Error("All models failed");
}

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ 
        error: "Please provide a valid message" 
      });
    }

    console.log(`📨 Received message: ${message.substring(0, 100)}...`);
    console.log(`🔑 API Key available: ${!!process.env.GEMINI_API_KEY}`);

    const reply = await getAIResponse(message.trim());
    
    console.log(`🤖 Generated reply (${reply.length} chars)`);
    
    res.json({ 
      success: true,
      reply: reply 
    });

  } catch (error) {
    console.error("💥 Chat route error:", error);
    
    // Specific error handling
    if (error.message === "GEMINI_API_KEY_NOT_CONFIGURED" || error.message.includes("API_KEY") || error.message.includes("key")) {
      return res.status(500).json({ 
        error: "AI service configuration issue. Please check API configuration." 
      });
    }
    
    if (error.message.includes("quota") || error.message.includes("rate")) {
      return res.status(429).json({ 
        error: "AI service is temporarily busy. Please try again in a moment." 
      });
    }

    if (error.message.includes("PERMISSION_DENIED")) {
      return res.status(500).json({ 
        error: "AI service access denied. Please check API permissions." 
      });
    }

    // User-friendly fallback response
    res.status(500).json({ 
      error: "I'm having some technical difficulties right now, but I'm still here to listen. Could you try again in a moment?" 
    });
  }
});

export default router;