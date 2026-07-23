import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { chatApi, type ChatMessageResponse, type ChatContactResponse } from '../api/chatApi';
import { userApi, type ProfileResponse } from '../api/userApi';
import { ConversationList } from '../components/messages/ConversationList';
import { ChatArea } from '../components/messages/ChatArea';

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

  const handleSendMessage = async (inputText: string, chatImage: string | null) => {
    if (!activeContactId) return;

    let finalContent = inputText;
    if (chatImage) {
      finalContent += `\n\n![chat_image](${chatImage})`;
    }

    const res: any = await chatApi.sendMessage(activeContactId, finalContent);
    const sentMsg = res.data || res;

    setMessages(prev => {
      if (prev.some(m => m.id === sentMsg.id)) return prev;
      return [...prev, sentMsg];
    });

    loadContacts();
  };

  const selectContact = (contactId: string) => {
    setSearchParams({ contactId });
    setShowSuggestions(false);
  };

  const filteredSuggestions = suggestions.filter(s => 
    s.id !== user?.id &&
    (s.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
     s.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeContactProfile = activeContactId ? contactProfiles[activeContactId] : null;

  return (
    <div className="flex h-[calc(100vh-64px)] sm:h-[calc(100vh-6rem)] w-full max-w-6xl mx-auto border-x-0 sm:border-x border-t-0 sm:border-t sm:border-b border-border-default sm:rounded-2xl bg-surface/30 sm:mt-8 overflow-hidden shadow-2xl relative">
      <ConversationList
        contacts={contacts}
        contactProfiles={contactProfiles}
        loading={loadingContacts}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showSuggestions={showSuggestions}
        setShowSuggestions={setShowSuggestions}
        filteredSuggestions={filteredSuggestions}
        selectContact={selectContact}
        activeContactId={activeContactId}
      />
      <ChatArea
        activeContactId={activeContactId}
        activeContactProfile={activeContactProfile}
        contacts={contacts}
        messages={messages}
        loadingMessages={loadingMessages}
        user={user}
        clearContact={() => setSearchParams({})}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
};

export default Messages;
