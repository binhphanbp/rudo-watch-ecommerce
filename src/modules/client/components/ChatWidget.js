/**
 * AI Chat Widget Component
 * Chat widget đẹp, responsive với AI Gemini
 */

import ChatbotService from '../../../shared/services/chatbot.js';

class ChatWidget {
  constructor() {
    this.isOpen = false;
    this.isTyping = false;
    this.messages = [];
    this.initWidget();
    this.loadWelcomeMessage();
  }

  /**
   * Khởi tạo widget HTML
   */
  initWidget() {
    const widgetHTML = `
      <!-- Chat Widget Button -->
      <button 
        id="chat-widget-btn" 
        class="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-[#0A2A45] to-[#0d3557] text-white rounded-full shadow-2xl hover:scale-110 transition-transform duration-300 z-50 flex items-center justify-center group"
        aria-label="Open chat"
      >
        <svg class="w-7 h-7 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center animate-pulse" id="chat-unread-badge" style="display: none;">1</span>
      </button>

      <!-- Chat Window -->
      <div 
        id="chat-widget-window" 
        class="fixed bottom-24 right-6 w-[380px] h-[600px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-300 transform scale-0 origin-bottom-right"
        style="display: none;"
      >
        <!-- Header -->
        <div class="bg-gradient-to-r from-[#0A2A45] to-[#0d3557] p-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="relative">
              <div class="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span class="text-2xl">🤖</span>
              </div>
              <span class="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-blue-700 rounded-full"></span>
            </div>
            <div>
              <h3 class="text-white font-bold text-sm">Rudo Assistant</h3>
              <p class="text-blue-100 text-xs">Trợ lý AI</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button 
              id="chat-refresh-btn" 
              class="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              title="Làm mới cuộc trò chuyện"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button 
              id="chat-close-btn" 
              class="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Messages Container -->
        <div 
          id="chat-messages" 
          class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-slate-800"
        >
          <!-- Messages will be appended here -->
        </div>

        <!-- Typing Indicator -->
        <div id="typing-indicator" class="px-4 py-2 hidden">
          <div class="flex items-center gap-2 text-gray-500 text-sm">
            <div class="flex gap-1">
              <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
              <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
              <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
            </div>
            <span>AI đang suy nghĩ...</span>
          </div>
        </div>

        <!-- Quick Replies -->
        <div id="quick-replies" class="px-4 py-2 flex gap-2 overflow-x-auto bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700" style="display: none;">
          <!-- Quick reply buttons will be appended here -->
        </div>

        <!-- Input Area -->
        <div class="p-4 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700">
          <form id="chat-form" class="flex gap-2">
            <input 
              type="text" 
              id="chat-input" 
              placeholder="Nhập tin nhắn..." 
              class="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              autocomplete="off"
            />
            <button 
              type="submit" 
              class="px-4 py-3 bg-[#0A2A45] hover:bg-[#0d3557] text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              id="chat-send-btn"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
          <p class="text-xs text-gray-400 mt-2 text-center">Powered by Google Gemini ✨</p>
        </div>
      </div>
    `;

    // Append to body
    document.body.insertAdjacentHTML('beforeend', widgetHTML);

    // Bind events
    this.bindEvents();
  }

