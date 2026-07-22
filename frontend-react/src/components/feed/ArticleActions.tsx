import React from 'react';

interface ArticleActionsProps {
  isLiked: boolean;
  likeCount: number;
  isBookmarked: boolean;
  bookmarkCount: number;
  isReposted: boolean;
  repostCount: number;
  commentCount: number;
  onLike: () => void;
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
  onLike,
  onBookmark,
  onRepost,
  onCommentClick,
  onShareClick
}) => {
  return (
    <div className="flex items-center justify-between text-text-secondary mt-3 px-1 border-t border-border-default pt-3">
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
        onClick={onRepost}
        className={`flex items-center gap-1.5 group transition-colors ${isReposted ? 'text-success' : 'hover:text-success'}`}
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isReposted ? 'bg-success/10' : 'group-hover:bg-success/10'}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <span className="text-[13px]">{repostCount > 0 ? repostCount : ''}</span>
      </button>

      {/* Like Button */}
      <button 
        onClick={onLike}
        className={`flex items-center gap-1.5 group transition-colors ${isLiked ? 'text-error' : 'hover:text-error'}`}
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isLiked ? 'bg-error/10' : 'group-hover:bg-error/10'}`}>
          <svg viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isLiked ? 0 : 2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <span className="text-[13px]">{likeCount > 0 ? likeCount : ''}</span>
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
