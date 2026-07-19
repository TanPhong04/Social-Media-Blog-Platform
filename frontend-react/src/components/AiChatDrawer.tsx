import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, AlertCircle } from 'lucide-react';
import { aiApi } from '../api/aiApi';
import type { ChatMessage } from '../api/aiApi';

interface AiChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  articleId: string;
  articleTitle: string;
  articleContent: string;
}

const AiChatDrawer: React.FC<AiChatDrawerProps> = ({ isOpen, onClose, articleId, articleTitle, articleContent }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Kiểm tra xem bài viết có chứa hình ảnh hay không dựa vào markdown tag ![image](URL)
  const hasImages = articleContent ? articleContent.includes('![image](') : false;

  // Reset chat và khởi tạo lời chào khi mở bài viết mới
  useEffect(() => {
    if (isOpen) {
      setMessages([
        {
          role: 'model',
          text: `Xin chào! Tôi là trợ lý AI của mạng xã hội **Axion** ✨.\n\nTôi đã đọc bài viết **"${articleTitle}"**. Bạn có câu hỏi nào cần tôi giải đáp hoặc phân tích về nội dung/hình ảnh của bài viết này không?`
        }
      ]);
      setErrorMsg('');
      setInput('');
    }
  }, [isOpen, articleId, articleTitle]);

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (questionText: string) => {
    const textToSend = questionText.trim();
    if (!textToSend || loading) return;

    setErrorMsg('');
    setInput('');
    
    // Thêm tin nhắn của người dùng vào state
    const userMessage: ChatMessage = { role: 'user', text: textToSend };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // Lấy lịch sử hội thoại loại trừ tin nhắn chào mừng đầu tiên để tiết kiệm token
      const historyToSend = updatedMessages.slice(1, -1); 

      const res: any = await aiApi.askAi(articleId, {
        question: textToSend,
        conversationHistory: historyToSend
      });

      const replyText = res.reply || res.data?.reply || '';
      setMessages(prev => [...prev, { role: 'model', text: replyText }]);
    } catch (err: any) {
      console.error('Error asking Gemini AI:', err);
      const errMsg = err.response?.data?.message || 'Không thể kết nối tới dịch vụ AI lúc này. Vui lòng thử lại sau.';
      setErrorMsg(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Helper định dạng in đậm Markdown **text** và `code` sang HTML an toàn
  const formatMessageText = (text: string) => {
    if (!text) return '';
    let formatted = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Convert in đậm **text** -> <strong>text</strong>
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert code inline `code` -> <code>code</code>
    formatted = formatted.replace(/`(.*?)`/g, '<code class="bg-black/30 px-1 py-0.5 rounded text-primary font-mono text-[13px]">$1</code>');
    
    // Chuyển ký tự xuống dòng sang thẻ <br />
    formatted = formatted.replace(/\n/g, '<br />');
    
    return formatted;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop mờ phía sau */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Container Drawer trượt từ bên phải */}
      <div className="fixed top-0 right-0 h-screen w-full sm:w-[420px] z-50 bg-surface border-l border-gray-800 shadow-2xl flex flex-col animate-slide-in">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 text-primary rounded-lg border border-primary/20">
              <Sparkles className="w-5 h-5 fill-primary/10" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-text-primary text-[15px] leading-tight">Trợ lý AI Axion</h3>
              <p className="text-[11px] text-text-secondary">Tìm hiểu sâu về bài đăng hiện tại</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/5 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Khung tin nhắn */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/20">
          {messages.map((msg, index) => {
            const isModel = msg.role === 'model';
            return (
              <div 
                key={index}
                className={`flex gap-2.5 max-w-[85%] ${isModel ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                {/* Avatar Icon */}
                {isModel && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md">
                    <Sparkles className="w-4 h-4 fill-white/20" />
                  </div>
                )}
                
                {/* Bong bóng chat */}
                <div 
                  className={`p-3 rounded-2xl text-[14px] leading-relaxed shadow-sm whitespace-pre-wrap break-words ${
                    isModel 
                      ? 'bg-surface border border-gray-800 text-text-primary rounded-tl-xs' 
                      : 'bg-primary text-white rounded-tr-xs'
                  }`}
                  dangerouslySetInnerHTML={{ __html: formatMessageText(msg.text) }}
                />
              </div>
            );
          })}

          {/* Hiệu ứng suy nghĩ khi Loading */}
          {loading && (
            <div className="flex gap-2.5 max-w-[85%] mr-auto items-center">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center text-white shrink-0 animate-pulse">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="bg-surface border border-gray-800 rounded-2xl rounded-tl-xs p-3 flex gap-1.5 items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          {/* Báo lỗi kết nối */}
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Khung gợi ý câu hỏi nhanh (chỉ hiển thị khi không trong trạng thái loading) */}
        {!loading && messages.length === 1 && (
          <div className="px-4 py-2 flex flex-wrap gap-2 border-t border-gray-800 bg-background/5">
            <button
              onClick={() => handleSend('Tóm tắt bài viết này')}
              className="px-3 py-1.5 text-xs rounded-full border border-gray-800 hover:border-primary/40 bg-surface text-text-primary hover:bg-white/5 transition-all text-left flex items-center gap-1.5 cursor-pointer"
            >
              📝 Tóm tắt bài đăng
            </button>
            <button
              onClick={() => handleSend('Các từ khóa chính và nội dung quan trọng của bài viết này là gì?')}
              className="px-3 py-1.5 text-xs rounded-full border border-gray-800 hover:border-primary/40 bg-surface text-text-primary hover:bg-white/5 transition-all text-left flex items-center gap-1.5 cursor-pointer"
            >
              💡 Nội dung cốt lõi
            </button>
            {hasImages && (
              <button
                onClick={() => handleSend('Hình ảnh trong bài viết này mô tả hoặc nói về điều gì?')}
                className="px-3 py-1.5 text-xs rounded-full border border-gray-800 hover:border-primary/40 bg-surface text-text-primary hover:bg-white/5 transition-all text-left flex items-center gap-1.5 cursor-pointer"
              >
                🖼️ Phân tích hình ảnh
              </button>
            )}
          </div>
        )}

        {/* Form nhập tin nhắn */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="p-4 border-t border-gray-800 flex gap-2 bg-surface"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Hỏi AI bất kỳ điều gì về bài đăng này..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-800 focus:border-primary focus:outline-none bg-background text-text-primary text-[14px] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white disabled:opacity-40 transition-opacity flex items-center justify-center cursor-pointer shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </>
  );
};

export default AiChatDrawer;
