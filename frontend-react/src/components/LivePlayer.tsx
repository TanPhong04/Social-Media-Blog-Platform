import React, { useEffect, useRef, useState, useCallback } from 'react';
import mpegts from 'mpegts.js';
import { Volume2, VolumeX, Maximize, Play, AlertCircle, Send, Heart, StopCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { commentApi } from '../api/commentApi';
import { articleApi } from '../api/articleApi';
import { livestreamApi } from '../api/livestreamApi';
import { userApi } from '../api/userApi';

interface LivePlayerProps {
  hlsUrl: string;
  articleId: string;
  authorId: string;
  title: string;
  muted?: boolean;
  onEnded?: () => void;
}

interface ChatMessage {
  id: string;
  authorId: string;
  displayName: string;
  avatarUrl?: string;
  content: string;
  createdAt: string;
}

// Floating heart animation component
const FloatingHeart: React.FC<{ id: number; onDone: (id: number) => void }> = ({ id, onDone }) => {
  useEffect(() => {
    const timer = setTimeout(() => onDone(id), 1500);
    return () => clearTimeout(timer);
  }, [id, onDone]);

  const left = 20 + Math.random() * 60;
  return (
    <div
      className="absolute bottom-12 pointer-events-none text-red-500 animate-bounce"
      style={{
        left: `${left}%`,
        animation: 'floatUp 1.5s ease-out forwards',
        fontSize: `${14 + Math.random() * 10}px`,
      }}
    >
      ❤️
    </div>
  );
};

const LivePlayer: React.FC<LivePlayerProps> = ({ hlsUrl, articleId, authorId, title, muted = true, onEnded }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const [isMuted, setIsMuted] = useState(muted);
  const [error, setError] = useState(false);
  const [ended, setEnded] = useState(false);
  const [endingLive, setEndingLive] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [profileCache, setProfileCache] = useState<Record<string, { displayName: string; avatarUrl?: string }>>({});

  // Interaction state
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [hearts, setHearts] = useState<number[]>([]);
  const heartIdRef = useRef(0);

  const isHost = user?.id === authorId;

  // --- MPEGTS (FLV) Player ---
  useEffect(() => {
    if (ended) return;
    const video = videoRef.current;
    if (!video) return;

    let player: any = null;
    setError(false);
    
    // Derive FLV URL from HLS URL (e.g. http://localhost:1980/live/STREAM_KEY.m3u8 -> .flv)
    const flvUrl = hlsUrl.replace('.m3u8', '.flv');

    if (mpegts.getFeatureList().mseLivePlayback) {
      player = mpegts.createPlayer({
        type: 'flv',
        isLive: true,
        url: flvUrl,
        hasAudio: true,
        hasVideo: true,
      }, {
        enableWorker: true,
        lazyLoadMaxDuration: 3 * 60,
        seekType: 'range',
        liveBufferLatencyChasing: true, // Auto chase live edge to minimize latency
        liveBufferLatencyMaxLatency: 3,
        liveBufferLatencyMinRemain: 1,
      });

      player.attachMediaElement(video);
      player.load();
      
      const playPromise = player.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          video.muted = true;
          setIsMuted(true);
          player.play();
        });
      }

      player.on(mpegts.Events.ERROR, (errType: any, errDetail: any) => {
        console.error('[MPEGTS Error]', errType, errDetail);
        if (errType === mpegts.ErrorTypes.NETWORK_ERROR) {
          setError(true);
        }
      });
    } else {
      setError(true); // MSE not supported
    }

    return () => {
      if (player) {
        player.pause();
        player.unload();
        player.detachMediaElement();
        player.destroy();
      }
    };
  }, [hlsUrl, ended]);

  // --- Fetch chat messages (polling) ---
  const fetchMessages = useCallback(async () => {
    if (ended) return;
    try {
      const res: any = await commentApi.getComments(articleId);
      const list = res?.content || res?.data?.content || res || [];
      // Filter out repost comments
      const chatMsgs = list.filter((c: any) => !c.content.includes('[repost]'));
      
      // Resolve profiles
      const newProfiles: Record<string, { displayName: string; avatarUrl?: string }> = { ...profileCache };
      const unknownIds = chatMsgs
        .map((c: any) => c.authorId)
        .filter((id: string) => !newProfiles[id]);
      const uniqueIds = [...new Set(unknownIds)] as string[];

      await Promise.all(
        uniqueIds.map(async (uid: string) => {
          try {
            const u: any = await userApi.getUserById(uid);
            const profile = u?.data || u;
            newProfiles[uid] = { displayName: profile.displayName || 'Ẩn danh', avatarUrl: profile.avatarUrl };
          } catch {
            newProfiles[uid] = { displayName: 'Ẩn danh' };
          }
        })
      );

      if (uniqueIds.length > 0) {
        setProfileCache(newProfiles);
      }

      const mapped: ChatMessage[] = chatMsgs.map((c: any) => ({
        id: c.id,
        authorId: c.authorId,
        displayName: newProfiles[c.authorId]?.displayName || 'Ẩn danh',
        avatarUrl: newProfiles[c.authorId]?.avatarUrl,
        content: c.content,
        createdAt: c.createdAt,
      }));

      setMessages(mapped);
    } catch (err) {
      console.warn('[LiveChat] Failed to fetch messages:', err);
    }

    // Fetch interaction to sync likes
    try {
      const res: any = await articleApi.getArticleInteraction(articleId);
      const data = res?.data || res;
      if (user && data.isLiked !== undefined) setLiked(data.isLiked);
      
      const currentLikes = data.likesCount || data.count || 0;
      setLikeCount(prev => {
        if (currentLikes > prev) {
          const diff = Math.min(currentLikes - prev, 10);
          for (let i = 0; i < diff; i++) {
            setTimeout(() => setHearts(h => [...h, heartIdRef.current++]), i * 150);
          }
        }
        return currentLikes;
      });
    } catch { /* ignore */ }
  }, [articleId, ended, profileCache, user]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [articleId, ended, fetchMessages]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // --- Handlers ---
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (video) {
      video.muted = !video.muted;
      setIsMuted(video.muted);
    }
  };

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (video) {
      if (video.requestFullscreen) video.requestFullscreen();
      else if ((video as any).webkitRequestFullscreen) (video as any).webkitRequestFullscreen();
    }
  };

  const handleManualPlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (video) {
      video.play().then(() => setError(false)).catch(err => console.error('Play failure:', err));
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || sending) return;
    setSending(true);
    try {
      await commentApi.createComment({ articleId, content: newMessage.trim() });
      setNewMessage('');
      await fetchMessages();
    } catch (err) {
      console.error('[LiveChat] Send failed:', err);
    } finally {
      setSending(false);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      if (liked) {
        await articleApi.unlikeArticle(articleId);
        setLiked(false);
        setLikeCount(c => Math.max(0, c - 1));
      } else {
        await articleApi.likeArticle(articleId);
        setLiked(true);
        setLikeCount(c => c + 1);
        // Spawn floating heart
        const id = heartIdRef.current++;
        setHearts(prev => [...prev, id]);
      }
    } catch (err) {
      console.error('[Live] Like failed:', err);
    }
  };

  const removeHeart = useCallback((id: number) => {
    setHearts(prev => prev.filter(h => h !== id));
  }, []);

  const handleEndLive = async () => {
    if (!confirm('Bạn có chắc chắn muốn dừng phát trực tiếp?')) return;
    setEndingLive(true);
    try {
      await livestreamApi.endLiveSession(articleId);
      setEnded(true);
      if (onEnded) onEnded();
    } catch (err) {
      console.error('[Live] End failed:', err);
      alert('Không thể dừng livestream. Vui lòng thử lại.');
    } finally {
      setEndingLive(false);
    }
  };

  // --- ENDED state ---
  if (ended) {
    return (
      <div className="w-full rounded-xl overflow-hidden border border-gray-800">
        <div className="aspect-video bg-gray-900/80 flex flex-col items-center justify-center gap-3">
          <StopCircle className="w-12 h-12 text-gray-500" />
          <p className="text-text-secondary text-sm font-medium">Buổi phát trực tiếp đã kết thúc</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl overflow-hidden border border-gray-800 bg-gray-950" onClick={(e) => e.stopPropagation()}>
      {/* Video Area */}
      <div className="relative w-full aspect-video bg-black group">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-text-secondary bg-gray-900/90 p-4 gap-2">
            <AlertCircle className="w-8 h-8 text-amber-500 animate-pulse" />
            <p className="text-sm font-medium text-text-primary text-center">Đang chờ tín hiệu phát sóng...</p>
            <button
              onClick={handleManualPlay}
              className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" /> Kết nối lại
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-contain bg-black"
              playsInline
              muted={isMuted}
            />

            {/* Controls overlay */}
            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <button onClick={toggleMute} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer" title={isMuted ? 'Bật tiếng' : 'Tắt tiếng'}>
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center gap-2">
                {isHost && (
                  <button
                    onClick={handleEndLive}
                    disabled={endingLive}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                  >
                    <StopCircle className="w-3.5 h-3.5" />
                    {endingLive ? 'Đang dừng...' : 'Dừng Live'}
                  </button>
                )}
                <button onClick={handleFullscreen} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer" title="Phóng to">
                  <Maximize className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* LIVE badge */}
            <div className="absolute top-3 left-3 bg-red-600 text-white font-bold text-[10px] px-2 py-0.5 rounded uppercase tracking-wider shadow-md animate-pulse z-10 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white block animate-ping" />
              LIVE
            </div>

            {/* Floating hearts */}
            {hearts.map(id => (
              <FloatingHeart key={id} id={id} onDone={removeHeart} />
            ))}
          </>
        )}
      </div>

      {/* Live Info + Interaction Bar */}
      <div className="px-4 py-2.5 border-t border-gray-800 flex items-center justify-between bg-gray-900/50">
        <h4 className="text-text-primary text-sm font-semibold truncate flex-1 mr-3">{title}</h4>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 text-xs font-medium transition-all cursor-pointer ${liked ? 'text-red-500' : 'text-text-secondary hover:text-red-400'}`}
          >
            <Heart className={`w-4 h-4 transition-transform ${liked ? 'fill-red-500 scale-110' : ''}`} />
            <span>{likeCount}</span>
          </button>
        </div>
      </div>

      {/* Live Chat */}
      <div className="border-t border-gray-800">
        {/* Chat header */}
        <div className="px-4 py-2 bg-gray-900/30 border-b border-gray-800/50">
          <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Trò chuyện trực tiếp</span>
        </div>

        {/* Messages */}
        <div ref={chatContainerRef} className="h-[200px] overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-text-secondary text-xs">Chưa có bình luận nào. Hãy bắt đầu trò chuyện!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-2 py-1 group/msg hover:bg-white/[0.02] rounded px-1 transition-colors">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary/60 to-purple-600/60 flex-shrink-0 overflow-hidden mt-0.5">
                  {msg.avatarUrl ? (
                    <img src={msg.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-white">
                      {msg.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-semibold text-primary/80 mr-1.5">{msg.displayName}</span>
                  <span className="text-[12px] text-text-primary break-words">{msg.content}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Chat input */}
        {user ? (
          <form onSubmit={handleSendMessage} className="px-3 py-2 border-t border-gray-800/50 flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Gửi tin nhắn..."
              maxLength={200}
              className="flex-1 px-3 py-2 bg-gray-800/60 border border-gray-700/50 rounded-lg text-text-primary text-xs placeholder:text-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="p-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          <div className="px-3 py-2.5 border-t border-gray-800/50 text-center">
            <p className="text-text-secondary text-xs">Đăng nhập để tham gia trò chuyện</p>
          </div>
        )}
      </div>

      {/* Floating heart keyframe animation */}
      <style>{`
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          50% { opacity: 0.8; transform: translateY(-60px) scale(1.3); }
          100% { opacity: 0; transform: translateY(-120px) scale(0.6); }
        }
      `}</style>
    </div>
  );
};

export default LivePlayer;
