const fs = require('fs');
const path = require('path');

let cachedTourismData = null;

// Load tourism data
const loadTourismData = () => {
  if (cachedTourismData) return cachedTourismData;
  try {
    // Try loading from indiaTourismData.js first
    const jsPath = path.join(__dirname, '../data/indiaTourismData.js');
    if (fs.existsSync(jsPath)) {
      const data = require(jsPath);
      cachedTourismData = data.places || [];
      return cachedTourismData;
    }
    // Fallback to JSON dataset
    const jsonPath = path.join(__dirname, '../data/indian_travel_dataset.json');
    const data = fs.readFileSync(jsonPath, 'utf-8');
    cachedTourismData = data.trim().split('\n').map(line => JSON.parse(line));
    return cachedTourismData;
  } catch (error) {
    console.error('Error loading tourism data:', error);
    return [];
  }
};

// Simple NLP utilities
const tokenize = (text) => {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
};

const calculateSimilarity = (tokens1, tokens2) => {
  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);
  const intersection = [...set1].filter(x => set2.has(x));
  const union = new Set([...set1, ...set2]);
  return intersection.length / union.size;
};

// In-memory chatbot knowledge base
const chatbotData = {
  intents: [],
  trained: false,
  contextMemory: new Map() // Store conversation context per session
};

// Load chatbot dataset from JSON or CSV
const loadChatbotData = () => {
  try {
    const jsonPath = path.join(__dirname, '../data/chatbot_dataset.json');
    const csvPath = path.join(__dirname, '../data/chatbot_dataset.csv');

    if (fs.existsSync(jsonPath)) {
      const rawJson = fs.readFileSync(jsonPath, 'utf8');
      const parsed = JSON.parse(rawJson);
      const jsonIntents = Array.isArray(parsed) ? parsed : parsed.intents || [];

      const intents = jsonIntents.map((intent) => {
        const patterns = intent.patterns || intent.questions || [];
        const responses = intent.responses || intent.answers || [];
        const keywords = intent.keywords || [];
        const category = intent.category || intent.tag || 'general';

        return {
          patterns,
          responses,
          category,
          tokens: tokenize([...patterns, ...keywords].join(' '))
        };
      }).filter((intent) => intent.patterns.length && intent.responses.length);

      chatbotData.intents = intents;
      chatbotData.trained = true;
      console.log(`✓ Loaded ${intents.length} chatbot intents from JSON`);
      return;
    }

    if (fs.existsSync(csvPath)) {
      const csvData = fs.readFileSync(csvPath, 'utf8');
      const lines = csvData.split('\n').slice(1); // Skip header

      const intents = [];
      lines.forEach(line => {
        const [question, answer, category, keywords = ''] = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));

        if (question && answer) {
          intents.push({
            patterns: [question, ...keywords.split(/\s+/).filter(k => k)],
            responses: [answer],
            category: category || 'general',
            tokens: tokenize(question + ' ' + keywords)
          });
        }
      });

      chatbotData.intents = intents;
      chatbotData.trained = true;
      console.log(`✓ Loaded ${intents.length} chatbot intents from CSV`);
      return;
    }

    console.log('Chatbot dataset not found, using defaults');
    return loadDefaultIntents();
    
  } catch (error) {
    console.error('Error loading chatbot data:', error);
    loadDefaultIntents();
  }
};

