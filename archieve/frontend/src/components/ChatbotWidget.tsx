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
  primaryColor?: string;
  language?: 'en' | 'hi' | 'local';
  className?: string;
}

const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({
  primaryColor,
  language = 'en',
  className
}) => {
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: '1',
      content: language === 'hi' 
        ? 'नमस्ते! मैं आपका कैंपस असिस्टेंट हूं। आप मुझसे कोई भी सवाल पूछ सकते हैं।'
        : "Hello! I'm your Campus Assistant. How can I help you today?",
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

    try {
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: inputValue,
          language: language
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);

    } catch (error) {
      console.error("Failed to get bot response:", error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm having trouble connecting. Please try again later.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const placeholderText = {
    en: 'Type your question...',
    hi: 'अपना सवाल लिखें...',
    local: 'Type your question...'
  };

  return (
    <div className={cn(
      "bg-card border border-border rounded-lg shadow-chatbot transition-all duration-300 ease-smooth",
      "w-full max-w-md mx-auto",
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
