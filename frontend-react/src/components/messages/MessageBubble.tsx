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
      <div className="space-y-2 max-w-full">
        {text.trim() && <p className="whitespace-pre-wrap break-words">{text.trim()}</p>}
        {imageSrc && (
          <div className="rounded-lg overflow-hidden border border-border-subtle bg-black/25">
            <img 
              src={imageSrc} 
              alt="Sent attachment" 
              className="max-h-52 w-auto max-w-full object-contain cursor-pointer hover:opacity-95 transition-opacity" 
              onClick={() => window.open(imageSrc, '_blank')} 
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`flex gap-3 ${isMine ? 'justify-end' : 'justify-start'} group animate-fade-in`}>
      {!isMine && (
        <div className="shrink-0 self-end mb-1">
          <Avatar 
            src={contactProfile?.avatarUrl} 
            fallback={contactProfile?.displayName?.charAt(0).toUpperCase() || 'U'} 
            size="sm" 
          />
        </div>
      )}
      
      <div className={`flex flex-col max-w-[75%] ${isMine ? 'items-end' : 'items-start'}`}>
        <div 
          className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
            isMine 
              ? 'bg-primary text-white rounded-br-none' 
              : 'bg-surface-elevated border border-border-default text-text-primary rounded-bl-none'
          }`}
        >
          {renderContent(message.content)}
        </div>
        <span className="text-[10px] text-text-secondary/60 font-medium mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          {new Date(message.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          {isMine && message.isRead && <span className="text-green-500">✓ Đã đọc</span>}
        </span>
      </div>
    </div>
  );
};
