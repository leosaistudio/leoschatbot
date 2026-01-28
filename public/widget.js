/**
 * ChatBot AI Widget
 * Embeddable chat widget for websites
 * 
 * Usage:
 * <script src="https://your-domain.com/widget.js" data-bot-id="BOT_ID"></script>
 */

(function () {
  'use strict';

  // Get configuration from script tag
  const script = document.currentScript;
  const botId = script?.getAttribute('data-bot-id');
  const apiUrl = script?.src.replace('/widget.js', '');

  if (!botId) {
    console.error('ChatBot Widget: Missing data-bot-id attribute');
    return;
  }

  // Styles
  const styles = `
    #chatbot-widget-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      direction: rtl;
    }
    
    #chatbot-widget-container.left {
      right: auto;
      left: 20px;
    }

    #chatbot-toggle-btn {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
      background: linear-gradient(135deg, #8B5CF6, #EC4899);
    }

    #chatbot-toggle-btn:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 25px rgba(0, 0, 0, 0.2);
    }

    #chatbot-toggle-btn svg {
      width: 28px;
      height: 28px;
      fill: white;
    }

    #chatbot-window {
      display: none;
      position: absolute;
      bottom: 80px;
      right: 0;
      width: 380px;
      height: 550px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      flex-direction: column;
    }

    #chatbot-window.open {
      display: flex;
    }

    #chatbot-header {
      padding: 16px 20px;
      background: linear-gradient(135deg, #8B5CF6, #EC4899);
      color: white;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    #chatbot-header-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    #chatbot-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }

    #chatbot-header-text h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }

    #chatbot-header-text p {
      margin: 2px 0 0;
      font-size: 12px;
      opacity: 0.9;
    }

    #chatbot-close-btn {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      transition: background 0.2s;
    }

    #chatbot-close-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    #chatbot-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .chatbot-message {
      max-width: 85%;
      padding: 12px 16px;
      border-radius: 16px;
      line-height: 1.6;
      font-size: 14px;
      animation: messageIn 0.3s ease;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    @keyframes messageIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .chatbot-message.bot {
      align-self: flex-start;
      background: #F3F4F6;
      color: #1F2937;
      border-bottom-right-radius: 4px;
    }

    .chatbot-message.user {
      align-self: flex-end;
      background: linear-gradient(135deg, #8B5CF6, #A855F7);
      color: white;
      border-bottom-left-radius: 4px;
    }

    .chatbot-message.typing {
      display: flex;
      gap: 4px;
      padding: 16px;
    }

    .chatbot-message.typing span {
      width: 8px;
      height: 8px;
      background: #9CA3AF;
      border-radius: 50%;
      animation: typing 1.4s infinite;
    }

    .chatbot-message.typing span:nth-child(2) { animation-delay: 0.2s; }
    .chatbot-message.typing span:nth-child(3) { animation-delay: 0.4s; }

    @keyframes typing {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-8px); }
    }

    #chatbot-suggestions {
      padding: 8px 16px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .chatbot-suggestion {
      padding: 8px 14px;
      border: 1px solid #E5E7EB;
      border-radius: 20px;
      background: white;
      color: #6B7280;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .chatbot-suggestion:hover {
      border-color: #8B5CF6;
      color: #8B5CF6;
      background: #F5F3FF;
    }

    #chatbot-input-area {
      padding: 16px;
      border-top: 1px solid #E5E7EB;
      display: flex;
      gap: 10px;
      align-items: center;
    }

    #chatbot-image-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 1px solid #E5E7EB;
      background: white;
      color: #6B7280;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    #chatbot-image-btn:hover {
      border-color: #8B5CF6;
      color: #8B5CF6;
      background: #F5F3FF;
    }

    #chatbot-image-btn svg {
      width: 20px;
      height: 20px;
    }

    #chatbot-image-input {
      display: none;
    }

    .chatbot-image-preview {
      max-width: 200px;
      max-height: 150px;
      border-radius: 12px;
      margin-bottom: 8px;
    }

    #chatbot-input {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid #E5E7EB;
      border-radius: 24px;
      outline: none;
      font-size: 14px;
      transition: border-color 0.2s;
    }

    #chatbot-input:focus {
      border-color: #8B5CF6;
    }

    #chatbot-send-btn {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: none;
      background: linear-gradient(135deg, #8B5CF6, #EC4899);
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s;
    }

    #chatbot-send-btn:hover {
      transform: scale(1.05);
    }

    #chatbot-send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    #chatbot-send-btn svg {
      width: 20px;
      height: 20px;
      transform: scaleX(-1);
    }

    #chatbot-branding {
      padding: 8px;
      text-align: center;
      font-size: 11px;
      color: #9CA3AF;
      border-top: 1px solid #F3F4F6;
    }

    #chatbot-branding a {
      color: #8B5CF6;
      text-decoration: none;
    }

    /* Link styling for product links */
    .chatbot-link {
      display: inline-block;
      color: #8B5CF6 !important;
      text-decoration: underline !important;
      font-weight: 600;
      cursor: pointer;
      margin: 4px 0;
      padding: 4px 8px;
      background: rgba(139, 92, 246, 0.1);
      border-radius: 6px;
      transition: all 0.2s;
    }

    .chatbot-link:hover {
      background: rgba(139, 92, 246, 0.2);
      color: #7C3AED !important;
    }

    /* Lead Collection Form Styles */
    .chatbot-lead-form {
      background: linear-gradient(135deg, #F0F9FF, #E0F2FE);
      border: 1px solid #BAE6FD;
      border-radius: 12px;
      padding: 16px;
      margin: 8px 16px;
    }

    .chatbot-lead-form p {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: #0369A1;
      line-height: 1.5;
    }

    .chatbot-lead-form input {
      width: 100%;
      padding: 10px 12px;
      margin-bottom: 8px;
      border: 1px solid #E0E7FF;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
      box-sizing: border-box;
    }

    .chatbot-lead-form input:focus {
      border-color: #8B5CF6;
    }

    .chatbot-lead-form button {
      width: 100%;
      padding: 12px;
      background: linear-gradient(135deg, #8B5CF6, #EC4899);
      border: none;
      border-radius: 8px;
      color: white;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      margin-top: 4px;
    }

    .chatbot-lead-form button:hover {
      opacity: 0.9;
    }

    .chatbot-lead-skip {
      text-align: center;
      margin-top: 8px;
    }

    .chatbot-lead-skip a {
      color: #6B7280;
      font-size: 12px;
      text-decoration: none;
      cursor: pointer;
    }

    .chatbot-lead-skip a:hover {
      color: #8B5CF6;
    }
  `;

  // Inject styles
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);

  // State
  let config = null;
  let conversationId = null;
  let visitorId = localStorage.getItem('chatbot_visitor_id') || generateId();
  localStorage.setItem('chatbot_visitor_id', visitorId);

  // Lead collection state - check if already collected in this session
  let leadCollected = localStorage.getItem('chatbot_lead_collected_' + botId) === 'true';

  function generateId() {
    return 'v_' + Math.random().toString(36).substr(2, 9);
  }

  // Load configuration
  async function loadConfig() {
    try {
      const res = await fetch(`${apiUrl}/api/widget/config?botId=${botId}`);
      if (!res.ok) throw new Error('Failed to load config');
      config = await res.json();
      applyConfig();
    } catch (error) {
      console.error('ChatBot Widget: Failed to load config', error);
    }
  }

  function applyConfig() {
    if (!config) return;

    const container = document.getElementById('chatbot-widget-container');
    if (config.position === 'bottom-left') {
      container.classList.add('left');
    }

    // Apply primary color
    if (config.primaryColor) {
      document.documentElement.style.setProperty('--chatbot-primary', config.primaryColor);
    }

    // Apply avatar
    if (config.avatarUrl) {
      const avatar = document.getElementById('chatbot-avatar');
      const toggleBtn = document.getElementById('chatbot-toggle-btn');

      // Update header avatar
      if (avatar) {
        avatar.innerHTML = `<img src="${config.avatarUrl}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
        avatar.style.background = 'transparent';
      }

      // Update toggle button
      if (toggleBtn) {
        toggleBtn.innerHTML = `<img src="${config.avatarUrl}" alt="Open Chat" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
        toggleBtn.style.background = config.primaryColor || '#8B5CF6';
        toggleBtn.style.padding = '0';
        toggleBtn.style.overflow = 'hidden';
      }
    }

    // Apply bot name
    if (config.name) {
      const headerText = document.querySelector('#chatbot-header-text h3');
      if (headerText) {
        headerText.textContent = config.name;
      }
    }

    // Show welcome message
    if (config.welcomeMessage) {
      addMessage(config.welcomeMessage, 'bot');
    }

    // Show suggested questions
    if (config.suggestedQuestions && config.suggestedQuestions.length > 0) {
      showSuggestions(config.suggestedQuestions);
    }
  }

  // Create widget HTML
  function createWidget() {
    const container = document.createElement('div');
    container.id = 'chatbot-widget-container';
    container.innerHTML = `
      <div id="chatbot-window">
        <div id="chatbot-header">
          <div id="chatbot-header-info">
            <div id="chatbot-avatar">🤖</div>
            <div id="chatbot-header-text">
              <h3>עוזר וירטואלי</h3>
              <p>🟢 מחובר</p>
            </div>
          </div>
          <button id="chatbot-close-btn">✕</button>
        </div>
        <div id="chatbot-messages"></div>
        <div id="chatbot-suggestions"></div>
        <div id="chatbot-input-area">
          <input type="file" id="chatbot-image-input" accept="image/*" />
          <button id="chatbot-image-btn" title="העלה תמונה">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21,15 16,10 5,21"/>
            </svg>
          </button>
          <input type="text" id="chatbot-input" placeholder="הקלד הודעה..." />
          <button id="chatbot-send-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" />
            </svg>
          </button>
        </div>
        <div id="chatbot-branding">
          מופעל על ידי <a href="#" target="_blank">ChatBot AI</a>
        </div>
      </div>
      <button id="chatbot-toggle-btn">
        <svg viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
        </svg>
      </button>
    `;
    document.body.appendChild(container);

    // Event listeners
    document.getElementById('chatbot-toggle-btn').addEventListener('click', toggleChat);
    document.getElementById('chatbot-close-btn').addEventListener('click', toggleChat);
    document.getElementById('chatbot-send-btn').addEventListener('click', sendMessage);
    document.getElementById('chatbot-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });

    // Image upload handlers
    document.getElementById('chatbot-image-btn').addEventListener('click', () => {
      document.getElementById('chatbot-image-input').click();
    });

    document.getElementById('chatbot-image-input').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        pendingImage = file;
        // Show preview
        addImagePreview(file);
        // Auto-send with default search message
        setTimeout(() => {
          document.getElementById('chatbot-input').value = 'חפש לי את המוצר הזה';
          sendMessage();
        }, 500);
      }
    });
  }

  let pendingImage = null;

  function addImagePreview(file) {
    const messagesContainer = document.getElementById('chatbot-messages');
    const reader = new FileReader();
    reader.onload = (e) => {
      const div = document.createElement('div');
      div.className = 'chatbot-message user';
      div.innerHTML = `<img src="${e.target.result}" class="chatbot-image-preview" alt="תמונה שהועלתה" />`;
      messagesContainer.appendChild(div);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };
    reader.readAsDataURL(file);
  }

  let chatFirstOpened = false;

  function toggleChat() {
    const chatWindow = document.getElementById('chatbot-window');
    chatWindow.classList.toggle('open');
    if (chatWindow.classList.contains('open')) {
      document.getElementById('chatbot-input').focus();

      // Show lead form on first open (after welcome message)
      if (!chatFirstOpened) {
        chatFirstOpened = true;
        setTimeout(() => {
          showLeadForm();
        }, 500); // Small delay after welcome message
      }
    }
  }

  function addMessage(text, sender) {
    const messagesContainer = document.getElementById('chatbot-messages');
    const div = document.createElement('div');
    div.className = `chatbot-message ${sender}`;

    // Step 1: Extract all URLs from the text (even if wrapped in broken HTML)
    const urlPattern = /https?:\/\/[^\s"<>\)]+/g;
    const foundUrls = text.match(urlPattern) || [];

    // Step 2: Clean up the text - remove broken HTML artifacts
    let cleanText = text
      // Remove broken <a> tag fragments
      .replace(/<a\s[^>]*>/gi, '')
      .replace(/<\/a>/gi, '')
      // Remove orphaned HTML attributes
      .replace(/target="_blank"[^>]*/g, '')
      .replace(/rel="noopener"[^>]*/g, '')
      .replace(/style="[^"]*"/g, '')
      // Remove any remaining HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove "לחצו כאן לרכישה 🛒" duplicates from broken links
      .replace(/(לחצו כאן לרכישה 🛒\s*)+/g, '')
      // Clean up excessive whitespace
      .replace(/\s+/g, ' ')
      .trim();

    // Step 3: Convert Markdown links [text](url) to clickable HTML
    let htmlText = cleanText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
      return `<a href="${url}" target="_blank" rel="noopener" class="chatbot-link">🔗 ${linkText}</a>`;
    });

    // Step 4: Convert any remaining raw URLs to clickable links
    htmlText = htmlText.replace(/(https?:\/\/[^\s<\)]+)/g, (url) => {
      // Clean URL of any trailing punctuation
      const cleanUrl = url.replace(/[,.\s]+$/, '');
      return `<a href="${cleanUrl}" target="_blank" rel="noopener" class="chatbot-link">🔗 לעמוד המוצר</a>`;
    });

    div.innerHTML = htmlText;
    messagesContainer.appendChild(div);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Show lead collection form after welcome message
  function showLeadForm() {
    if (leadCollected) return;

    const messagesContainer = document.getElementById('chatbot-messages');
    const formDiv = document.createElement('div');
    formDiv.id = 'chatbot-lead-form-container';
    formDiv.className = 'chatbot-lead-form';
    formDiv.innerHTML = `
      <p>😊 לפני שנמשיך, נשמח לקבל את פרטיך כדי שנוכל לחזור אליך במידה והשיחה תיקטע או שתרצה לקבל מידע נוסף מאיתנו.</p>
      <input type="text" id="lead-name" placeholder="שם מלא" required>
      <input type="tel" id="lead-phone" placeholder="טלפון" dir="ltr">
      <input type="email" id="lead-email" placeholder="אימייל" dir="ltr">
      <button type="button" id="lead-submit-btn">המשך לשיחה</button>
      <div class="chatbot-lead-skip">
        <a id="lead-skip-btn">דלג והמשך ▶</a>
      </div>
    `;
    messagesContainer.appendChild(formDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Handle form submission
    document.getElementById('lead-submit-btn').addEventListener('click', submitLeadForm);
    document.getElementById('lead-skip-btn').addEventListener('click', skipLeadForm);
  }

  async function submitLeadForm() {
    const name = document.getElementById('lead-name').value.trim();
    const phone = document.getElementById('lead-phone').value.trim();
    const email = document.getElementById('lead-email').value.trim();

    if (!name) {
      alert('אנא הזן את שמך');
      return;
    }

    if (!phone && !email) {
      alert('אנא הזן טלפון או אימייל');
      return;
    }

    try {
      // Submit lead to API
      await fetch(`${apiUrl}/api/widget/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botId,
          visitorId,
          name,
          phone,
          email,
          pageUrl: window.location.href,
        }),
      });

      // Mark as collected
      leadCollected = true;
      localStorage.setItem('chatbot_lead_collected_' + botId, 'true');

      // Remove form and show thank you
      hideLeadForm();
      addMessage(`תודה ${name}! נשמח לעזור לך 🎉`, 'bot');

      // Show suggestions if available
      if (config?.suggestedQuestions?.length > 0) {
        showSuggestions(config.suggestedQuestions);
      }
    } catch (error) {
      console.error('Lead submit error:', error);
      hideLeadForm();
    }
  }

  function skipLeadForm() {
    leadCollected = true;
    localStorage.setItem('chatbot_lead_collected_' + botId, 'true');
    hideLeadForm();
    addMessage('אין בעיה! במה אוכל לעזור לך? 🙂', 'bot');

    if (config?.suggestedQuestions?.length > 0) {
      showSuggestions(config.suggestedQuestions);
    }
  }

  function hideLeadForm() {
    const form = document.getElementById('chatbot-lead-form-container');
    if (form) form.remove();
  }

  function showTyping() {
    const messagesContainer = document.getElementById('chatbot-messages');
    const div = document.createElement('div');
    div.id = 'chatbot-typing';
    div.className = 'chatbot-message bot typing';
    div.innerHTML = '<span></span><span></span><span></span>';
    messagesContainer.appendChild(div);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function hideTyping() {
    const typing = document.getElementById('chatbot-typing');
    if (typing) typing.remove();
  }

  function showSuggestions(questions) {
    const container = document.getElementById('chatbot-suggestions');
    container.innerHTML = questions.map(q =>
      `<button class="chatbot-suggestion">${q}</button>`
    ).join('');

    container.querySelectorAll('.chatbot-suggestion').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('chatbot-input').value = btn.textContent;
        sendMessage();
        container.innerHTML = '';
      });
    });
  }

  // Track last message time for polling
  let lastPollTime = Date.now();
  let isHumanTakeover = false;
  let pollingInterval = null;

  // Start polling for new messages
  function startPolling() {
    if (pollingInterval) return;
    console.log('ChatBot Widget: Starting polling');
    pollingInterval = setInterval(pollMessages, 2000); // Poll every 2 seconds
  }

  function stopPolling() {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
      console.log('ChatBot Widget: Stopped polling');
    }
  }

  async function pollMessages() {
    if (!conversationId) return;

    try {
      const url = `${apiUrl}/api/widget/messages?conversationId=${conversationId}&afterTime=${lastPollTime}`;
      const res = await fetch(url);
      if (!res.ok) return;

      const data = await res.json();

      // Update human takeover status
      const wasHumanTakeover = isHumanTakeover;
      isHumanTakeover = data.humanTakeover;

      // If just switched to human takeover, show the system message
      if (!wasHumanTakeover && isHumanTakeover) {
        addMessage('👋 נציג אנושי הצטרף לשיחה. אנא המתן לתשובה...', 'bot');
      }

      // Show new messages from human agent or bot
      if (data.messages && data.messages.length > 0) {
        data.messages.forEach(msg => {
          // Only show if it's an assistant message
          if (msg.role === 'assistant') {
            // Don't show system messages again if already shown
            if (!msg.content.startsWith('👋 נציג אנושי')) {
              addMessage(msg.content, 'bot');
            }
          }
          // Update the poll time to after this message
          const msgTime = new Date(msg.createdAt).getTime();
          if (msgTime > lastPollTime) {
            lastPollTime = msgTime;
          }
        });
      }
    } catch (error) {
      console.error('ChatBot Widget: Poll error', error);
    }
  }

  async function sendMessage() {
    const input = document.getElementById('chatbot-input');
    const message = input.value.trim();

    // Require message or image
    if (!message && !pendingImage) return;

    // Clear input
    input.value = '';

    // Clear suggestions
    document.getElementById('chatbot-suggestions').innerHTML = '';

    // Show user message if there's text
    if (message) {
      addMessage(message, 'user');
    }

    // Show typing indicator (only if not in human takeover)
    if (!isHumanTakeover) {
      showTyping();
    }

    try {
      // Convert image to base64 if exists
      let imageBase64 = null;
      if (pendingImage) {
        imageBase64 = await fileToBase64(pendingImage);
        pendingImage = null;
        document.getElementById('chatbot-image-input').value = '';
      }

      const res = await fetch(`${apiUrl}/api/widget/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botId,
          visitorId,
          message: message || 'מה זה במידע שיש לך?',
          conversationId,
          pageUrl: window.location.href,
          image: imageBase64,
        }),
      });

      hideTyping();

      if (!res.ok) throw new Error('Failed to send message');

      const data = await res.json();
      conversationId = data.conversationId;

      // Check if human takeover
      if (data.humanTakeover) {
        isHumanTakeover = true;
        // Start polling only for human takeover mode
        startPolling();
      } else if (data.response) {
        // AI responded - show the message
        addMessage(data.response, 'bot');
        // Update poll time to now to prevent duplicates
        lastPollTime = Date.now();
        isHumanTakeover = false;
      }

      // Always start polling after conversation is established
      // This ensures we catch human takeover from dashboard
      if (conversationId && !pollingInterval) {
        startPolling();
      }
    } catch (error) {
      hideTyping();
      addMessage('מצטער, אירעה שגיאה. נסה שוב.', 'bot');
      console.error('ChatBot Widget: Send message error', error);
    }
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Initialize
  createWidget();
  loadConfig();
})();
