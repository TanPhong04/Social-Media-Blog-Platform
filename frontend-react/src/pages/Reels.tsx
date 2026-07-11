import React, { useState, useEffect, useRef } from 'react';
import { articleApi, type ArticleResponse } from '../api/articleApi';
import { Heart, MessageCircle, Share2, Music, Film } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../api/userApi';
import ShareModal from '../components/ShareModal';

const ReelItem = ({ article, isActive }: { article: ArticleResponse, isActive: boolean }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [author, setAuthor] = useState<any>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // Extract video URL
  let videoUrl = '';
  const videoRegex = /<video src="([^"]+)"[^>]*><\/video>/;
  const match = videoRegex.exec(article.content);
  if (match) videoUrl = match[1];

  // Extract text
  const textContent = article.content.replace(/<video src="([^"]+)"[^>]*><\/video>/g, '').trim();

  useEffect(() => {
    if (isActive) {
      videoRef.current?.play().catch(e => console.log('Auto-play blocked', e));
      setIsPlaying(true);
    } else {
      videoRef.current?.pause();
      setIsPlaying(false);
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
    <div className="relative w-full h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)] max-w-lg mx-auto bg-black flex items-center justify-center snap-start snap-always shrink-0 overflow-hidden">
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-cover cursor-pointer"
        loop
        playsInline
        onClick={togglePlay}
      />

      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center">
            <div className="w-0 h-0 border-t-8 border-t-transparent border-l-[16px] border-l-white border-b-8 border-b-transparent ml-1" />
          </div>
        </div>
      )}

      {/* Right Actions Overlay */}
      <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 z-20">
        <button 
          onClick={(e) => { e.stopPropagation(); navigate(`/profile?userId=${article.authorId}`); }}
          className="w-11 h-11 rounded-full border-2 border-white overflow-hidden"
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
          <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center group-hover:bg-black/60 transition">
            <Heart className={`w-6 h-6 ${liked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
          </div>
          <span className="text-white text-xs font-medium shadow-black drop-shadow-md">{likeCount > 0 ? likeCount : ''}</span>
        </button>

        <button onClick={() => navigate(`/?articleId=${article.id}`)} className="flex flex-col items-center gap-1 group">
          <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center group-hover:bg-black/60 transition">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs font-medium shadow-black drop-shadow-md">Bình luận</span>
        </button>

        <button onClick={handleShare} className="flex flex-col items-center gap-1 group">
          <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center group-hover:bg-black/60 transition">
            <Share2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs font-medium shadow-black drop-shadow-md">Chia sẻ</span>
        </button>
      </div>

      {/* Bottom Info Overlay */}
      <div className="absolute left-4 bottom-4 right-20 z-20 pointer-events-none">
        <div className="flex items-center gap-2 mb-2 pointer-events-auto">
          <span 
            className="text-white font-bold text-[15px] cursor-pointer hover:underline shadow-black drop-shadow-md"
            onClick={(e) => { e.stopPropagation(); navigate(`/profile?userId=${article.authorId}`); }}
          >
            {author?.displayName || author?.username || 'Đang tải...'}
          </span>
          <button className="px-3 py-1 rounded-full border border-white text-white text-[13px] font-medium hover:bg-white/10 transition">
            Theo dõi
          </button>
        </div>

        {textContent && (
          <p className="text-white text-[14px] line-clamp-2 mb-3 shadow-black drop-shadow-md">
            {textContent}
          </p>
        )}

        <div className="flex items-center gap-2 text-white">
          <Music className="w-4 h-4 animate-spin-slow" />
          <div className="overflow-hidden w-40 whitespace-nowrap mask-image-linear">
            <span className="inline-block animate-marquee text-[13px] font-medium shadow-black drop-shadow-md">
              Âm thanh gốc - {author?.displayName || 'Unknown'}
            </span>
          </div>
        </div>
      </div>
      
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareUrl={`${window.location.origin}/article/${article.id}`}
        title={article.title || 'Reel từ Axion'}
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
      
      // Lọc ra các bài viết có video (được coi là Reel)
      const videoArticles = data.filter(a => /<video src="([^"]+)"[^>]*><\/video>/.test(a.content));
      
      if (pageNum === 0) {
        setReels(videoArticles);
      } else {
        setReels(prev => [...prev, ...videoArticles]);
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
    
    // Tính toán index của Reel đang hiển thị
    const scrollPosition = containerRef.current.scrollTop;
    const windowHeight = containerRef.current.clientHeight;
    const currentIndex = Math.round(scrollPosition / windowHeight);
    
    if (currentIndex !== activeIndex) {
      setActiveIndex(currentIndex);
    }

    // Tải thêm reels nếu cuộn gần đến cuối
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
          animation: spin 3s linear infinite;
        }
      `}</style>
      
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full max-w-[500px] h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide bg-black relative"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {loading && reels.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : reels.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary gap-4">
            <Film className="w-12 h-12 opacity-50" />
            <p>Chưa có thước phim nào.</p>
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
