# 🤖 Gemini AI Travel Chatbot Setup Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Your Free Gemini API Key

1. **Visit Google AI Studio**: https://aistudio.google.com/
2. **Sign in** with your Google account
3. **Click "Get API Key"** in the top right
4. **Create API Key** - Choose "Create API Key in new project"
5. **Copy your API key** - It will look like: `AIzaSyB...`

### Step 2: Add API Key to Your App

1. **Open** `src/services/AITravelChatbot.ts`
2. **Replace** `YOUR_GEMINI_API_KEY` with your actual key:

```typescript
// Line 4 in AITravelChatbot.ts
const genAI = new GoogleGenerativeAI('AIzaSyB_your_actual_key_here');
```

### Step 3: Test the Chatbot

1. **Run your app**: `npx expo start`
2. **Navigate to** the "AI Assistant" tab
3. **Ask a question** like: "What's the best time to visit Paris?"
4. **Enjoy** your AI travel assistant! ✈️

## 🎯 What Your Chatbot Can Do

### ✨ Core Features
- **Destination Recommendations** - "Where should I go for a budget trip?"
- **Travel Planning** - "Help me plan a 5-day trip to Tokyo"
- **Budget Advice** - "What's the cheapest way to travel to Europe?"
- **Travel Tips** - "What should I pack for a beach vacation?"
- **Booking Guidance** - "How do I book flights through your app?"

### 🧠 Smart Features
- **Personalized Responses** - Uses your profile preferences
- **Context Awareness** - Remembers conversation history
- **Travel Suggestions** - Provides specific recommendations
- **Real-time Help** - 24/7 travel assistance

## 📊 Gemini Free Tier Limits

| Feature | Limit | What it means |
|---------|-------|---------------|
| **Requests per minute** | 15 | Perfect for normal usage |
| **Daily tokens** | 1,000,000 | ~500,000 words per day |
| **Cost** | $0 | Completely free! |

## 🔧 Advanced Configuration

### Customize Chatbot Personality

Edit the prompt in `AITravelChatbot.ts`:

```typescript
const basePrompt = `You are an expert AI travel assistant for the Smart Travel Planner app. 
You help users with travel planning, recommendations, and advice.

Your personality:
- Friendly and enthusiastic about travel
- Knowledgeable about destinations worldwide
- Practical and budget-conscious
- Encouraging and inspiring

Always provide helpful, accurate travel advice...`;
```

### Add More Features

You can extend the chatbot with:

1. **Weather Integration** - Real-time weather data
2. **Currency Conversion** - Live exchange rates
3. **Flight Status** - Real-time flight information
4. **Local Events** - Destination-specific events
5. **Photo Analysis** - Analyze travel photos

## 🚨 Troubleshooting

### Common Issues

**"API Key Invalid"**
- Double-check your API key is correct
- Make sure there are no extra spaces
- Verify the key is from Google AI Studio

**"Rate Limit Exceeded"**
- You've hit the 15 requests/minute limit
- Wait a minute and try again
- Consider upgrading to paid tier for higher limits

**"No Response"**
- Check your internet connection
- Verify the API key is working
- Check console for error messages

### Getting Help

1. **Check the logs** in your development console
2. **Test your API key** at https://aistudio.google.com/
3. **Verify network connectivity**
4. **Check Expo/React Native compatibility**

## 🎉 Success!

Your AI Travel Chatbot is now ready! Users can:

- Ask travel questions 24/7
- Get personalized recommendations
- Receive travel tips and advice
- Plan their trips with AI assistance

The chatbot will help increase user engagement and provide valuable travel assistance to your app users! 🌍✈️

## 📈 Next Steps

1. **Monitor usage** - Check how users interact with the chatbot
2. **Gather feedback** - Ask users what they'd like to see improved
3. **Add more features** - Weather, currency, flight status
4. **Scale up** - Consider paid tier if you need higher limits
5. **Integrate with booking** - Connect chatbot suggestions to your booking system

Happy travels! 🎒✈️
