const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

let aiClient = null;

function getGeminiClient() {
  if (aiClient) return aiClient;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
    console.warn('[Gemini Config] Peringatan: GEMINI_API_KEY belum disetel di berkas .env.');
    return null;
  }

  aiClient = new GoogleGenAI({ apiKey });
  return aiClient;
}

module.exports = {
  getGeminiClient,
};
