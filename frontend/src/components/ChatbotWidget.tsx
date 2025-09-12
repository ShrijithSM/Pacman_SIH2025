import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, MessageCircle, X, Maximize2, Minimize2 } from 'lucide-react';
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

const languages = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'local', name: 'Local' },
];

const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({
  isEmbedded = false,
  position = 'bottom-right',
  primaryColor = '#3B82F6',
  language = 'en',
  className
}) => {
  const [isOpen, setIsOpen] = useState(!isEmbedded);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(language);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: currentLanguage === 'hi'
        ? 'नमस्ते! मैं आपका कैंपस असिस्टेंट हूं। आप मुझसे कोई भी सवाल पूछ सकते हैं।'
        : 'Hello! I\'m your Campus Assistant. How can I help you today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Set CSS custom property for theme color
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', primaryColor);
  }, [primaryColor]);

  const scrollToBottom = () => {
    if (messagesEndRef.current && chatContainerRef.current) {
      // Scroll only the chat container, not the entire page
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
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
        content: getBotResponse(inputValue, currentLanguage),
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
      ],
      local: [
        "I'd be happy to help you with that! Let me check our campus resources.",
        "That's a great question! Here's what I found in our student handbook."
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

  const handleLanguageChange = (newLanguage: string) => {
    setCurrentLanguage(newLanguage as 'en' | 'hi' | 'local');
    // Update initial message when language changes
    const welcomeMessage = newLanguage === 'hi'
      ? 'नमस्ते! मैं आपका कैंपस असिस्टेंट हूं। आप मुझसे कोई भी सवाल पूछ सकते हैं।'
      : 'Hello! I\'m your Campus Assistant. How can I help you today?';

    setMessages([{
      id: '1',
      content: welcomeMessage,
      sender: 'bot',
      timestamp: new Date()
    }]);
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
          style={{ backgroundColor: primaryColor }}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Backdrop for expanded mode */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}

      <div
        className={cn(
          "bg-card border border-border rounded-lg shadow-chatbot transition-all duration-300 ease-smooth",
          isExpanded ? (
            "fixed z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-4xl h-[80vh]"
          ) : isEmbedded ? cn(
            "fixed z-50 w-80 h-96",
            position === 'bottom-right' ? 'bottom-6 right-6' : 'bottom-6 left-6'
          ) : "w-full max-w-md mx-auto",
          className
        )}
        style={{ '--theme-color': primaryColor } as React.CSSProperties}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-card rounded-t-lg">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: primaryColor }}
            >
              <MessageCircle className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">Campus Assistant</h3>
              <p className="text-xs text-muted-foreground">
                {currentLanguage === 'hi' ? 'ऑनलाइन' : 'Online'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select value={currentLanguage} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-24 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0 hover:bg-secondary"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>

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
        </div>

        {/* Messages */}
        <div
          ref={chatContainerRef}
          className={cn(
            "flex-1 p-4 overflow-y-auto space-y-3 scroll-smooth",
            isExpanded ? "h-[calc(80vh-140px)]" : "h-64"
          )}
          style={{ overscrollBehavior: 'contain' }}
        >
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
                  "max-w-[80%] p-3 rounded-lg transition-all duration-200 text-left",
                  message.sender === 'user'
                    ? "rounded-br-sm text-white"
                    : "bg-secondary text-secondary-foreground rounded-bl-sm"
                )}
                style={message.sender === 'user' ? { backgroundColor: primaryColor } : {}}
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
              placeholder={placeholderText[currentLanguage]}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              className="flex-1 text-sm border-input focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="h-10 w-10 p-0 transition-all duration-200 hover:scale-105"
              style={{ backgroundColor: primaryColor }}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatbotWidget;