import React, { useState, useRef, useEffect } from 'react';
import axiosInstance from '@/utils/axios';

const ChatbotWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      from: 'bot', 
      text: 'Hi! I\'m SpaceBook AI Assistant. Ask me about properties, bookings, pricing, or anything else! 🏡',
      suggestions: ['Show properties in Mumbai', 'How do I book?', 'What amenities are available?']
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const sessionId = useRef(`session_${Date.now()}_${Math.random().toString(36).slice(2)}`);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Add user message
    setMessages((prev) => [...prev, { from: 'user', text: trimmed }]);
    setInput('');
    setIsTyping(true);

    try {
      // Call AI chatbot backend
      const { data } = await axiosInstance.post('/chatbot/chat', {
        message: trimmed,
        sessionId: sessionId.current,
      });

      // Add bot response
      setMessages((prev) => [
        ...prev,
        {
          from: 'bot',
          text: data.response || "I'm not sure how to help with that. Could you rephrase?",
          category: data.category,
          suggestions: data.suggestions || []
        },
      ]);
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages((prev) => [
        ...prev,
        {
          from: 'bot',
          text: error.response?.data?.response || 'Sorry, I encountered an error. Please try again!',
          suggestions: ['Show properties', 'How to book?', 'Contact support']
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = () => sendMessage(input);

  const handleSuggestionClick = (suggestion) => {
    sendMessage(suggestion);
  };

  const clearChat = () => {
    setMessages([
      {
        from: 'bot',
        text: 'Chat cleared! How can I help you today? 🏡',
        suggestions: ['Browse properties', 'Booking help', 'Popular destinations']
      },
    ]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-4 w-96 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-[#0B1220] to-[#1a2332] px-4 py-3 text-white border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#1F8A8A] animate-pulse"></div>
              <span className="font-light">SpaceBook AI Assistant</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={clearChat}
                className="text-[#E5E7EB]/60 hover:text-[#E5E7EB] transition text-xs"
                title="Clear chat"
              >
                🗑️
              </button>
              <button
                onClick={() => setOpen(false)}
                className="text-[#E5E7EB]/60 hover:text-[#E5E7EB] transition"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="max-h-96 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, idx) => (
              <div key={`${msg.from}-${idx}`}>
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.from === 'user'
                      ? 'ml-auto max-w-[85%] bg-gradient-to-r from-[#C9A96E] to-[#D4B896] text-[#0B1220] font-medium'
                      : 'mr-auto max-w-[90%] bg-white/10 text-[#E5E7EB]/90'
                  }`}
                >
                  {msg.text}
                </div>
                
                {/* Suggestions */}
                {msg.from === 'bot' && msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="mt-2 mr-auto max-w-[90%] flex flex-wrap gap-2">
                    {msg.suggestions.map((suggestion, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="text-xs px-3 py-1.5 rounded-full border border-[#C9A96E]/30 bg-[#C9A96E]/5 text-[#C9A96E] hover:bg-[#C9A96E]/15 transition"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="mr-auto max-w-[90%] rounded-2xl px-4 py-2.5 bg-white/10">
                <div className="flex gap-1">
                  <div className="h-2 w-2 rounded-full bg-[#E5E7EB]/60 animate-bounce"></div>
                  <div className="h-2 w-2 rounded-full bg-[#E5E7EB]/60 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="h-2 w-2 rounded-full bg-[#E5E7EB]/60 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-white/10 p-3 bg-[#0B1220]/20">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask me anything..."
              disabled={isTyping}
              className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-[#E5E7EB] placeholder-[#E5E7EB]/40 focus:outline-none focus:border-[#C9A96E]/50 transition disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={isTyping || !input.trim()}
              className="rounded-full bg-gradient-to-r from-[#C9A96E] to-[#D4B896] px-5 py-2.5 text-sm text-[#0B1220] font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>

          {/* Powered by badge */}
          <div className="px-4 py-2 text-center text-xs text-[#E5E7EB]/40 border-t border-white/5">
            Powered by SpaceBook AI 🤖
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-[#C9A96E] to-[#D4B896] text-[#0B1220] shadow-2xl hover:shadow-[#C9A96E]/20 transition-all duration-300 ${
          open ? 'scale-90' : 'scale-100 hover:scale-105'
        }`}
        aria-label="Toggle chatbot"
      >
        {open ? (
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        ) : (
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default ChatbotWidget;