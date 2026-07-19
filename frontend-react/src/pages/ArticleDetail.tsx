import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { articleApi, type ArticleResponse } from '../api/articleApi';
import { commentApi, type CommentResponse } from '../api/commentApi';
import { followerApi } from '../api/followerApi';
import { userApi, type ProfileResponse } from '../api/userApi';
import { mediaApi } from '../api/mediaApi';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, ThumbsUp, Share2, Bookmark, UserPlus, UserMinus, ArrowLeft, Repeat, Smile, Image as ImageIcon, Send, X } from 'lucide-react';

// Sub-component hiển thị từng hình ảnh/video cho trang Chi tiết
const MediaItemDetail: React.FC<{ url: string; articleId: string; isVideo?: boolean; onMediaClick?: (url: string) => void }> = ({ url, isVideo, onMediaClick }) => {
  return (
    <div className="relative group/media rounded-2xl overflow-hidden border border-white/10 bg-black/20 flex items-center justify-center">
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

const CommentItem: React.FC<{
  comment: CommentResponse;
  replies: CommentResponse[];
  user: any;
  targetUrl?: string | null;
  onReplySuccess: () => void;
}> = ({ comment, replies, user, targetUrl, onReplySuccess }) => {
  const [author, setAuthor] = useState<any>(null);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const isRepost = comment.content.includes('[repost]');

  useEffect(() => {
    const fetchAuthor = async () => {
      try {
        const res = await userApi.getUserById(comment.authorId);
        const data = (res as any).data || res;
        setAuthor(data);
      } catch (e) {
        console.warn(e);
      }
    };
    fetchAuthor();
  }, [comment.authorId]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handlePostReply = async () => {
    if (!user) return;
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      await commentApi.createComment({
        articleId: comment.articleId,
        parentId: comment.id,
        targetUrl: targetUrl,
        content: replyText
      });
      setReplyText('');
      setShowReplyBox(false);
      onReplySuccess();
    } catch (err) {
      console.error('Error posting reply', err);
    } finally {
      setSubmittingReply(false);
    }
  };

  const displayName = author ? author.displayName : `Người dùng ${comment.authorId.substring(0, 4)}`;
  const avatarUrl = author ? author.avatarUrl : null;
  const initials = author ? author.displayName.substring(0, 2).toUpperCase() : 'U';

  if (isRepost) {
    return (
      <div className="flex gap-4 items-center bg-green-500/5 border border-green-500/10 rounded-xl p-4 my-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-green-500 to-emerald-600 overflow-hidden flex items-center justify-center text-white font-bold text-xs shrink-0 shadow">
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="flex-1 flex items-center gap-2">
          <span className="font-semibold text-green-400 text-sm">{displayName}</span>
          <span className="text-xs text-text-secondary">đã đăng lại bài viết này</span>
          <Repeat className="w-3.5 h-3.5 text-green-500 ml-1 shrink-0 animate-pulse" />
        </div>
        <span className="text-xs text-text-secondary/50">{new Date(comment.createdAt).toLocaleDateString('vi-VN')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bình luận */}
      <div className="flex gap-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-500 overflow-hidden shrink-0 flex items-center justify-center font-bold text-white shadow">
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="flex-1 bg-surface border border-white/5 rounded-2xl rounded-tl-none p-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="font-semibold text-text-primary text-sm">{displayName}</span>
            <span className="text-xs text-text-secondary">{new Date(comment.createdAt).toLocaleDateString('vi-VN')}</span>
          </div>
          <p className="text-text-secondary text-sm leading-relaxed">{comment.content}</p>
          
          {user && (
            <div className="flex items-center gap-4 mt-3 pt-2 border-t border-white/5">
              <button 
                onClick={() => setShowReplyBox(!showReplyBox)}
                className="text-xs text-text-secondary hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Phản hồi</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Ô phản hồi */}
      {showReplyBox && (
        <div className="ml-12 flex gap-3 bg-surface/30 p-3 rounded-xl border border-white/5 relative">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-500 overflow-hidden shrink-0 flex items-center justify-center text-white font-bold text-xs">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              user?.displayName?.charAt(0).toUpperCase() || 'U'
            )}
          </div>
          <div className="flex-1 space-y-2 relative">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Phản hồi @${displayName}...`}
              className="w-full bg-surface border border-white/10 rounded-lg p-2 text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary/50 resize-none min-h-[60px]"
            />
            <div className="flex justify-between items-center relative">
              {/* Emoji trigger */}
              <div className="relative" ref={emojiPickerRef}>
                <button 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-1.5 hover:bg-white/5 rounded-full text-text-secondary hover:text-primary transition-colors cursor-pointer"
                >
                  <Smile className="w-4 h-4" />
                </button>
                {showEmojiPicker && (
                  <div className="absolute left-0 top-8 z-50 bg-surface border border-white/10 rounded-xl shadow-2xl p-3 w-72">
                    <div className="grid grid-cols-6 gap-1 max-h-40 overflow-y-auto">
                      {['😊', '😂', '🤣', '👍', '❤️', '🔥', '🎉', '✨', '👏', '😍', '🥰', '😘', '😃', '😄', '😁', '😆', '😅', '😉', '😌', '😎', '😢', '😭', '😡', '👍', '🙌', '🙏'].map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => {
                            setReplyText(prev => prev + emoji);
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

              <div className="flex gap-2">
                <button 
                  onClick={() => setShowReplyBox(false)}
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 text-text-primary text-xs font-semibold rounded-full transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button 
                  onClick={handlePostReply}
                  disabled={!replyText.trim() || submittingReply}
                  className="px-3 py-1 bg-primary text-white text-xs font-semibold rounded-full hover:bg-primary-hover disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {submittingReply ? 'Đang gửi...' : 'Gửi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bình luận phản hồi con */}
      {replies.length > 0 && (
        <div className="ml-12 pl-4 border-l border-white/5 space-y-4">
          {replies.map((reply) => (
            <CommentItem 
              key={reply.id} 
              comment={reply} 
              replies={[]} 
              user={user} 
              targetUrl={targetUrl}
              onReplySuccess={onReplySuccess} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

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
  const [likeCount, setLikeCount] = useState(0);
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
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
      <div className="max-w-3xl mx-auto border-x border-gray-800 min-h-screen bg-background p-8">
         <div className="animate-pulse space-y-4">
            <div className="h-8 bg-white/5 rounded w-3/4"></div>
            <div className="h-4 bg-white/5 rounded w-1/4"></div>
            <div className="h-64 bg-white/5 rounded w-full mt-8"></div>
         </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-3xl mx-auto border-x border-gray-800 min-h-screen bg-background p-8 text-center flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Không tìm thấy bài viết</h2>
        <button onClick={() => navigate('/')} className="text-primary hover:underline">Quay lại</button>
      </div>
    );
  }

  return (
    <div className={mediaUrlQuery ? "fixed inset-0 z-[9999] bg-black flex overflow-hidden" : "max-w-3xl mx-auto border-x border-gray-800 min-h-screen bg-background pb-20"}>
      {mediaUrlQuery && (
        <div className="flex-1 relative flex items-center justify-center bg-black">
          <button 
             onClick={handleCloseTheater} 
             className="absolute top-4 left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full z-[10000] text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          {article?.content?.includes(`<video src="${mediaUrlQuery}"`) ? (
            <video src={mediaUrlQuery} controls autoPlay className="max-w-full max-h-full object-contain outline-none" />
          ) : (
            <img src={mediaUrlQuery} className="max-w-full max-h-full object-contain" alt="Theater view" />
          )}
        </div>
      )}
      <div className={mediaUrlQuery ? "w-[400px] flex-shrink-0 bg-background border-l border-white/10 flex flex-col h-full overflow-y-auto" : "w-full"}>
        {/* Header */}
        {!mediaUrlQuery && (
          <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-gray-800 p-4 z-40 flex items-center gap-4">
            <button onClick={onClose || (() => navigate('/'))} className="p-2 hover:bg-white/5 rounded-full transition-colors">
               <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-heading font-bold truncate">Bài viết</h1>
          </div>
        )}

      <div className="p-6">
         {/* Article Title */}
         <h1 className="text-3xl font-heading font-bold mb-6 text-text-primary leading-tight">
           {article.title}
         </h1>

         {/* Author Info */}
         <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white font-bold shadow-md overflow-hidden">
                {author?.avatarUrl ? (
                   <img src={author.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
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
                    ? 'bg-surface border border-white/10 text-text-secondary hover:text-red-400 hover:border-red-400/50'
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
             
             // Xóa tiêu đề bị lặp ở đầu nội dung (vì đã render h1 ở trên)
             if (article.title && textToShow.trim().startsWith(article.title)) {
               textToShow = textToShow.trim().substring(article.title.length).trim();
             }
             
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
           <div className="flex flex-wrap gap-2 mb-8">
             {article.tags.map(tag => (
               <span key={tag} className="px-3 py-1 bg-surface border border-white/5 text-text-secondary rounded-full text-xs hover:text-primary cursor-pointer transition-colors">
                 #{tag}
               </span>
             ))}
           </div>
         )}

         {/* Interaction Bar */}
         <div className="flex items-center justify-between py-4 border-y border-white/5 mb-10">
            <div className="flex items-center gap-6">
               <div 
                 className="relative flex items-center group/like"
                 onMouseEnter={() => setShowReactionPicker(true)}
                 onMouseLeave={() => setShowReactionPicker(false)}
               >
                 {showReactionPicker && (
                   <div className="absolute bottom-full left-0 mb-2 bg-background border border-gray-800 rounded-full px-3 py-2 flex items-center gap-2 shadow-xl z-50 animate-[slideIn_0.2s_ease-out] after:content-[''] after:absolute after:w-full after:h-4 after:top-full after:left-0">
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
                 )}
                 <button onClick={(e) => handleLike(e, 'LIKE')} className={`flex items-center gap-2 transition-colors ${isLiked ? 'text-primary' : 'text-text-secondary hover:text-primary/70'}`}>
                   {myReaction === 'LOVE' ? <span className="text-2xl leading-none -ml-1">❤️</span> :
                    myReaction === 'HAHA' ? <span className="text-2xl leading-none -ml-1">😆</span> :
                    myReaction === 'WOW' ? <span className="text-2xl leading-none -ml-1">😮</span> :
                    myReaction === 'SAD' ? <span className="text-2xl leading-none -ml-1">😢</span> :
                    myReaction === 'ANGRY' ? <span className="text-2xl leading-none -ml-1">😡</span> :
                    myReaction === 'LIKE' ? <span className="text-2xl leading-none -ml-1 text-primary">👍</span> :
                    <ThumbsUp className={`w-6 h-6 transition-transform group-hover/like:scale-110 ${isLiked ? 'fill-current' : ''}`} />}
                   <span className="font-medium">{likeCount > 0 ? likeCount : ''}</span>
                 </button>
               </div>
               <button className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors group">
                 <MessageCircle className="w-6 h-6 transition-transform group-hover:scale-110" />
                 <span className="font-medium">{comments.length > 0 ? comments.length : ''}</span>
               </button>
               <button 
                 onClick={user?.id !== article.authorId ? handleRepostToggle : undefined} 
                 className={`flex items-center gap-2 group transition-colors ${user?.id === article.authorId ? 'opacity-50 cursor-not-allowed text-text-secondary' : isReposted ? 'text-green-500 hover:text-green-400' : 'text-text-secondary hover:text-green-400'}`}
                 title={user?.id === article.authorId ? "Không thể tự đăng lại bài của mình" : "Đăng lại"}
               >
                 <Repeat className={`w-6 h-6 transition-transform group-hover:scale-110 ${isReposted ? 'animate-pulse' : ''}`} />
                 <span className="font-medium">{repostCount > 0 ? repostCount : ''}</span>
               </button>
            </div>
            <div className="flex items-center gap-4 text-text-secondary">
               <button className="hover:text-primary transition-colors">
                 <Bookmark className="w-5 h-5" />
               </button>
               <button className="hover:text-primary transition-colors">
                 <Share2 className="w-5 h-5" />
               </button>
            </div>
         </div>

         {/* Comments Section */}
         <div>
            <h3 className="text-xl font-bold mb-6">Bình luận ({comments.length})</h3>
            
            {/* Comment Input */}
            {user ? (
              <div className="space-y-2 mb-8">
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-500 overflow-hidden shrink-0 flex items-center justify-center text-white font-bold shadow">
                     {user.avatarUrl ? (
                       <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                     ) : (
                       user.displayName?.charAt(0).toUpperCase() || 'U'
                     )}
                  </div>
                  
                  <div className="flex-1 flex gap-2 items-center bg-surface border border-white/10 rounded-full px-4 py-1.5 focus-within:border-primary/50 transition-colors">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Post your reply"
                      className="flex-1 bg-transparent border-0 text-text-primary text-sm focus:outline-none placeholder-text-secondary"
                    />
                    
                    {/* Nút chọn ảnh */}
                    <button
                      type="button"
                      onClick={() => commentImageInputRef.current?.click()}
                      className={`p-1.5 rounded-full hover:bg-white/5 transition-colors cursor-pointer shrink-0 ${commentImage ? 'text-primary' : 'text-text-secondary'}`}
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

                    {/* Nút chọn Emoji */}
                    <div className="relative" ref={mainEmojiPickerRef}>
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
                            {['😊', '😂', '🤣', '👍', '❤️', '🔥', '🎉', '✨', '👏', '😍', '🥰', '😘', '😃', '😄', '😁', '😆', '😅', '😉', '😌', '😎', '😢', '😭', '😡', '👍', '🙌', '🙏'].map(emoji => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => {
                                  setNewComment(prev => prev + emoji);
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

                    {/* Nút gửi */}
                    <button
                      onClick={handlePostComment}
                      disabled={submittingComment || (!newComment.trim() && !commentImage)}
                      className="p-1.5 bg-primary hover:bg-primary/95 text-white rounded-full transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Xem trước ảnh nếu có */}
                {commentImage && (
                  <div className="ml-13 relative inline-block">
                    <img src={commentImage} alt="Comment Preview" className="max-h-24 max-w-[150px] object-contain rounded-lg border border-white/10" />
                    <button
                      type="button"
                      onClick={() => {
                        setCommentImage(null);
                        if (commentImageInputRef.current) commentImageInputRef.current.value = '';
                      }}
                      className="absolute -top-1.5 -right-1.5 bg-black/70 hover:bg-black/90 text-white rounded-full p-1 transition-colors cursor-pointer border border-white/10"
                      title="Gỡ ảnh"
                    >
                      <span className="text-[10px] leading-none">✕</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-surface/50 border border-white/5 rounded-xl p-6 text-center mb-8">
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
    </div>
  );
};

export default ArticleDetail;
