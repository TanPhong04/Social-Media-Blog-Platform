import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { articleApi, type ArticleResponse } from '../api/articleApi';
import { commentApi, type CommentResponse } from '../api/commentApi';
import { followerApi } from '../api/followerApi';
import { userApi, type ProfileResponse } from '../api/userApi';
import { mediaApi } from '../api/mediaApi';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, MessageCircle, UserPlus, UserMinus, Smile, Image as ImageIcon, Send, X, ThumbsUp, Share2 } from 'lucide-react';
import AiChatDrawer from '../components/AiChatDrawer';
import ShareModal from '../components/ShareModal';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { ArticleActions } from '../components/feed/ArticleActions';


// Sub-component hiển thị từng hình ảnh/video cho trang Chi tiết
const MediaItemDetail: React.FC<{ url: string; articleId: string; isVideo?: boolean; onMediaClick?: (url: string) => void }> = ({ url, isVideo, onMediaClick }) => {
  return (
    <div className="relative group/media rounded-2xl overflow-hidden border border-border-subtle bg-black/20 flex items-center justify-center">
      {isVideo ? (
        <video 
           src={url} 
           controls 
           controlsList="nodownload"
           className="w-full max-h-[700px] object-contain outline-none bg-black rounded-2xl" 
           onClick={(e) => e.stopPropagation()} 
        />
      ) : (
        <img 
          src={url} 
          alt="Article Attachment" 
          className="w-full max-h-[700px] object-contain hover:opacity-95 transition-opacity cursor-pointer" 
          onClick={(e) => { 
            e.stopPropagation(); 
            if (onMediaClick) onMediaClick(url);
            else window.open(url, '_blank'); 
          }} 
        />
      )}
    </div>
  );
};

import { CommentItem } from '../components/comments/CommentItem';

interface ArticleDetailProps {
  articleId?: string;
  onClose?: () => void;
  initialMediaUrl?: string;
}

const ArticleDetail: React.FC<ArticleDetailProps> = ({ articleId, onClose, initialMediaUrl }) => {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const slug = articleId || paramSlug;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Use local state if initialMediaUrl is provided to avoid modifying URL in feed
  const [localMediaUrl, setLocalMediaUrl] = useState<string | null>(initialMediaUrl || null);
  const mediaUrlQuery = localMediaUrl || searchParams.get('mediaUrl');

  const handleCloseTheater = () => {
    if (localMediaUrl) {
       setLocalMediaUrl(null);
       if (onClose && initialMediaUrl) onClose();
    } else if (onClose) {
       // In modal overlay mode: close the entire modal to return to feed
       onClose();
    } else {
       // In standalone page mode: go back to home
       navigate('/');
    }
  };

  const { user } = useAuth();
  
  const [article, setArticle] = useState<ArticleResponse | null>(null);
  const [author, setAuthor] = useState<ProfileResponse | null>(null);
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isReposted, setIsReposted] = useState(false);
  const [repostCount, setRepostCount] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const mainEmojiPickerRef = useRef<HTMLDivElement>(null);
  
  const [commentImage, setCommentImage] = useState<string | null>(null);
  const commentImageInputRef = useRef<HTMLInputElement>(null);

  // Khóa scroll nền khi mở Modal
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (mainEmojiPickerRef.current && !mainEmojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Nạp trạng thái đăng lại (repost)
  useEffect(() => {
    if (user && article) {
      try {
        const reposts = JSON.parse(localStorage.getItem(`reposts_${user.id}`) || '[]');
        setIsReposted(reposts.some((b: any) => b.id === article.id));
      } catch (e) {
        setIsReposted(false);
      }
    }
  }, [article, user]);

  const handleCommentImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    try {
      const url = await mediaApi.uploadFile(file);
      setCommentImage(url);
    } catch (err) {
      console.error('Error uploading comment image:', err);
    }
  };

  const handleRepostToggle = async () => {
    if (!user) return navigate('/login');
    if (!article) return;

    try {
      if (isReposted) {
        const commentsData = await commentApi.getComments(article.id);
        const list = (commentsData as any).content || (commentsData as any).data?.content || commentsData || [];
        const myRepostComment = list.find((c: any) => c.authorId === user.id && c.content.includes('[repost]'));
        if (myRepostComment) {
          await commentApi.deleteComment(myRepostComment.id);
        }
        const reposts = JSON.parse(localStorage.getItem(`reposts_${user.id}`) || '[]');
        const updated = reposts.filter((b: any) => b.id !== article.id);
        localStorage.setItem(`reposts_${user.id}`, JSON.stringify(updated));
        setIsReposted(false);
        setRepostCount(prev => Math.max(0, prev - 1));
      } else {
        await commentApi.createComment({
          articleId: article.id,
          content: `[repost] đã đăng lại bài viết này`
        });
        const reposts = JSON.parse(localStorage.getItem(`reposts_${user.id}`) || '[]');
        reposts.push({ id: article.id });
        localStorage.setItem(`reposts_${user.id}`, JSON.stringify(reposts));
        setIsReposted(true);
        setRepostCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Error toggling repost', err);
    }
  };

  const [reelsFeed, setReelsFeed] = useState<ArticleResponse[]>([]);
  
  useEffect(() => {
    if (mediaUrlQuery) {
      articleApi.getFeed(0, 100).then((res: any) => {
         const data = res.content || res.data?.content || [];
         const reels = data.filter((a: any) => {
            if (a.tags && a.tags.includes('reel')) return true;
            if (!a.content) return false;
            const videoMatches = a.content.match(/<video src="([^"]+)"/g);
            const imageMatches = a.content.match(/!\[image\]\(([^)]+)\)/g);
            return (videoMatches?.length === 1) && (!imageMatches || imageMatches.length === 0);
         });
         setReelsFeed(reels);
      }).catch(console.error);
    }
  }, [mediaUrlQuery]);

  const goToNextReel = (direction: 'next' | 'prev') => {
    if (!article || reelsFeed.length === 0) return;
    const currentIndex = reelsFeed.findIndex(r => r.id === article.id);
    if (currentIndex === -1) return;
    
    let targetIndex = currentIndex;
    if (direction === 'next' && currentIndex < reelsFeed.length - 1) {
       targetIndex = currentIndex + 1;
    } else if (direction === 'prev' && currentIndex > 0) {
       targetIndex = currentIndex - 1;
    }
    
    if (targetIndex !== currentIndex) {
       const targetReel = reelsFeed[targetIndex];
       const srcMatch = targetReel.content?.match(/<video src="([^"]+)"/);
       const targetVideoUrl = srcMatch ? srcMatch[1] : '';
       navigate(`/article/${targetReel.id}?mediaUrl=${encodeURIComponent(targetVideoUrl)}`, { replace: true });
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY > 50) goToNextReel('next');
    else if (e.deltaY < -50) goToNextReel('prev');
  };

  const touchStartY = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartY.current - e.changedTouches[0].clientY;
    if (diff > 50) goToNextReel('next');
    else if (diff < -50) goToNextReel('prev');
  };

  useEffect(() => {
    if (slug) {
      fetchData();
    }
  }, [slug, user?.id]);

  useEffect(() => {
    if (user && article) {
      if (mediaUrlQuery) {
        articleApi.getMediaInteraction(mediaUrlQuery).then((res: any) => {
          setLikeCount(res.count || res.likesCount || 0);
          setIsLiked(res.likedByCurrentUser || res.isLiked || false);
          setMyReaction(res.reactionType || (res.likedByCurrentUser ? 'LIKE' : null));
        }).catch(() => {});
      } else {
        articleApi.getArticleInteraction(article.id).then((res: any) => {
          setLikeCount(res.likesCount || res.count || 0);
          setIsLiked(res.isLiked || res.likedByCurrentUser || false);
          setMyReaction(res.reactionType || (res.isLiked ? 'LIKE' : null));
        }).catch(() => {});
      }
    }
  }, [mediaUrlQuery, article?.id, user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch article (Supports both friendly slug and raw article UUID)
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug || '');
      let articleData: any;
      if (isUuid) {
        articleData = await articleApi.getById(slug!);
      } else {
        articleData = await articleApi.getBySlug(slug!);
      }
      // Type assertion is needed because response object might directly be the data, check interceptor
      const art = articleData as unknown as ArticleResponse;
      setArticle(art);

      // Fetch author profile
      if (art.authorId) {
         try {
           const authorData = await userApi.getUserById(art.authorId);
           setAuthor(authorData as unknown as ProfileResponse);
           
           // Fetch follow status if logged in
           if (user && user.id !== art.authorId) {
             try {
                await followerApi.status(art.authorId);
                setIsFollowing(true);
             } catch(err) {
                setIsFollowing(false);
             }
           }
         } catch(e) { console.error("Could not fetch author", e); }
      }

      // Fetch comments
      try {
        const commentsData = await commentApi.getComments(art.id, mediaUrlQuery);
        const list = (commentsData as any).content || (commentsData as any).data?.content || commentsData || [];
        setComments(list.filter((c: any) => !c.content.includes('[repost]')));
        const count = list.filter((c: any) => c.content.includes('[repost]')).length;
        setRepostCount(count);
      } catch(e) { console.error("Could not fetch comments", e); }

      // Fetch interaction
      if (user) {
        try {
          const interaction = await articleApi.getArticleInteraction(art.id);
          const ia = interaction as any;
          setLikeCount(ia.likesCount || 0);
          setIsLiked(ia.isLiked || false);
          setMyReaction(ia.reactionType || (ia.isLiked ? 'LIKE' : null));
        } catch(e) { console.error("Could not fetch interactions", e); }
      }

    } catch (err) {
      console.error('Error fetching article detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!user) return navigate('/login');
    if (!author) return;

    try {
      if (isFollowing) {
        await followerApi.unfollow(author.id);
        setIsFollowing(false);
      } else {
        await followerApi.follow(author.id);
        setIsFollowing(true);
      }
    } catch (err) {
      console.error('Error toggling follow', err);
    }
  };

  const handleLike = async (e: React.MouseEvent, reactionType: string = 'LIKE') => {
    e.stopPropagation();
    if (!user) return navigate('/login');
    if (!article) return;
    
    setShowReactionPicker(false);
    
    const nextLiked = !isLiked || (isLiked && myReaction !== reactionType);
    setIsLiked(nextLiked);
    setMyReaction(nextLiked ? reactionType : null);
    
    if (nextLiked && !isLiked) setLikeCount(c => c + 1);
    if (!nextLiked && isLiked) setLikeCount(c => Math.max(0, c - 1));

    try {
      if (nextLiked) {
        if (mediaUrlQuery) {
          await articleApi.likeMedia(mediaUrlQuery, article.id, reactionType);
        } else {
          await articleApi.likeArticle(article.id, reactionType);
        }
      } else {
        if (mediaUrlQuery) {
          await articleApi.unlikeMedia(mediaUrlQuery);
        } else {
          await articleApi.unlikeArticle(article.id);
        }
      }
    } catch (err) {
      console.error('Error toggling like', err);
      setIsLiked(!nextLiked);
      setMyReaction(isLiked ? myReaction : null);
      if (nextLiked && !isLiked) setLikeCount(c => Math.max(0, c - 1));
      if (!nextLiked && isLiked) setLikeCount(c => c + 1);
    }
  };

  const handlePostComment = async () => {
    if (!user) return navigate('/login');
    if (!article || !newComment.trim()) return;

    setSubmittingComment(true);
    try {
      let finalContent = newComment;
      if (commentImage) {
        finalContent += `\n\n![comment_image](${commentImage})`;
      }

      await commentApi.createComment({
        articleId: article.id,
        targetUrl: mediaUrlQuery,
        content: finalContent
      });
      setNewComment('');
      setCommentImage(null);
      if (commentImageInputRef.current) commentImageInputRef.current.value = '';

      const commentsData = await commentApi.getComments(article.id, mediaUrlQuery);
      const list = (commentsData as any).content || (commentsData as any).data?.content || commentsData || [];
      setComments(list.filter((c: any) => !c.content.includes('[repost]')));
      const count = list.filter((c: any) => c.content.includes('[repost]')).length;
      setRepostCount(count);
    } catch (err) {
      console.error('Error posting comment', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
      return (
        <div className="max-w-2xl mx-auto border-x-0 sm:border-x border-border-default min-h-screen bg-background p-8 flex items-center justify-center">
           <Spinner size="lg" className="text-primary" />
        </div>
      );
    }

  if (!article) {
      return (
        <div className="max-w-2xl mx-auto border-x-0 sm:border-x border-border-default min-h-screen bg-background p-8 flex items-center justify-center">
          <EmptyState 
            title="Không tìm thấy bài viết" 
            description="Bài viết này không tồn tại hoặc đã bị xóa." 
            action={<Button onClick={() => navigate('/')} variant="secondary">Quay lại trang chủ</Button>} 
            className="border-none bg-transparent"
          />
        </div>
      );
    }

  return (
    <div className={mediaUrlQuery ? "fixed inset-0 z-[9999] bg-black flex overflow-hidden" : "max-w-2xl mx-auto border-x-0 sm:border-x border-border-default min-h-screen bg-background pb-20"}>
      {mediaUrlQuery && (
        <div 
          className="flex-1 relative flex items-center justify-center bg-black"
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button 
             onClick={handleCloseTheater} 
             className="absolute top-4 left-4 p-3 bg-surface-elevated hover:bg-white/20 rounded-full z-[10000] text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          {article?.content?.includes(`<video src="${mediaUrlQuery}"`) ? (
            <div className="relative w-full max-w-[420px] h-[calc(100vh-4rem)] mx-auto flex items-center justify-center">
              <video src={mediaUrlQuery} controls autoPlay className="w-full h-full object-cover outline-none" />
              
              {/* Right Actions Overlay */}
              <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 z-20">
                <button 
                  onClick={(e) => { e.stopPropagation(); navigate(`/profile?userId=${article.authorId}`); }}
                  className="w-11 h-11 rounded-full border-[2px] border-white overflow-hidden shadow-lg"
                >
                  {author?.avatarUrl ? (
                    <img src={author.avatarUrl} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary flex items-center justify-center text-white text-sm font-bold">
                      {(author?.displayName || 'U').substring(0,2).toUpperCase()}
                    </div>
                  )}
                </button>

                <div 
                  className="relative flex flex-col items-center gap-1"
                  onMouseEnter={() => setShowReactionPicker(true)}
                  onMouseLeave={() => setShowReactionPicker(false)}
                >
                  {showReactionPicker && (
                    <div className="absolute right-full pr-2 bottom-0 py-4 flex items-center z-50">
                      <div className="bg-black/60 backdrop-blur-md border border-white/20 rounded-full px-3 py-2 flex items-center gap-2 shadow-xl animate-[slideIn_0.2s_ease-out]">
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
                          className="text-2xl hover:scale-125 transition-transform origin-bottom cursor-pointer"
                          title={reaction.type}
                        >
                          {reaction.icon}
                        </button>
                      ))}
                      </div>
                    </div>
                  )}
                  <button onClick={(e) => handleLike(e, 'LIKE')} className="flex flex-col items-center gap-1 group">
                    <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center group-hover:bg-black/40 transition backdrop-blur-sm">
                      {myReaction === 'LOVE' ? <span className="text-2xl leading-none">❤️</span> :
                       myReaction === 'HAHA' ? <span className="text-2xl leading-none">😆</span> :
                       myReaction === 'WOW' ? <span className="text-2xl leading-none">😮</span> :
                       myReaction === 'SAD' ? <span className="text-2xl leading-none">😢</span> :
                       myReaction === 'ANGRY' ? <span className="text-2xl leading-none">😡</span> :
                       myReaction === 'LIKE' ? <span className="text-2xl leading-none text-primary">👍</span> :
                       <ThumbsUp className={`w-6 h-6 text-white drop-shadow-md transition-transform duration-300 ${isLiked ? 'fill-current text-primary' : ''}`} />
                      }
                    </div>
                    <span className="text-white text-xs font-bold drop-shadow-md">{likeCount > 0 ? likeCount : 'Thích'}</span>
                  </button>
                </div>

                <button onClick={() => {}} className="flex flex-col items-center gap-1 group cursor-default">
                  <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center transition backdrop-blur-sm">
                    <MessageCircle className="w-6 h-6 text-white drop-shadow-md" />
                  </div>
                  <span className="text-white text-xs font-bold drop-shadow-md">{comments.length}</span>
                </button>

                <button onClick={(e) => { e.stopPropagation(); setShowShareModal(true); }} className="flex flex-col items-center gap-1 group">
                  <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center group-hover:bg-black/40 transition backdrop-blur-sm">
                    <Share2 className="w-6 h-6 text-white drop-shadow-md" />
                  </div>
                  <span className="text-white text-xs font-bold drop-shadow-md">Chia sẻ</span>
                </button>
              </div>

              {/* Bottom Info Overlay */}
              <div className="absolute left-4 bottom-6 right-20 z-20 flex items-end justify-between pointer-events-none">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 pointer-events-auto">
                    <span 
                      className="text-white font-bold text-[16px] cursor-pointer hover:underline drop-shadow-md"
                      onClick={(e) => { e.stopPropagation(); navigate(`/profile?userId=${article.authorId}`); }}
                    >
                      {author?.displayName || author?.username || 'Đang tải...'}
                    </span>
                  </div>
                  <div className="mb-4 pr-4 pointer-events-auto">
                    <p className={`text-white text-[15px] drop-shadow-md leading-snug font-medium whitespace-pre-wrap ${!isExpanded ? 'line-clamp-2' : ''}`}>
                      {article.content?.replace(/<video src="([^"]+)"[^>]*>(?:<\/video>)?/g, '').replace(/!\[image\]\(([^)]+)\)/g, '').trim()}
                    </p>
                    {(article.content?.replace(/<video src="([^"]+)"[^>]*>(?:<\/video>)?/g, '').replace(/!\[image\]\(([^)]+)\)/g, '').trim().length || 0) > 80 && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                        className="text-white/80 font-bold text-[13px] hover:underline mt-1"
                      >
                        {isExpanded ? 'Ẩn bớt' : '...xem thêm'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <img src={mediaUrlQuery} className="max-w-full max-h-full object-contain" alt="Theater view" />
          )}
        </div>
      )}
      <div className={mediaUrlQuery ? "w-[400px] flex-shrink-0 bg-background border-l border-border-subtle flex flex-col h-full overflow-y-auto" : "w-full"}>
        {/* Header */}
        {!mediaUrlQuery && (
          <div className="sticky top-16 z-40 bg-background/80 backdrop-blur-xl border-b border-border-default px-4 py-3 flex items-center gap-4">
            <button onClick={onClose || (() => navigate('/'))} className="p-2 hover:bg-surface-elevated rounded-full transition-colors">
               <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-heading font-bold truncate">Bài viết</h1>
          </div>
        )}

      <div className="p-6">
         {/* Author Info */}
         <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white font-bold shadow-md overflow-hidden">
                {author?.avatarUrl ? (
                   <img src={author.avatarUrl} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                   author?.displayName?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">{author?.displayName || 'Unknown User'}</h3>
                <p className="text-sm text-text-secondary">{new Date(article.publishedAt || article.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric'})}</p>
              </div>
            </div>
            {user && user.id !== article.authorId && (
              <button
                onClick={handleFollowToggle}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all duration-300 ${
                  isFollowing
                    ? 'bg-surface border border-border-subtle text-text-secondary hover:text-red-400 hover:border-red-400/50'
                    : 'bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/25'
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserMinus className="w-4 h-4" />
                    Bỏ theo dõi
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Theo dõi
                  </>
                )}
              </button>
            )}
         </div>


         {/* Content */}
         <div className="text-text-primary text-[16px] leading-relaxed whitespace-pre-wrap mb-10 break-words">
           {(() => {
             let textToShow = article.content || '';
             

             let images: string[] = [];
             let videos: string[] = [];

             // Tìm TẤT CẢ ảnh nhúng
             const imgRegex = /!\[image\]\(([^\)]+)\)/g;
             let imgMatch;
             while ((imgMatch = imgRegex.exec(textToShow)) !== null) {
               images.push(imgMatch[1]);
             }
             textToShow = textToShow.replace(/!\[image\]\(([^\)]+)\)/g, '');

             // Tìm TẤT CẢ video nhúng
             const videoRegex = /<video src="([^"]+)"/g;
             let videoMatch;
             while ((videoMatch = videoRegex.exec(textToShow)) !== null) {
               videos.push(videoMatch[1]);
             }
             textToShow = textToShow.replace(/<video src="([^"]+)"[^>]*>(?:<\/video>)?/g, '');

             return (
               <>
                 <div>{textToShow.trim()}</div>
                 
                 {!mediaUrlQuery && images.length > 0 && (
                   <div className={`mt-8 grid gap-4 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                     {images.map((src, i) => (
                       <MediaItemDetail key={i} url={src} articleId={article.id} isVideo={false} onMediaClick={(u) => setLocalMediaUrl(u)} />
                     ))}
                   </div>
                 )}

                 {!mediaUrlQuery && videos.length > 0 && (
                   <div className={`mt-8 grid gap-4 ${videos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                     {videos.map((src, i) => (
                       <MediaItemDetail key={i} url={src} articleId={article.id} isVideo={true} />
                     ))}
                   </div>
                 )}
               </>
             );
           })()}
         </div>

         {/* Tags */}
         {article.tags && article.tags.length > 0 && (
           <div className="flex flex-wrap gap-2 mb-8 mt-4">
             {article.tags.map(tag => (
               <span key={tag} className="px-3 py-1 bg-surface border border-border-default text-text-secondary rounded-full text-xs hover:text-primary hover:border-primary/50 cursor-pointer transition-colors">
                 #{tag}
               </span>
             ))}
           </div>
         )}

         {/* Interaction Bar */}
          {(!mediaUrlQuery || !article?.content?.includes('<video')) && (
            <div className="mb-8 border-b border-border-default pb-4">
              <ArticleActions
                isLiked={isLiked}
                likeCount={likeCount}
                isBookmarked={false}
                bookmarkCount={0}
                isReposted={isReposted}
                repostCount={repostCount}
                commentCount={comments.length}
                onLike={() => handleLike({ stopPropagation: () => {} } as any, 'LIKE')}
                onBookmark={() => {}}
                onRepost={handleRepostToggle}
                onCommentClick={() => { document.querySelector<HTMLInputElement>('input[placeholder="Post your reply"]')?.focus(); }}
                onShareClick={() => setShowShareModal(true)}
              />
            </div>
          )}

          {/* Comments Section */}
         <div>
            <h3 className="text-xl font-heading font-bold mb-6 text-text-primary">Bình luận ({comments.length})</h3>
            
            {/* Comment Input */}
            {user ? (
              <div className="space-y-3 mb-8">
                <div className="flex gap-3 items-center">
                  <div className="shrink-0">
                     <Avatar src={user.avatarUrl} fallback={user.displayName?.charAt(0).toUpperCase() || 'U'} size="md" />
                  </div>
                  
                  <div className="flex-1 flex gap-2 items-center bg-surface-elevated border border-border-default rounded-full px-4 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all shadow-sm">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Post your reply"
                      className="flex-1 bg-transparent border-0 text-text-primary text-sm focus:outline-none placeholder-text-secondary"
                    />
                    
                    <button
                      type="button"
                      onClick={() => commentImageInputRef.current?.click()}
                      className={`p-1.5 rounded-full hover:bg-surface-elevated transition-colors cursor-pointer shrink-0 ${commentImage ? 'text-primary' : 'text-text-secondary'}`}
                      title="Thêm hình ảnh"
                    >
                      <ImageIcon className="w-4.5 h-4.5" />
                    </button>
                    <input
                      type="file"
                      ref={commentImageInputRef}
                      onChange={handleCommentImageChange}
                      accept="image/*"
                      className="hidden"
                    />

                    <div className="relative" ref={mainEmojiPickerRef}>
                      <button 
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-1.5 hover:bg-surface-elevated text-text-secondary hover:text-primary transition-colors cursor-pointer shrink-0"
                      >
                        <Smile className="w-4.5 h-4.5" />
                      </button>
                      {showEmojiPicker && (
                        <div className="absolute right-0 bottom-10 z-50 bg-surface border border-border-subtle rounded-xl shadow-2xl p-3 w-72">
                          <div className="grid grid-cols-6 gap-1 max-h-40 overflow-y-auto">
                            {['😊', '😂', '🤣', '👍', '❤️', '🔥', '🎉', '✨', '👏', '😍', '🥰', '😘', '😃', '😄', '😁', '😆', '😅', '😉', '😌', '😎', '😢', '😭', '😡', '👍', '🙌', '🙏'].map(emoji => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => {
                                  setNewComment(prev => prev + emoji);
                                  setShowEmojiPicker(false);
                                }}
                                className="text-lg p-1 hover:bg-surface-elevated rounded text-center cursor-pointer"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handlePostComment}
                      disabled={submittingComment || (!newComment.trim() && !commentImage)}
                      className="p-1.5 bg-primary hover:bg-primary/95 text-white rounded-full transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {commentImage && (
                  <div className="ml-13 relative inline-block">
                    <img src={commentImage} alt="Comment Preview" className="max-h-24 max-w-[150px] object-contain rounded-lg border border-border-subtle" />
                    <button
                      type="button"
                      onClick={() => {
                        setCommentImage(null);
                        if (commentImageInputRef.current) commentImageInputRef.current.value = '';
                      }}
                      className="absolute -top-1.5 -right-1.5 bg-black/70 hover:bg-black/90 text-white rounded-full p-1 transition-colors cursor-pointer border border-border-subtle"
                      title="Gỡ ảnh"
                    >
                      <span className="text-[10px] leading-none">✕</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-surface/50 border border-border-subtle rounded-xl p-6 text-center mb-8">
                <p className="text-text-secondary mb-4">Vui lòng đăng nhập để tham gia thảo luận.</p>
                <button onClick={() => navigate('/login')} className="px-6 py-2 bg-primary text-white rounded-full font-semibold">Đăng nhập</button>
              </div>
            )}

            {/* Comment List */}
            <div className="space-y-6">
               {comments.filter(c => c.parentId === null).map((comment) => {
                 const replies = comments.filter(c => c.parentId === comment.id);
                 return (
                   <CommentItem 
                     key={comment.id} 
                     comment={comment} 
                     replies={replies} 
                     user={user} 
                     targetUrl={mediaUrlQuery}
                     onReplySuccess={fetchData} 
                   />
                 );
               })}
            </div>
         </div>
      </div>
      </div>
      {article && (
        <AiChatDrawer
          isOpen={aiChatOpen}
          onClose={() => setAiChatOpen(false)}
          articleId={article.id}
          articleTitle={article.title || 'Bài đăng'}
          articleContent={article.content}
        />
      )}
      {article && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          shareUrl={`${window.location.origin}/article/${article.id}`}
          title={article.title || 'Bài đăng'}
        />
      )}
    </div>
  );
};

export default ArticleDetail;
