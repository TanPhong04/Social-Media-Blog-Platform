import React from 'react';
import type { ArticleResponse } from '../api/articleApi';
import { Link } from 'react-router-dom';

interface ArticleCardProps {
  article: ArticleResponse;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  // Format date
  const date = new Date(article.publishedAt || article.createdAt).toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <article className="group bg-surface rounded-app p-5 border border-white/5 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(108,92,231,0.15)] flex flex-col gap-3 relative overflow-hidden">
      {/* Decorative gradient blob */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-colors duration-500 pointer-events-none" />

      {/* Author & Date */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {/* Avatar placeholder */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white font-semibold text-xs shadow-md">
            {article.authorId.substring(0, 2).toUpperCase()}
          </div>
          <span className="text-text-secondary font-medium">Author {article.authorId.substring(0, 4)}</span>
        </div>
        <span className="text-text-secondary text-xs">{date}</span>
      </div>

      {/* Title */}
      <Link to={`/article/${article.slug}`}>
        <h2 className="text-xl font-heading font-semibold text-text-primary group-hover:text-primary transition-colors duration-300 mt-2 line-clamp-2">
          {article.title}
        </h2>
      </Link>

      {/* Summary */}
      <p className="text-text-secondary text-sm line-clamp-3 leading-relaxed">
        {article.summary}
      </p>

      {/* Tags & Action */}
      <div className="mt-auto pt-4 flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {article.tags.map((tag) => (
            <span key={tag} className="px-2.5 py-1 rounded-md bg-white/5 text-xs text-text-secondary border border-white/5 font-medium">
              #{tag}
            </span>
          ))}
        </div>
        <Link 
          to={`/article/${article.slug}`}
          className="text-primary text-sm font-semibold hover:text-white transition-colors duration-300 flex items-center gap-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
        >
          Đọc tiếp
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </div>
    </article>
  );
};

export default ArticleCard;
