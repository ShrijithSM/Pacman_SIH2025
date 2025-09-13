// Main export for React component usage
export { default as CampusChatbot } from './components/ChatbotWidget';
export { default as EmbedScript } from './components/EmbedScript';

// Type exports
export interface ChatbotConfig {
  position?: 'bottom-right' | 'bottom-left';
  primaryColor?: string;
  language?: 'en' | 'hi' | 'local';
  isEmbedded?: boolean;
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}