  /**
   * Bind các events
   */
  bindEvents() {
    const btn = document.getElementById('chat-widget-btn');
    const closeBtn = document.getElementById('chat-close-btn');
    const refreshBtn = document.getElementById('chat-refresh-btn');
    const form = document.getElementById('chat-form');

    btn.addEventListener('click', () => this.toggleWidget());
    closeBtn.addEventListener('click', () => this.closeWidget());
    refreshBtn.addEventListener('click', () => this.refreshConversation());
    form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  /**
   * Toggle widget
   */
  toggleWidget() {
    this.isOpen = !this.isOpen;
    const window = document.getElementById('chat-widget-window');

    if (this.isOpen) {
      window.style.display = 'flex';
      setTimeout(() => {
        window.classList.remove('scale-0');
        window.classList.add('scale-100');
      }, 10);
      document.getElementById('chat-input').focus();
      this.hideUnreadBadge();
    } else {
      this.closeWidget();
    }
  }

  /**
   * Đóng widget
   */
  closeWidget() {
    this.isOpen = false;
    const window = document.getElementById('chat-widget-window');
    window.classList.remove('scale-100');
    window.classList.add('scale-0');
    setTimeout(() => {
      window.style.display = 'none';
    }, 300);
  }

  /**
   * Load welcome message
   */
  loadWelcomeMessage() {
    const welcomeMsg = `Xin chào! 👋 Tôi là trợ lý AI của Rudo Watch. 
    
Tôi có thể giúp bạn:
⌚ Tư vấn chọn đồng hồ phù hợp
💎 Giới thiệu sản phẩm mới
🔍 Tra cứu đơn hàng
📦 Hướng dẫn mua hàng

Bạn cần hỗ trợ gì?`;

    this.addMessage('bot', welcomeMsg);
    this.showQuickReplies();
  }

  /**
   * Thêm message vào chat
   */
  addMessage(type, text) {
    const container = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `flex ${
      type === 'user' ? 'justify-end' : 'justify-start'
    } animate-fade-in`;

    const time = new Date().toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    messageDiv.innerHTML = `
      <div class="max-w-[80%] ${type === 'user' ? 'order-2' : 'order-1'}">
        <div class="${
          type === 'user'
            ? 'bg-[#0A2A45] text-white'
            : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white'
        } rounded-2xl px-4 py-3 shadow-sm">
          <p class="text-sm whitespace-pre-line">${this.escapeHtml(text)}</p>
        </div>
        <p class="text-xs text-gray-400 mt-1 ${
          type === 'user' ? 'text-right' : 'text-left'
        }">${time}</p>
      </div>
      ${
        type === 'bot'
          ? `
        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-[#0A2A45] to-[#0d3557] flex items-center justify-center text-white text-sm order-2 ml-2 flex-shrink-0">
          🤖
        </div>
      `
          : ''
      }
    `;

    container.appendChild(messageDiv);
    this.scrollToBottom();

    // Store message
    this.messages.push({ type, text, time });
  }

  /**
   * Show quick replies
   */
  showQuickReplies() {
    const container = document.getElementById('quick-replies');
    const replies = ChatbotService.getWelcomeMessages();

    container.innerHTML = replies
      .map(
        (reply) => `
      <button 
        class="px-4 py-2 bg-[#0A2A45]/10 dark:bg-slate-800 text-[#0A2A45] dark:text-blue-400 rounded-full text-xs whitespace-nowrap hover:bg-[#0A2A45]/20 dark:hover:bg-slate-700 transition-colors"
        onclick="window.chatWidget.sendQuickReply('${reply}')"
      >
        ${reply}
      </button>
    `
      )
      .join('');

    container.style.display = 'flex';
  }

  /**
   * Send quick reply
   */
  sendQuickReply(text) {
    document.getElementById('chat-input').value = text;
    document.getElementById('chat-form').dispatchEvent(new Event('submit'));
  }

  /**
   * Handle form submit
   */
  async handleSubmit(e) {
    e.preventDefault();

    console.log('💬 Chat form submitted');

    const input = document.getElementById('chat-input');
    const message = input.value.trim();

    console.log('📝 User message:', message);

    if (!message || this.isTyping) {
      console.warn('⚠️ Empty message or already typing');
      return;
    }

    // Hide quick replies
    document.getElementById('quick-replies').style.display = 'none';

    // Add user message
    this.addMessage('user', message);
    input.value = '';

    // Show typing indicator
    this.showTyping();

    try {
      console.log('🤖 Calling ChatbotService...');
      // Get AI response
      const response = await ChatbotService.sendMessage(message);

      console.log('✅ Got response:', response);

      // Hide typing and show response
      this.hideTyping();
      this.addMessage('bot', response);
    } catch (error) {
      console.error('❌ Error in handleSubmit:', error);
      this.hideTyping();
      this.addMessage(
        'bot',
        'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại! 🙏'
      );
    }
  }

  /**
   * Show typing indicator
   */
  showTyping() {
    this.isTyping = true;
    document.getElementById('typing-indicator').classList.remove('hidden');
    document.getElementById('chat-send-btn').disabled = true;
    this.scrollToBottom();
  }

  /**
   * Hide typing indicator
   */
  hideTyping() {
    this.isTyping = false;
    document.getElementById('typing-indicator').classList.add('hidden');
    document.getElementById('chat-send-btn').disabled = false;
  }

  /**
   * Scroll to bottom
   */
  scrollToBottom() {
    const container = document.getElementById('chat-messages');
    setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, 100);
  }

  /**
   * Refresh conversation
   */
  refreshConversation() {
    if (confirm('Bạn muốn bắt đầu cuộc trò chuyện mới?')) {
      ChatbotService.resetConversation();
      this.messages = [];
      document.getElementById('chat-messages').innerHTML = '';
      this.loadWelcomeMessage();
    }
  }

  /**
   * Show unread badge
   */
  showUnreadBadge() {
    if (!this.isOpen) {
      document.getElementById('chat-unread-badge').style.display = 'flex';
    }
  }

  /**
   * Hide unread badge
   */
  hideUnreadBadge() {
    document.getElementById('chat-unread-badge').style.display = 'none';
  }

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize widget on page load
let chatWidgetInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Initializing Chat Widget...');
  console.log('🔍 Checking environment variables:');
  console.log(
    '   - VITE_GEMINI_API_KEY:',
    import.meta.env.VITE_GEMINI_API_KEY ? '✅ Exists' : '❌ Not found'
  );

  chatWidgetInstance = new ChatWidget();
  window.chatWidget = chatWidgetInstance; // Global access

  console.log('✅ Chat Widget initialized successfully');
});

export default ChatWidget;
