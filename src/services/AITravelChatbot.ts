import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI('');

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'text' | 'suggestion' | 'booking' | 'error';
}

export interface TravelSuggestion {
  type: 'destination' | 'hotel' | 'activity' | 'restaurant';
  title: string;
  description: string;
  price?: string;
  rating?: number;
  location?: string;
}

class AITravelChatbotService {
  private model: any;
  private conversationHistory: ChatMessage[] = [];
  private modelName: string = 'gemini-1.5-flash-001';

  constructor() {
    // Skip model initialization for now to prevent errors
    console.log('⚠️ AI Chatbot initialized with fallback mode');
  }

  private initializeModel() {
    try {
      this.model = genAI.getGenerativeModel({ model: this.modelName });
    } catch (error) {
      console.error('Error initializing model:', error);
      // Try fallback models
      this.tryFallbackModels();
    }
  }

  private tryFallbackModels() {
    const fallbackModels = [
      'gemini-1.5-pro',
      'gemini-1.5-pro-001',
      'gemini-1.5-flash',
      'gemini-1.0-pro',
      'gemini-pro'
    ];

    for (const modelName of fallbackModels) {
      try {
        this.model = genAI.getGenerativeModel({ model: modelName });
        this.modelName = modelName;
        console.log(`Successfully initialized with model: ${modelName}`);
        return;
      } catch (error) {
        console.log(`Failed to initialize with model: ${modelName}`);
      }
    }
    
    console.error('All model fallbacks failed');
  }


  // Send message to AI chatbot
  async sendMessage(userMessage: string, userProfile?: any): Promise<ChatMessage> {
    try {
      // Add user message to history
      const userChatMessage: ChatMessage = {
        id: Date.now().toString(),
        text: userMessage,
        isUser: true,
        timestamp: new Date(),
        type: 'text'
      };
      this.conversationHistory.push(userChatMessage);

      // Check for quick responses first
      const quickResponse = this.getQuickResponse(userMessage);
      if (quickResponse) {
        const quickChatMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: quickResponse,
          isUser: false,
          timestamp: new Date(),
          type: 'text'
        };
        this.conversationHistory.push(quickChatMessage);
        return quickChatMessage;
      }

      // Check if model is available
      if (!this.model) {
        console.log('Model not available, using fallback response');
        const fallbackResponse = this.getFallbackResponse(userMessage);
        const fallbackMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: fallbackResponse,
          isUser: false,
          timestamp: new Date(),
          type: 'text'
        };
        this.conversationHistory.push(fallbackMessage);
        return fallbackMessage;
      }

      // Create context-aware prompt
      const prompt = this.createTravelPrompt(userMessage, userProfile);

      // Get response from Gemini
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const aiResponse = response.text();

