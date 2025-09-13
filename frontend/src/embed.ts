// frontend/src/embed.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import ChatbotWidget from './components/ChatbotWidget';
import './index.css'; // Import your main stylesheet

// Find the script tag that loaded this script.
// This is more robust than document.currentScript.
const scriptTag = document.querySelector('script[src*="embed.js"]');

if (scriptTag) {
  // Extract data attributes from the script tag
  const institutionId = scriptTag.getAttribute('data-institution-id');
  const primaryColor = scriptTag.getAttribute('data-theme-color') || '#3B82F6';
  const position = (scriptTag.getAttribute('data-position') as 'bottom-right' | 'bottom-left') || 'bottom-right';
  const language = (scriptTag.getAttribute('data-language') as 'en' | 'hi' | 'local') || 'en';

  // Create a div to mount the chatbot widget
  const app = document.createElement('div');
  app.id = 'campus-assistant-widget-container';
  document.body.appendChild(app);

  // Render the ChatbotWidget into the created div
  const root = ReactDOM.createRoot(app);
  root.render(
    <React.StrictMode>
      <ChatbotWidget
        isEmbedded={true}
        institutionId={institutionId}
        position={position}
        primaryColor={primaryColor}
        language={language}
      />
    </React.StrictMode>
  );
} else {
  console.error("Campus Assistant: Could not find the embed script tag.");
}
