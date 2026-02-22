const fs = require('fs');
const path = require('path');

// Load tourism data
const loadTourismData = () => {
  try {
    const jsonPath = path.join(__dirname, '../data/indian_travel_dataset.json');
    const data = fs.readFileSync(jsonPath, 'utf-8');
    return data.trim().split('\n').map(line => JSON.parse(line));
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

// Load chatbot dataset from CSV
const loadChatbotData = () => {
  try {
    const csvPath = path.join(__dirname, '../data/chatbot_dataset.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.log('Chatbot dataset not found, using defaults');
      return loadDefaultIntents();
    }

    const csvData = fs.readFileSync(csvPath, 'utf8');
    const lines = csvData.split('\n').slice(1); // Skip header
    
    const intents = [];
    lines.forEach(line => {
      const [question, answer, category, keywords] = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
      
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
    console.log(`✓ Loaded ${intents.length} chatbot intents`);
    
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
        'Hello! Welcome to SpaceBook. How can I help you find your perfect stay today?',
        'Hi there! I\'m here to help you discover amazing properties. What are you looking for?',
        'Hey! Looking for a place to stay? I can help you find the perfect property!'
      ],
      tokens: tokenize('hi hello hey greeting welcome')
    },
    {
      category: 'property_search',
      patterns: ['show properties', 'find accommodation', 'available properties', 'search', 'listings'],
      responses: [
        'I can help you search for properties! Which city are you interested in? We have listings in Mumbai, Kolkata, Hyderabad, Gurgaon, and tourist destinations like Goa and Manali.',
        'Great! Let me help you find properties. What location are you looking at, and when do you plan to visit?'
      ],
      tokens: tokenize('show find search properties accommodation listings available')
    },
    {
      category: 'booking_help',
      patterns: ['how to book', 'booking process', 'make reservation', 'book property'],
      responses: [
        'Booking is easy! 1) Browse properties, 2) Select your dates and number of guests, 3) Click "Book Now", 4) Complete payment. You must be logged in to book.',
        'To book a property: Find a property you like, check availability for your dates, and click the booking button. I\'ll guide you through the payment process!'
      ],
      tokens: tokenize('how book booking process reservation make')
    },
    {
      category: 'pricing',
      patterns: ['price', 'cost', 'how much', 'rates', 'charges'],
      responses: [
        'Property prices vary by location, size, and amenities. You can see the per-night rate on each listing. The total is calculated based on your stay duration.',
        'Our properties range from budget-friendly to luxury options. Check individual listings for specific rates. Prices are shown per night.'
      ],
      tokens: tokenize('price cost how much rates charges pricing')
    },
    {
      category: 'features',
      patterns: ['amenities', 'facilities', 'what features', 'perks'],
      responses: [
        'Our properties offer various amenities like WiFi, parking, TV, air conditioning, kitchen facilities, and more. Each listing shows specific amenities available.',
        'Property features vary! Common amenities include WiFi, parking, kitchen, washing machine, AC, and pet-friendly options. Filter by your preferred amenities!'
      ],
      tokens: tokenize('amenities facilities features perks what included')
    },
    {
      category: 'location',
      patterns: ['where', 'location', 'city', 'area', 'destinations'],
      responses: [
        'We have 300+ properties across India! Major cities include Mumbai, Kolkata, Hyderabad, and Gurgaon. We also cover tourist destinations like Goa, Manali, and more.',
        'SpaceBook covers major Indian cities and tourist hotspots. Where would you like to stay? I can show you available properties in that area!'
      ],
      tokens: tokenize('where location city area destinations place')
    },
    {
      category: 'support',
      patterns: ['help', 'support', 'problem', 'issue', 'contact'],
      responses: [
        'I\'m here to help! You can ask me about property search, booking process, pricing, amenities, or any other questions. What do you need help with?',
        'Need assistance? I can help with property searches, bookings, account issues, or general questions. Just let me know what you need!'
      ],
      tokens: tokenize('help support problem issue contact assistance')
    },
    {
      category: 'cancellation',
      patterns: ['cancel', 'cancellation', 'refund', 'cancel booking'],
      responses: [
        'Cancellation policy: Free cancellation up to 24 hours before check-in. Cancellations after that may incur charges. Check your booking details for specific terms.',
        'You can cancel bookings from your account page. Refund policies vary by property. Most offer free cancellation 24 hours before check-in.'
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
    const score = calculateSimilarity(userTokens, intent.tokens);
    
    // Boost score if category matches recent context
    const context = chatbotData.contextMemory.get(sessionId);
    if (context && context.lastCategory === intent.category) {
      score * 1.2;
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = intent;
    }
  });

  // Only return if similarity is above threshold
  return highestScore > 0.15 ? bestMatch : null;
};

// Get random response from intent
const getResponse = (intent) => {
  if (!intent || !intent.responses || intent.responses.length === 0) {
    return null;
  }
  return intent.responses[Math.floor(Math.random() * intent.responses.length)];
};

// Check if message is about tourism and provide intelligent response
const handleTourismQuery = (message) => {
  const lowerMessage = message.toLowerCase();
  const destinations = loadTourismData();
  
  // Keywords for tourism queries
  const tourismKeywords = ['tourist', 'tourism', 'visit', 'destination', 'trip', 'travel', 
    'heritage', 'beach', 'nature', 'adventure', 'religious', 'temple', 'fort', 'palace'];
  
  const categories = ['heritage', 'beach', 'nature', 'adventure', 'religious'];
  const regions = ['north', 'south', 'east', 'west'];
  
  // Check if message contains tourism keywords
  const hasTourismKeyword = tourismKeywords.some(keyword => lowerMessage.includes(keyword));
  
  if (!hasTourismKeyword) {
    // Check if message mentions any destination
    const mentionedDest = destinations.find(d => 
      lowerMessage.includes(d.Destination_Name.toLowerCase()) ||
      lowerMessage.includes(d.State.toLowerCase())
    );
    
    if (mentionedDest) {
      return {
        response: `${mentionedDest.Destination_Name} in ${mentionedDest.State} is a beautiful ${mentionedDest.Category.toLowerCase()} destination! Famous for ${mentionedDest.Popular_Attraction}. Nearest airport: ${mentionedDest.Nearest_Airport}. Would you like to see properties available there?`,
        suggestions: ['Show properties in ' + mentionedDest.State, 'More heritage sites', 'Popular destinations'],
        isTourism: true
      };
    }
    return null;
  }
  
  // Handle category queries
  const mentionedCategory = categories.find(cat => lowerMessage.includes(cat));
  if (mentionedCategory) {
    const categoryDests = destinations.filter(d => 
      d.Category.toLowerCase() === mentionedCategory
    );
    const unique = Array.from(new Set(categoryDests.map(d => d.Destination_Name)));
    const top5 = unique.slice(0, 5);
    
    return {
      response: `India has amazing ${mentionedCategory} destinations! Top picks: ${top5.join(', ')}. Which one interests you?`,
      suggestions: top5.slice(0, 3).map(dest => `Tell me about ${dest}`),
      isTourism: true
    };
  }
  
  // Handle region queries
  const mentionedRegion = regions.find(reg => lowerMessage.includes(reg));
  if (mentionedRegion) {
    const regionDests = destinations.filter(d => 
      d.Region.toLowerCase() === mentionedRegion
    );
    const unique = Array.from(new Set(regionDests.map(d => d.Destination_Name)));
    const top5 = unique.slice(0, 5);
    
    return {
      response: `${mentionedRegion.charAt(0).toUpperCase() + mentionedRegion.slice(1)} India has wonderful destinations: ${top5.join(', ')}. Where would you like to explore?`,
      suggestions: top5.slice(0, 3).map(dest => `Properties in ${dest}`),
      isTourism: true
    };
  }
  
  // General tourism query
  const popularDests = Array.from(
    new Set(destinations.slice(0, 20).map(d => d.Destination_Name))
  ).slice(0, 6);
  
  return {
    response: `India has incredible tourist destinations! Popular picks include ${popularDests.slice(0, 4).join(', ')}, and many more! What type of experience are you looking for - Heritage, Beach, Nature, or Adventure?`,
    suggestions: ['Heritage sites', 'Beach destinations', 'Nature spots', 'Adventure locations'],
    isTourism: true
  };
};

// Chat endpoint
exports.chat = (req, res) => {
  try {
    const { message, sessionId = 'default' } = req.body;

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

    // Check for tourism-related queries first
    const tourismResponse = handleTourismQuery(message);
    if (tourismResponse && tourismResponse.isTourism) {
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
      
      // Update context
      chatbotData.contextMemory.set(sessionId, {
        lastCategory: intent.category,
        lastMessage: message,
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

    res.json({
      response,
      category: intent?.category || 'unknown',
      confidence: intent ? 'high' : 'low',
      suggestions
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
