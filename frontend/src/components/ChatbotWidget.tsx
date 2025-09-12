import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, MessageCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatbotWidgetProps {
  isEmbedded?: boolean;
  position?: 'bottom-right' | 'bottom-left';
  primaryColor?: string;
  language?: 'en' | 'hi' | 'local';
  className?: string;
}

const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({
  isEmbedded = false,
  position = 'bottom-right',
  primaryColor,
  language = 'en',
  className
}) => {
  const [isOpen, setIsOpen] = useState(!isEmbedded);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: language === 'hi' 
        ? 'नमस्ते! मैं आपका कैंपस असिस्टेंट हूं। आप मुझसे कोई भी सवाल पूछ सकते हैं।'
        : 'Hello! I\'m your Campus Assistant. How can I help you today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const messagesContainer = messagesEndRef.current.parentElement;
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: getBotResponse(inputValue, language),
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const getBotResponse = (input: string, lang: string): string => {
    const responses = {
      en: [
        "I'd be happy to help you with that! Let me check our campus resources.",
        "That's a great question! Here's what I found in our student handbook.",
        "I can assist you with campus information. Would you like me to connect you with the right department?",
        "Based on your question, I recommend checking with student services or visiting our online portal."
      ],
      hi: [
        "मैं इसमें आपकी मदद कर सकता हूं! मुझे कैंपस संसाधन चेक करने दें।",
        "यह एक बहुत अच्छा सवाल है! यहां वह है जो मुझे छात्र पुस्तिका में मिला।",
        "मैं कैंपस की जानकारी में आपकी सहायता कर सकता हूं। क्या आप चाहेंगे कि मैं आपको सही विभाग से जोड़ूं?"
      ]
    };
    
    const langResponses = responses[lang as keyof typeof responses] || responses.en;
    return langResponses[Math.floor(Math.random() * langResponses.length)];
  };

  const placeholderText = {
    en: 'Type your question...',
    hi: 'अपना सवाल लिखें...',
    local: 'Type your question...'
  };

  if (isEmbedded && !isOpen) {
    return (
      <div className={cn(
        "fixed z-50 transition-all duration-300 ease-bounce",
        position === 'bottom-right' ? 'bottom-6 right-6' : 'bottom-6 left-6',
        className
      )}>
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-primary hover:bg-primary-hover shadow-chatbot hover:shadow-hover transition-all duration-300 ease-bounce transform hover:scale-110"
          style={primaryColor ? { backgroundColor: primaryColor } : {}}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-card border border-border rounded-lg shadow-chatbot transition-all duration-300 ease-smooth",
      isEmbedded ? cn(
        "fixed z-50 w-80 h-96",
        position === 'bottom-right' ? 'bottom-6 right-6' : 'bottom-6 left-6'
      ) : "w-full max-w-md mx-auto",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-card rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <MessageCircle className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">Campus Assistant</h3>
            <p className="text-xs text-muted-foreground">
              {language === 'hi' ? 'ऑनलाइन' : 'Online'}
            </p>
          </div>
        </div>
        {isEmbedded && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 p-0 hover:bg-secondary"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 h-64 overflow-y-auto space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.sender === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                "max-w-[80%] p-3 rounded-lg transition-all duration-200",
                message.sender === 'user'
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-secondary text-secondary-foreground rounded-bl-sm"
              )}
            >
              <p className="text-sm leading-relaxed">{message.content}</p>
              <p className="text-xs mt-1 opacity-70">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-secondary text-secondary-foreground p-3 rounded-lg rounded-bl-sm">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-gradient-card rounded-b-lg">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholderText[language]}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 text-sm border-input focus:ring-2 focus:ring-primary/20 transition-all duration-200"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
            className="h-10 w-10 p-0 bg-primary hover:bg-primary-hover transition-all duration-200 hover:scale-105"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotWidget;