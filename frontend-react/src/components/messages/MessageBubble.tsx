import React from 'react';
import { Avatar } from '../ui/Avatar';
import { useCall } from '../../contexts/CallContext';
import { Phone, PhoneMissed, PhoneOff, Video } from 'lucide-react';

interface MessageBubbleProps {
  message: any;
  isMine: boolean;
  contactProfile: any;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isMine, contactProfile }) => {
  const { startCall } = useCall();

  const handleCallAgain = (isVideo: boolean) => {
    // If we are calling back, the target is the other person
    const targetId = isMine ? message.recipientId : message.senderId;
    startCall(targetId, contactProfile, isVideo);
  };

  const renderContent = (content: string) => {
    if (content.startsWith('[CALL_LOG]:')) {
      try {
        const payload = JSON.parse(content.replace('[CALL_LOG]:', ''));
        const { type, isVideo, duration } = payload;
        
        let icon = <Phone className="w-5 h-5 text-text-primary" />;
        let text = 'Cuộc gọi thoại';
        let subText = '';
        
        if (type === 'MISSED') {
          icon = <PhoneMissed className="w-5 h-5 text-error" />;
          text = 'Cuộc gọi nhỡ';
        } else if (type === 'REJECTED') {
          icon = <PhoneOff className="w-5 h-5 text-error" />;
          text = 'Cuộc gọi bị từ chối';
        } else if (type === 'ENDED') {
          icon = isVideo ? <Video className="w-5 h-5 text-text-primary" /> : <Phone className="w-5 h-5 text-text-primary" />;
          text = isVideo ? 'Cuộc gọi video' : 'Cuộc gọi thoại';
          
          const m = Math.floor(duration / 60);
          const s = duration % 60;
          subText = `${m} phút ${s} giây`;
        }

        return (
          <div className="flex flex-col gap-2 min-w-[180px]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-background rounded-full shrink-0 shadow-sm">
                {icon}
              </div>
              <div>
                <p className="font-semibold text-[15px] leading-tight">{text}</p>
                {subText && <p className="text-[13px] opacity-80 mt-0.5">{subText}</p>}
              </div>
            </div>
            
            <button 
              onClick={() => handleCallAgain(isVideo)}
              className="mt-2 w-full py-2 bg-surface text-text-primary hover:bg-surface-elevated font-medium rounded-xl text-sm transition-colors border border-border-default shadow-sm"
            >
              Gọi lại
            </button>
          </div>
        );
      } catch (e) {
        // Fallback to normal text if JSON parse fails
      }
    }
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
