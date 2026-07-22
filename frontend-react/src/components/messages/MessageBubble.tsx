import React from 'react';
import { Avatar } from '../ui/Avatar';

interface MessageBubbleProps {
  message: any;
  isMine: boolean;
  contactProfile: any;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isMine, contactProfile }) => {
  const renderContent = (content: string) => {
    let text = content;
    let imageSrc = '';
    const imgMatch = content.match(/!\[(?:chat_image|comment_image)\]\(([^\)]+)\)/);
    if (imgMatch) {
      imageSrc = imgMatch[1];
      text = text.replace(imgMatch[0], '');
    }

    return (
      <div className="space-y-2.5 max-w-full">
        {text.trim() && <p className="whitespace-pre-wrap break-words leading-[1.6]">{text.trim()}</p>}
        {imageSrc && (
          <div className="rounded-xl overflow-hidden bg-black/5 shadow-inner border border-white/5">
            <img 
              src={imageSrc} 
              alt="Attachment" 
              className="max-h-64 w-auto max-w-full object-contain cursor-pointer hover:scale-[1.02] transition-transform duration-300" 
              onClick={() => window.open(imageSrc, '_blank')} 
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`flex gap-2.5 ${isMine ? 'justify-end' : 'justify-start'} group animate-fade-in`}>
      {!isMine && (
        <div className="shrink-0 self-end mb-1">
          <Avatar 
            src={contactProfile?.avatarUrl} 
            fallback={contactProfile?.displayName?.charAt(0).toUpperCase() || 'U'} 
            size="sm" 
            className="shadow-sm"
          />
        </div>
      )}
      
      <div className={`flex flex-col max-w-[78%] ${isMine ? 'items-end' : 'items-start'}`}>
        <div 
          className={`px-4 py-3 text-[14.5px] shadow-sm relative ${
            isMine 
              ? 'bg-gradient-to-br from-primary to-primary-hover text-white rounded-[22px] rounded-br-[4px] shadow-primary/20' 
              : 'bg-surface-elevated border border-border-subtle text-text-primary rounded-[22px] rounded-bl-[4px] hover:shadow-md transition-shadow'
          }`}
        >
          {renderContent(message.content)}
        </div>
        <div className={`flex items-center gap-1.5 mt-1.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-[10px] text-text-secondary/80 font-semibold tracking-wide uppercase">
            {new Date(message.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isMine && message.isRead && (
            <span className="text-[10px] text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded-full">Đã đọc</span>
          )}
        </div>
      </div>
    </div>
  );
};
