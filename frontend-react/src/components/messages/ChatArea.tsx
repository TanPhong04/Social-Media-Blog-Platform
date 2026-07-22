import React, { useRef, useEffect, useState } from 'react';
import { ArrowLeft, MessageSquare, Send, Image as ImageIcon, Smile, X } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Spinner } from '../ui/Spinner';
import { EmptyState } from '../ui/EmptyState';
import { MessageBubble } from './MessageBubble';
import { EmojiPicker } from '../shared/EmojiPicker';
import { mediaApi } from '../../api/mediaApi';

interface ChatAreaProps {
  activeContactId: string | null;
  activeContactProfile: any | null;
  contacts: any[];
  messages: any[];
  loadingMessages: boolean;
  user: any;
  clearContact: () => void;
  onSendMessage: (content: string, image: string | null) => Promise<void>;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  activeContactId, activeContactProfile, contacts, messages, loadingMessages, user, clearContact, onSendMessage
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  const [inputText, setInputText] = useState('');
  const [chatImage, setChatImage] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
    return () => clearTimeout(timer);
  }, [messages, activeContactId]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const url = await mediaApi.uploadFile(file);
      setChatImage(url);
    } catch (err) {
      console.error('Error uploading chat image:', err);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!inputText.trim() && !chatImage) || sending) return;
    setSending(true);
    try {
      await onSendMessage(inputText, chatImage);
      setInputText('');
      setChatImage(null);
      if (imageInputRef.current) imageInputRef.current.value = '';
    } finally {
      setSending(false);
    }
  };

  if (!activeContactId) {
    return (
      <div className="hidden md:flex flex-1 flex-col justify-center items-center p-8 bg-background">
        <EmptyState 
          icon={<MessageSquare className="w-16 h-16 opacity-20 text-text-secondary mb-4" />}
          title="Mở cuộc hội thoại mới"
          description="Chọn một liên hệ ở danh sách bên trái hoặc tìm kiếm người dùng mới ở thanh tìm kiếm để bắt đầu nhắn tin."
          className="border-none bg-transparent"
        />
      </div>
    );
  }

  const isOnline = contacts.find(c => c.contactId === activeContactId)?.isOnline;

  return (
    <div className={`flex-1 flex flex-col bg-background relative md:flex`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border-default flex items-center gap-3 bg-surface/90 backdrop-blur-md sticky top-0 z-10">
        <button 
          onClick={clearContact} 
          className="md:hidden p-2 -ml-2 hover:bg-surface-elevated rounded-full text-text-secondary hover:text-text-primary cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
          aria-label="Quay lại"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="relative shrink-0">
          <Avatar 
            src={activeContactProfile?.avatarUrl} 
            fallback={activeContactProfile?.displayName?.charAt(0).toUpperCase() || 'U'} 
            size="md" 
          />
          {isOnline ? (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full shadow" title="Đang trực tuyến" />
          ) : (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-gray-500 border-2 border-background rounded-full shadow" title="Ngoại tuyến" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-text-primary text-sm truncate">{activeContactProfile?.displayName || 'Đang tải...'}</h3>
          <span className="text-[11px] font-medium text-text-secondary">
            {isOnline ? <span className="text-green-500">Đang hoạt động</span> : <span>Ngoại tuyến</span>}
          </span>
        </div>
      </div>

      {/* Messages body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loadingMessages ? (
          <div className="flex justify-center p-8"><Spinner size="md" /></div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col justify-center items-center text-center p-8">
            <MessageSquare className="w-12 h-12 text-text-secondary opacity-20 mb-4 animate-pulse" />
            <p className="text-sm font-semibold text-text-primary">Chưa có tin nhắn</p>
            <p className="text-xs text-text-secondary mt-1">Hãy gửi tin nhắn đầu tiên để bắt đầu trò chuyện.</p>
          </div>
        ) : (
          messages.map((m) => (
            <MessageBubble 
              key={m.id} 
              message={m} 
              isMine={m.senderId === user?.id} 
              contactProfile={activeContactProfile} 
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer input */}
      <div className="p-4 border-t border-border-default bg-surface/50 relative backdrop-blur-sm">
        <form onSubmit={handleSend} className="flex flex-col gap-3">
          {chatImage && (
            <div className="relative self-start ml-4 animate-fade-in">
              <img src={chatImage} alt="Attachment" className="max-h-24 max-w-[120px] object-cover rounded-xl border border-border-default shadow-md" />
              <button
                type="button"
                onClick={() => {
                  setChatImage(null);
                  if (imageInputRef.current) imageInputRef.current.value = '';
                }}
                className="absolute -top-2 -right-2 bg-surface-elevated hover:bg-surface text-text-primary rounded-full p-1 shadow-lg border border-border-subtle cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all hover:scale-110"
                aria-label="Xóa ảnh"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-1 bg-background border border-border-default rounded-full px-4 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all shadow-sm">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Viết tin nhắn..."
                className="flex-1 bg-transparent border-0 text-text-primary text-sm focus:outline-none placeholder-text-secondary py-1"
                aria-label="Nội dung tin nhắn"
              />

              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className={`p-1.5 rounded-full hover:bg-surface-elevated transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:bg-surface-elevated ${chatImage ? 'text-primary' : 'text-text-secondary'}`}
                title="Đính kèm hình ảnh"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <input
                type="file"
                ref={imageInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
                aria-hidden="true"
              />

              <div className="relative flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-1.5 rounded-full hover:bg-surface-elevated transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:bg-surface-elevated ${showEmojiPicker ? 'text-primary' : 'text-text-secondary'}`}
                  title="Biểu tượng cảm xúc"
                >
                  <Smile className="w-5 h-5" />
                </button>
                {showEmojiPicker && (
                  <div className="absolute right-0 bottom-12 z-50 animate-fade-in shadow-2xl rounded-2xl overflow-hidden border border-border-default">
                    <EmojiPicker 
                      onEmojiSelect={(emoji: string) => setInputText(prev => prev + emoji)} 
                      onClose={() => setShowEmojiPicker(false)} 
                    />
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={sending || (!inputText.trim() && !chatImage)}
              className="w-10 h-10 flex items-center justify-center bg-primary hover:bg-primary-hover text-white rounded-full transition-all disabled:opacity-50 disabled:hover:bg-primary cursor-pointer shrink-0 shadow-md hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary focus-visible:ring-offset-background"
              aria-label="Gửi tin nhắn"
            >
              {sending ? <Spinner size="sm" className="text-white" /> : <Send className="w-4 h-4 ml-0.5" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
