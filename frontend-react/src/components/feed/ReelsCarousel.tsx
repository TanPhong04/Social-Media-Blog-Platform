import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { articleApi, type ArticleResponse } from '../../api/articleApi';
import { userApi } from '../../api/userApi';
import { ChevronLeft, ChevronRight, Film, Volume2, VolumeX } from 'lucide-react';

import { isReel } from '../../utils/feedMixer';

const extractVideoUrl = (content: string): string | null => {
  const match = content.match(/<video src="([^"]+)"/);
  return match ? match[1] : null;
};

const ReelCard: React.FC<{ article: ArticleResponse }> = ({ article }) => {
  const navigate = useNavigate();
  const [author, setAuthor] = useState<any>(null);

  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoUrl = extractVideoUrl(article.content);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    userApi.getUserById(article.authorId).then((res: any) => {
      setAuthor(res.data || res);
    }).catch(() => {});
  }, [article.authorId]);

  const handleMouseEnter = () => {
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        if (err.name === 'NotAllowedError') {
          setIsMuted(true);
          videoRef.current!.muted = true;
          videoRef.current!.play().catch(() => {});
        } else {
        }
      });
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
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

  return (
    <div 
      className="relative shrink-0 w-[140px] sm:w-[200px] md:w-[180px] h-56 sm:h-72 rounded-xl overflow-hidden cursor-pointer group snap-start bg-surface-elevated border border-border-default shadow-sm hover:shadow-md transition-shadow flex flex-col"
      onClick={() => navigate('/reels/' + article.id, { state: { initialReel: article } })}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex-1 relative overflow-hidden">
        {videoUrl ? (
          <video 
            ref={videoRef}
            src={videoUrl} 
            className="w-full h-full object-cover"
            preload="metadata"
            muted={isMuted}
            loop
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-purple-500/20" />
        )}
      
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors pointer-events-none" />
        
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/50 backdrop-blur-md px-1.5 py-0.5 rounded text-white text-[10px] font-bold pointer-events-none z-10">
          <Film className="w-3 h-3" />
          Reels
        </div>



        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto z-20">
          <button 
            className="p-1.5 bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full text-white border border-white/20"
            onClick={toggleMute}
            title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="absolute bottom-6 left-2 right-2 flex flex-col pointer-events-none z-10">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full overflow-hidden bg-primary shrink-0 border border-white/20">
              {author?.avatarUrl ? (
                <img src={author.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-[10px] font-bold">
                  {(author?.displayName || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <span className="text-white text-xs font-semibold truncate drop-shadow-md">
              {author?.displayName || 'Người dùng'}
            </span>
          </div>
        </div>

        {/* Progress Bar & Time */}
        <div 
          className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-gradient-to-t from-black/80 to-transparent flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-auto"
          onClick={e => e.stopPropagation()}
        >
          <span className="text-white text-[10px] font-medium w-7 text-right drop-shadow-md">{formatTime(currentTime)}</span>
          
          <input 
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={progress}
            onChange={handleSeek}
            className="flex-1 h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full focus:outline-none"
            style={{ background: `linear-gradient(to right, var(--color-primary) ${progress}%, rgba(255,255,255,0.3) ${progress}%)` }}
          />
          
          <span className="text-white/90 text-[10px] font-medium w-7 drop-shadow-md">{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export const ReelsCarousel: React.FC = () => {
  const [reels, setReels] = useState<ArticleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchReels = async () => {
      try {
        const res: any = await articleApi.getFeed(0, 50);
        const articles = res.content || res.data?.content || [];
        const filtered = articles.filter(isReel);
        setReels(filtered.slice(0, 10)); // Take top 10 reels
      } catch (err) {
        console.error('Failed to fetch reels for carousel', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReels();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <div className="py-4 border-b border-border-default bg-surface/30">
        <div className="px-4 mb-3 flex items-center gap-2">
          <Film className="w-5 h-5 text-text-primary" />
          <h2 className="font-heading font-bold text-lg text-text-primary">Reels</h2>
        </div>
        <div className="flex gap-3 overflow-hidden px-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="shrink-0 w-[140px] sm:w-[200px] md:w-[180px] h-56 sm:h-72 bg-surface-elevated animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (reels.length === 0) return null;

  return (
    <div className="py-4 border-b border-border-default bg-surface/30">
      <div className="px-4 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5 text-primary" />
          <h2 className="font-heading font-bold text-lg text-text-primary">Reels</h2>
        </div>
      </div>

      <div className="relative group">
        <button 
          onClick={() => scroll('left')}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur text-black dark:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-black disabled:opacity-0 shadow-md"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div 
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-4 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {reels.map(reel => (
            <ReelCard key={reel.id} article={reel} />
          ))}
        </div>

        <button 
          onClick={() => scroll('right')}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur text-black dark:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-black disabled:opacity-0 shadow-md"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};
