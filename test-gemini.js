import { GoogleGenerativeAI } from "@google/generative-ai";

async function testGeminiAPI() {
  const apiKey = "AIzaSyCissQZN0k0pdMOucn_t8Rmu4vweQBItXw";
  
  console.log("🔑 Testing Gemini API Key with available models...");

  const modelsToTest = [
    "gemini-2.0-flash-001",
    "gemini-2.0-flash", 
    "gemini-2.5-flash",
    "gemini-1.5-flash-latest"
  ];

  for (const modelName of modelsToTest) {
    try {
      console.log(`\n🧠 Testing model: ${modelName}`);
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const result = await model.generateContent("Hello! Please respond with 'OK' if you can read this.");
      const response = await result.response;
      const text = response.text();
      
      console.log(`✅ ${modelName}: SUCCESS`);
      console.log(`   Response: ${text}`);
      
      return true; // Stop at first successful model
      
    } catch (error) {
      console.log(`❌ ${modelName}: FAILED - ${error.message}`);
    }
  }
  
  console.log("\n💥 All models failed - check your API key and permissions");
  return false;
}

testGeminiAPI();