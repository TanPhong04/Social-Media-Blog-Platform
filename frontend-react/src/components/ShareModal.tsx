import React from 'react';
import { X, Repeat, Link as LinkIcon, Send, Globe, MessageSquare, MessageCircle } from 'lucide-react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  title?: string;
  onRepost?: () => void;
  reposted?: boolean;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, shareUrl, title = 'Bài viết', onRepost, reposted }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      // Có thể gọi Toast ở ngoài hoặc tự báo
      alert('Đã sao chép liên kết vào khay nhớ tạm!');
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
    onClose();
  };

  const shareToTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`, '_blank');
    onClose();
  };

  const shareToNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url: shareUrl
        });
        onClose();
      } catch (e) {
        // User cancelled
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-surface border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-[slideUp_0.2s_ease-out]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h3 className="text-lg font-bold text-text-primary">Chia sẻ</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-text-secondary transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="p-2 space-y-1">
          {onRepost && (
            <button 
              onClick={() => { onRepost(); onClose(); }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 text-text-primary transition-colors cursor-pointer text-left"
            >
              <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center", reposted ? "bg-green-500/20 text-green-500" : "bg-white/10 text-text-primary")}>
                <Repeat className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">{reposted ? 'Hủy đăng lại' : 'Đăng lại'}</div>
                <div className="text-xs text-text-secondary">{reposted ? 'Xóa khỏi danh sách đăng lại của bạn' : 'Chia sẻ lại bài viết này trên trang cá nhân của bạn'}</div>
              </div>
            </button>
          )}

          <button 
            onClick={copyToClipboard}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 text-text-primary transition-colors cursor-pointer text-left"
          >
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-text-primary">
              <LinkIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 font-semibold">Sao chép liên kết</div>
          </button>

          <button 
            onClick={() => {
              onClose();
              navigate(`/messages?text=${encodeURIComponent(shareUrl)}`);
            }}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-primary/10 text-primary transition-colors cursor-pointer text-left"
          >
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div className="flex-1 font-semibold">Gửi qua tin nhắn</div>
          </button>

          <button 
            onClick={shareToFacebook}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-blue-600/10 text-blue-500 transition-colors cursor-pointer text-left"
          >
            <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <div className="flex-1 font-semibold">Chia sẻ lên Facebook</div>
          </button>

          <button 
            onClick={shareToTwitter}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 text-text-primary transition-colors cursor-pointer text-left"
          >
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="flex-1 font-semibold">Chia sẻ qua X</div>
          </button>

          {typeof navigator.share === 'function' && (
            <button 
              onClick={shareToNative}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 text-text-primary transition-colors cursor-pointer text-left"
            >
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <div className="flex-1 font-semibold">Gửi qua ứng dụng khác...</div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