// Default intents for initial setup
const loadDefaultIntents = () => {
  chatbotData.intents = [
    {
      category: 'greeting',
      patterns: ['hi', 'hello', 'hey', 'good morning', 'good evening'],
      responses: [
        'Hello! Welcome to Offbeat Travel India. How can I help you discover a hidden gem today?',
        'Hi there! I\'m here to help you explore offbeat destinations across India. What are you looking for?',
        'Hey! Looking for a unique place to visit? I can help you find the perfect destination!'
      ],
      tokens: tokenize('hi hello hey greeting welcome')
    },
    {
      category: 'property_search',
      patterns: ['show properties', 'find accommodation', 'available properties', 'search', 'listings'],
      responses: [
        'I can help you discover destinations! Which state or region are you interested in? We cover hidden gems across India, including Goa, Manali, Kerala, and more.',
        'Great! Let me help you explore. What location are you looking at, and what kind of experience do you want?'
      ],
      tokens: tokenize('show find search properties accommodation listings available')
    },
    {
      category: 'booking_help',
      patterns: ['how to book', 'booking process', 'make reservation', 'book property'],
      responses: [
        'Planning a trip is easy! Browse destinations, pick a region, and explore travel tips and stays. I can guide you to the best offbeat options.',
        'To plan your journey: choose a destination, check travel highlights, and explore stays and experiences that match your interests.'
      ],
      tokens: tokenize('how book booking process reservation make')
    },
    {
      category: 'pricing',
      patterns: ['price', 'cost', 'how much', 'rates', 'charges'],
      responses: [
        'Costs vary by destination and travel style. You can explore budget, mid, and premium options for each region.',
        'We highlight experiences across budget-friendly to premium stays. Filter by budget to find what fits you best.'
      ],
      tokens: tokenize('price cost how much rates charges pricing')
    },
    {
      category: 'features',
      patterns: ['amenities', 'facilities', 'what features', 'perks'],
      responses: [
        'Destinations vary by experience — heritage walks, nature trails, beaches, food routes, and cultural stays. Tell me what you enjoy most!',
        'Experiences include trekking, temple trails, food tours, and community stays. Filter by your interests to explore more.'
      ],
      tokens: tokenize('amenities facilities features perks what included')
    },
    {
      category: 'location',
      patterns: ['where', 'location', 'city', 'area', 'destinations'],
      responses: [
        'We cover hidden gems across India — from the Himalayas to coastal villages. Tell me the region you want to explore!',
        'Offbeat Travel India focuses on Indian destinations only. Where would you like to travel?'
      ],
      tokens: tokenize('where location city area destinations place')
    },
    {
      category: 'support',
      patterns: ['help', 'support', 'problem', 'issue', 'contact'],
      responses: [
        'I\'m here to help! You can ask me about destinations, travel themes, best seasons, or hidden gems across India.',
        'Need assistance? I can help with destination ideas, travel planning, or finding offbeat places.'
      ],
      tokens: tokenize('help support problem issue contact assistance')
    },
    {
      category: 'cancellation',
      patterns: ['cancel', 'cancellation', 'refund', 'cancel booking'],
      responses: [
        'For trip changes or cancellations, please review the specific stay or experience provider details.',
        'Policies vary by partner. Check the experience details for the latest cancellation information.'
      ],
      tokens: tokenize('cancel cancellation refund policy')
    }
  ];
  chatbotData.trained = true;
};

// Find best matching intent using NLP
const findBestIntent = (userMessage, sessionId = 'default') => {
  const userTokens = tokenize(userMessage);
  
  if (userTokens.length === 0) {
    return null;
  }

  let bestMatch = null;
  let highestScore = 0;

  chatbotData.intents.forEach(intent => {
    let score = calculateSimilarity(userTokens, intent.tokens);
    
    // Boost score if category matches recent context
    const context = chatbotData.contextMemory.get(sessionId);
    if (context && context.lastCategory === intent.category) {
      score *= 1.2;
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = intent;
    }
  });

  // Use a lower threshold for short queries like "goa" or "kerala"
  const threshold = userTokens.length <= 2 ? 0.08 : 0.15;
  return highestScore > threshold ? bestMatch : null;
};

// Get random response from intent
const getResponse = (intent) => {
  if (!intent || !intent.responses || intent.responses.length === 0) {
    return null;
  }
  return intent.responses[Math.floor(Math.random() * intent.responses.length)];
};

const findDestinationByContext = (contextName = '') => {
  if (!contextName) return null;
  const places = loadTourismData();
  const needle = String(contextName).toLowerCase().trim();
  return (
    places.find((d) => String(d.title || d.Destination_Name || '').toLowerCase() === needle) ||
    places.find((d) => String(d.title || d.Destination_Name || '').toLowerCase().includes(needle)) ||
    places.find((d) => String(d.address || d.State || '').toLowerCase().includes(needle)) ||
    null
  );
};

