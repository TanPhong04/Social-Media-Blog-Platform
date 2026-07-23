import React, { useState } from 'react';
import { ThumbsUp } from 'lucide-react';

interface ArticleActionsProps {
  isLiked: boolean;
  likeCount: number;
  isBookmarked: boolean;
  bookmarkCount: number;
  isReposted: boolean;
  repostCount: number;
  commentCount: number;
  isOwnArticle?: boolean;
  myReaction?: string | null;
  onLike: (e: React.MouseEvent, reactionType: string) => void;
  onBookmark: () => void;
  onRepost: () => void;
  onCommentClick: () => void;
  onShareClick: () => void;
}

export const ArticleActions: React.FC<ArticleActionsProps> = ({
  isLiked,
  likeCount,
  isBookmarked,
  bookmarkCount,
  isReposted,
  repostCount,
  commentCount,
  isOwnArticle,
  myReaction,
  onLike,
  onBookmark,
  onRepost,
  onCommentClick,
  onShareClick
}) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  return (
    <div className="flex items-center justify-between text-text-secondary mt-3 px-1 border-t border-border-default pt-3">
      {/* Like Button */}
      <div 
        className="flex items-center relative"
        onMouseEnter={() => setShowReactionPicker(true)}
        onMouseLeave={() => setShowReactionPicker(false)}
      >
        {showReactionPicker && (
          <div className="absolute bottom-full left-0 mb-2 bg-background border border-border-default rounded-full px-3 py-2 flex items-center gap-2 shadow-xl z-50 animate-[slideIn_0.2s_ease-out] after:content-[''] after:absolute after:w-full after:h-4 after:top-full after:left-0">
            {[
              { type: 'LIKE', icon: '👍' },
              { type: 'LOVE', icon: '❤️' },
              { type: 'HAHA', icon: '😂' },
              { type: 'SAD', icon: '😢' },
              { type: 'ANGRY', icon: '😡' }
            ].map((reaction) => (
              <button
                key={reaction.type}
                onClick={(e) => {
                  setShowReactionPicker(false);
                  onLike(e, reaction.type);
                }}
                className="text-2xl hover:scale-125 transition-transform origin-bottom cursor-pointer"
                title={reaction.type}
              >
                {reaction.icon}
              </button>
            ))}
          </div>
        )}
        
        <button 
          onClick={(e) => onLike(e, 'LIKE')}
          className={`flex items-center gap-1.5 group transition-colors ${isLiked ? 'text-primary' : 'hover:text-primary'}`}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isLiked ? 'bg-primary/10' : 'group-hover:bg-primary/10'}`}>
            {myReaction === 'LOVE' ? <span className="text-xl leading-none">❤️</span> :
             myReaction === 'HAHA' ? <span className="text-xl leading-none">😂</span> :
             myReaction === 'WOW' ? <span className="text-xl leading-none">😮</span> :
             myReaction === 'SAD' ? <span className="text-xl leading-none">😢</span> :
             myReaction === 'ANGRY' ? <span className="text-xl leading-none">😡</span> :
             myReaction === 'LIKE' ? <span className="text-xl leading-none text-primary">👍</span> :
             <ThumbsUp className={`w-5 h-5 group-hover:scale-110 transition-transform ${isLiked ? 'fill-current text-primary' : ''}`} />
            }
          </div>
          <span className="text-[13px]">{likeCount > 0 ? likeCount : ''}</span>
        </button>
      </div>

      {/* Comment Button */}
      <button 
        onClick={onCommentClick}
        className="flex items-center gap-1.5 group transition-colors hover:text-primary"
      >
        <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-primary/10 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <span className="text-[13px]">{commentCount > 0 ? commentCount : ''}</span>
      </button>

      {/* Repost Button */}
      <button 
        onClick={() => { if (!isOwnArticle) onRepost(); }}
        disabled={isOwnArticle}
        className={`flex items-center gap-1.5 group transition-colors ${isOwnArticle ? 'opacity-50 cursor-not-allowed' : isReposted ? 'text-success' : 'hover:text-success'}`}
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isOwnArticle ? '' : isReposted ? 'bg-success/10' : 'group-hover:bg-success/10'}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <span className="text-[13px]">{repostCount > 0 ? repostCount : ''}</span>
      </button>

      {/* Bookmark Button */}
      <button 
        onClick={onBookmark}
        className={`flex items-center gap-1.5 group transition-colors ${isBookmarked ? 'text-primary' : 'hover:text-primary'}`}
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isBookmarked ? 'bg-primary/10' : 'group-hover:bg-primary/10'}`}>
          <svg viewBox="0 0 24 24" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isBookmarked ? 0 : 2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </div>
        <span className="text-[13px]">{bookmarkCount > 0 ? bookmarkCount : ''}</span>
      </button>

      {/* Share Button */}
      <button 
        onClick={onShareClick}
        className="flex items-center gap-1.5 group transition-colors hover:text-primary"
      >
        <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-primary/10 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </div>
      </button>
    </div>
  );
};
