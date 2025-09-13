(function() {
  'use strict';
  
  // Configuration from data attributes
  function getConfig() {
    const scripts = document.querySelectorAll('script[src*="embed.js"]');
    const currentScript = scripts[scripts.length - 1];
    
    return {
      themeColor: currentScript.getAttribute('data-theme-color') || '#3B82F6',
      position: currentScript.getAttribute('data-position') || 'bottom-right',
      language: currentScript.getAttribute('data-language') || 'en'
    };
  }

  // Create and inject the chatbot widget
  function initChatbot() {
    const config = getConfig();
    
    // Create container
    const container = document.createElement('div');
    container.id = 'campus-assistant-widget';
    container.style.cssText = `
      position: fixed;
      z-index: 10000;
      ${config.position.includes('right') ? 'right: 24px;' : 'left: 24px;'}
      bottom: 24px;
    `;
    
    // Create chatbot button
    const button = document.createElement('button');
    button.style.cssText = `
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background-color: ${config.themeColor};
      border: none;
      cursor: pointer;
      box-shadow: 0 8px 30px -4px rgba(0,0,0,0.15);
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    `;
    
    button.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    `;
    
    // Create chat widget (initially hidden)
    const chatWidget = document.createElement('div');
    chatWidget.style.cssText = `
      position: absolute;
      bottom: 70px;
      ${config.position.includes('right') ? 'right: 0;' : 'left: 0;'}
      width: 320px;
      height: 400px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 30px -4px rgba(0,0,0,0.15);
      display: none;
      flex-direction: column;
      border: 1px solid #e5e7eb;
    `;
    
    // Chat header
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 16px;
      border-bottom: 1px solid #e5e7eb;
      background: linear-gradient(180deg, #ffffff, #f8fafc);
      border-radius: 12px 12px 0 0;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    
    header.innerHTML = `
      <div style="width: 32px; height: 32px; border-radius: 50%; background: ${config.themeColor}; display: flex; align-items: center; justify-content: center; color: white;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
      <div>
        <h3 style="margin: 0; font-size: 14px; font-weight: 600; color: #1f2937;">Campus Assistant</h3>
        <p style="margin: 0; font-size: 12px; color: #6b7280;">Online</p>
      </div>
    `;
    
    // Messages area
    const messages = document.createElement('div');
    messages.style.cssText = `
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    `;
    
    // Welcome message
    const welcomeMessage = document.createElement('div');
    welcomeMessage.style.cssText = `
      background: #f3f4f6;
      color: #374151;
      padding: 12px;
      border-radius: 12px;
      border-bottom-left-radius: 4px;
      max-width: 80%;
      font-size: 14px;
      line-height: 1.4;
    `;
    
    const welcomeTexts = {
      en: 'Hello! I\'m your Campus Assistant. How can I help you today?',
      hi: 'नमस्ते! मैं आपका कैंपस असिस्टेंट हूं। आप मुझसे कोई भी सवाल पूछ सकते हैं।',
      local: 'Hello! I\'m your Campus Assistant. How can I help you today?'
    };
    
    welcomeMessage.textContent = welcomeTexts[config.language] || welcomeTexts.en;
    messages.appendChild(welcomeMessage);
    
    // Input area
    const inputArea = document.createElement('div');
    inputArea.style.cssText = `
      padding: 16px;
      border-top: 1px solid #e5e7eb;
      background: linear-gradient(180deg, #ffffff, #f8fafc);
      border-radius: 0 0 12px 12px;
      display: flex;
      gap: 8px;
    `;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = config.language === 'hi' ? 'अपना सवाल लिखें...' : 'Type your question...';
    input.style.cssText = `
      flex: 1;
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
    `;
    
    const sendButton = document.createElement('button');
    sendButton.style.cssText = `
      width: 40px;
      height: 40px;
      background: ${config.themeColor};
      border: none;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    `;
    
    sendButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
      </svg>
    `;
    
    // Event handlers
    let isOpen = false;
    
    button.addEventListener('click', () => {
      isOpen = !isOpen;
      chatWidget.style.display = isOpen ? 'flex' : 'none';
      button.style.transform = isOpen ? 'scale(0.9)' : 'scale(1)';
    });
    
    function sendMessage() {
      const message = input.value.trim();
      if (!message) return;
      
      // Add user message
      const userMsg = document.createElement('div');
      userMsg.style.cssText = `
        background: ${config.themeColor};
        color: white;
        padding: 12px;
        border-radius: 12px;
        border-bottom-right-radius: 4px;
        max-width: 80%;
        align-self: flex-end;
        font-size: 14px;
        line-height: 1.4;
      `;
      userMsg.textContent = message;
      messages.appendChild(userMsg);
      
      input.value = '';
      
      // Auto-scroll
      messages.scrollTop = messages.scrollHeight;
      
      // Simulate bot response
      setTimeout(() => {
        const botMsg = document.createElement('div');
        botMsg.style.cssText = `
          background: #f3f4f6;
          color: #374151;
          padding: 12px;
          border-radius: 12px;
          border-bottom-left-radius: 4px;
          max-width: 80%;
          font-size: 14px;
          line-height: 1.4;
        `;
        
        const responses = {
          en: [
            "I'd be happy to help you with that! Let me check our campus resources.",
            "That's a great question! Here's what I found in our student handbook.",
            "I can assist you with campus information. Would you like me to connect you with the right department?"
          ],
          hi: [
            "मैं इसमें आपकी मदद कर सकता हूं! मुझे कैंपस संसाधन चेक करने दें।",
            "यह एक बहुत अच्छा सवाल है! यहां वह है जो मुझे छात्र पुस्तिका में मिला।"
          ]
        };
        
        const langResponses = responses[config.language] || responses.en;
        botMsg.textContent = langResponses[Math.floor(Math.random() * langResponses.length)];
        
        messages.appendChild(botMsg);
        messages.scrollTop = messages.scrollHeight;
      }, 1000);
    }
    
    sendButton.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
    
    // Assemble widget
    inputArea.appendChild(input);
    inputArea.appendChild(sendButton);
    
    chatWidget.appendChild(header);
    chatWidget.appendChild(messages);
    chatWidget.appendChild(inputArea);
    
    container.appendChild(button);
    container.appendChild(chatWidget);
    
    document.body.appendChild(container);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
  } else {
    initChatbot();
  }
})();