const parseTripDays = (message = '') => {
  const match = String(message).toLowerCase().match(/(\d{1,2})\s*(day|days)/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
};

const handleContextualFollowup = (message, sessionContext = {}) => {
  if (!sessionContext?.lastDestination) return null;

  const lowerMessage = String(message || '').toLowerCase();
  const destinationName = sessionContext.lastDestination;
  const destination = findDestinationByContext(destinationName);
  const bestSeason = Array.isArray(destination?.best_season) ? destination.best_season : [];
  const budgetRange = destination?.budget_range || destination?.budgetRange || '';

  const asksBudget = /(budget|cost|price|cheap|expensive|money|how much)/.test(lowerMessage);
  const asksBestTime = /(best time|when to visit|season|weather|which month)/.test(lowerMessage);
  const tripDays = parseTripDays(lowerMessage);

  if (!asksBudget && !asksBestTime && !tripDays) {
    return null;
  }

  if (asksBudget) {
    const budgetText = budgetRange || '₹1,500 - ₹4,500 (avg, depends on stay type)';
    return {
      response: `Great choice! For ${destinationName}, a practical budget is around ${budgetText}. If you want, I can break this into stay, food, and local transport.`,
      suggestions: [`Best time for ${destinationName}`, `${destinationName} itinerary`, `Affordable stays in ${destinationName}`],
    };
  }

  if (asksBestTime) {
    const seasonText = bestSeason.length ? bestSeason.join(', ') : 'October to March';
    return {
      response: `Best time to visit ${destinationName} is usually ${seasonText}. I can also suggest what to do month-wise.`,
      suggestions: [`${destinationName} in 3 days`, `Top places in ${destinationName}`, `Budget for ${destinationName}`],
    };
  }

  if (tripDays) {
    return {
      response: `Awesome. For ${tripDays} days in ${destinationName}, I can suggest a balanced plan: Day 1 highlights, Day 2 local experiences, Day 3 hidden gems + food trail.`,
      suggestions: [`Detailed ${tripDays}-day plan for ${destinationName}`, `Top cafes in ${destinationName}`, `Must-visit spots in ${destinationName}`],
    };
  }

  return null;
};

const detectDestinationFromMessage = (message = '', intent = null) => {
  const rawMessage = String(message).trim();
  if (!rawMessage) return null;

  const byMessage = findDestinationByContext(rawMessage);
  if (byMessage) {
    return byMessage.title || byMessage.Destination_Name || rawMessage;
  }

  // For short prompts like "goa" we still keep context even if exact dataset match is missing.
  const words = rawMessage.split(/\s+/).filter(Boolean);
  const genericWords = new Set(['hi', 'hello', 'hey', 'help', 'book', 'booking', 'price', 'budget']);
  if (words.length <= 3 && !genericWords.has(rawMessage.toLowerCase())) {
    return rawMessage.charAt(0).toUpperCase() + rawMessage.slice(1);
  }

  const intentCategory = String(intent?.category || '').trim();
  if (!intentCategory) return null;

  const byCategory = findDestinationByContext(intentCategory);
  if (byCategory) {
    return byCategory.title || byCategory.Destination_Name || intentCategory;
  }

  return null;
};

// Check if message is about tourism and provide intelligent response
const handleTourismQuery = (message, personalization = {}) => {
  const lowerMessage = message.toLowerCase();
  const normalizedMessage = lowerMessage.replace(/\s+/g, ' ').trim();
  const userTokens = tokenize(normalizedMessage);
  const genericTokens = new Set(['india', 'indian', 'place', 'places', 'destination', 'destinations', 'travel', 'trip']);
  const meaningfulTokens = userTokens.filter((token) => !genericTokens.has(token));
  const destinations = loadTourismData();
  
  // Keywords for tourism queries
  const tourismKeywords = ['tourist', 'tourism', 'visit', 'destination', 'trip', 'travel', 
    'heritage', 'beach', 'nature', 'adventure', 'religious', 'temple', 'fort', 'palace'];
  
  const categories = ['heritage', 'beach', 'nature', 'adventure', 'religious'];
  const regions = ['north', 'south', 'east', 'west'];

  const destinationHintTokens = new Set();
  destinations.forEach((dest) => {
    const textBlob = [
      dest.title,
      dest.Destination_Name,
      dest.address,
      dest.State,
      dest.Region,
      dest.Category,
    ].filter(Boolean).join(' ');

    tokenize(textBlob).forEach((token) => destinationHintTokens.add(token));
  });
  
  // Check if message contains tourism keywords
  const hasTourismKeyword =
    tourismKeywords.some(keyword => normalizedMessage.includes(keyword)) ||
    meaningfulTokens.some((token) => destinationHintTokens.has(token));
  
  if (!hasTourismKeyword) {
    // Check if message mentions any destination
    const mentionedDest = destinations.find(d => {
      const name = d.title || d.Destination_Name || '';
      const location = d.address || d.State || d.Region || '';
      const nameLower = name.toLowerCase();
      const locationLower = location.toLowerCase();

      const exactOrPartialMatch =
        normalizedMessage.includes(nameLower) ||
        nameLower.includes(normalizedMessage) ||
        normalizedMessage.includes(locationLower) ||
        locationLower.includes(normalizedMessage);

      const tokenOverlap = meaningfulTokens.some((token) =>
        nameLower.includes(token) || locationLower.includes(token)
      );

      return exactOrPartialMatch || tokenOverlap;
    });
    
    if (mentionedDest) {
      const name = mentionedDest.title || mentionedDest.Destination_Name;
      const location = mentionedDest.address || mentionedDest.State;
      const desc = mentionedDest.description || mentionedDest.Popular_Attraction || 'a beautiful destination';
      
      return {
        response: `${name} is ${desc.substring(0, 150)}... Would you like to explore more?`,
        suggestions: [
          `Tell me more about ${name}`,
          `Best time to visit ${name}`,
          'Show similar destinations'
        ],
        isTourism: true,
        detectedDestination: name,
      };
    }
    return null;
  }
  
  // Handle category queries
  const mentionedCategory = categories.find(cat => lowerMessage.includes(cat));
  if (mentionedCategory) {
    const categoryDests = destinations.filter(d => {
      const desc = (d.description || d.Category || '').toLowerCase();
      const perks = (d.perks || []).join(' ').toLowerCase();
      return desc.includes(mentionedCategory) || perks.includes(mentionedCategory);
    });
    const unique = Array.from(new Set(categoryDests.map(d => d.title || d.Destination_Name)));
    const top5 = unique.slice(0, 5);
    
    if (top5.length > 0) {
      return {
        response: `India has amazing ${mentionedCategory} destinations! Top picks: ${top5.join(', ')}. Which one interests you?`,
        suggestions: top5.slice(0, 3).map(dest => `Tell me about ${dest}`),
        isTourism: true
      };
    }
  }
  
  // Handle region queries
  const mentionedRegion = regions.find(reg => lowerMessage.includes(reg));
  if (mentionedRegion) {
    const regionDests = destinations.filter(d => {
      const address = (d.address || d.State || d.Region || '').toLowerCase();
      return address.includes(mentionedRegion);
    });
    const unique = Array.from(new Set(regionDests.map(d => d.title || d.Destination_Name)));
    const top5 = unique.slice(0, 5);
    
    if (top5.length > 0) {
      return {
        response: `${mentionedRegion.charAt(0).toUpperCase() + mentionedRegion.slice(1)} India has wonderful destinations: ${top5.join(', ')}. Where would you like to explore?`,
        suggestions: top5.slice(0, 3),
        isTourism: true
      };
    }
  }
  
  // General tourism query
  const personalizedRegions = personalization.regions || [];
  const personalizedCategories = personalization.categories || [];
  let pool = destinations;

  if (personalizedRegions.length) {
    pool = pool.filter((d) =>
      personalizedRegions.some((reg) =>
        d.Region?.toLowerCase().includes(reg.toLowerCase())
      )
    );
  }

  if (personalizedCategories.length) {
    pool = pool.filter((d) =>
      personalizedCategories.some((cat) =>
        d.Category?.toLowerCase().includes(cat.toLowerCase())
      )
    );
  }

  const popularDests = Array.from(
    new Set((pool.length ? pool : destinations).slice(0, 20).map(d => d.title || d.Destination_Name))
  ).slice(0, 6);
  
  if (popularDests.length > 0) {
    return {
      response: `India has incredible tourist destinations! Popular picks include ${popularDests.slice(0, 4).join(', ')}, and many more! What type of experience are you looking for - Heritage, Beach, Nature, or Adventure?`,
      suggestions: ['Heritage sites', 'Beach destinations', 'Nature spots', 'Adventure locations'],
      isTourism: true
    };
  }
  
  return {
    response: "I can help you discover amazing destinations across India! Try asking about beaches, mountains, heritage sites, or specific states.",
    suggestions: ['Show beach destinations', 'Mountain destinations', 'Heritage sites'],
    isTourism: true
  };
};

// Chat endpoint
exports.chat = (req, res) => {
  try {
    const { message, sessionId = 'default', personalization = {} } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ 
        error: 'Message is required',
        response: 'Please send me a message so I can help you!'
      });
    }

    // Ensure chatbot is trained
    if (!chatbotData.trained) {
      loadChatbotData();
    }

    // Destination-context follow up (e.g., "budget?", "best time?", "3 days")
    const contextFollowup = handleContextualFollowup(
      message,
      chatbotData.contextMemory.get(sessionId)
    );

    if (contextFollowup) {
      return res.json({
        response: contextFollowup.response,
        category: 'tourism_context',
        confidence: 'high',
        suggestions: contextFollowup.suggestions || [],
      });
    }

    // Check for tourism-related queries first
    const tourismResponse = handleTourismQuery(message, personalization);
    if (tourismResponse && tourismResponse.isTourism) {
      chatbotData.contextMemory.set(sessionId, {
        ...(chatbotData.contextMemory.get(sessionId) || {}),
        lastCategory: 'tourism',
        lastMessage: message,
        lastDestination: tourismResponse.detectedDestination || chatbotData.contextMemory.get(sessionId)?.lastDestination || null,
        timestamp: Date.now(),
      });

      return res.json({
        response: tourismResponse.response,
        category: 'tourism',
        confidence: 'high',
        suggestions: tourismResponse.suggestions || []
      });
    }

    // Find best matching intent from training data
    const intent = findBestIntent(message, sessionId);
    
    let response;
    let suggestions = [];

    if (intent) {
      response = getResponse(intent);
      const inferredDestination = detectDestinationFromMessage(message, intent);
      
      // Update context
      chatbotData.contextMemory.set(sessionId, {
        ...(chatbotData.contextMemory.get(sessionId) || {}),
        lastCategory: intent.category,
        lastMessage: message,
        lastDestination: inferredDestination || chatbotData.contextMemory.get(sessionId)?.lastDestination || null,
        timestamp: Date.now()
      });

      // Provide contextual suggestions
      if (intent.category === 'greeting') {
        suggestions = [
          'Show me properties in Mumbai',
          'How do I book?',
          'What amenities are available?'
        ];
      } else if (intent.category === 'property_search') {
        suggestions = [
          'Properties in Goa',
          'Show luxury villas',
          'Budget-friendly options'
        ];
      } else if (intent.category === 'booking_help') {
        suggestions = [
          'What is the cancellation policy?',
          'How do I pay?',
          'Show my bookings'
        ];
      }
    } else {
      response = "I'm not sure I understand. Could you rephrase that? I can help with property searches, bookings, pricing, amenities, and more!";
      suggestions = [
        'Show available properties',
        'How to book a property?',
        'What are the prices?',
        'Help me find accommodation'
      ];
    }

    if (personalization?.regions?.length && suggestions.length < 4) {
      personalization.regions.slice(0, 2).forEach((region) => {
        suggestions.push(`Top places in ${region} India`);
      });
    }

    if (personalization?.categories?.length && suggestions.length < 4) {
      personalization.categories.slice(0, 2).forEach((category) => {
        suggestions.push(`${category.charAt(0).toUpperCase() + category.slice(1)} destinations`);
      });
    }

    res.json({
      response,
      category: intent?.category || 'unknown',
      confidence: intent ? 'high' : 'low',
      suggestions: [...new Set(suggestions)].slice(0, 6)
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ 
      error: 'Chatbot error',
      response: 'Sorry, I encountered an error. Please try again!'
    });
  }
};

// Train chatbot with new data
exports.train = (req, res) => {
  try {
    loadChatbotData();
    res.json({ 
      success: true, 
      message: 'Chatbot trained successfully',
      intentsCount: chatbotData.intents.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Training failed', details: error.message });
  }
};

// Get chatbot stats
exports.getStats = (req, res) => {
  res.json({
    trained: chatbotData.trained,
    intentsCount: chatbotData.intents.length,
    categories: [...new Set(chatbotData.intents.map(i => i.category))],
    activeContexts: chatbotData.contextMemory.size
  });
};

// Clear conversation context
exports.clearContext = (req, res) => {
  const { sessionId } = req.body;
  if (sessionId) {
    chatbotData.contextMemory.delete(sessionId);
  } else {
    chatbotData.contextMemory.clear();
  }
  res.json({ success: true });
};

// Initialize on load
loadChatbotData();
