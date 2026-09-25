/**
 * AI Mock Implementation
 * Used when GEMINI_API_KEY is not available or for development/testing.
 * Provides realistic-looking responses based on keyword matching.
 */

const categoryKeywordMap = {
  'Washing Machine Repair': {
    keywords: ['washing machine', 'washer', 'laundry', 'spin', 'drum', 'rinse', 'cloth', 'fabric'],
    skills: ['Washing Machine Technician', 'Appliance Repair'],
    icon: '🧺',
  },
  'Refrigerator Repair': {
    keywords: ['fridge', 'refrigerator', 'cooling', 'freezer', 'compressor', 'ice', 'cold', 'temperature'],
    skills: ['Refrigerator Technician', 'Appliance Repair'],
    icon: '❄️',
  },
  'AC Repair': {
    keywords: ['ac', 'air conditioner', 'air conditioning', 'cooling', 'hvac', 'condenser', 'cool', 'heat'],
    skills: ['AC Technician', 'HVAC Specialist'],
    icon: '❄️',
  },
  'Electrical Work': {
    keywords: ['electrical', 'wiring', 'switch', 'socket', 'power', 'circuit', 'fuse', 'wire', 'voltage', 'light', 'fan'],
    skills: ['Electrician', 'Electrical Engineer'],
    icon: '⚡',
  },
  'Plumbing': {
    keywords: ['plumbing', 'pipe', 'leak', 'drain', 'water', 'tap', 'faucet', 'flush', 'toilet', 'sink', 'basin'],
    skills: ['Plumber', 'Pipe Fitter'],
    icon: '🚰',
  },
  'House Cleaning': {
    keywords: ['clean', 'cleaning', 'dust', 'mop', 'sweep', 'vacuum', 'scrub', 'disinfect', 'hygiene', 'sanitize'],
    skills: ['Professional Cleaner', 'Deep Cleaning Specialist'],
    icon: '🧹',
  },
  'Appliance Repair': {
    keywords: ['appliance', 'microwave', 'oven', 'dishwasher', 'geyser', 'heater', 'toaster', 'grinder', 'mixer'],
    skills: ['Appliance Technician'],
    icon: '🔧',
  },
  'Home Maintenance': {
    keywords: ['maintenance', 'repair', 'fix', 'broken', 'paint', 'carpenter', 'wall', 'ceiling', 'door', 'window', 'furniture'],
    skills: ['Handyman', 'Carpenter', 'Painter'],
    icon: '🏠',
  },
};

const possibleIssueMap = {
  'Washing Machine Repair': {
    'spin': 'Drum/motor issue – the spin cycle mechanism may be faulty.',
    'noise': 'Drum bearing or foreign object lodged in the drum.',
    'leak': 'Door seal or pump seal issue.',
    'water': 'Inlet valve or pump blockage.',
    default: 'General washing machine malfunction requiring diagnosis.',
  },
  'Refrigerator Repair': {
    'cool': 'Compressor or refrigerant gas leak issue.',
    'noise': 'Compressor vibration or condenser fan issue.',
    'ice': 'Defrost system or thermostat malfunction.',
    'warm': 'Compressor failure or refrigerant leak.',
    default: 'General refrigerator issue requiring professional diagnosis.',
  },
  'AC Repair': {
    'cool': 'Low refrigerant or dirty coils.',
    'noise': 'Fan motor or compressor issue.',
    'leak': 'Drain blockage or coil freeze-up.',
    'smell': 'Dirty filters or mold in the unit.',
    default: 'AC not functioning optimally – requires service visit.',
  },
  'Electrical Work': {
    'trip': 'Overloaded circuit or short circuit.',
    'spark': 'Loose connection – potentially dangerous, requires urgent attention.',
    'light': 'Bulb, fixture, or wiring issue.',
    'power': 'Fuse or circuit breaker issue.',
    default: 'Electrical issue requiring licensed electrician.',
  },
  'Plumbing': {
    'leak': 'Pipe joint or fitting leakage.',
    'block': 'Drain blockage – clearing required.',
    'pressure': 'Pipe or valve issue affecting water pressure.',
    'flush': 'Toilet flush mechanism replacement needed.',
    default: 'Plumbing issue requiring professional attention.',
  },
  'House Cleaning': {
    default: 'Professional cleaning service required.',
  },
};

/**
 * Classify a service request using keyword matching
 */
const classifyServiceRequest = (description, categoryName = null) => {
  const lowerDesc = description.toLowerCase();
  let detectedCategory = null;
  let highestScore = 0;

  // Score each category
  for (const [cat, data] of Object.entries(categoryKeywordMap)) {
    const score = data.keywords.filter((kw) => lowerDesc.includes(kw)).length;
    if (score > highestScore) {
      highestScore = score;
      detectedCategory = cat;
    }
  }

  // Use provided category name as fallback
  if (!detectedCategory && categoryName) {
    detectedCategory = categoryName;
  }

  if (!detectedCategory) {
    detectedCategory = 'Home Maintenance';
  }

  const catData = categoryKeywordMap[detectedCategory] || {};
  const skills = catData.skills || ['General Technician'];

  // Detect possible issue
  let possibleIssue = 'General issue requiring professional diagnosis.';
  const issueMap = possibleIssueMap[detectedCategory];
  if (issueMap) {
    for (const [keyword, issue] of Object.entries(issueMap)) {
      if (keyword !== 'default' && lowerDesc.includes(keyword)) {
        possibleIssue = issue;
        break;
      }
    }
    if (possibleIssue === 'General issue requiring professional diagnosis.' && issueMap.default) {
      possibleIssue = issueMap.default;
    }
  }

  // Confidence: higher if more keywords matched
  const confidence = Math.min(0.5 + highestScore * 0.1, 0.95);

  return {
    category: detectedCategory,
    specificService: detectedCategory,
    requiredSkills: skills,
    possibleIssue,
    confidence: Math.round(confidence * 100) / 100,
    source: 'mock',
  };
};

/**
 * Generate AI assistant response
 */
const generateAssistantResponse = (userMessage, context = {}) => {
  const lower = userMessage.toLowerCase();

  let category = 'our service team';
  let response = '';

  for (const [cat, data] of Object.entries(categoryKeywordMap)) {
    if (data.keywords.some((kw) => lower.includes(kw))) {
      category = cat;
      break;
    }
  }

  if (lower.includes('cool') || lower.includes('cold') || lower.includes('hot') || lower.includes('warm')) {
    response = `Got it! This sounds like a temperature-related issue with your ${category}. Don't worry — we'll connect you with a certified technician who can diagnose and fix the problem quickly.`;
  } else if (lower.includes('noise') || lower.includes('sound') || lower.includes('loud')) {
    response = `I can see your ${category} is making unusual sounds. This could be a mechanical issue. A skilled technician will be able to identify and fix it for you.`;
  } else if (lower.includes('leak') || lower.includes('water')) {
    response = `Water-related issues need prompt attention! We'll find you a qualified technician for ${category} to prevent further damage.`;
  } else if (lower.includes('not working') || lower.includes("doesn't work") || lower.includes('broken')) {
    response = `I understand your ${category} isn't working. Let's get this sorted out quickly — our technicians are ready to help!`;
  } else {
    response = `Got it! This sounds like a ${category} issue. We'll find you the best-matched technician in your area right away.`;
  }

  return {
    message: response,
    suggestedCategory: category,
    followUpQuestions: [
      'How long has this issue been occurring?',
      'Have you noticed any unusual sounds or smells?',
      'Has there been any recent power fluctuation or damage?',
    ],
  };
};

module.exports = { classifyServiceRequest, generateAssistantResponse };
