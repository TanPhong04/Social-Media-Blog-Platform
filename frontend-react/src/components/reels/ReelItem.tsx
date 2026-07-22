import React, { useState, useEffect, useRef } from 'react';
import { articleApi, type ArticleResponse } from '../../api/articleApi';
import { userApi } from '../../api/userApi';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { ThumbsUp, MessageCircle, Share2, Music, Play, Volume2, VolumeX } from 'lucide-react';
import ShareModal from '../ShareModal';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';

interface ReelItemProps {
  article: ArticleResponse;
  isActive: boolean;
}

export const ReelItem: React.FC<ReelItemProps> = ({ article, isActive }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [author, setAuthor] = useState<any>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  let videoUrl = '';
  const content = article.content || '';
  const videoRegex = /<video src="([^"]+)"/;
  const match = videoRegex.exec(content);
  if (match) videoUrl = match[1];

  const textContent = content.replace(/<video src="([^"]+)"[^>]*>(?:<\/video>)?/g, '').trim();

  useEffect(() => {
    if (isActive) {
      videoRef.current?.play().catch(e => console.log('Auto-play blocked', e));
      setIsPlaying(true);
    } else {
      videoRef.current?.pause();
      setIsPlaying(false);
      if (videoRef.current) videoRef.current.currentTime = 0;
    }
  }, [isActive]);

  useEffect(() => {
    userApi.getUserById(article.authorId).then((res: any) => setAuthor(res.data || res)).catch(() => {});
    articleApi.getArticleInteraction(article.id).then((res: any) => {
      setLiked(res.likedByCurrentUser);
      setMyReaction(res.currentUserReactionType || (res.likedByCurrentUser ? 'LIKE' : null));
      setLikeCount(res.count);
    }).catch(() => {});
  }, [article.id, article.authorId]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration || 1;
      setProgress((current / total) * 100);
      setCurrentTime(current);
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (videoRef.current) {
      const val = parseFloat(e.target.value);
      const newTime = (val / 100) * (videoRef.current.duration || 1);
      videoRef.current.currentTime = newTime;
      setProgress(val);
      setCurrentTime(newTime);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '00:00';
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleLike = async (e: React.MouseEvent, reactionType: string = 'LIKE') => {
    e.stopPropagation();
    if (!user) return navigate('/login');
    setShowReactionPicker(false);
    
    const nextLiked = !liked || (liked && myReaction !== reactionType);
    const wasLiked = liked;
    
    setLiked(nextLiked);
    setMyReaction(nextLiked ? reactionType : null);
    if (!wasLiked && nextLiked) {
      setLikeCount(p => p + 1);
    } else if (wasLiked && !nextLiked) {
      setLikeCount(p => p - 1);
    }
    
    try {
      if (nextLiked) await articleApi.likeArticle(article.id, reactionType);
      else await articleApi.unlikeArticle(article.id);
    } catch (e) {
      setLiked(wasLiked);
      setMyReaction(wasLiked ? (myReaction || 'LIKE') : null);
      if (!wasLiked && nextLiked) setLikeCount(p => p - 1);
      else if (wasLiked && !nextLiked) setLikeCount(p => p + 1);
    }
  };

  
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareModal(true);
  };

  if (!videoUrl) return null;

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] sm:h-screen bg-black flex items-center justify-center snap-start snap-always shrink-0 overflow-hidden shadow-2xl">
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain cursor-pointer"
        loop
        playsInline
        muted={isMuted}
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
      />

      {/* Play Icon Overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 transition-opacity">
          <div className="w-20 h-20 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-2xl">
            <Play className="w-10 h-10 text-white fill-white ml-2 opacity-90" />
          </div>
        </div>
      )}

      {/* Gradient Bottom Overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/95 via-black/50 to-transparent pointer-events-none z-10" />
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/50 to-transparent pointer-events-none z-10" />

      {/* Mute Toggle */}
      <button 
        className="absolute top-6 right-6 p-3 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white z-20 pointer-events-auto border border-white/20 transition-all hover:scale-110"
        onClick={toggleMute}
        title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
      >
        {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
      </button>

      {/* Right Actions */}
      <div className="absolute right-4 bottom-20 flex flex-col items-center gap-5 z-20">
        <button 
          onClick={(e) => { e.stopPropagation(); navigate(`/profile?userId=${article.authorId}`); }}
          className="w-12 h-12 rounded-full border-[2px] border-white overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.5)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-transform hover:scale-105"
          aria-label="Xem hồ sơ"
        >
          <Avatar src={author?.avatarUrl} fallback={author?.displayName?.substring(0,2).toUpperCase() || 'U'} size="lg" />
        </button>

        <div 
          className="relative flex flex-col items-center gap-1.5"
          onMouseEnter={() => setShowReactionPicker(true)}
          onMouseLeave={() => setShowReactionPicker(false)}
        >
          {showReactionPicker && (
            <div className="absolute right-full pr-4 bottom-0 py-4 flex items-center z-50">
              <div className="bg-surface-elevated backdrop-blur-xl border border-white/20 rounded-full px-3 py-2 flex items-center gap-2 shadow-2xl animate-[slideIn_0.2s_ease-out]">
                {[
                  { type: 'LIKE', icon: '👍' },
                  { type: 'LOVE', icon: '❤️' },
                  { type: 'HAHA', icon: '😆' },
                  { type: 'WOW', icon: '😮' },
                  { type: 'SAD', icon: '😢' },
                  { type: 'ANGRY', icon: '😡' }
                ].map((reaction) => (
                  <button
                    key={reaction.type}
                    onClick={(e) => handleLike(e, reaction.type)}
                    className="text-2xl hover:scale-125 hover:-translate-y-2 transition-all origin-bottom cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
                    title={reaction.type}
                  >
                    {reaction.icon}
                  </button>
                ))}
              </div>
            </div>
          )}
          <button 
            onClick={(e) => handleLike(e, 'LIKE')} 
            className="flex flex-col items-center gap-1 group focus-visible:outline-none"
            aria-label="Thích"
          >
            <div className="w-11 h-11 rounded-full bg-black/40 flex items-center justify-center group-hover:bg-black/60 transition-colors backdrop-blur-md border border-border-default shadow-lg">
              {myReaction === 'LOVE' ? <span className="text-2xl leading-none">❤️</span> :
               myReaction === 'HAHA' ? <span className="text-2xl leading-none">😆</span> :
               myReaction === 'WOW' ? <span className="text-2xl leading-none">😮</span> :
               myReaction === 'SAD' ? <span className="text-2xl leading-none">😢</span> :
               myReaction === 'ANGRY' ? <span className="text-2xl leading-none">😡</span> :
               myReaction === 'LIKE' ? <ThumbsUp className="w-6 h-6 text-primary fill-primary drop-shadow-md transition-transform duration-300" /> :
               <ThumbsUp className="w-6 h-6 text-white drop-shadow-md transition-transform duration-300" />
              }
            </div>
            <span className="text-white text-xs font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {likeCount > 0 ? likeCount : 'Thích'}
            </span>
          </button>
        </div>

        <button 
          onClick={() => navigate(`/article/${article.id}?mediaUrl=${encodeURIComponent(videoUrl)}`, { state: { backgroundLocation: location } })} 
          className="flex flex-col items-center gap-1.5 group focus-visible:outline-none"
          aria-label="Bình luận"
        >
          <div className="w-11 h-11 rounded-full bg-black/40 flex items-center justify-center group-hover:bg-black/60 transition-colors backdrop-blur-md border border-border-default shadow-lg">
            <MessageCircle className="w-6 h-6 text-white drop-shadow-md" />
          </div>
          <span className="text-white text-xs font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Bình luận</span>
        </button>

        <button 
          onClick={handleShare} 
          className="flex flex-col items-center gap-1.5 group focus-visible:outline-none"
          aria-label="Chia sẻ"
        >
          <div className="w-11 h-11 rounded-full bg-black/40 flex items-center justify-center group-hover:bg-black/60 transition-colors backdrop-blur-md border border-border-default shadow-lg">
            <Share2 className="w-6 h-6 text-white drop-shadow-md" />
          </div>
          <span className="text-white text-xs font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Chia sẻ</span>
        </button>
      </div>

      {/* Bottom Info Overlay */}
      <div className="absolute left-4 bottom-8 right-20 z-20 flex items-end justify-between">
        <div className="flex-1 pointer-events-none flex flex-col items-start">
          <button 
            className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center text-white pointer-events-auto transition-colors mb-3 border border-white/20"
            onClick={togglePlay}
          >
            {!isPlaying ? (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            ) : (
              <div className="w-4 h-4 flex justify-between items-center px-0.5">
                <div className="w-1 h-full bg-white rounded-sm" />
                <div className="w-1 h-full bg-white rounded-sm" />
              </div>
            )}
          </button>

          <div className="flex items-center gap-3 mb-2.5 pointer-events-auto">
            <span 
              className="text-white font-bold text-base cursor-pointer hover:underline drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
              onClick={(e) => { e.stopPropagation(); navigate(`/profile?userId=${article.authorId}`); }}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/profile?userId=${article.authorId}`)}
            >
              {author?.displayName || author?.username || 'Đang tải...'}
            </span>
            <Button 
              variant="secondary" 
              size="sm" 
              className="h-7 px-3 text-xs bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-md rounded-full font-bold"
            >
              Theo dõi
            </Button>
          </div>

          {textContent && (
            <div className="mb-4 pr-4 pointer-events-auto">
              <p className={`text-white text-sm drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] leading-relaxed font-medium whitespace-pre-wrap ${!isExpanded ? 'line-clamp-2' : ''}`}>
                {textContent}
              </p>
              {textContent.length > 80 && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                  className="text-white/90 font-bold text-xs hover:underline mt-1 drop-shadow-md focus-visible:outline-none"
                >
                  {isExpanded ? 'Ẩn bớt' : '...xem thêm'}
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 text-white/90 bg-black/20 w-fit px-3 py-1.5 rounded-full backdrop-blur-md border border-border-default">
            <Music className="w-3.5 h-3.5" />
            <div className="overflow-hidden w-36 whitespace-nowrap mask-image-linear">
              <span className="inline-block animate-marquee text-xs font-semibold drop-shadow-md">
                Âm thanh gốc - {author?.displayName || 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        {/* Music Disc */}
        <div className="w-10 h-10 rounded-full border-[5px] border-[#222] bg-gradient-to-tr from-gray-800 to-gray-600 animate-spin-slow overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.6)] shrink-0 relative left-12 bottom-1">
          {author?.avatarUrl ? (
            <img src={author.avatarUrl} alt="disc" className="w-full h-full object-cover opacity-90" />
          ) : (
            <div className="w-full h-full bg-primary/80" />
          )}
          <div className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-white shadow-inner"></div>
        </div>
      </div>
      
      {/* Progress Bar & Time */}
      <div 
        className="absolute bottom-0 left-0 right-0 px-4 py-2 bg-gradient-to-t from-black/80 to-transparent flex items-center gap-3 z-30 pointer-events-auto"
        onClick={e => e.stopPropagation()}
      >
        <span className="text-white text-[13px] font-medium w-10 text-right drop-shadow-md">{formatTime(currentTime)}</span>
        
        <input 
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={progress}
          onChange={handleSeek}
          className="flex-1 h-1.5 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg focus:outline-none"
          style={{ background: `linear-gradient(to right, var(--color-primary) ${progress}%, rgba(255,255,255,0.3) ${progress}%)` }}
        />
        
        <span className="text-white/90 text-[13px] font-medium w-10 drop-shadow-md">{formatTime(duration)}</span>
      </div>
      
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareUrl={`${window.location.origin}/article/${article.id}`}
        title={article.title || 'Reel mới'}
      />
    </div>
  );
};
