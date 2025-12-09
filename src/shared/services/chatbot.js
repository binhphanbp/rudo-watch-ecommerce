/**
 * AI Chatbot Service - Gemini Integration
 * Tích hợp Google Gemini API để tạo chatbot hỗ trợ khách hàng
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
// Gemini 1.5 Flash - Model name chính xác cho v1beta
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// Context về cửa hàng đồng hồ
const SHOP_CONTEXT = `
Bạn là trợ lý AI thông minh của Rudo Watch - cửa hàng đồng hồ cao cấp tại Việt Nam.

THÔNG TIN CỬA HÀNG:
- Tên: Rudo Watch
- Chuyên: Đồng hồ nam, đồng hồ nữ cao cấp
- Thương hiệu: Rolex, Omega, Casio, Citizen, Seiko, Tissot, v.v.
- Website: rudowatch.com
- Hotline: 1900 xxxx (giả định)

NHIỆM VỤ:
1. Tư vấn sản phẩm đồng hồ (thiết kế, tính năng, giá cả)
2. Hướng dẫn mua hàng, thanh toán
3. Giải đáp chính sách đổi trả, bảo hành
4. Hỗ trợ tra cứu đơn hàng
5. Gợi ý đồng hồ phù hợp với nhu cầu khách hàng

PHONG CÁCH:
- Thân thiện, chuyên nghiệp
- Ngắn gọn, súc tích (tối đa 3-4 câu)
- Dùng emoji phù hợp (⌚ 💎 ✨)
- Luôn hỏi lại nếu không rõ yêu cầu

CHÚ Ý:
- KHÔNG trả lời về chủ đề ngoài đồng hồ/mua sắm
- KHÔNG đưa ra thông tin giá chính xác (nói "vui lòng xem trên website")
- Nếu không biết: "Để tôi chuyển cho chuyên viên tư vấn hỗ trợ bạn nhé!"
`;

class ChatbotService {
  constructor() {
    this.conversationHistory = [];
    this.maxHistoryLength = 10; // Giữ 10 tin nhắn gần nhất
  }

  /**
   * Gửi tin nhắn đến Gemini API
   * @param {string} userMessage - Tin nhắn từ user
   * @returns {Promise<string>} - Phản hồi từ AI
   */
  async sendMessage(userMessage) {
    try {
      console.log('🔑 Checking API key...');
      console.log('API Key exists:', !!GEMINI_API_KEY);
      console.log('API Key length:', GEMINI_API_KEY?.length || 0);
      console.log('API Key prefix:', GEMINI_API_KEY?.substring(0, 10) || 'empty');
      
      if (!GEMINI_API_KEY) {
        console.error('❌ No API key found!');
        throw new Error(
          'Chưa cấu hình API Key. Vui lòng thêm VITE_GEMINI_API_KEY vào file .env'
        );
      }

      console.log('📤 Sending message to Gemini:', userMessage);

      // Thêm tin nhắn user vào history
      this.conversationHistory.push({
        role: 'user',
        parts: [{ text: userMessage }],
      });

      // Giới hạn độ dài history
      if (this.conversationHistory.length > this.maxHistoryLength) {
        this.conversationHistory = this.conversationHistory.slice(
          -this.maxHistoryLength
        );
      }

      // Tạo payload cho Gemini
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: SHOP_CONTEXT }],
          },
          ...this.conversationHistory,
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 300, // Giới hạn độ dài phản hồi
        },
      };

      // Gọi Gemini API
      console.log('🌐 Calling Gemini API...');
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);
        throw new Error(errorData.error?.message || 'Lỗi kết nối API');
      }

      const data = await response.json();
      console.log('📥 API Response:', data);

      // Lấy phản hồi từ AI
      const aiResponse =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        'Xin lỗi, tôi không thể trả lời lúc này. Vui lòng thử lại!';
      
      console.log('✅ AI Response:', aiResponse);

      // Lưu phản hồi vào history
      this.conversationHistory.push({
        role: 'model',
        parts: [{ text: aiResponse }],
      });

      return aiResponse;
    } catch (error) {
      console.error('❌ Chatbot error:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });

      // Fallback responses
      if (error.message.includes('API Key')) {
        return 'Hệ thống chatbot đang được cấu hình. Vui lòng liên hệ hotline để được hỗ trợ! 📞';
      }

      if (error.message.includes('API_KEY_INVALID')) {
        return '⚠️ API Key không hợp lệ. Vui lòng kiểm tra lại cấu hình!';
      }

      return `Xin lỗi, tôi đang gặp sự cố kỹ thuật (${error.message}). Bạn có thể thử lại hoặc liên hệ hotline! 🙏`;
    }
  }

  /**
   * Reset conversation history
   */
  resetConversation() {
    this.conversationHistory = [];
    console.log('🔄 Conversation reset');
  }

  /**
   * Lấy quick replies dựa trên context
   * @returns {Array<string>}
   */
  getQuickReplies() {
    return [
      '⌚ Tư vấn đồng hồ nam',
      '💎 Đồng hồ nữ cao cấp',
      '🔍 Tra cứu đơn hàng',
      '🛡️ Chính sách bảo hành',
      '💳 Hướng dẫn thanh toán',
    ];
  }

  /**
   * Lấy suggested messages khi bắt đầu chat
   * @returns {Array<string>}
   */
  getWelcomeMessages() {
    return [
      'Tìm đồng hồ dưới 5 triệu',
      'Đồng hồ nào phù hợp văn phòng?',
      'Chính sách đổi trả như thế nào?',
    ];
  }
}

// Export singleton instance
export default new ChatbotService();
