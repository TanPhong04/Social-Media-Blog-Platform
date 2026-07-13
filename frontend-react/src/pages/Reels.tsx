import React, { useState, useEffect, useRef } from 'react';
import { articleApi, type ArticleResponse } from '../api/articleApi';
import { Heart, MessageCircle, Share2, Music, Film, Play } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../api/userApi';
import ShareModal from '../components/ShareModal';

// Helper to determine if article is a reel (exactly 1 video, 0 images)
const isReel = (article: ArticleResponse): boolean => {
  if (article.tags && article.tags.includes('reel')) return true;
  if (!article.content) return false;
  const videoMatches = article.content.match(/<video src="([^"]+)"/g);
  const imageMatches = article.content.match(/!\[image\]\(([^)]+)\)/g);
  return (videoMatches?.length === 1) && (!imageMatches || imageMatches.length === 0);
};

const ReelItem = ({ article, isActive }: { article: ArticleResponse, isActive: boolean }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [author, setAuthor] = useState<any>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // Extract video URL
  let videoUrl = '';
  const content = article.content || '';
  const videoRegex = /<video src="([^"]+)"/;
  const match = videoRegex.exec(content);
  if (match) videoUrl = match[1];

  // Extract text
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
      const total = videoRef.current.duration;
      setProgress((current / total) * 100);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return navigate('/login');
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount(p => nextLiked ? p + 1 : p - 1);
    try {
      if (nextLiked) await articleApi.likeArticle(article.id, 'LIKE');
      else await articleApi.unlikeArticle(article.id);
    } catch (e) {
      setLiked(!nextLiked);
      setLikeCount(p => nextLiked ? p - 1 : p + 1);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareModal(true);
  };

  if (!videoUrl) return null;

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] max-w-[420px] mx-auto bg-black flex items-center justify-center snap-start snap-always shrink-0 overflow-hidden">
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-cover cursor-pointer"
        loop
        playsInline
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
      />

      {/* Play Icon Overlay when paused */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 transition-opacity">
          <div className="w-20 h-20 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
            <Play className="w-10 h-10 text-white fill-white ml-2 opacity-90" />
          </div>
        </div>
      )}

      {/* Gradient Overlay for bottom text readability */}
      <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10" />

      {/* Right Actions Overlay */}
      <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 z-20">
        <button 
          onClick={(e) => { e.stopPropagation(); navigate(`/profile?userId=${article.authorId}`); }}
          className="w-11 h-11 rounded-full border-[2px] border-white overflow-hidden shadow-lg"
        >
          {author?.avatarUrl ? (
            <img src={author.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-primary flex items-center justify-center text-white text-sm font-bold">
              {(author?.displayName || 'U').substring(0,2).toUpperCase()}
            </div>
          )}
        </button>

        <button onClick={handleLike} className="flex flex-col items-center gap-1 group">
          <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center group-hover:bg-black/40 transition backdrop-blur-sm">
            <Heart className={`w-7 h-7 ${liked ? 'fill-error text-error scale-110' : 'text-white drop-shadow-md'} transition-transform duration-300`} />
          </div>
          <span className="text-white text-xs font-bold drop-shadow-md">{likeCount > 0 ? likeCount : 'Thích'}</span>
        </button>

        <button onClick={() => navigate(`/?articleId=${article.id}`)} className="flex flex-col items-center gap-1 group">
          <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center group-hover:bg-black/40 transition backdrop-blur-sm">
            <MessageCircle className="w-7 h-7 text-white drop-shadow-md" />
          </div>
          <span className="text-white text-xs font-bold drop-shadow-md">Bình luận</span>
        </button>

        <button onClick={handleShare} className="flex flex-col items-center gap-1 group">
          <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center group-hover:bg-black/40 transition backdrop-blur-sm">
            <Share2 className="w-7 h-7 text-white drop-shadow-md" />
          </div>
          <span className="text-white text-xs font-bold drop-shadow-md">Chia sẻ</span>
        </button>
      </div>

      {/* Bottom Info Overlay */}
      <div className="absolute left-4 bottom-6 right-20 z-20 flex items-end justify-between">
        <div className="flex-1 pointer-events-none">
          <div className="flex items-center gap-2 mb-2 pointer-events-auto">
            <span 
              className="text-white font-bold text-[16px] cursor-pointer hover:underline drop-shadow-md"
              onClick={(e) => { e.stopPropagation(); navigate(`/profile?userId=${article.authorId}`); }}
            >
              {author?.displayName || author?.username || 'Đang tải...'}
            </span>
            <button className="px-4 py-1 rounded-md border border-white text-white text-[13px] font-semibold hover:bg-white/20 transition backdrop-blur-sm">
              Theo dõi
            </button>
          </div>

          {textContent && (
            <p className="text-white text-[15px] line-clamp-2 mb-4 drop-shadow-md leading-snug font-medium pr-4">
              {textContent}
            </p>
          )}

          <div className="flex items-center gap-2 text-white">
            <Music className="w-4 h-4" />
            <div className="overflow-hidden w-40 whitespace-nowrap mask-image-linear">
              <span className="inline-block animate-marquee text-[13px] font-semibold drop-shadow-md">
                Âm thanh gốc - {author?.displayName || 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        {/* Music Disc animation (bottom right corner next to actions) */}
        <div className="w-10 h-10 rounded-full border-[6px] border-[#222] bg-gradient-to-tr from-gray-800 to-gray-600 animate-spin-slow overflow-hidden shadow-lg flex-shrink-0 relative left-12 bottom-1">
          {author?.avatarUrl ? (
            <img src={author.avatarUrl} alt="disc" className="w-full h-full object-cover opacity-80" />
          ) : (
            <div className="w-full h-full bg-primary/50" />
          )}
          <div className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-white"></div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-30">
        <div 
          className="h-full bg-primary transition-all duration-100 ease-linear rounded-r-full shadow-[0_0_8px_rgba(108,92,231,0.8)]"
          style={{ width: `${progress}%` }}
        />
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

const Reels = () => {
  const [reels, setReels] = useState<ArticleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchReels = async (pageNum: number) => {
    try {
      const res = await articleApi.getFeed(pageNum, 100);
      const data = res.data.content;
      
      // Lọc ra các bài viết là Reel (chính xác 1 video, 0 hình ảnh)
      const videoArticles = data.filter((a: ArticleResponse) => isReel(a));
      
      if (pageNum === 0) {
        setReels(videoArticles);
      } else {
        setReels(prev => {
          const newIds = new Set(prev.map(r => r.id));
          const uniqueNewReels = videoArticles.filter((r: ArticleResponse) => !newIds.has(r.id));
          return [...prev, ...uniqueNewReels];
        });
      }
      
      if (res.data.last) {
        setHasMore(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReels(0);
  }, []);

  const handleScroll = () => {
    if (!containerRef.current) return;
    
    const scrollPosition = containerRef.current.scrollTop;
    const windowHeight = containerRef.current.clientHeight;
    // Thay vì chia làm tròn, dùng offset nhỏ để snap mượt hơn
    const currentIndex = Math.round(scrollPosition / windowHeight);
    
    if (currentIndex !== activeIndex) {
      setActiveIndex(currentIndex);
    }

    if (hasMore && currentIndex >= reels.length - 2) {
      setPage(p => {
        const next = p + 1;
        fetchReels(next);
        return next;
      });
    }
  };

  return (
    <div className="bg-[#1A1A1A] w-full h-[calc(100vh-4rem)] flex justify-center overflow-hidden">
      <style>{`
        .animate-marquee {
          animation: marquee 5s linear infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .mask-image-linear {
          mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        }
        .animate-spin-slow {
          animation: spin 4s linear infinite;
        }
        /* Custom scrollbar hiding */
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
      
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide bg-black relative"
      >
        {loading && reels.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center bg-black">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : reels.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-black text-text-secondary gap-4">
            <Film className="w-16 h-16 opacity-30 text-white" />
            <p className="text-lg font-medium text-white/70">Chưa có thước phim nào.</p>
          </div>
        ) : (
          reels.map((article, index) => (
            <ReelItem 
              key={article.id} 
              article={article} 
              isActive={index === activeIndex} 
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Reels;
