import React, { useEffect } from 'react';
import ChatbotWidget from './ChatbotWidget';

interface EmbedScriptProps {
  themeColor?: string;
  position?: 'bottom-right' | 'bottom-left';
  language?: 'en' | 'hi' | 'local';
}

declare global {
  interface Window {
    CampusAssistant?: {
      init: (config: EmbedScriptProps) => void;
    };
  }
}

const EmbedScript: React.FC<EmbedScriptProps> = ({
  themeColor = '#3B82F6',
  position = 'bottom-right',
  language = 'en'
}) => {
  useEffect(() => {
    // Make the component available globally for embedding
    if (typeof window !== 'undefined') {
      window.CampusAssistant = {
        init: (config: EmbedScriptProps) => {
          const container = document.createElement('div');
          container.id = 'campus-assistant-widget';
          document.body.appendChild(container);

          // This would normally render using ReactDOM in a real implementation
          console.log('Campus Assistant initialized with config:', config);
        }
      };
    }
  }, []);

  return (
    <ChatbotWidget
      isEmbedded={true}
      position={position}
      primaryColor={themeColor}
      language={language}
    />
  );
};

// Export for React component usage
export { ChatbotWidget as CampusChatbot };
export default EmbedScript;