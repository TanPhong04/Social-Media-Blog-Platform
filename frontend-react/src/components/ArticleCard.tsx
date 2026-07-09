import React, { useState } from 'react';
import type { ArticleResponse } from '../api/articleApi';
import { MessageCircle, Heart, Bookmark, Share2, MoreHorizontal } from 'lucide-react';

interface ArticleCardProps {
  article: ArticleResponse;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(Math.floor(Math.random() * 50)); // Giả lập count
  const [bookmarked, setBookmarked] = useState(false);

  // Định dạng ngày giờ thân thiện kiểu mạng xã hội
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return date.toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'short'
    });
  };

  // Hàm highlight các hashtag trong nội dung bài viết
  const renderHighlightedContent = (text: string) => {
    if (!text) return null;
    const words = text.split(/(\s+)/);
    return words.map((word, index) => {
      if (word.startsWith('#') && word.length > 1) {
        return (
          <span
            key={index}
            className="text-primary hover:underline cursor-pointer font-medium transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              // Logic tìm kiếm theo tag sau này
            }}
          >
            {word}
          </span>
        );
      }
      return word;
    });
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
    // Sau này sẽ kết nối gọi API Like
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarked(!bookmarked);
    // Sau này sẽ kết nối gọi API Bookmark
  };

  const authorInitials = article.authorId.substring(0, 2).toUpperCase();
  const authorHandle = `@user_${article.authorId.substring(0, 8)}`;

  return (
    <div className="bg-surface p-4 border-b border-gray-800 hover:bg-white/[0.02] transition-colors duration-200 flex gap-3 animate-fade-in text-[15px]">
      {/* Cột bên trái: Avatar tròn */}
      <div className="shrink-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white font-semibold text-sm shadow-md cursor-pointer hover:opacity-90 transition-opacity">
          {authorInitials}
        </div>
      </div>

      {/* Cột bên phải: Nội dung bài viết */}
      <div className="flex-1 min-w-0">
        {/* Header: Tác giả và thời gian */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-text-primary hover:underline cursor-pointer">
              Tác giả {article.authorId.substring(0, 4)}
            </span>
            <span className="text-text-secondary text-sm">
              {authorHandle}
            </span>
            <span className="text-text-secondary text-sm">·</span>
            <span className="text-text-secondary text-sm">
              {formatTime(article.publishedAt || article.createdAt)}
            </span>
          </div>
          <button className="text-text-secondary hover:text-primary p-1.5 rounded-full hover:bg-primary/10 transition-colors cursor-pointer">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Body: Tiêu đề và Nội dung */}
        <div className="mt-1 space-y-1 text-text-primary whitespace-pre-wrap break-words leading-normal">
          {/* Nếu tiêu đề không trùng với dòng đầu của content thì có thể hiển thị như tiêu đề đậm */}
          {article.title && !article.content.startsWith(article.title) && (
            <h3 className="font-bold text-base mb-1 text-text-primary">
              {article.title}
            </h3>
          )}
          <p className="text-text-primary">
            {renderHighlightedContent(article.content)}
          </p>
        </div>

        {/* Footer: Hàng nút tương tác (Bình luận, Like, Bookmark, Share) */}
        <div className="flex justify-between items-center max-w-md mt-3 text-text-secondary text-[13px] -ml-2">
          {/* Bình luận */}
          <button className="flex items-center gap-1.5 hover:text-primary group p-2 rounded-full hover:bg-primary/10 transition-all cursor-pointer">
            <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>{Math.floor(Math.random() * 15)}</span>
          </button>

          {/* Thích (Like) */}
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 hover:text-red-500 group p-2 rounded-full hover:bg-red-500/10 transition-all cursor-pointer ${liked ? 'text-red-500' : ''}`}
          >
            <Heart className={`w-4 h-4 group-hover:scale-110 transition-transform ${liked ? 'fill-current' : ''}`} />
            <span>{likeCount}</span>
          </button>

          {/* Đã lưu (Bookmark) */}
          <button
            onClick={handleBookmark}
            className={`flex items-center gap-1.5 hover:text-blue-500 group p-2 rounded-full hover:bg-blue-500/10 transition-all cursor-pointer ${bookmarked ? 'text-blue-500' : ''}`}
          >
            <Bookmark className={`w-4 h-4 group-hover:scale-110 transition-transform ${bookmarked ? 'fill-current' : ''}`} />
          </button>

          {/* Chia sẻ (Share) */}
          <button className="flex items-center gap-1.5 hover:text-green-500 group p-2 rounded-full hover:bg-green-500/10 transition-all cursor-pointer">
            <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;
