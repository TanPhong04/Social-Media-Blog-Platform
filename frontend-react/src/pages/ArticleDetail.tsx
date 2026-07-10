import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { articleApi, type ArticleResponse } from '../api/articleApi';
import { commentApi, type CommentResponse } from '../api/commentApi';
import { followerApi } from '../api/followerApi';
import { userApi, type ProfileResponse } from '../api/userApi';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, Heart, Share2, Bookmark, UserPlus, UserMinus, ArrowLeft } from 'lucide-react';

const ArticleDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [article, setArticle] = useState<ArticleResponse | null>(null);
  const [author, setAuthor] = useState<ProfileResponse | null>(null);
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchData();
    }
  }, [slug]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch article
      const articleData = await articleApi.getBySlug(slug!);
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
        const commentsData = await commentApi.getComments(art.id);
        setComments((commentsData as any).content || []);
      } catch(e) { console.error("Could not fetch comments", e); }

      // Fetch interaction
      if (user) {
        try {
          const interaction = await articleApi.getArticleInteraction(art.id);
          const ia = interaction as any;
          setLikeCount(ia.likesCount || 0);
          setIsLiked(ia.isLiked || false);
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

  const handleLikeToggle = async () => {
    if (!user) return navigate('/login');
    if (!article) return;
    
    try {
      if (isLiked) {
        await articleApi.unlikeArticle(article.id);
        setIsLiked(false);
        setLikeCount(c => Math.max(0, c - 1));
      } else {
        await articleApi.likeArticle(article.id);
        setIsLiked(true);
        setLikeCount(c => c + 1);
      }
    } catch (err) {
      console.error('Error toggling like', err);
    }
  };

  const handlePostComment = async () => {
    if (!user) return navigate('/login');
    if (!article || !newComment.trim()) return;

    setSubmittingComment(true);
    try {
      await commentApi.createComment({
        articleId: article.id,
        content: newComment
      });
      setNewComment('');
      // Reload comments
      const commentsData = await commentApi.getComments(article.id);
      setComments((commentsData as any).content || []);
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
        <button onClick={() => navigate(-1)} className="text-primary hover:underline">Quay lại</button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto border-x border-gray-800 min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-gray-800 p-4 z-40 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
           <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-heading font-bold truncate">Bài viết</h1>
      </div>

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
         <div 
           className="prose prose-invert prose-p:text-text-secondary prose-a:text-primary max-w-none mb-10"
           dangerouslySetInnerHTML={{ __html: article.content }}
         />

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
               <button onClick={handleLikeToggle} className={`flex items-center gap-2 group transition-colors ${isLiked ? 'text-red-500' : 'text-text-secondary hover:text-red-400'}`}>
                 <Heart className={`w-6 h-6 transition-transform group-hover:scale-110 ${isLiked ? 'fill-current' : ''}`} />
                 <span className="font-medium">{likeCount > 0 ? likeCount : ''}</span>
               </button>
               <button className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors group">
                 <MessageCircle className="w-6 h-6 transition-transform group-hover:scale-110" />
                 <span className="font-medium">{comments.length > 0 ? comments.length : ''}</span>
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
              <div className="flex gap-4 mb-8">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-500 shrink-0 flex items-center justify-center text-white font-bold">
                   {user.displayName?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 space-y-3">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Viết bình luận của bạn..."
                    className="w-full bg-surface border border-white/10 rounded-xl p-3 text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary/50 resize-none min-h-[100px]"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handlePostComment}
                      disabled={!newComment.trim() || submittingComment}
                      className="px-5 py-2 bg-primary text-white rounded-full font-semibold hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {submittingComment ? 'Đang gửi...' : 'Gửi bình luận'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-surface/50 border border-white/5 rounded-xl p-6 text-center mb-8">
                <p className="text-text-secondary mb-4">Vui lòng đăng nhập để tham gia thảo luận.</p>
                <button onClick={() => navigate('/login')} className="px-6 py-2 bg-primary text-white rounded-full font-semibold">Đăng nhập</button>
              </div>
            )}

            {/* Comment List */}
            <div className="space-y-6">
               {comments.map((comment) => (
                 <div key={comment.id} className="flex gap-4">
                   <div className="w-10 h-10 rounded-full bg-surface border border-white/10 shrink-0 flex items-center justify-center font-bold text-sm">
                      U
                   </div>
                   <div className="flex-1 bg-surface border border-white/5 rounded-2xl rounded-tl-none p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-text-primary">User</span>
                        <span className="text-xs text-text-secondary">• {new Date(comment.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <p className="text-text-secondary text-sm">{comment.content}</p>
                   </div>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};

export default ArticleDetail;
