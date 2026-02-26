import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthProvider';
import { aiTravelChatbot, ChatMessage, TravelSuggestion } from '../services/AITravelChatbot';
import { useNavigation } from '@react-navigation/native';

const shouldGetSuggestions = (message: string): boolean => {
  const suggestionKeywords = ['recommend', 'suggest', 'where', 'destination', 'hotel', 'activity', 'restaurant'];
  return suggestionKeywords.some(keyword => message.toLowerCase().includes(keyword));
};

export const ChatbotScreen: React.FC = () => {
  const { profile } = useAuth();
  const navigation = useNavigation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<TravelSuggestion[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Initialize with welcome message
    const welcomeMessage: ChatMessage = {
      id: '1',
      text: "Hi! I'm your AI travel assistant. I can help you with destination recommendations, travel planning, budget tips, and more. How can I assist you today? ✈️",
      isUser: false,
      timestamp: new Date(),
      type: 'text'
    };
    setMessages([welcomeMessage]);
  }, []);

  // Predefined questions for quick access
  const predefinedQuestions = [
    {
      id: 'budget_tips',
      text: '💡 Budget travel tips',
      question: 'Give me tips for traveling on a low budget'
    },
    {
      id: 'london_guide',
      text: '🇬🇧 London travel guide',
      question: 'What are the best things to do in London?'
    },
    {
      id: 'paris_guide',
      text: '🇫🇷 Paris travel guide',
      question: 'What are the must-see places in Paris?'
    },
    {
      id: 'tokyo_guide',
      text: '🇯🇵 Tokyo travel guide',
      question: 'What should I know before visiting Tokyo?'
    },
    {
      id: 'app_features',
      text: '📱 App features guide',
      question: 'What features does this travel app have?'
    },
    {
      id: 'booking_help',
      text: '🏨 How to book hotels',
      question: 'How do I book hotels using this app?'
    },
    {
      id: 'flight_help',
      text: '✈️ How to book flights',
      question: 'How do I search and book flights?'
    },
    {
      id: 'car_rental',
      text: '🚗 Car rental guide',
      question: 'How do I rent a car for my trip?'
    }
  ];

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    setInputText('');
    setIsLoading(true);

    try {
      // Add user message immediately
      const userChatMessage: ChatMessage = {
        id: Date.now().toString(),
        text: userMessage,
        isUser: true,
        timestamp: new Date(),
        type: 'text'
      };

      setMessages(prev => [...prev, userChatMessage]);

      // Get AI response
      const aiResponse = await aiTravelChatbot.sendMessage(userMessage, profile);
      setMessages(prev => [...prev, aiResponse]);

      // Get travel suggestions if appropriate
      if (shouldGetSuggestions(userMessage)) {
        const travelSuggestions = await aiTravelChatbot.getTravelSuggestions(userMessage, profile);
        setSuggestions(travelSuggestions);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        text: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date(),
        type: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };


  const sendQuickMessage = (message: string) => {
    setInputText(message);
    // Automatically send the message when clicking suggestion cards
    setTimeout(() => {
      sendMessage();
    }, 100);
  };

  const handlePredefinedQuestion = (question: string) => {
    setInputText(question);
    setTimeout(() => {
      sendMessage();
    }, 100);
  };

  const clearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear the conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            aiTravelChatbot.clearHistory();
            setMessages([]);
            setSuggestions([]);
            // Reset with welcome message
            const welcomeMessage: ChatMessage = {
              id: '1',
              text: "Hi! I'm your AI travel assistant. How can I help you plan your next adventure? ✈️",
              isUser: false,
              timestamp: new Date(),
              type: 'text'
            };
            setMessages([welcomeMessage]);
          }
        }
      ]
    );
  };

  const renderMessage = (message: ChatMessage) => (
    <View
      key={message.id}
      style={[
        styles.messageContainer,
        message.isUser ? styles.userMessage : styles.aiMessage
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          message.isUser ? styles.userBubble : styles.aiBubble
        ]}
      >
        <Text
          style={[
            styles.messageText,
            message.isUser ? styles.userMessageText : styles.aiMessageText
          ]}
        >
          {message.text}
        </Text>
        <Text
          style={[
            styles.timestamp,
            message.isUser ? styles.userTimestamp : styles.aiTimestamp
          ]}
        >
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );

  const handleSuggestionPress = (suggestion: TravelSuggestion) => {
    // Navigate to search page with the suggestion location
    if (suggestion.type === 'destination' || suggestion.type === 'hotel') {
      // Navigate to Search tab and pass the suggestion data
      navigation.navigate('Search' as never, { 
        destination: suggestion.location || suggestion.title,
        type: suggestion.type === 'hotel' ? 'hotels' : 'hotels', // Default to hotels for booking
        suggestedHotel: suggestion.type === 'hotel' ? suggestion : undefined // Pass hotel suggestion
      } as never);
    } else {
      // For other types, just send a message
      sendQuickMessage(`Tell me more about ${suggestion.title.toLowerCase()}`);
    }
  };

  const renderSuggestion = (suggestion: TravelSuggestion, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.suggestionCard}
      onPress={() => handleSuggestionPress(suggestion)}
    >
      <View style={styles.suggestionHeader}>
        <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
        {suggestion.rating && (
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#fbbf24" />
            <Text style={styles.ratingText}>{suggestion.rating}</Text>
          </View>
        )}
      </View>
      <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
      <View style={styles.suggestionFooter}>
        {suggestion.price && (
          <Text style={styles.suggestionPrice}>{suggestion.price}</Text>
        )}
        {suggestion.location && (
          <Text style={styles.suggestionLocation}>{suggestion.location}</Text>
        )}
        {(suggestion.type === 'destination' || suggestion.type === 'hotel') && (
          <View style={styles.navigateHint}>
            <Ionicons name="arrow-forward" size={16} color="#667eea" />
            <Text style={styles.navigateText}>Tap to search</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Ionicons name="chatbubble-ellipses" size={24} color="white" />
            <Text style={styles.headerTitle}>AI Travel Assistant</Text>
          </View>
          <TouchableOpacity onPress={clearChat} style={styles.clearButton}>
            <Ionicons name="trash-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map(renderMessage)}
          
          {/* Show predefined questions only when there are no suggestions and not loading */}
          {messages.length === 1 && !isLoading && suggestions.length === 0 && (
            <View style={styles.predefinedQuestionsContainer}>
              <Text style={styles.predefinedQuestionsTitle}>Quick Questions</Text>
              <View style={styles.predefinedQuestionsGrid}>
                {predefinedQuestions.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.predefinedQuestionButton}
                    onPress={() => handlePredefinedQuestion(item.question)}
                  >
                    <Text style={styles.predefinedQuestionText}>{item.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#667eea" />
              <Text style={styles.loadingText}>AI is thinking...</Text>
            </View>
          )}

          {suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Travel Suggestions</Text>
              {suggestions.map(renderSuggestion)}
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask me anything about travel..."
            placeholderTextColor="#9ca3af"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <Ionicons
              name="send"
              size={20}
              color={(!inputText.trim() || isLoading) ? '#9ca3af' : 'white'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  clearButton: {
    padding: 8,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#667eea',
  },
  aiBubble: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: 'white',
  },
  aiMessageText: {
    color: '#1f2937',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
  },
  userTimestamp: {
    color: 'rgba(255,255,255,0.7)',
  },
  aiTimestamp: {
    color: '#9ca3af',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 8,
    color: '#6b7280',
    fontSize: 14,
  },
  suggestionsContainer: {
    marginTop: 16,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  suggestionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#6b7280',
  },
  suggestionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  suggestionPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10b981',
  },
  suggestionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  suggestionLocation: {
    fontSize: 12,
    color: '#6b7280',
  },
  navigateHint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navigateText: {
    fontSize: 12,
    color: '#667eea',
    marginLeft: 4,
    fontWeight: '500',
  },
  predefinedQuestionsContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  predefinedQuestionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  predefinedQuestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  predefinedQuestionButton: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    minWidth: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  predefinedQuestionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'flex-end',
    paddingBottom: Platform.OS === 'ios' ? 16 : 24,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#667eea',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
});
