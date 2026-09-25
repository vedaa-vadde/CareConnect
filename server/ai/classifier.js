/**
 * AI Classifier — uses Gemini API if available, falls back to mock
 */

const mock = require('./mock');

let geminiModel = null;

const initGemini = async () => {
  try {
    if (!process.env.GEMINI_API_KEY) return null;
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    console.log('✅ Gemini AI initialized');
    return model;
  } catch (err) {
    console.warn('⚠️ Gemini AI unavailable, using mock:', err.message);
    return null;
  }
};

// Initialize on module load
(async () => {
  geminiModel = await initGemini();
})();

/**
 * Classify a service request
 * Returns: { category, specificService, requiredSkills, possibleIssue, confidence, source }
 */
const classifyServiceRequest = async (description, categoryName = null) => {
  if (!geminiModel) {
    return mock.classifyServiceRequest(description, categoryName);
  }

  try {
    const prompt = `You are a home services classification AI for an Indian platform called CareConnect.

Analyze this service request and respond ONLY with a JSON object (no markdown, no explanation):

Service Request: "${description}"
${categoryName ? `Suggested Category: ${categoryName}` : ''}

Respond with this exact JSON format:
{
  "category": "one of: Washing Machine Repair, Refrigerator Repair, AC Repair, Electrical Work, Plumbing, House Cleaning, Appliance Repair, Home Maintenance",
  "specificService": "more specific service name",
  "requiredSkills": ["skill1", "skill2"],
  "possibleIssue": "brief description of likely issue",
  "confidence": 0.85
}`;

    const result = await geminiModel.generateContent(prompt);
    const text = result.response.text().trim();
    
    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    
    const parsed = JSON.parse(jsonMatch[0]);
    return { ...parsed, source: 'gemini' };
  } catch (err) {
    console.warn('Gemini classification failed, using mock:', err.message);
    return mock.classifyServiceRequest(description, categoryName);
  }
};

/**
 * Generate AI assistant chat response
 */
const generateAssistantResponse = async (userMessage, context = {}) => {
  if (!geminiModel) {
    return mock.generateAssistantResponse(userMessage, context);
  }

  try {
    const prompt = `You are CareConnect's friendly AI assistant for home services in India.
A customer has typed: "${userMessage}"
Context: ${JSON.stringify(context)}

Reply in 1-2 friendly sentences acknowledging their issue and reassuring them you'll find the right technician.
Also suggest which service category this falls under from: Washing Machine Repair, Refrigerator Repair, AC Repair, Electrical Work, Plumbing, House Cleaning, Appliance Repair, Home Maintenance.

Respond ONLY with JSON:
{
  "message": "friendly response",
  "suggestedCategory": "category name",
  "followUpQuestions": ["question1", "question2"]
}`;

    const result = await geminiModel.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.warn('Gemini assistant failed, using mock:', err.message);
    return mock.generateAssistantResponse(userMessage, context);
  }
};

module.exports = { classifyServiceRequest, generateAssistantResponse };
