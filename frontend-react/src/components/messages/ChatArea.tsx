import React, { useRef, useEffect, useState } from 'react';
import { ArrowLeft, MessageSquare, Send, Image as ImageIcon, Smile, X, Phone, Video, Info } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Spinner } from '../ui/Spinner';

import { MessageBubble } from './MessageBubble';
import { EmojiPicker } from '../shared/EmojiPicker';
import { mediaApi } from '../../api/mediaApi';
import { CallModal } from './CallModal';

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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const [inputText, setInputText] = useState('');
  const [chatImage, setChatImage] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [sending, setSending] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);

  const startCall = (video: boolean) => {
    setIsVideoCall(video);
    setIsCallModalOpen(true);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, activeContactId, sending]);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      setIsScrolled(scrollContainerRef.current.scrollTop > 10);
    }
  };

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
      <div className="hidden md:flex flex-1 flex-col justify-center items-center p-8 bg-gradient-to-br from-surface to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--color-primary),0.03)_0,transparent_100%)] pointer-events-none" />
        <div className="w-24 h-24 rounded-3xl bg-surface-elevated flex items-center justify-center mb-6 shadow-2xl shadow-primary/10 rotate-12 hover:rotate-0 transition-transform duration-500">
          <MessageSquare className="w-10 h-10 text-primary opacity-80" />
        </div>
        <h2 className="text-2xl font-heading font-extrabold text-text-primary mb-2">Tin nhắn của bạn</h2>
        <p className="text-text-secondary max-w-sm text-center leading-relaxed">
          Gửi ảnh và tin nhắn riêng tư cho bạn bè hoặc nhóm. Hãy bắt đầu một cuộc hội thoại mới!
        </p>
      </div>
    );
  }

  const isOnline = contacts.find(c => c.contactId === activeContactId)?.isOnline;

  const groupedMessages: { dateLabel: string, messages: any[] }[] = [];
  
  const formatDateLabel = (dateString: string) => {
    const d = new Date(dateString);
    const now = new Date();
    
    const isToday = d.getDate() === now.getDate() && 
                    d.getMonth() === now.getMonth() && 
                    d.getFullYear() === now.getFullYear();
                    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.getDate() === yesterday.getDate() && 
                        d.getMonth() === yesterday.getMonth() && 
                        d.getFullYear() === yesterday.getFullYear();

    if (isToday) return 'Hôm nay';
    if (isYesterday) return 'Hôm qua';
    return d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  messages.forEach(m => {
    const label = formatDateLabel(m.createdAt);
    let group = groupedMessages.find(g => g.dateLabel === label);
    if (!group) {
      group = { dateLabel: label, messages: [] };
      groupedMessages.push(group);
    }
    group.messages.push(m);
  });

  return (
    <div className={`flex-1 flex flex-col bg-background relative md:flex`}>
      {/* Header */}
      <div className={`px-4 py-3.5 flex items-center justify-between bg-surface/80 backdrop-blur-xl sticky top-0 z-20 transition-shadow duration-300 ${isScrolled ? 'shadow-md border-b border-border-default/50' : 'border-b border-border-default'}`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={clearContact} 
            className="md:hidden p-2 -ml-2 hover:bg-surface-elevated rounded-full text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
            aria-label="Quay lại"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="relative shrink-0 cursor-pointer group">
            <Avatar 
              src={activeContactProfile?.avatarUrl} 
              fallback={activeContactProfile?.displayName?.charAt(0).toUpperCase() || 'U'} 
              size="md"
              className="group-hover:opacity-90 transition-opacity"
            />
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-surface rounded-full shadow-sm" title="Đang trực tuyến" />
            )}
          </div>

          <div className="flex-1 min-w-0 cursor-pointer">
            <h3 className="font-bold text-text-primary text-[15px] truncate hover:underline">{activeContactProfile?.displayName || 'Đang tải...'}</h3>
            <span className="text-[11px] font-semibold tracking-wide">
              {isOnline ? <span className="text-green-500">Đang hoạt động</span> : <span className="text-text-secondary">Ngoại tuyến</span>}
            </span>
          </div>
        </div>

        {/* Mock Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-text-secondary">
          <button 
            onClick={() => startCall(false)}
            className="p-2 rounded-full hover:bg-primary/10 hover:text-primary transition-colors" 
            title="Cuộc gọi thoại"
          >
            <Phone className="w-5 h-5" />
          </button>
          <button 
            onClick={() => startCall(true)}
            className="p-2 rounded-full hover:bg-primary/10 hover:text-primary transition-colors hidden sm:flex" 
            title="Cuộc gọi video"
          >
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-full hover:bg-primary/10 hover:text-primary transition-colors" title="Thông tin">
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages body */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed custom-scrollbar"
        style={{ backgroundBlendMode: 'overlay', backgroundColor: 'var(--color-background)' }}
      >
        {loadingMessages ? (
          <div className="flex justify-center p-8"><Spinner size="md" /></div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col justify-center items-center text-center p-8 animate-fade-in">
            <Avatar src={activeContactProfile?.avatarUrl} fallback={activeContactProfile?.displayName?.charAt(0).toUpperCase() || 'U'} size="xl" className="mb-4 shadow-xl" />
            <p className="text-lg font-bold text-text-primary mb-1">{activeContactProfile?.displayName}</p>
            <p className="text-sm text-text-secondary max-w-xs">Đây là bắt đầu của cuộc trò chuyện. Hãy gửi lời chào!</p>
          </div>
        ) : (
          groupedMessages.map((group) => (
            <div key={group.dateLabel} className="space-y-6">
              <div className="flex justify-center my-6">
                <span className="bg-surface-elevated/80 backdrop-blur-sm text-text-secondary text-xs font-bold px-3.5 py-1.5 rounded-full shadow-sm border border-border-default/50">
                  {group.dateLabel}
                </span>
              </div>
              {group.messages.map((m) => (
                <MessageBubble 
                  key={m.id} 
                  message={m} 
                  isMine={m.senderId === user?.id} 
                  contactProfile={activeContactProfile} 
                />
              ))}
            </div>
          ))
        )}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* Footer input */}
      <div className="p-3 sm:p-4 bg-surface/95 backdrop-blur-xl border-t border-border-default relative z-20">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto flex flex-col gap-3">
          {chatImage && (
            <div className="relative self-start ml-4 animate-fade-in">
              <img src={chatImage} alt="Attachment" className="max-h-32 max-w-[150px] object-cover rounded-2xl border-2 border-surface-elevated shadow-xl" />
              <button
                type="button"
                onClick={() => {
                  setChatImage(null);
                  if (imageInputRef.current) imageInputRef.current.value = '';
                }}
                className="absolute -top-3 -right-3 bg-background text-text-primary rounded-full p-1.5 shadow-lg border border-border-default cursor-pointer hover:scale-110 hover:text-error transition-all"
                aria-label="Xóa ảnh"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-end gap-2 sm:gap-3">
            <div className="flex-1 flex items-end gap-1 bg-surface-elevated border border-border-subtle rounded-3xl p-1.5 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all shadow-sm">
              <div className="relative flex items-center justify-center mb-0.5 ml-1">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-2 rounded-full hover:bg-surface transition-colors cursor-pointer shrink-0 ${showEmojiPicker ? 'text-primary bg-primary/10' : 'text-text-secondary'}`}
                  title="Biểu tượng cảm xúc"
                >
                  <Smile className="w-5 h-5" />
                </button>
                {showEmojiPicker && (
                  <div className="absolute left-0 bottom-14 z-50 animate-fade-in shadow-2xl rounded-2xl overflow-hidden border border-border-default">
                    <EmojiPicker 
                      onEmojiSelect={(emoji: string) => setInputText(prev => prev + emoji)} 
                      onClose={() => setShowEmojiPicker(false)} 
                    />
                  </div>
                )}
              </div>

              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Soạn tin nhắn..."
                className="flex-1 bg-transparent border-0 text-text-primary text-[15px] focus:outline-none placeholder-text-secondary py-2.5 px-2 resize-none max-h-32 min-h-[44px] custom-scrollbar"
                rows={1}
                aria-label="Nội dung tin nhắn"
              />

              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className={`p-2 mb-0.5 mr-1 rounded-full hover:bg-surface transition-colors cursor-pointer shrink-0 ${chatImage ? 'text-primary bg-primary/10' : 'text-text-secondary'}`}
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
            </div>

            <button
              type="submit"
              disabled={sending || (!inputText.trim() && !chatImage)}
              className="w-12 h-12 flex items-center justify-center bg-primary hover:bg-primary-hover text-white rounded-full transition-all disabled:opacity-50 disabled:hover:bg-primary disabled:scale-100 hover:scale-105 active:scale-95 cursor-pointer shrink-0 shadow-lg shadow-primary/30 mb-0.5"
              aria-label="Gửi tin nhắn"
            >
              {sending ? <Spinner size="sm" className="text-white" /> : <Send className="w-5 h-5 ml-1" />}
            </button>
          </div>
        </form>
      </div>

      <CallModal 
        isOpen={isCallModalOpen} 
        onClose={() => setIsCallModalOpen(false)} 
        contactProfile={activeContactProfile}
        isVideo={isVideoCall}
      />
    </div>
  );
};
