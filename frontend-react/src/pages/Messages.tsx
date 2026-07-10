import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { chatApi, type ChatMessageResponse, type ChatContactResponse } from '../api/chatApi';
import { userApi, type ProfileResponse } from '../api/userApi';
import { Search, Send, Smile, Image as ImageIcon, MessageSquare, ArrowLeft } from 'lucide-react';

const EMOJIS = ['😊', '😂', '🤣', '👍', '❤️', '🔥', '🎉', '✨', '👏', '😍', '🥰', '😘', '😃', '😄', '😁', '😆', '😅', '😉', '😌', '😎', '😢', '😭', '😡', '👍', '🙌', '🙏'];

const Messages = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeContactId = searchParams.get('contactId');

  const [contacts, setContacts] = useState<ChatContactResponse[]>([]);
  const [contactProfiles, setContactProfiles] = useState<Record<string, ProfileResponse>>({});
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<ProfileResponse[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [inputText, setInputText] = useState('');
  const [chatImage, setCommentImage] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [sending, setSending] = useState(false);

  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadContacts = async () => {
    try {
      const res: any = await chatApi.getContacts();
      const list = res.data || res || [];
      setContacts(list);

      const newProfiles = { ...contactProfiles };
      for (const c of list) {
        if (!newProfiles[c.contactId]) {
          try {
            const uRes = await userApi.getUserById(c.contactId);
            newProfiles[c.contactId] = uRes.data || uRes;
          } catch (e) {
            console.error('Error loading contact profile', e);
          }
        }
      }
      setContactProfiles(newProfiles);
    } catch (e) {
      console.error('Error fetching chat contacts', e);
    } finally {
      setLoadingContacts(false);
    }
  };

  const loadSuggestions = async () => {
    try {
      const res: any = await userApi.getSuggestions();
      setSuggestions(res.data || res || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user) {
      loadContacts();
      loadSuggestions();
    }
  }, [user]);

  useEffect(() => {
    if (!user || !activeContactId) return;

    const loadHistory = async () => {
      setLoadingMessages(true);
      try {
        const res: any = await chatApi.getChatHistory(activeContactId, 0, 100);
        const list = res.data?.content || res.content || res || [];
        setMessages([...list].reverse());
        
        await chatApi.markAsRead(activeContactId);
        window.dispatchEvent(new CustomEvent('chat-unread-count-changed'));
        
        setContacts(prev => prev.map(c => c.contactId === activeContactId ? { ...c, unreadCount: 0 } : c));
      } catch (e) {
        console.error('Error fetching chat history', e);
      } finally {
        setLoadingMessages(false);
      }
    };
    loadHistory();

    if (!contactProfiles[activeContactId]) {
      userApi.getUserById(activeContactId).then(res => {
        const profile = res.data || res;
        setContactProfiles(prev => ({ ...prev, [activeContactId]: profile }));
      }).catch(console.error);
    }
  }, [activeContactId, user]);

  useEffect(() => {
    const handleNewMessage = (e: Event) => {
      const msg = (e as CustomEvent).detail as ChatMessageResponse;
      if (!msg) return;

      if (activeContactId && (msg.senderId === activeContactId || msg.recipientId === activeContactId)) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        if (msg.senderId === activeContactId) {
          chatApi.markAsRead(activeContactId).then(() => {
            window.dispatchEvent(new CustomEvent('chat-unread-count-changed'));
          });
        }
      } else {
        loadContacts();
      }
    };

    window.addEventListener('new-chat-message-received', handleNewMessage);
    return () => window.removeEventListener('new-chat-message-received', handleNewMessage);
  }, [activeContactId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  useEffect(() => {
    if (contacts.length === 0) return;
    const interval = setInterval(async () => {
      const uids = contacts.map(c => c.contactId);
      try {
        const res: any = await chatApi.checkOnlineStatuses(uids);
        const statuses = res.data || res || {};
        setContacts(prev => prev.map(c => ({
          ...c,
          isOnline: !!statuses[c.contactId]
        })));
      } catch (e) {
        console.warn(e);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [contacts]);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = document.createElement('img');
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
      };
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const base64 = await compressImage(file);
      setCommentImage(base64);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!activeContactId || (!inputText.trim() && !chatImage) || sending) return;

    setSending(true);
    try {
      let finalContent = inputText;
      if (chatImage) {
        finalContent += `\n\n![chat_image](${chatImage})`;
      }

      await chatApi.sendMessage(activeContactId, finalContent);
      setInputText('');
      setCommentImage(null);
      if (imageInputRef.current) imageInputRef.current.value = '';
      
      loadContacts();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const selectContact = (contactId: string) => {
    setSearchParams({ contactId });
    setShowSuggestions(false);
  };

  const renderMessageContent = (content: string) => {
    let text = content;
    let imageSrc = '';
    const imgMatch = content.match(/!\[(?:chat_image|comment_image)\]\(([^\)]+)\)/);
    if (imgMatch) {
      imageSrc = imgMatch[1];
      text = text.replace(imgMatch[0], '');
    }

    return (
      <div className="space-y-2 max-w-full">
        {text.trim() && <p className="whitespace-pre-wrap break-words">{text.trim()}</p>}
        {imageSrc && (
          <div className="rounded-lg overflow-hidden max-w-[260px] border border-white/5 bg-black/25">
            <img src={imageSrc} alt="Sent attachment" className="max-h-52 w-full object-contain cursor-pointer hover:opacity-95 transition-opacity" onClick={() => window.open(imageSrc, '_blank')} />
          </div>
        )}
      </div>
    );
  };

  const filteredSuggestions = suggestions.filter(s => 
    s.id !== user?.id &&
    (s.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
     s.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeContactProfile = activeContactId ? contactProfiles[activeContactId] : null;

  return (
    <div className="flex h-[calc(100vh-6rem)] max-w-6xl mx-auto border border-white/5 rounded-2xl bg-surface/30 backdrop-blur overflow-hidden shadow-2xl">
      {/* CỘT TRÁI: DANH SÁCH LIÊN HỆ */}
      <div className={`w-full md:w-80 border-r border-white/5 flex flex-col bg-background/50 ${activeContactId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-white/5 relative z-30">
          <h2 className="text-xl font-bold mb-3 text-text-primary">Tin nhắn</h2>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Tìm người dùng chat mới..."
              className="w-full bg-surface border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 text-text-primary placeholder-text-secondary"
            />
            <Search className="w-4 h-4 text-text-secondary absolute left-3 top-2.5" />
          </div>

          {showSuggestions && searchQuery.trim().length > 0 && (
            <div className="absolute left-4 right-4 mt-2 bg-surface border border-white/10 rounded-xl shadow-2xl max-h-60 overflow-y-auto p-1.5 z-45 animate-fade-in">
              <div className="flex justify-between items-center px-3 py-1.5 text-xs text-text-secondary font-semibold border-b border-white/5 mb-1">
                <span>Gợi ý liên hệ</span>
                <button onClick={() => setShowSuggestions(false)} className="text-[10px] hover:text-text-primary">Đóng</button>
              </div>
              {filteredSuggestions.length === 0 ? (
                <div className="p-4 text-center text-xs text-text-secondary italic">Không tìm thấy người dùng phù hợp.</div>
              ) : (
                filteredSuggestions.map((profile) => (
                  <div
                    key={profile.id}
                    onClick={() => selectContact(profile.id)}
                    className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-500 overflow-hidden flex items-center justify-center text-white font-bold text-xs shrink-0">
                      {profile.avatarUrl ? <img src={profile.avatarUrl} alt="avatar" className="w-full h-full object-cover" /> : profile.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate text-text-primary">{profile.displayName}</p>
                      <p className="text-xs text-text-secondary truncate">@{profile.username}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
          {loadingContacts ? (
            <div className="p-8 text-center text-xs text-text-secondary animate-pulse">Đang tải cuộc hội thoại...</div>
          ) : contacts.length === 0 ? (
            <div className="p-8 text-center text-text-secondary">
              <MessageSquare className="w-10 h-10 mx-auto opacity-20 mb-3" />
              <p className="text-sm font-semibold">Chưa có tin nhắn</p>
              <p className="text-xs mt-1">Tìm người dùng mới ở thanh tìm kiếm phía trên để bắt đầu nhắn tin.</p>
            </div>
          ) : (
            contacts.map((c) => {
              const profile = contactProfiles[c.contactId];
              const isActive = c.contactId === activeContactId;
              const name = profile ? profile.displayName : `Người dùng ${c.contactId.substring(0, 4)}`;
              const initials = profile ? profile.displayName.charAt(0).toUpperCase() : 'U';

              return (
                <div
                  key={c.contactId}
                  onClick={() => selectContact(c.contactId)}
                  className={`flex items-center gap-3 p-4 cursor-pointer transition-colors relative ${isActive ? 'bg-primary/10 border-l-4 border-primary' : 'hover:bg-white/[0.02]'}`}
                >
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-primary to-purple-500 overflow-hidden flex items-center justify-center text-white font-bold shadow">
                      {profile?.avatarUrl ? <img src={profile.avatarUrl} alt="avatar" className="w-full h-full object-cover" /> : initials}
                    </div>
                    {c.isOnline ? (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full shadow" title="Đang online" />
                    ) : (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-gray-600 border-2 border-background rounded-full shadow" title="Ngoại tuyến" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-bold text-text-primary truncate">{name}</span>
                      <span className="text-[10px] text-text-secondary">{new Date(c.lastMessageTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className={`text-xs truncate ${c.unreadCount > 0 ? 'text-text-primary font-semibold' : 'text-text-secondary'}`}>
                      {c.lastMessage.startsWith('![chat_image]') ? '[Hình ảnh]' : c.lastMessage}
                    </p>
                  </div>

                  {c.unreadCount > 0 && (
                    <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm shrink-0">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* CỘT PHẢI: NỘI DUNG CHAT */}
      <div className={`flex-1 flex flex-col bg-background/25 ${!activeContactId ? 'hidden md:flex justify-center items-center text-center p-8' : 'flex'}`}>
        {activeContactId && activeContactProfile ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center gap-3 bg-background/50 relative z-10 shadow-sm">
              <button onClick={() => setSearchParams({})} className="md:hidden p-2 hover:bg-white/5 rounded-full text-text-secondary hover:text-text-primary cursor-pointer">
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-500 overflow-hidden flex items-center justify-center text-white font-bold text-sm shadow">
                  {activeContactProfile.avatarUrl ? <img src={activeContactProfile.avatarUrl} alt="avatar" className="w-full h-full object-cover" /> : activeContactProfile.displayName.charAt(0).toUpperCase()}
                </div>
                {contacts.find(c => c.contactId === activeContactId)?.isOnline ? (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border border-background rounded-full shadow" />
                ) : (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-gray-600 border border-background rounded-full shadow" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-text-primary text-sm truncate">{activeContactProfile.displayName}</h3>
                <span className="text-xs text-text-secondary">
                  {contacts.find(c => c.contactId === activeContactId)?.isOnline ? (
                    <span className="text-green-500">Đang hoạt động</span>
                  ) : (
                    <span>Ngoại tuyến</span>
                  )}
                </span>
              </div>
            </div>

            {/* Messages body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingMessages ? (
                <div className="p-8 text-center text-xs text-text-secondary animate-pulse">Đang tải lịch sử tin nhắn...</div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col justify-center items-center text-center opacity-40 py-8">
                  <MessageSquare className="w-8 h-8 text-text-secondary mb-2 animate-bounce" />
                  <p className="text-xs">Hãy gửi tin nhắn đầu tiên để bắt đầu cuộc trò chuyện.</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isMine = m.senderId === user?.id;
                  return (
                    <div key={m.id} className={`flex gap-3 ${isMine ? 'justify-end' : 'justify-start'}`}>
                      {!isMine && (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-purple-500 overflow-hidden flex items-center justify-center text-white font-bold text-[10px] shadow shrink-0 self-end mb-1">
                          {activeContactProfile.avatarUrl ? <img src={activeContactProfile.avatarUrl} alt="avatar" className="w-full h-full object-cover" /> : activeContactProfile.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      
                      <div className={`flex flex-col max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>
                        <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow ${isMine ? 'bg-primary text-white rounded-br-none' : 'bg-surface border border-white/5 text-text-primary rounded-bl-none'}`}>
                          {renderMessageContent(m.content)}
                        </div>
                        <span className="text-[9px] text-text-secondary mt-1 px-1">
                          {new Date(m.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          {isMine && m.isRead && <span className="text-green-500 ml-1">✓ Đã đọc</span>}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Footer input */}
            <div className="p-4 border-t border-white/5 bg-background/50 relative">
              <form onSubmit={handleSendMessage} className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 flex items-center gap-2 bg-surface border border-white/10 rounded-full px-4 py-2 focus-within:border-primary/50 transition-colors">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Viết tin nhắn..."
                      className="flex-1 bg-transparent border-0 text-text-primary text-sm focus:outline-none placeholder-text-secondary"
                    />

                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className={`p-1.5 rounded-full hover:bg-white/5 transition-colors cursor-pointer shrink-0 ${chatImage ? 'text-primary' : 'text-text-secondary'}`}
                      title="Gửi hình ảnh"
                    >
                      <ImageIcon className="w-4.5 h-4.5" />
                    </button>
                    <input
                      type="file"
                      ref={imageInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      className="hidden"
                    />

                    <div className="relative" ref={emojiPickerRef}>
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-1.5 hover:bg-white/5 text-text-secondary hover:text-primary transition-colors cursor-pointer shrink-0"
                      >
                        <Smile className="w-4.5 h-4.5" />
                      </button>
                      {showEmojiPicker && (
                        <div className="absolute right-0 bottom-10 z-50 bg-surface border border-white/10 rounded-xl shadow-2xl p-3 w-72">
                          <div className="grid grid-cols-6 gap-1 max-h-40 overflow-y-auto">
                            {EMOJIS.map(emoji => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => {
                                  setInputText(prev => prev + emoji);
                                  setShowEmojiPicker(false);
                                }}
                                className="text-lg p-1 hover:bg-white/10 rounded text-center cursor-pointer"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={sending || (!inputText.trim() && !chatImage)}
                      className="p-1.5 bg-primary hover:bg-primary/95 text-white rounded-full transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {chatImage && (
                  <div className="relative inline-block ml-3">
                    <img src={chatImage} alt="Attachment preview" className="max-h-20 max-w-[120px] object-contain rounded-lg border border-white/10" />
                    <button
                      type="button"
                      onClick={() => {
                        setCommentImage(null);
                        if (imageInputRef.current) imageInputRef.current.value = '';
                      }}
                      className="absolute -top-1.5 -right-1.5 bg-black/70 hover:bg-black/90 text-white rounded-full p-1 transition-colors cursor-pointer border border-white/10"
                    >
                      <span className="text-[10px] leading-none">✕</span>
                    </button>
                  </div>
                )}
              </form>
            </div>
          </>
        ) : (
          <div className="text-center p-8">
            <MessageSquare className="w-16 h-16 text-text-secondary opacity-15 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-text-primary mb-1">Mở cuộc hội thoại mới</h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto">Chọn một liên hệ ở danh sách bên trái hoặc tìm kiếm người dùng mới ở thanh tìm kiếm để bắt đầu nhắn tin.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
