import { useState, useEffect, useRef } from 'react';
import { articleApi, type ArticleResponse } from '../api/articleApi';
import { Film } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ReelItem } from '../components/reels/ReelItem';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';

const isReel = (article: ArticleResponse): boolean => {
  if (article.tags && article.tags.includes('reel')) return true;
  if (!article.content) return false;
  const videoMatches = article.content.match(/<video src="([^"]+)"/g);
  const imageMatches = article.content.match(/!\[image\]\([^)]+\)/g);
  return (videoMatches?.length === 1) && (!imageMatches || imageMatches.length === 0);
};

const Reels = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<{id: string}>();
  const initialReel = location.state?.initialReel as ArticleResponse | undefined;

  const [reels, setReels] = useState<ArticleResponse[]>(initialReel ? [initialReel] : []);
  const [loading, setLoading] = useState(true);
  const pageRef = useRef(0);
  const isFetchingRef = useRef(false);
  const [hasMore, setHasMore] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchReels = async (isInitial: boolean = false) => {
    if (isFetchingRef.current || (!hasMore && !isInitial)) return;
    isFetchingRef.current = true;
    
    try {
      let currentPage = isInitial ? 0 : pageRef.current + 1;
      let newReelsFound: ArticleResponse[] = [];
      let isLast = false;
      let fetchedPagesCount = 0;
      
      let fetchedInitialReel: ArticleResponse | undefined = undefined;
      if (isInitial && id && !initialReel) {
        try {
          const res = await articleApi.getById(id);
          fetchedInitialReel = res as any;
        } catch (e) {
          console.error('Failed to fetch initial reel by id', e);
        }
      }

      while (newReelsFound.length === 0 && !isLast && fetchedPagesCount < 5) {
        const res: any = await articleApi.getFeed(currentPage, 100);
        const data = res.content || res.data?.content || [];
        
        const videoArticles = data.filter((a: ArticleResponse) => isReel(a));
        newReelsFound = videoArticles;
        isLast = res.last || false;
        
        if (newReelsFound.length === 0 && !isLast) {
          currentPage++;
          fetchedPagesCount++;
        }
      }
      
      pageRef.current = currentPage;
      if (isLast) setHasMore(false);
      
      const targetInitialReel = initialReel || fetchedInitialReel;

      if (isInitial) {
        if (targetInitialReel) {
          const filtered = newReelsFound.filter((a: ArticleResponse) => a.id !== targetInitialReel.id);
          setReels([targetInitialReel, ...filtered]);
        } else {
          setReels(newReelsFound);
        }
      } else {
        setReels(prev => {
          const newIds = new Set(prev.map(r => r.id));
          const uniqueNewReels = newReelsFound.filter((r: ArticleResponse) => !newIds.has(r.id));
          return [...prev, ...uniqueNewReels];
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    fetchReels(true);
  }, []);

  const handleScroll = () => {
    if (!containerRef.current) return;
    
    const scrollPosition = containerRef.current.scrollTop;
    const windowHeight = containerRef.current.clientHeight;
    const currentIndex = Math.round(scrollPosition / windowHeight);
    
    if (currentIndex !== activeIndex) {
      setActiveIndex(currentIndex);
      
      if (reels[currentIndex]) {
        navigate(`/reels/${reels[currentIndex].id}`, { replace: true, state: location.state });
      }

      if (hasMore && currentIndex >= reels.length - 2 && !isFetchingRef.current) {
        fetchReels(false);
      }
    }
  };

  return (
    <div className="bg-black sm:bg-background/90 w-full h-[calc(100vh-4rem)] sm:h-screen flex justify-center overflow-hidden">
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
        className="w-full h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide bg-transparent relative flex flex-col items-center"
      >
        {loading && reels.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center">
            <Spinner size="lg" className="text-primary" />
          </div>
        ) : reels.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center p-8">
            <EmptyState
              icon={<Film className="w-16 h-16 opacity-30 text-white mb-4" />}
              title="Chưa có thước phim nào"
              description="Hãy theo dõi thêm người dùng để xem các thước phim mới."
              className="border-none bg-transparent text-white"
            />
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