      // Create AI response message
      const aiChatMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
        type: 'text'
      };

      this.conversationHistory.push(aiChatMessage);
      return aiChatMessage;

    } catch (error) {
      console.error('Error in AI chatbot:', error);
      
      // Try to reinitialize model if it failed
      if (error.message && error.message.includes('404')) {
        console.log('Model not found, trying to reinitialize...');
        this.tryFallbackModels();
      }
      
      // Provide a helpful fallback response
      const fallbackResponse = this.getFallbackResponse(userMessage);
      
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        text: fallbackResponse,
        isUser: false,
        timestamp: new Date(),
        type: 'error'
      };

      this.conversationHistory.push(errorMessage);
      return errorMessage;
    }
  }

  // Create context-aware prompt for travel queries
  private createTravelPrompt(userMessage: string, userProfile?: any): string {
    const basePrompt = `You are an expert AI travel assistant for the Smart Travel Planner app. You help users with travel planning, recommendations, and advice.

User Profile Context:
${userProfile ? `
- Budget: ${userProfile.preferences?.budget || 'Not specified'}
- Interests: ${userProfile.preferences?.interests?.join(', ') || 'Not specified'}
- Home Airport: ${userProfile.preferences?.homeAirport || 'Not specified'}
- Currency: ${userProfile.preferences?.currency || 'USD'}
` : 'No profile information available'}

Previous conversation context:
${this.conversationHistory.slice(-4).map(msg => 
  `${msg.isUser ? 'User' : 'Assistant'}: ${msg.text}`
).join('\n')}

Current user message: "${userMessage}"

Instructions:
1. Provide helpful, accurate travel advice
2. Be conversational and friendly
3. Suggest specific destinations, hotels, or activities when appropriate
4. Consider the user's budget and preferences
5. Provide practical travel tips
6. If asked about bookings, guide them to use the app's search features
7. Keep responses concise but informative (max 200 words)
8. Use emojis sparingly to make responses engaging

Response:`;

    return basePrompt;
  }

  // Get travel suggestions based on query
  async getTravelSuggestions(query: string, userProfile?: any): Promise<TravelSuggestion[]> {
    try {
      // Check if model is available
      if (!this.model) {
        console.log('Model not available for suggestions, using fallback suggestions');
        return this.getFallbackSuggestions(query);
      }

      const prompt = `Based on this travel query: "${query}"

User preferences:
- Budget: ${userProfile?.preferences?.budget || 'Not specified'}
- Interests: ${userProfile?.preferences?.interests?.join(', ') || 'Not specified'}
- Home Airport: ${userProfile?.preferences?.homeAirport || 'Not specified'}

Provide 3-5 specific travel suggestions in this JSON format:
[
  {
    "type": "destination|hotel|activity|restaurant",
    "title": "Suggestion title",
    "description": "Brief description",
    "price": "Price range if applicable",
    "rating": 4.5,
    "location": "Location if applicable"
  }
]

Only return valid JSON, no additional text.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const suggestionsText = response.text();

      // Parse JSON response
      const suggestions = JSON.parse(suggestionsText);
      return suggestions;

    } catch (error) {
      console.error('Error getting travel suggestions:', error);
      
      // Try to reinitialize model if it failed
      if (error.message && error.message.includes('404')) {
        console.log('Model not found for suggestions, trying to reinitialize...');
        this.tryFallbackModels();
      }
      
      // Return fallback suggestions
      return this.getFallbackSuggestions(query);
    }
  }

  // Get quick travel tips
  async getQuickTravelTips(destination?: string): Promise<string[]> {
    try {
      const prompt = `Provide 5 quick, practical travel tips${destination ? ` for ${destination}` : ' for general travel'}. 
      Each tip should be one sentence and very practical. 
      Format as a simple list, one tip per line.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const tipsText = response.text();

      return tipsText.split('\n').filter(tip => tip.trim().length > 0);

    } catch (error) {
      console.error('Error getting travel tips:', error);
      return [
        'Always keep copies of important documents',
        'Check visa requirements before booking',
        'Pack light and bring versatile clothing',
        'Research local customs and etiquette',
        'Keep emergency contacts handy'
      ];
    }
  }

  // Get conversation history
  getConversationHistory(): ChatMessage[] {
    return this.conversationHistory;
  }

  // Clear conversation history
  clearHistory(): void {
    this.conversationHistory = [];
  }

  // Get current model name
  getCurrentModelName(): string {
    return this.modelName;
  }

  // List available models (for debugging)
  async listAvailableModels(): Promise<void> {
    try {
      console.log('Attempting to list available models...');
      // This is a debugging method - in production, you might want to remove this
      console.log('Current model name:', this.modelName);
      console.log('Model object:', this.model);
    } catch (error) {
      console.error('Error listing models:', error);
    }
  }

  // Get quick response for common queries
  private getQuickResponse(userMessage: string): string | null {
    const quickResponses = this.getQuickResponses();
    const lowerMessage = userMessage.toLowerCase();
    
    // Check for predefined question patterns
    if (lowerMessage.includes('budget') && (lowerMessage.includes('travel') || lowerMessage.includes('tips'))) {
      return quickResponses['budget'];
    }
    
    if (lowerMessage.includes('london') && (lowerMessage.includes('travel') || lowerMessage.includes('guide'))) {
      return quickResponses['london'];
    }
    
    if (lowerMessage.includes('paris') && (lowerMessage.includes('travel') || lowerMessage.includes('guide'))) {
      return quickResponses['paris'];
    }
    
    if (lowerMessage.includes('tokyo') && (lowerMessage.includes('travel') || lowerMessage.includes('guide'))) {
      return quickResponses['tokyo'];
    }
    
    if (lowerMessage.includes('app features') || lowerMessage.includes('features does this travel app')) {
      return quickResponses['app features'];
    }
    
    if (lowerMessage.includes('book hotels') || lowerMessage.includes('how do i book hotels')) {
      return quickResponses['book hotels'];
    }
    
    if (lowerMessage.includes('book flights') || lowerMessage.includes('search and book flights')) {
      return quickResponses['book flights'];
    }
    
    if (lowerMessage.includes('rent a car') || lowerMessage.includes('car rental')) {
      return quickResponses['car rental'];
    }
    
    // Check for simple keywords
    for (const [key, response] of Object.entries(quickResponses)) {
      if (lowerMessage.includes(key)) {
        return response;
      }
    }
    return null;
  }

  // Get fallback response when API fails
  private getFallbackResponse(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return 'Hi! I\'m your AI travel assistant. I\'m currently experiencing some technical difficulties, but I can still help you with basic travel questions. How can I assist you? ✈️';
    }
    
    // Check for location-specific hotel requests first
    if (lowerMessage.includes('dubai') && (lowerMessage.includes('hotel') || lowerMessage.includes('suggest') || lowerMessage.includes('recommend'))) {
      return '🏨 **Dubai Hotel Recommendations:**\n\n🌟 **Luxury Hotels:**\n• Burj Al Arab - Iconic sail-shaped luxury hotel with stunning views ($800-1200/night)\n• Atlantis The Palm - Resort hotel with underwater suites and waterpark ($400-800/night)\n• Emirates Palace - Luxury hotel with private beach and marina ($300-600/night)\n\n🏢 **Business Hotels:**\n• Raffles Dubai - Elegant hotel with traditional architecture ($200-400/night)\n• Dubai Marina Hotel - Modern hotel with marina views and amenities ($150-300/night)\n\n💡 **Tips:**\n• Book in advance for better rates\n• Consider staying in Dubai Marina for modern amenities\n• Burj Khalifa area offers great city views\n• Many hotels offer free shuttle to malls and attractions\n\nTap on any hotel suggestion card to search and book!';
    }

    if (lowerMessage.includes('london') && (lowerMessage.includes('hotel') || lowerMessage.includes('suggest') || lowerMessage.includes('recommend'))) {
      return '🏨 **London Hotel Recommendations:**\n\n🌟 **Luxury Hotels:**\n• The Ritz London - Historic luxury hotel in Piccadilly ($400-800/night)\n• The Savoy - Iconic hotel on the Thames with Art Deco design ($350-700/night)\n• Claridge\'s - Elegant Mayfair hotel with afternoon tea ($300-600/night)\n\n🏢 **Modern Hotels:**\n• The Shard Hotel - Modern hotel in London\'s tallest building ($250-500/night)\n• Covent Garden Hotel - Boutique hotel in the heart of theatre district ($200-400/night)\n\n💡 **Tips:**\n• Stay in Central London for easy access to attractions\n• Many hotels offer afternoon tea experiences\n• Book attractions online for discounts\n• Use Oyster card for public transport\n\nTap on any hotel suggestion card to search and book!';
    }

    if (lowerMessage.includes('paris') && (lowerMessage.includes('hotel') || lowerMessage.includes('suggest') || lowerMessage.includes('recommend'))) {
      return '🏨 **Paris Hotel Recommendations:**\n\n🌟 **Luxury Hotels:**\n• Hotel Ritz Paris - Luxury hotel on Place Vendôme ($500-1000/night)\n• Le Meurice - Palace hotel with views of Tuileries Garden ($400-800/night)\n• Hotel Plaza Athénée - Elegant hotel on Avenue Montaigne ($350-700/night)\n\n🏢 **Boutique Hotels:**\n• Hotel des Invalides - Boutique hotel near Eiffel Tower ($200-400/night)\n• Montmartre Hotel - Charming hotel in artistic Montmartre district ($150-300/night)\n\n💡 **Tips:**\n• Book Eiffel Tower views in advance\n• Stay in different arrondissements for different experiences\n• Many hotels offer wine tasting experiences\n• Walk along the Seine for romantic views\n\nTap on any hotel suggestion card to search and book!';
    }

    if (lowerMessage.includes('tokyo') && (lowerMessage.includes('hotel') || lowerMessage.includes('suggest') || lowerMessage.includes('recommend'))) {
      return '🏨 **Tokyo Hotel Recommendations:**\n\n🌟 **Luxury Hotels:**\n• The Ritz-Carlton Tokyo - Luxury hotel in Roppongi with city views ($300-600/night)\n• Park Hyatt Tokyo - Iconic hotel featured in Lost in Translation ($250-500/night)\n• Aman Tokyo - Minimalist luxury hotel with traditional elements ($400-800/night)\n\n🏢 **Modern Hotels:**\n• Shibuya Sky Hotel - Modern hotel in the heart of Shibuya ($150-300/night)\n• Ginza Business Hotel - Efficient business hotel in upscale Ginza ($100-200/night)\n\n💡 **Tips:**\n• Stay in different districts for different experiences\n• Many hotels offer traditional Japanese experiences\n• Book restaurants in advance\n• Use JR Pass for unlimited travel\n\nTap on any hotel suggestion card to search and book!';
    }

    if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest')) {
      return 'I\'d love to help with recommendations! While I\'m having some technical issues, here are some popular destinations:\n\n• Paris, France - Great for romance and culture\n• Tokyo, Japan - Amazing food and technology\n• Bali, Indonesia - Beautiful beaches and temples\n• New York, USA - Iconic city experience\n• London, UK - Rich history and culture\n\nWhat type of trip are you planning?';
    }
    
    if (lowerMessage.includes('budget') || lowerMessage.includes('cheap') || lowerMessage.includes('low budget')) {
      return '💡 **Budget Travel Tips:**\n\n🌍 **Best Budget Destinations:**\n• Southeast Asia (Thailand, Vietnam, Cambodia)\n• Eastern Europe (Poland, Czech Republic, Hungary)\n• Central America (Guatemala, Nicaragua, Honduras)\n• India and Nepal\n• Portugal and Greece in Europe\n\n💰 **Money-Saving Tips:**\n• Travel during off-peak seasons\n• Stay in hostels or budget hotels\n• Eat local street food\n• Use public transportation\n• Book flights in advance\n• Consider house-sitting or Couchsurfing\n• Look for free walking tours\n• Visit free attractions and museums\n\nThese destinations offer great value for money!';
    }
    
    // Handle specific destination questions
    if (lowerMessage.includes('prague')) {
      return 'Prague, Czech Republic is a fantastic budget destination! Here\'s what you need to know:\n\n🏛️ **Top Attractions:**\n• Prague Castle - Historic royal residence\n• Charles Bridge - Iconic 14th-century bridge\n• Old Town Square - Beautiful medieval square\n• Astronomical Clock - Famous mechanical clock\n\n💰 **Budget Tips:**\n• Stay in hostels: $15-25/night\n• Eat local food: $5-10/meal\n• Use public transport: $1-2/ride\n• Many attractions are free!\n\n🍺 **Must-Try:**\n• Czech beer (cheaper than water!)\n• Traditional goulash\n• Trdelník (sweet pastry)\n\nBest time to visit: April-June or September-October for pleasant weather and fewer crowds!';
    }
    
    if (lowerMessage.includes('budapest')) {
      return 'Budapest, Hungary is an amazing budget-friendly destination! Here\'s your guide:\n\n🏛️ **Top Attractions:**\n• Buda Castle - Historic castle complex\n• Parliament Building - Stunning architecture\n• Fisherman\'s Bastion - Beautiful lookout point\n• Széchenyi Thermal Baths - Famous spa experience\n\n💰 **Budget Tips:**\n• Stay in hostels: $12-20/night\n• Eat Hungarian cuisine: $4-8/meal\n• Use public transport: $1-1.5/ride\n• Thermal baths: $15-25/visit\n\n🍽️ **Must-Try:**\n• Goulash soup\n• Langos (fried bread)\n• Hungarian wine\n• Chimney cake\n\nBest time to visit: May-June or September-October for perfect weather!';
    }
    
    if (lowerMessage.includes('krakow')) {
      return 'Krakow, Poland is a hidden gem for budget travelers! Here\'s what to know:\n\n🏛️ **Top Attractions:**\n• Wawel Castle - Historic royal castle\n• Main Market Square - Europe\'s largest medieval square\n• Auschwitz-Birkenau - Important historical site\n• Kazimierz District - Historic Jewish quarter\n\n💰 **Budget Tips:**\n• Stay in hostels: $10-18/night\n• Eat Polish food: $3-7/meal\n• Use public transport: $0.8-1.2/ride\n• Many museums are free on certain days\n\n🍽️ **Must-Try:**\n• Pierogi (dumplings)\n• Bigos (hunter\'s stew)\n• Polish vodka\n• Zapiekanka (Polish pizza)\n\nBest time to visit: May-September for warm weather and outdoor activities!';
    }
    
    if (lowerMessage.includes('lisbon')) {
      return 'Lisbon, Portugal offers incredible value for money! Here\'s your guide:\n\n🏛️ **Top Attractions:**\n• Belém Tower - Iconic 16th-century tower\n• Jerónimos Monastery - Beautiful Manueline architecture\n• Alfama District - Historic neighborhood\n• São Jorge Castle - Hilltop castle with city views\n\n💰 **Budget Tips:**\n• Stay in hostels: $15-25/night\n• Eat Portuguese cuisine: $5-10/meal\n• Use public transport: $1.5-2/ride\n• Many viewpoints are free\n\n🍽️ **Must-Try:**\n• Pastéis de nata (custard tarts)\n• Bacalhau (salted cod)\n• Port wine\n• Ginjinha (cherry liqueur)\n\nBest time to visit: April-June or September-October for perfect weather!';
    }

    // Handle specific destination questions
    if (lowerMessage.includes('london')) {
      return '🇬🇧 **London Travel Guide:**\n\n🏛️ **Must-See Attractions:**\n• Big Ben & Houses of Parliament\n• Tower of London & Crown Jewels\n• British Museum (free entry!)\n• London Eye & Thames River\n• Buckingham Palace & Changing of the Guard\n• Westminster Abbey\n• St. Paul\'s Cathedral\n• Tower Bridge\n\n🍽️ **Food & Drink:**\n• Traditional fish & chips\n• Afternoon tea experience\n• Sunday roast at a pub\n• Borough Market for street food\n• Indian food in Brick Lane\n\n🚇 **Getting Around:**\n• Use Oyster card for public transport\n• Walk between nearby attractions\n• Take the iconic red double-decker buses\n• River Thames boat tours\n\n💰 **Budget Tips:**\n• Many museums are free\n• Walk instead of taking taxis\n• Eat at local pubs for affordable meals\n• Book attractions online for discounts\n\nBest time to visit: May-September for pleasant weather!';
    }

    if (lowerMessage.includes('paris')) {
      return '🇫🇷 **Paris Travel Guide:**\n\n🗼 **Iconic Attractions:**\n• Eiffel Tower (book tickets in advance!)\n• Louvre Museum & Mona Lisa\n• Notre-Dame Cathedral\n• Arc de Triomphe\n• Champs-Élysées\n• Montmartre & Sacré-Cœur\n• Seine River cruises\n• Palace of Versailles (day trip)\n\n🍽️ **Food & Culture:**\n• Croissants & café au lait\n• French cuisine at local bistros\n• Wine tasting experiences\n• Macarons from Ladurée\n• Street crepes\n\n🚇 **Getting Around:**\n• Metro system is efficient\n• Walk along the Seine\n• Rent a bike (Vélib)\n• Take the bus for scenic routes\n\n💰 **Budget Tips:**\n• Many attractions have free days\n• Eat at local markets\n• Buy a Paris Museum Pass\n• Walk between nearby attractions\n• Enjoy free views from bridges\n\nBest time to visit: April-June or September-October!';
    }

    if (lowerMessage.includes('tokyo')) {
      return '🇯🇵 **Tokyo Travel Guide:**\n\n🏙️ **Must-Visit Areas:**\n• Shibuya Crossing (world\'s busiest)\n• Harajuku & Takeshita Street\n• Asakusa & Senso-ji Temple\n• Shinjuku & Golden Gai\n• Akihabara (electronics district)\n• Ginza (luxury shopping)\n• Tsukiji Outer Market\n• Ueno Park & Museums\n\n🍽️ **Food Experiences:**\n• Sushi at Tsukiji Market\n• Ramen at local shops\n• Wagyu beef\n• Matcha tea ceremonies\n• Street food in Harajuku\n• Conveyor belt sushi\n\n🚇 **Getting Around:**\n• JR Pass for tourists\n• Tokyo Metro system\n• Walk in neighborhoods\n• Taxis for short distances\n\n💰 **Budget Tips:**\n• Eat at convenience stores (7-Eleven)\n• Stay in business hotels\n• Use JR Pass for unlimited travel\n• Many temples are free\n• Walk between nearby areas\n\nBest time to visit: March-May (cherry blossoms) or September-November!';
    }

    if (lowerMessage.includes('app features') || lowerMessage.includes('features does this travel app')) {
      return '📱 **Smart Travel Planner App Features:**\n\n🔍 **Search & Book:**\n• Hotel search with real images\n• Flight search and booking\n• Car rental options\n• Location-specific results\n\n🤖 **AI Assistant:**\n• Travel recommendations\n• Budget planning tips\n• Destination guides\n• Personalized suggestions\n\n📊 **Trip Management:**\n• My Trips - View all bookings\n• Booking details and history\n• PDF export of trips\n• Save favorite items\n\n👤 **User Features:**\n• Profile management\n• Travel preferences\n• Biometric login\n• Travel library\n\n💰 **Smart Features:**\n• Budget tracking\n• Cost analysis\n• Weather integration\n• Expense reports\n\n🎯 **How to Use:**\n• Search tab: Find hotels, flights, cars\n• AI Assistant: Get travel advice\n• My Trips: Manage bookings\n• Profile: Update preferences\n\nStart by searching for your destination or ask me for recommendations!';
    }

    if (lowerMessage.includes('book hotels') || lowerMessage.includes('how do i book hotels')) {
      return '🏨 **How to Book Hotels:**\n\n📱 **Step-by-Step Guide:**\n1. Go to the **Search** tab\n2. Select **Hotels** tab\n3. Enter your destination (e.g., "Paris")\n4. Choose check-in and check-out dates\n5. Select number of guests\n6. Set your budget\n7. Tap **Search**\n8. Browse hotel results with real images\n9. Tap **Book Hotel** on your choice\n10. Confirm your booking\n\n💡 **Tips:**\n• Use the AI Assistant for hotel recommendations\n• Check the "My Trips" section to view bookings\n• Save favorite hotels to your library\n• Export your trip details as PDF\n\n🎯 **Features:**\n• Real hotel images for each location\n• Detailed hotel information\n• Price comparison\n• Location-specific results\n\nTry searching for hotels now!';
    }

    if (lowerMessage.includes('book flights') || lowerMessage.includes('search and book flights')) {
      return '✈️ **How to Book Flights:**\n\n📱 **Step-by-Step Guide:**\n1. Go to the **Search** tab\n2. Select **Flights** tab\n3. Enter origin city (e.g., "New York")\n4. Enter destination (e.g., "Paris")\n5. Choose departure and return dates\n6. Select number of passengers\n7. Tap **Search**\n8. Browse flight options\n9. Tap **Book Flight** on your choice\n10. Confirm your booking\n\n💡 **Tips:**\n• Book in advance for better prices\n• Use the AI Assistant for flight recommendations\n• Check "My Trips" to view flight bookings\n• Compare different airlines and times\n\n🎯 **Features:**\n• Multiple airline options\n• Price comparison\n• Flight duration and stops info\n• Easy booking process\n\nTry searching for flights now!';
    }

    if (lowerMessage.includes('rent a car') || lowerMessage.includes('car rental')) {
      return '🚗 **How to Rent a Car:**\n\n📱 **Step-by-Step Guide:**\n1. Go to the **Search** tab\n2. Select **Cars** tab\n3. Enter your location (e.g., "Paris")\n4. Choose pickup and drop-off dates\n5. Select pickup and drop-off times\n6. Tap **Search**\n7. Browse car options by category\n8. Compare prices and features\n9. Tap **Book Car** on your choice\n10. Confirm your rental\n\n💡 **Tips:**\n• Book in advance for better rates\n• Compare different car categories\n• Check included features (GPS, etc.)\n• Review pickup/drop-off locations\n\n🎯 **Features:**\n• Economy to luxury car options\n• Real car images\n• Feature comparison\n• Multiple rental companies\n• Easy booking process\n\nTry searching for car rentals now!';
    }
    
    return 'I\'m currently experiencing some technical difficulties, but I\'m still here to help! I can provide general travel advice and tips. What would you like to know about travel?';
  }

  // Get fallback travel suggestions when API fails
  private getFallbackSuggestions(query: string): TravelSuggestion[] {
    const lowerQuery = query.toLowerCase();
    
    // Dubai hotel suggestions
    if (lowerQuery.includes('dubai') && (lowerQuery.includes('hotel') || lowerQuery.includes('suggest'))) {
      return [
        {
          type: 'hotel',
          title: 'Burj Al Arab',
          description: 'Iconic sail-shaped luxury hotel with stunning views',
          price: '$800-1200/night',
          rating: 4.9,
          location: 'Dubai, UAE'
        },
        {
          type: 'hotel',
          title: 'Atlantis The Palm',
          description: 'Resort hotel with underwater suites and waterpark',
          price: '$400-800/night',
          rating: 4.7,
          location: 'Dubai, UAE'
        },
        {
          type: 'hotel',
          title: 'Emirates Palace',
          description: 'Luxury hotel with private beach and marina',
          price: '$300-600/night',
          rating: 4.6,
          location: 'Dubai, UAE'
        },
        {
          type: 'hotel',
          title: 'Raffles Dubai',
          description: 'Elegant hotel with traditional architecture',
          price: '$200-400/night',
          rating: 4.5,
          location: 'Dubai, UAE'
        },
        {
          type: 'hotel',
          title: 'Dubai Marina Hotel',
          description: 'Modern hotel with marina views and amenities',
          price: '$150-300/night',
          rating: 4.4,
          location: 'Dubai, UAE'
        }
      ];
    }
    
    // London hotel suggestions
    if (lowerQuery.includes('london') && (lowerQuery.includes('hotel') || lowerQuery.includes('suggest'))) {
      return [
        {
          type: 'hotel',
          title: 'The Ritz London',
          description: 'Historic luxury hotel in Piccadilly',
          price: '$400-800/night',
          rating: 4.8,
          location: 'London, UK'
        },
        {
          type: 'hotel',
          title: 'The Savoy',
          description: 'Iconic hotel on the Thames with Art Deco design',
          price: '$350-700/night',
          rating: 4.7,
          location: 'London, UK'
        },
        {
          type: 'hotel',
          title: 'Claridge\'s',
          description: 'Elegant Mayfair hotel with afternoon tea',
          price: '$300-600/night',
          rating: 4.6,
          location: 'London, UK'
        },
        {
          type: 'hotel',
          title: 'The Shard Hotel',
          description: 'Modern hotel in London\'s tallest building',
          price: '$250-500/night',
          rating: 4.5,
          location: 'London, UK'
        },
        {
          type: 'hotel',
          title: 'Covent Garden Hotel',
          description: 'Boutique hotel in the heart of theatre district',
          price: '$200-400/night',
          rating: 4.4,
          location: 'London, UK'
        }
      ];
    }
    
    // Paris hotel suggestions
    if (lowerQuery.includes('paris') && (lowerQuery.includes('hotel') || lowerQuery.includes('suggest'))) {
      return [
        {
          type: 'hotel',
          title: 'Hotel Ritz Paris',
          description: 'Luxury hotel on Place Vendôme',
          price: '$500-1000/night',
          rating: 4.9,
          location: 'Paris, France'
        },
        {
          type: 'hotel',
          title: 'Le Meurice',
          description: 'Palace hotel with views of Tuileries Garden',
          price: '$400-800/night',
          rating: 4.8,
          location: 'Paris, France'
        },
        {
          type: 'hotel',
          title: 'Hotel Plaza Athénée',
          description: 'Elegant hotel on Avenue Montaigne',
          price: '$350-700/night',
          rating: 4.7,
          location: 'Paris, France'
        },
        {
          type: 'hotel',
          title: 'Hotel des Invalides',
          description: 'Boutique hotel near Eiffel Tower',
          price: '$200-400/night',
          rating: 4.5,
          location: 'Paris, France'
        },
        {
          type: 'hotel',
          title: 'Montmartre Hotel',
          description: 'Charming hotel in artistic Montmartre district',
          price: '$150-300/night',
          rating: 4.3,
          location: 'Paris, France'
        }
      ];
    }
    
    // Tokyo hotel suggestions
    if (lowerQuery.includes('tokyo') && (lowerQuery.includes('hotel') || lowerQuery.includes('suggest'))) {
      return [
        {
          type: 'hotel',
          title: 'The Ritz-Carlton Tokyo',
          description: 'Luxury hotel in Roppongi with city views',
          price: '$300-600/night',
          rating: 4.8,
          location: 'Tokyo, Japan'
        },
        {
          type: 'hotel',
          title: 'Park Hyatt Tokyo',
          description: 'Iconic hotel featured in Lost in Translation',
          price: '$250-500/night',
          rating: 4.7,
          location: 'Tokyo, Japan'
        },
        {
          type: 'hotel',
          title: 'Aman Tokyo',
          description: 'Minimalist luxury hotel with traditional elements',
          price: '$400-800/night',
          rating: 4.9,
          location: 'Tokyo, Japan'
        },
        {
          type: 'hotel',
          title: 'Shibuya Sky Hotel',
          description: 'Modern hotel in the heart of Shibuya',
          price: '$150-300/night',
          rating: 4.4,
          location: 'Tokyo, Japan'
        },
        {
          type: 'hotel',
          title: 'Ginza Business Hotel',
          description: 'Efficient business hotel in upscale Ginza',
          price: '$100-200/night',
          rating: 4.2,
          location: 'Tokyo, Japan'
        }
      ];
    }
    
    // New York hotel suggestions
    if (lowerQuery.includes('new york') && (lowerQuery.includes('hotel') || lowerQuery.includes('suggest'))) {
      return [
        {
          type: 'hotel',
          title: 'The Plaza New York',
          description: 'Historic luxury hotel on Central Park',
          price: '$400-800/night',
          rating: 4.8,
          location: 'New York, USA'
        },
        {
          type: 'hotel',
          title: 'The St. Regis New York',
          description: 'Elegant hotel in Midtown Manhattan',
          price: '$350-700/night',
          rating: 4.7,
          location: 'New York, USA'
        },
        {
          type: 'hotel',
          title: 'Times Square Hotel',
          description: 'Modern hotel in the heart of Times Square',
          price: '$200-400/night',
          rating: 4.5,
          location: 'New York, USA'
        },
        {
          type: 'hotel',
          title: 'SoHo Boutique Hotel',
          description: 'Charming hotel in trendy SoHo district',
          price: '$250-500/night',
          rating: 4.4,
          location: 'New York, USA'
        },
        {
          type: 'hotel',
          title: 'Manhattan Business Hotel',
          description: 'Efficient business hotel in Financial District',
          price: '$150-300/night',
          rating: 4.3,
          location: 'New York, USA'
        }
      ];
    }
    
    // Singapore hotel suggestions
    if (lowerQuery.includes('singapore') && (lowerQuery.includes('hotel') || lowerQuery.includes('suggest'))) {
      return [
        {
          type: 'hotel',
          title: 'Marina Bay Sands',
          description: 'Iconic hotel with infinity pool and city views',
          price: '$300-600/night',
          rating: 4.8,
          location: 'Singapore'
        },
        {
          type: 'hotel',
          title: 'The Ritz-Carlton Singapore',
          description: 'Luxury hotel in Marina Bay area',
          price: '$250-500/night',
          rating: 4.7,
          location: 'Singapore'
        },
        {
          type: 'hotel',
          title: 'Raffles Singapore',
          description: 'Historic colonial hotel with Singapore Sling',
          price: '$400-800/night',
          rating: 4.9,
          location: 'Singapore'
        },
        {
          type: 'hotel',
          title: 'Orchard Road Hotel',
          description: 'Modern hotel in shopping district',
          price: '$150-300/night',
          rating: 4.4,
          location: 'Singapore'
        },
        {
          type: 'hotel',
          title: 'Chinatown Heritage Hotel',
          description: 'Boutique hotel in historic Chinatown',
          price: '$100-200/night',
          rating: 4.2,
          location: 'Singapore'
        }
      ];
    }
    
    if (lowerQuery.includes('europe') && lowerQuery.includes('budget')) {
      return [
        {
          type: 'destination',
          title: 'Prague, Czech Republic',
          description: 'Beautiful historic city with affordable prices',
          price: '$30-50/day',
          rating: 4.8,
          location: 'Czech Republic'
        },
        {
          type: 'destination',
          title: 'Budapest, Hungary',
          description: 'Stunning architecture and thermal baths',
          price: '$25-45/day',
          rating: 4.7,
          location: 'Hungary'
        },
        {
          type: 'destination',
          title: 'Krakow, Poland',
          description: 'Rich history and vibrant nightlife',
          price: '$20-40/day',
          rating: 4.6,
          location: 'Poland'
        },
        {
          type: 'destination',
          title: 'Lisbon, Portugal',
          description: 'Coastal charm and delicious cuisine',
          price: '$35-55/day',
          rating: 4.5,
          location: 'Portugal'
        }
      ];
    }
    
    if (lowerQuery.includes('europe')) {
      return [
        {
          type: 'destination',
          title: 'Paris, France',
          description: 'City of lights with iconic landmarks',
          price: '$80-120/day',
          rating: 4.9,
          location: 'France'
        },
        {
          type: 'destination',
          title: 'Rome, Italy',
          description: 'Ancient history and amazing food',
          price: '$70-110/day',
          rating: 4.8,
          location: 'Italy'
        },
        {
          type: 'destination',
          title: 'Barcelona, Spain',
          description: 'Art, architecture, and Mediterranean vibes',
          price: '$60-90/day',
          rating: 4.7,
          location: 'Spain'
        },
        {
          type: 'destination',
          title: 'Amsterdam, Netherlands',
          description: 'Canals, museums, and cycling culture',
          price: '$75-105/day',
          rating: 4.6,
          location: 'Netherlands'
        }
      ];
    }
    
    if (lowerQuery.includes('budget')) {
      return [
        {
          type: 'destination',
          title: 'Thailand',
          description: 'Tropical paradise with amazing food',
          price: '$25-45/day',
          rating: 4.8,
          location: 'Southeast Asia'
        },
        {
          type: 'destination',
          title: 'Vietnam',
          description: 'Rich culture and stunning landscapes',
          price: '$20-35/day',
          rating: 4.7,
          location: 'Southeast Asia'
        },
        {
          type: 'destination',
          title: 'Guatemala',
          description: 'Mayan ruins and colonial cities',
          price: '$30-50/day',
          rating: 4.5,
          location: 'Central America'
        }
      ];
    }
    
    // Default suggestions
    return [
      {
        type: 'destination',
        title: 'Tokyo, Japan',
        description: 'Modern metropolis with ancient traditions',
        price: '$60-100/day',
        rating: 4.9,
        location: 'Japan'
      },
      {
        type: 'destination',
        title: 'Bali, Indonesia',
        description: 'Tropical paradise with rich culture',
        price: '$30-60/day',
        rating: 4.8,
        location: 'Indonesia'
      },
      {
        type: 'destination',
        title: 'New York, USA',
        description: 'The city that never sleeps',
        price: '$100-150/day',
        rating: 4.7,
        location: 'USA'
      }
    ];
  }

  // Get quick responses for common queries
  getQuickResponses(): { [key: string]: string } {
    return {
      'hello': 'Hi! I\'m your AI travel assistant. How can I help you plan your next adventure? ✈️',
      'help': 'I can help you with:\n• Destination recommendations\n• Travel planning advice\n• Budget tips\n• Booking guidance\n• Travel tips and tricks\n\nWhat would you like to know?',
      'budget': '💡 **Budget Travel Tips:**\n\n🌍 **Best Budget Destinations:**\n• Southeast Asia (Thailand, Vietnam, Cambodia)\n• Eastern Europe (Poland, Czech Republic, Hungary)\n• Central America (Guatemala, Nicaragua, Honduras)\n• India and Nepal\n• Portugal and Greece in Europe\n\n💰 **Money-Saving Tips:**\n• Travel during off-peak seasons\n• Stay in hostels or budget hotels\n• Eat local street food\n• Use public transportation\n• Book flights in advance\n• Consider house-sitting or Couchsurfing\n• Look for free walking tours\n• Visit free attractions and museums\n\nThese destinations offer great value for money!',
      'london': '🇬🇧 **London Travel Guide:**\n\n🏛️ **Must-See Attractions:**\n• Big Ben & Houses of Parliament\n• Tower of London & Crown Jewels\n• British Museum (free entry!)\n• London Eye & Thames River\n• Buckingham Palace & Changing of the Guard\n• Westminster Abbey\n• St. Paul\'s Cathedral\n• Tower Bridge\n\n🍽️ **Food & Drink:**\n• Traditional fish & chips\n• Afternoon tea experience\n• Sunday roast at a pub\n• Borough Market for street food\n• Indian food in Brick Lane\n\n🚇 **Getting Around:**\n• Use Oyster card for public transport\n• Walk between nearby attractions\n• Take the iconic red double-decker buses\n• River Thames boat tours\n\n💰 **Budget Tips:**\n• Many museums are free\n• Walk instead of taking taxis\n• Eat at local pubs for affordable meals\n• Book attractions online for discounts\n\nBest time to visit: May-September for pleasant weather!',
      'paris': '🇫🇷 **Paris Travel Guide:**\n\n🗼 **Iconic Attractions:**\n• Eiffel Tower (book tickets in advance!)\n• Louvre Museum & Mona Lisa\n• Notre-Dame Cathedral\n• Arc de Triomphe\n• Champs-Élysées\n• Montmartre & Sacré-Cœur\n• Seine River cruises\n• Palace of Versailles (day trip)\n\n🍽️ **Food & Culture:**\n• Croissants & café au lait\n• French cuisine at local bistros\n• Wine tasting experiences\n• Macarons from Ladurée\n• Street crepes\n\n🚇 **Getting Around:**\n• Metro system is efficient\n• Walk along the Seine\n• Rent a bike (Vélib)\n• Take the bus for scenic routes\n\n💰 **Budget Tips:**\n• Many attractions have free days\n• Eat at local markets\n• Buy a Paris Museum Pass\n• Walk between nearby attractions\n• Enjoy free views from bridges\n\nBest time to visit: April-June or September-October!',
      'tokyo': '🇯🇵 **Tokyo Travel Guide:**\n\n🏙️ **Must-Visit Areas:**\n• Shibuya Crossing (world\'s busiest)\n• Harajuku & Takeshita Street\n• Asakusa & Senso-ji Temple\n• Shinjuku & Golden Gai\n• Akihabara (electronics district)\n• Ginza (luxury shopping)\n• Tsukiji Outer Market\n• Ueno Park & Museums\n\n🍽️ **Food Experiences:**\n• Sushi at Tsukiji Market\n• Ramen at local shops\n• Wagyu beef\n• Matcha tea ceremonies\n• Street food in Harajuku\n• Conveyor belt sushi\n\n🚇 **Getting Around:**\n• JR Pass for tourists\n• Tokyo Metro system\n• Walk in neighborhoods\n• Taxis for short distances\n\n💰 **Budget Tips:**\n• Eat at convenience stores (7-Eleven)\n• Stay in business hotels\n• Use JR Pass for unlimited travel\n• Many temples are free\n• Walk between nearby areas\n\nBest time to visit: March-May (cherry blossoms) or September-November!',
      'app features': '📱 **Smart Travel Planner App Features:**\n\n🔍 **Search & Book:**\n• Hotel search with real images\n• Flight search and booking\n• Car rental options\n• Location-specific results\n\n🤖 **AI Assistant:**\n• Travel recommendations\n• Budget planning tips\n• Destination guides\n• Personalized suggestions\n\n📊 **Trip Management:**\n• My Trips - View all bookings\n• Booking details and history\n• PDF export of trips\n• Save favorite items\n\n👤 **User Features:**\n• Profile management\n• Travel preferences\n• Biometric login\n• Travel library\n\n💰 **Smart Features:**\n• Budget tracking\n• Cost analysis\n• Weather integration\n• Expense reports\n\n🎯 **How to Use:**\n• Search tab: Find hotels, flights, cars\n• AI Assistant: Get travel advice\n• My Trips: Manage bookings\n• Profile: Update preferences\n\nStart by searching for your destination or ask me for recommendations!',
      'book hotels': '🏨 **How to Book Hotels:**\n\n📱 **Step-by-Step Guide:**\n1. Go to the **Search** tab\n2. Select **Hotels** tab\n3. Enter your destination (e.g., "Paris")\n4. Choose check-in and check-out dates\n5. Select number of guests\n6. Set your budget\n7. Tap **Search**\n8. Browse hotel results with real images\n9. Tap **Book Hotel** on your choice\n10. Confirm your booking\n\n💡 **Tips:**\n• Use the AI Assistant for hotel recommendations\n• Check the "My Trips" section to view bookings\n• Save favorite hotels to your library\n• Export your trip details as PDF\n\n🎯 **Features:**\n• Real hotel images for each location\n• Detailed hotel information\n• Price comparison\n• Location-specific results\n\nTry searching for hotels now!',
      'book flights': '✈️ **How to Book Flights:**\n\n📱 **Step-by-Step Guide:**\n1. Go to the **Search** tab\n2. Select **Flights** tab\n3. Enter origin city (e.g., "New York")\n4. Enter destination (e.g., "Paris")\n5. Choose departure and return dates\n6. Select number of passengers\n7. Tap **Search**\n8. Browse flight options\n9. Tap **Book Flight** on your choice\n10. Confirm your booking\n\n💡 **Tips:**\n• Book in advance for better prices\n• Use the AI Assistant for flight recommendations\n• Check "My Trips" to view flight bookings\n• Compare different airlines and times\n\n🎯 **Features:**\n• Multiple airline options\n• Price comparison\n• Flight duration and stops info\n• Easy booking process\n\nTry searching for flights now!',
      'car rental': '🚗 **How to Rent a Car:**\n\n📱 **Step-by-Step Guide:**\n1. Go to the **Search** tab\n2. Select **Cars** tab\n3. Enter your location (e.g., "Paris")\n4. Choose pickup and drop-off dates\n5. Select pickup and drop-off times\n6. Tap **Search**\n7. Browse car options by category\n8. Compare prices and features\n9. Tap **Book Car** on your choice\n10. Confirm your rental\n\n💡 **Tips:**\n• Book in advance for better rates\n• Compare different car categories\n• Check included features (GPS, etc.)\n• Review pickup/drop-off locations\n\n🎯 **Features:**\n• Economy to luxury car options\n• Real car images\n• Feature comparison\n• Multiple rental companies\n• Easy booking process\n\nTry searching for car rentals now!',
      'weather': 'I can provide general weather information, but for real-time updates, I recommend checking weather apps or the local forecast.',
      'visa': 'Visa requirements vary by destination and nationality. I recommend checking with the embassy or using official government travel websites for the most current information.',
      'booking': 'For bookings, you can use our app\'s search features! I can guide you through the process or help you find the best options.'
    };
  }
}

export const aiTravelChatbot = new AITravelChatbotService();
