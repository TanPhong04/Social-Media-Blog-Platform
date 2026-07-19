import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { ArticleResponse } from '../api/articleApi';
import { articleApi } from '../api/articleApi';
import { userApi } from '../api/userApi';
import { commentApi } from '../api/commentApi';
import type { CommentResponse } from '../api/commentApi';
import { mediaApi } from '../api/mediaApi';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, Heart, ThumbsUp, Bookmark, Share2, MoreHorizontal, Edit3, Trash2, X, Check, Image as ImageIcon, Repeat, Send, Edit2, Smile, Film, Play, Sparkles } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import ShareModal from './ShareModal';
import AiChatDrawer from './AiChatDrawer';


interface ArticleCardProps {
  article: ArticleResponse;
  onRefresh?: () => void;
}

// Module-level cache để lưu thông tin người dùng, tránh gọi API trùng lặp
const authorCache: { [id: string]: any } = {};

// Hàm helper upload tệp tin trực tiếp lên Cloudinary sử dụng Unsigned Preset
const uploadToCloudinary = async (file: File): Promise<string> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dgn74bbvy';
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'blog-platform';
  
  const resourceType = file.type.startsWith('video/') ? 'video' : 'image';
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('resource_type', resourceType);
  
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
  const response = await fetch(url, {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Cloudinary upload error response:', errorText);
    let errMsg = 'Đăng tải tệp tin lên Cloudinary thất bại.';
    try {
      const errJson = JSON.parse(errorText);
      if (errJson.error && errJson.error.message) {
        errMsg = `Cloudinary: ${errJson.error.message}`;
      }
    } catch (e) {}
    throw new Error(errMsg);
  }
  
  const data = await response.json();
  return data.secure_url;
};

// Sub-component hiển thị từng hình ảnh/video kèm tính năng thả tim độc lập
const MediaItem: React.FC<{ 
  url: string; 
  articleId: string; 
  isVideo?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}> = ({ url, isVideo, className, onClick }) => {
  return (
    <div 
      className={`relative group/media overflow-hidden flex items-center justify-center ${className || 'rounded-app border border-gray-800 bg-black/20 max-h-[450px]'}`}
      onClick={onClick}
    >
      {isVideo ? (
        <>
          <video src={url} className="w-full h-full object-contain bg-black" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform group-hover/media:scale-110">
            <div className="w-14 h-14 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-xl">
               <Play className="w-6 h-6 text-white fill-white ml-1" />
            </div>
          </div>
        </>
      ) : (
        <img 
          src={url} 
          alt="Attachment" 
          className="w-full h-full object-cover hover:opacity-95 transition-opacity" 
        />
      )}
    </div>
  );
};

const MediaGallery: React.FC<{ items: {url: string, isVideo: boolean}[], articleId: string }> = ({ items, articleId }) => {


  const navigate = useNavigate();
  const location = useLocation();

  if (!items || items.length === 0) return null;

  const count = items.length;

  const handleImageClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    navigate(`/article/${articleId}?mediaUrl=${encodeURIComponent(items[index].url)}`, { state: { backgroundLocation: location } });
  };

  const renderGrid = () => {
    if (count === 1) {
      return <MediaItem url={items[0].url} isVideo={items[0].isVideo} articleId={articleId} className="w-full max-h-[500px] border border-gray-800 rounded-app cursor-pointer" onClick={(e) => handleImageClick(e, 0)} />;
    }
    if (count === 2) {
      return (
        <div className="grid grid-cols-2 gap-1 mt-2">
          {items.map((item, idx) => (
            <MediaItem key={idx} url={item.url} isVideo={item.isVideo} articleId={articleId} className={`w-full aspect-[4/5] border border-gray-800 cursor-pointer ${idx === 0 ? 'rounded-l-app rounded-r-none' : 'rounded-r-app rounded-l-none'}`} onClick={(e) => handleImageClick(e, idx)} />
          ))}
        </div>
      );
    }
    if (count === 3) {
      return (
        <div className="grid grid-cols-2 gap-1 mt-2 h-[400px]">
          <MediaItem url={items[0].url} isVideo={items[0].isVideo} articleId={articleId} className="w-full h-full border border-gray-800 rounded-l-app rounded-r-none cursor-pointer" onClick={(e) => handleImageClick(e, 0)} />
          <div className="grid grid-rows-2 gap-1 h-full">
            <MediaItem url={items[1].url} isVideo={items[1].isVideo} articleId={articleId} className="w-full h-full border border-gray-800 rounded-none rounded-tr-app cursor-pointer" onClick={(e) => handleImageClick(e, 1)} />
            <MediaItem url={items[2].url} isVideo={items[2].isVideo} articleId={articleId} className="w-full h-full border border-gray-800 rounded-none rounded-br-app cursor-pointer" onClick={(e) => handleImageClick(e, 2)} />
          </div>
        </div>
      );
    }
    if (count === 4) {
      return (
        <div className="grid grid-cols-2 gap-1 mt-2 h-[400px]">
          <div className="grid grid-rows-2 gap-1 h-full">
             <MediaItem url={items[0].url} isVideo={items[0].isVideo} articleId={articleId} className="w-full h-full border border-gray-800 rounded-tl-app rounded-bl-none rounded-r-none cursor-pointer" onClick={(e) => handleImageClick(e, 0)} />
             <MediaItem url={items[1].url} isVideo={items[1].isVideo} articleId={articleId} className="w-full h-full border border-gray-800 rounded-bl-app rounded-tl-none rounded-r-none cursor-pointer" onClick={(e) => handleImageClick(e, 1)} />
          </div>
          <div className="grid grid-rows-2 gap-1 h-full">
             <MediaItem url={items[2].url} isVideo={items[2].isVideo} articleId={articleId} className="w-full h-full border border-gray-800 rounded-tr-app rounded-br-none rounded-l-none cursor-pointer" onClick={(e) => handleImageClick(e, 2)} />
             <MediaItem url={items[3].url} isVideo={items[3].isVideo} articleId={articleId} className="w-full h-full border border-gray-800 rounded-br-app rounded-tr-none rounded-l-none cursor-pointer" onClick={(e) => handleImageClick(e, 3)} />
          </div>
        </div>
      );
    }
    // count >= 5
    return (
      <div className="grid grid-cols-2 gap-1 mt-2 h-[450px]">
        <div className="grid grid-rows-2 gap-1 h-full">
           <MediaItem url={items[0].url} isVideo={items[0].isVideo} articleId={articleId} className="w-full h-full border border-gray-800 rounded-tl-app rounded-bl-none rounded-r-none cursor-pointer" onClick={(e) => handleImageClick(e, 0)} />
           <MediaItem url={items[1].url} isVideo={items[1].isVideo} articleId={articleId} className="w-full h-full border border-gray-800 rounded-bl-app rounded-tl-none rounded-r-none cursor-pointer" onClick={(e) => handleImageClick(e, 1)} />
        </div>
        <div className="grid grid-rows-3 gap-1 h-full">
           <MediaItem url={items[2].url} isVideo={items[2].isVideo} articleId={articleId} className="w-full h-full border border-gray-800 rounded-tr-app rounded-b-none rounded-l-none cursor-pointer" onClick={(e) => handleImageClick(e, 2)} />
           <MediaItem url={items[3].url} isVideo={items[3].isVideo} articleId={articleId} className="w-full h-full border border-gray-800 rounded-none cursor-pointer" onClick={(e) => handleImageClick(e, 3)} />
           <div className="relative w-full h-full cursor-pointer" onClick={(e) => handleImageClick(e, 4)}>
             <MediaItem url={items[4].url} isVideo={items[4].isVideo} articleId={articleId} className="w-full h-full border border-gray-800 rounded-br-app rounded-t-none rounded-l-none" />
             {count > 5 && (
               <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-br-app text-white text-2xl font-bold">
                 +{count - 5}
               </div>
             )}
           </div>
        </div>
      </div>
    );
  };

  return renderGrid();
};

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onRefresh }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  
  const [isAuthorFollowing, setIsAuthorFollowing] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Trạng thái cho Dropdown Menu tác vụ
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Trạng thái cho Bookmark (localStorage)
  const [bookmarked, setBookmarked] = useState(false);

  // Trạng thái cho Repost (localStorage)
  const [reposted, setReposted] = useState(false);
  const [repostCount, setRepostCount] = useState(0);

  // Trạng thái cho Modal Chỉnh sửa bài đăng
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [updating, setUpdating] = useState(false);

  // Trạng thái tệp đính kèm khi chỉnh sửa (Ảnh/Video)
  const [editFile, setEditFile] = useState<{
    url: string;
    type: 'image' | 'video';
    file?: File;
    base64?: string;
  } | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Trạng thái thông tin thật của tác giả bài viết
  const [authorProfile, setAuthorProfile] = useState<any>(null);

  // Trạng thái cho khung bình luận (Comments Section)
  const [showComments] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [commentProfiles, setCommentProfiles] = useState<{ [id: string]: any }>({});

  // Trạng thái tương tác bình luận nâng cao
  const [commentLikes, setCommentLikes] = useState<{ [id: string]: { count: number; liked: boolean } }>({});
  const [commentsFollowStatus, setCommentsFollowStatus] = useState<{ [uid: string]: boolean }>({});
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  
  // Thêm state cho danh sách người thích & cảm xúc
  const [showLikersModal, setShowLikersModal] = useState(false);
  const [likers, setLikers] = useState<any[]>([]);
  const [loadingLikers, setLoadingLikers] = useState(false);
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);
  const [showMapModal, setShowMapModal] = useState(false);

  useEffect(() => {
    if (showLikersModal) {
      loadLikers();
    }
  }, [showLikersModal]);

  const loadLikers = async () => {
    try {
      setLoadingLikers(true);
      const res: any = await articleApi.getArticleLikers(article.id, 0, 50);
      const interactions = res.content || res.data?.content || [];
      
      const profiles = await Promise.all(
        interactions.map(async (interaction: any) => {
          try {
            const userRes: any = await userApi.getUserById(interaction.actorId);
            return userRes.data || userRes;
          } catch (e) {
            return null;
          }
        })
      );
      
      setLikers(profiles.filter(p => p !== null));
    } catch (err) {
      console.error('Failed to load likers', err);
    } finally {
      setLoadingLikers(false);
    }
  };
  
  // Trạng thái bình luận hình ảnh
  const [commentImage, setCommentImage] = useState<string | null>(null);
  const [replyImage, setReplyImage] = useState<string | null>(null);

  // Refs input file bình luận
  const commentImageInputRef = useRef<HTMLInputElement>(null);
  const replyImageInputRef = useRef<HTMLInputElement>(null);

  // Refs emoji pickers bình luận
  const commentEmojiPickerRef = useRef<HTMLDivElement>(null);
  const replyEmojiPickerRef = useRef<HTMLDivElement>(null);

  // Trạng thái Emoji picker bình luận
  const [showCommentEmojiPicker, setShowCommentEmojiPicker] = useState(false);
  const [showReplyEmojiPicker, setShowReplyEmojiPicker] = useState(false);

  const [activeCommentEmojiTab, setActiveCommentEmojiTab] = useState(1);
  const [activeReplyEmojiTab, setActiveReplyEmojiTab] = useState(1);
  const [searchCommentEmoji, setSearchCommentEmoji] = useState('');
  const [searchReplyEmoji, setSearchReplyEmoji] = useState('');
  const [hoveredCommentEmoji, setHoveredCommentEmoji] = useState<string | null>(null);
  const [hoveredReplyEmoji, setHoveredReplyEmoji] = useState<string | null>(null);

  const EMOJI_CATEGORIES = [
    {
      icon: '🕒',
      title: 'Gần đây',
      emojis: ['😊', '😂', '🤣', '👍', '❤️', '🔥', '🎉', '✨', '👏', '😍', '🥰', '😘']
    },
    {
      icon: '😀',
      title: 'Mặt cười & con người',
      emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😓', '🤔']
    },
    {
      icon: '🐱',
      title: 'Động vật & thiên nhiên',
      emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞']
    },
    {
      icon: '🍎',
      title: 'Đồ ăn & thức uống',
      emojis: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🧅', '🥖', '🥨', '🧀', '🍕', '🌭', '🍔', '🍟', '🍺', '🍻', '🍷', '🥤', '🧋']
    },
    {
      icon: '⚽',
      title: 'Hoạt động & thể thao',
      emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🏆', '🥇', '🥈', '🥉', '🎖️', '🎗️', '🎫', '🎟️', '🎪', '🎨', '🎭', '🎬', '🎤', '🎧', '🎼', '🥁']
    },
    {
      icon: '🚗',
      title: 'Du lịch & địa điểm',
      emojis: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🛵', '🚲', '🛴', '🛺', '🚂', '🚆', '🚄', '🚅', '🚈', '🚇', '🚀', '🛸', '🚁', '🛶', '⛵', '🛥️', '🛳️', '🚢', '✈️', '🛫', '🛬', '🪂', '🪟', '🌋', '🗻', '🏠']
    },
    {
      icon: '💡',
      title: 'Đồ vật & bóng đèn',
      emojis: ['💡', '🔦', '🕯️', '🔌', '🔋', '💻', '🖥️', '🖨️', '⌨️', '🖱️', '🎛️', '🎞️', '📷', '📸', '📹', '🎥', '📻', '🎙️', '🎚️', '🎛️', '📺', '⏰', '⌚', '🧭', '⌛', '⏳', '🪓', '🛡️', '🔑', '🗝️', '🔨', '🛠️', '⛏️', '🔩', '⚙️', '🧱', '⛓️', '🧲', '🔫', '💣']
    },
    {
      icon: '🔣',
      title: 'Ký hiệu & biểu tượng',
      emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐']
    }
  ];

  const EMOJI_KEYWORDS: { [key: string]: string } = {
    '😊': 'cuoi vui ve mat cuoi smile happy',
    '😂': 'cuoi ra nuoc mat haha cuoi to lol joy',
    '🤣': 'cuoi lan lon haha rofl',
    '😍': 'yeu thich love heart eyes',
    '🥰': 'yeu thuong hanh phuc love hearts',
    '😘': 'hon kiss blowing kiss',
    '👍': 'like thich tot nhat ok good yes',
    '👎': 'dislike khong thich bad no',
    '❤️': 'tim do love heart red',
    '🔥': 'lua hot fire trend',
    '🎉': 'chuc mung party celebrate',
    '✨': 'lap lanh lanh lay sparkle',
    '👏': 'vo tay clap bravo',
    '😭': 'khoc to cry sad'
  };

  const showToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 2500);
  };

  // Helper: Đo thời lượng video
  const checkVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  // Fetch thông tin thật của tác giả từ cache hoặc API
  useEffect(() => {
    const fetchAuthorInfo = async () => {
      const authorId = article.authorId;
      if (authorCache[authorId]) {
        setAuthorProfile(authorCache[authorId]);
        return;
      }
      try {
        const res = await userApi.getUserById(authorId);
        authorCache[authorId] = res;
        setAuthorProfile(res);
      } catch (err) {
        console.warn('Lấy profile tác giả thất bại', err);
        setAuthorProfile({
          displayName: `Người dùng ${authorId.substring(0, 4)}`,
          username: `user_${authorId.substring(0, 8)}`,
          avatarUrl: null
        });
      }
    };
    fetchAuthorInfo();
  }, [article.authorId]);

  // Tự động phân tách phần text và tệp đính kèm khi mở Modal Chỉnh sửa
  useEffect(() => {
    if (isEditing) {
      let text = article.content;
      let fileData: any = null;

      // Tìm ảnh nhúng (Base64 hoặc URL Cloudinary)
      const imgMatch = article.content.match(/!\[image\]\(([^\)]+)\)/);
      if (imgMatch) {
        const url = imgMatch[1];
        fileData = {
          url: url,
          base64: url.startsWith('data:') ? url : '',
          type: 'image'
        };
        text = text.replace(imgMatch[0], '');
      }

      // Tìm video nhúng
      const videoMatch = article.content.match(/<video src="([^"]+)"[^>]*><\/video>/);
      if (videoMatch) {
        const url = videoMatch[1];
        fileData = {
          url: url,
          base64: url.startsWith('data:') ? url : '',
          type: 'video'
        };
        text = text.replace(videoMatch[0], '');
      }

      setEditContent(text.trim());
      setEditFile(fileData);
    } else {
      if (editFile && editFile.url && editFile.url.startsWith('blob:')) {
        URL.revokeObjectURL(editFile.url);
      }
      setEditFile(null);
    }
  }, [isEditing, article.content]);

  // Đọc trạng thái like và follow của tác giả bài viết
  useEffect(() => {
    const fetchLikeAndFollowStatus = async () => {
      if (!user) return;
      try {
        // Tải trạng thái thích bài viết
        const res: any = await articleApi.getArticleInteraction(article.id);
        setLiked(res.likedByCurrentUser);
        setMyReaction(res.reactionType || (res.likedByCurrentUser ? 'LIKE' : null));
        setLikeCount(res.count);
      } catch (err) {
        console.warn('Interaction service unavailable', err);
        setLikeCount(0);
      }

      // Tải trạng thái follow của tác giả bài viết
      if (user.id !== article.authorId) {
        try {
          const fRes: any = await userApi.getFollowStatus(article.authorId);
          setIsAuthorFollowing(fRes.following);
        } catch (fErr) {
          console.warn('Follower service status query failed', fErr);
        }
      }
    };
    fetchLikeAndFollowStatus();
  }, [article.id, article.authorId, user]);

  // Đọc trạng thái bookmark khi mount
  useEffect(() => {
    if (user) {
      try {
        const bookmarks = JSON.parse(localStorage.getItem(`bookmarks_${user.id}`) || '[]');
        setBookmarked(bookmarks.some((b: any) => b.id === article.id));
      } catch (e) {
        setBookmarked(false);
      }
    }
  }, [article.id, user]);

  // Đọc trạng thái đăng lại (Repost)
  useEffect(() => {
    if (user) {
      try {
        const reposts = JSON.parse(localStorage.getItem(`reposts_${user.id}`) || '[]');
        const isReposted = reposts.some((b: any) => b.id === article.id);
        setReposted(isReposted);
      } catch (e) {
        setReposted(false);
      }
    }
  }, [article.id, user]);

  // Tải danh sách bình luận ngay khi mount để hiển thị số lượng thực tế
  useEffect(() => {
    fetchComments();
  }, [article.id]);

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const res: any = await commentApi.getComments(article.id);
      const list = res.content || res || [];
      setComments(list);
      
      const count = list.filter((c: any) => c.content.includes('[repost]')).length;
      setRepostCount(count);

      // Tải tên thật của người viết bình luận
      const uids = Array.from(new Set(list.map((c: any) => c.authorId))) as string[];
      for (const uid of uids) {
        if (!commentProfiles[uid]) {
          if (authorCache[uid]) {
            setCommentProfiles(prev => ({ ...prev, [uid]: authorCache[uid] }));
          } else {
            try {
              const uRes = await userApi.getUserById(uid);
              authorCache[uid] = uRes;
              setCommentProfiles(prev => ({ ...prev, [uid]: uRes }));
            } catch (err) {
              console.warn(`Lấy profile bình luận ${uid} thất bại`, err);
            }
          }
        }
      }

      // Tải trạng thái thả tim bình luận & follow của tác giả bình luận
      const likesData: { [id: string]: { count: number; liked: boolean } } = {};
      const followMap: { [uid: string]: boolean } = {};
      
      await Promise.all(list.map(async (c: any) => {
        // Thích bình luận
        try {
          const lRes: any = await commentApi.getCommentInteraction(c.id);
          likesData[c.id] = { count: lRes.count, liked: lRes.likedByCurrentUser };
        } catch (err) {
          likesData[c.id] = { count: 0, liked: false };
        }
        
        // Trạng thái follow của tác giả bình luận
        if (user && c.authorId !== user.id && !followMap[c.authorId]) {
          try {
            const fRes: any = await userApi.getFollowStatus(c.authorId);
            followMap[c.authorId] = fRes.following;
          } catch (err) {
            followMap[c.authorId] = false;
          }
        }
      }));
      
      setCommentLikes(likesData);
      setCommentsFollowStatus(prev => ({ ...prev, ...followMap }));

    } catch (err) {
      console.warn('Comments service unavailable (comment-service chưa chạy?)', err);
    } finally {
      setLoadingComments(false);
    }
  };

  // Click ra ngoài đóng dropdown menu & emoji pickers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (commentEmojiPickerRef.current && !commentEmojiPickerRef.current.contains(event.target as Node)) {
        setShowCommentEmojiPicker(false);
      }
      if (replyEmojiPickerRef.current && !replyEmojiPickerRef.current.contains(event.target as Node)) {
        setShowReplyEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format ngày giờ thân thiện kiểu MXH
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

  // Hàm highlight các hashtag trong nội dung
  const renderHighlightedContent = (text: string) => {
    if (!text) return null;
    const words = text.split(/(\s+)/);
    return words.map((word, index) => {
      if (word.startsWith('#') && word.length > 1) {
        return (
          <span
            key={index}
            className="text-primary hover:underline cursor-pointer font-medium transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {word}
          </span>
        );
      }
      return word;
    });
  };

  // Hàm phân tích và hiển thị nội dung kèm hình ảnh / video
  const renderContentWithMedia = (content: string) => {
    if (!content) return null;

    let textToShow = content;
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
    const videoRegex = /<video src="([^"]+)"[^>]*><\/video>/g;
    let videoMatch;
    while ((videoMatch = videoRegex.exec(textToShow)) !== null) {
      videos.push(videoMatch[1]);
    }
    textToShow = textToShow.replace(/<video src="([^"]+)"[^>]*><\/video>/g, '');

    const mediaItems: {url: string, isVideo: boolean}[] = [
      ...images.map(url => ({ url, isVideo: false })),
      ...videos.map(url => ({ url, isVideo: true }))
    ];

    const isReel = videos.length === 1 && images.length === 0;

    return (
      <div className="space-y-2.5">
        {textToShow.trim() && (
          <p className="text-text-primary text-[15px] whitespace-pre-wrap break-words leading-normal">
            {renderHighlightedContent(textToShow.trim())}
          </p>
        )}

        {isReel ? (
          <div 
            className="relative w-full max-w-[320px] mx-auto rounded-xl overflow-hidden bg-black cursor-pointer group border border-gray-800 shadow-lg"
            onClick={(e) => { e.stopPropagation(); navigate('/reels', { state: { initialReel: article } }); }}
          >
            <video src={videos[0]} className="w-full aspect-[9/16] object-cover opacity-90 group-hover:opacity-100 transition" />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 group-hover:bg-black/10 transition">
              <div className="w-14 h-14 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-md border border-white/20">
                <Play className="w-6 h-6 text-white fill-white ml-1" />
              </div>
            </div>
            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded flex items-center gap-1.5 border border-white/10">
              <Film className="w-3.5 h-3.5 text-white" />
              <span className="text-[11px] text-white font-bold uppercase tracking-widest">Reel</span>
            </div>
          </div>
        ) : (
          <MediaGallery items={mediaItems} articleId={article.id} />
        )}
      </div>
    );
  };

  // Helper render hình ảnh đính kèm bình luận
  const renderCommentContent = (content: string) => {
    if (!content) return null;
    let textToShow = content;
    let imageSrc = '';

    const imgMatch = content.match(/!\[comment_image\]\(([^\)]+)\)/);
    if (imgMatch) {
      imageSrc = imgMatch[1];
      textToShow = textToShow.replace(imgMatch[0], '');
    }

    return (
      <div className="space-y-1.5 text-sm">
        {textToShow.trim() && (
          <p className="text-text-primary whitespace-pre-wrap leading-relaxed">
            {textToShow.trim()}
          </p>
        )}
        {imageSrc && (
          <div className="rounded-lg overflow-hidden border border-gray-800 bg-black/10 max-h-36 flex items-center justify-start mt-1">
            <img src={imageSrc} alt="Comment Attachment" className="max-h-36 max-w-[200px] object-contain rounded-lg" />
          </div>
        )}
      </div>
    );
  };

  // Thích bài viết
  const handleLike = async (e: React.MouseEvent, reactionType: string = 'LIKE') => {
    e.stopPropagation();
    if (!user) {
      showToastMessage('Vui lòng đăng nhập để thích bài viết.', 'error');
      return;
    }

    setShowReactionPicker(false);

    const nextLiked = !liked || (liked && myReaction !== reactionType);
    const wasLiked = liked;

    setLiked(nextLiked);
    setMyReaction(nextLiked ? reactionType : null);
    
    if (!wasLiked && nextLiked) {
      setLikeCount(prev => prev + 1);
    } else if (wasLiked && !nextLiked) {
      setLikeCount(prev => prev - 1);
    }

    try {
      if (nextLiked) {
        await articleApi.likeArticle(article.id, reactionType);
      } else {
        await articleApi.unlikeArticle(article.id);
      }

      const likedKey = `liked_posts_${user.id}`;
      const likedList = JSON.parse(localStorage.getItem(likedKey) || '[]');
      let newLikedList;

      if (!nextLiked) {
        newLikedList = likedList.filter((b: any) => b.id !== article.id);
      } else {
        if (!likedList.some((b: any) => b.id === article.id)) {
          newLikedList = [...likedList, article];
        } else {
          newLikedList = likedList;
        }
      }
      localStorage.setItem(likedKey, JSON.stringify(newLikedList));

      if (onRefresh && !nextLiked) {
        setTimeout(() => {
          onRefresh();
        }, 400);
      }
    } catch (err) {
      console.error('Error liking/unliking article', err);
      setLiked(liked);
      setLikeCount(prev => liked ? prev + 1 : prev - 1);
      showToastMessage('Không thể thực hiện tương tác thích.', 'error');
    }
  };

  // Thích bình luận
  const handleLikeComment = async (commentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      showToastMessage('Vui lòng đăng nhập để thích bình luận.', 'error');
      return;
    }

    const current = commentLikes[commentId] || { count: 0, liked: false };
    const nextLiked = !current.liked;
    const nextCount = nextLiked ? current.count + 1 : Math.max(0, current.count - 1);

    // Cập nhật Optimistic UI
    setCommentLikes(prev => ({
      ...prev,
      [commentId]: { count: nextCount, liked: nextLiked }
    }));

    try {
      if (nextLiked) {
        await commentApi.likeComment(commentId);
      } else {
        await commentApi.unlikeComment(commentId);
      }
    } catch (err) {
      console.error('Error liking comment', err);
      setCommentLikes(prev => ({
        ...prev,
        [commentId]: current
      }));
      showToastMessage('Không thể thích bình luận lúc này.', 'error');
    }
  };

  // Đăng lại bài viết (Repost)
  const handleRepost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      showToastMessage('Vui lòng đăng nhập để đăng lại bài viết.', 'error');
      return;
    }

    try {
      const repostsKey = `reposts_${user.id}`;
      const reposts = JSON.parse(localStorage.getItem(repostsKey) || '[]');
      let newReposts;

      const nextReposted = !reposted;

      if (reposted) {
        newReposts = reposts.filter((b: any) => b.id !== article.id);
        // Tìm comment repost đó và xóa (nếu tìm thấy trong database)
        try {
          const fetchedComments = await commentApi.getComments(article.id);
          const commentsList = (fetchedComments as any).content || fetchedComments || [];
          const repostComment = commentsList.find((c: any) => c.authorId === user.id && c.content.includes('[repost]'));
          if (repostComment) {
            await commentApi.deleteComment(repostComment.id);
          }
        } catch (commentErr) {
          console.warn('Could not delete repost comment tracking', commentErr);
        }
        showToastMessage('Đã hủy đăng lại!');
      } else {
        newReposts = [...reposts, article];
        // Tạo comment đặc biệt làm repost ở backend để sinh thông báo và lưu vết
        try {
          await commentApi.createComment({
            articleId: article.id,
            content: "[repost] đã đăng lại bài viết này"
          });
        } catch (commentErr) {
          console.warn('Could not create repost comment tracking', commentErr);
        }
        showToastMessage('Đã đăng lại bài viết thành công!');
      }

      localStorage.setItem(repostsKey, JSON.stringify(newReposts));
      setReposted(nextReposted);
      setRepostCount(prev => nextReposted ? prev + 1 : Math.max(0, prev - 1));

      if (onRefresh) {
        setTimeout(() => {
          onRefresh();
        }, 400);
      }
    } catch (err) {
      console.error('Error reposting', err);
      showToastMessage('Tác vụ đăng lại thất bại.', 'error');
    }
  };

  // Bookmark bài viết
  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      showToastMessage('Vui lòng đăng nhập để lưu bài viết.', 'error');
      return;
    }

    try {
      const storageKey = `bookmarks_${user.id}`;
      const bookmarks = JSON.parse(localStorage.getItem(storageKey) || '[]');
      let newBookmarks;

      if (bookmarked) {
        newBookmarks = bookmarks.filter((b: any) => b.id !== article.id);
        showToastMessage('Đã bỏ lưu bài viết!');
      } else {
        newBookmarks = [...bookmarks, article];
        showToastMessage('Đã lưu bài viết thành công!');
      }

      localStorage.setItem(storageKey, JSON.stringify(newBookmarks));
      setBookmarked(!bookmarked);

      if (onRefresh) {
        setTimeout(() => {
          onRefresh();
        }, 400);
      }
    } catch (err) {
      console.error('Error handling bookmark', err);
      showToastMessage('Thao tác lưu thất bại.', 'error');
    } finally {
      setShowDropdown(false);
    }
  };

  // Chia sẻ liên kết (Share)
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareModal(true);
  };

  // Xóa bài viết
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: 'Xóa bài viết',
      message: 'Bạn có chắc chắn muốn xóa bài viết này không?',
      onConfirm: async () => {
        try {
          await articleApi.deleteArticle(article.id);
          showToastMessage('Xóa bài đăng thành công!');

          if (user) {
            const storageKey = `bookmarks_${user.id}`;
            const bookmarks = JSON.parse(localStorage.getItem(storageKey) || '[]');
            const newBookmarks = bookmarks.filter((b: any) => b.id !== article.id);
            localStorage.setItem(storageKey, JSON.stringify(newBookmarks));
          }

          if (onRefresh) onRefresh();
        } catch (err: any) {
          console.error(err);
          showToastMessage(err.response?.data?.message || 'Không thể xóa bài đăng.', 'error');
        }
      }
    });
  };

  // Xử lý chọn hình ảnh khi bình luận
  const handleCommentImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToastMessage('Chỉ hỗ trợ file hình ảnh.', 'error');
      return;
    }
    try {
      const url = await mediaApi.uploadFile(file);
      setCommentImage(url);
    } catch (err) {
      console.error(err);
      showToastMessage('Lỗi tải ảnh.', 'error');
    }
  };

  // Xử lý chọn hình ảnh khi phản hồi comment
  const handleReplyImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToastMessage('Chỉ hỗ trợ file hình ảnh.', 'error');
      return;
    }
    try {
      const url = await mediaApi.uploadFile(file);
      setReplyImage(url);
    } catch (err) {
      console.error(err);
      showToastMessage('Lỗi tải ảnh.', 'error');
    }
  };

  // Gửi bình luận mới (gốc)
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() && !commentImage) return;
    if (!user) {
      showToastMessage('Vui lòng đăng nhập để bình luận.', 'error');
      return;
    }

    setPostingComment(true);
    try {
      let finalContent = commentText.trim();
      if (commentImage) {
        finalContent += `\n\n![comment_image](${commentImage})`;
      }

      await commentApi.createComment({
        articleId: article.id,
        content: finalContent
      });

      setCommentText('');
      setCommentImage(null);
      if (commentImageInputRef.current) commentImageInputRef.current.value = '';

      showToastMessage('Đã đăng câu trả lời!');
      fetchComments();
    } catch (err) {
      console.error('Failed to create comment', err);
      showToastMessage('Đăng bình luận thất bại.', 'error');
    } finally {
      setPostingComment(false);
    }
  };

  // Gửi phản hồi bình luận con (Threaded Replies)
  const handlePostReply = async (commentId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() && !replyImage) return;
    if (!user) return;

    setPostingComment(true);
    try {
      let finalContent = replyText.trim();
      if (replyImage) {
        finalContent += `\n\n![comment_image](${replyImage})`;
      }

      await commentApi.createComment({
        articleId: article.id,
        parentId: commentId,
        content: finalContent
      });

      setReplyText('');
      setReplyImage(null);
      setReplyingToId(null);
      if (replyImageInputRef.current) replyImageInputRef.current.value = '';

      showToastMessage('Đã đăng phản hồi!');
      fetchComments();
    } catch (err) {
      console.error('Failed to post reply', err);
      showToastMessage('Gửi phản hồi thất bại.', 'error');
    } finally {
      setPostingComment(false);
    }
  };

  // Cập nhật/Chỉnh sửa bình luận cá nhân
  const handleUpdateComment = async (commentId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!editCommentText.trim()) return;

    try {
      // Giữ lại ảnh đính kèm cũ trong comment nếu có
      const oldComment = comments.find(c => c.id === commentId);
      let imagePart = '';
      if (oldComment) {
        const imgMatch = oldComment.content.match(/!\[comment_image\]\(([^\)]+)\)/);
        if (imgMatch) {
          imagePart = `\n\n${imgMatch[0]}`;
        }
      }

      const finalContent = editCommentText.trim() + imagePart;

      await commentApi.updateComment(commentId, { content: finalContent });
      setEditingCommentId(null);
      setEditCommentText('');
      showToastMessage('Đã cập nhật bình luận!');
      fetchComments();
    } catch (err) {
      console.error('Failed to edit comment', err);
      showToastMessage('Cập nhật bình luận thất bại.', 'error');
    }
  };

  // Xóa bình luận
  const handleDeleteComment = async (commentId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xóa bình luận',
      message: 'Bạn có chắc muốn xóa bình luận này không?',
      onConfirm: async () => {
        try {
          await commentApi.deleteComment(commentId);
          showToastMessage('Xóa bình luận thành công!');
          fetchComments();
        } catch (err: any) {
          console.error(err);
          showToastMessage(err.response?.data?.message || 'Không thể xóa bình luận.', 'error');
        }
      }
    });
  };

  // Xử lý khi chọn file trong Modal chỉnh sửa bài đăng
  const handleEditFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      showToastMessage('Chỉ cho phép tải lên hình ảnh hoặc video.', 'error');
      return;
    }

    // Kiểm tra giới hạn video dưới 2.5 phút (150 giây)
    if (isVideo) {
      try {
        const duration = await checkVideoDuration(file);
        if (duration > 150) {
          showToastMessage('Thời lượng video phải dưới 2.5 phút!', 'error');
          return;
        }
      } catch (err) {
        console.error(err);
        showToastMessage('Không thể kiểm tra thời lượng video.', 'error');
        return;
      }
    }

    try {
      if (editFile && editFile.url && editFile.url.startsWith('blob:')) {
        URL.revokeObjectURL(editFile.url);
      }

      const url = URL.createObjectURL(file);
      setEditFile({
        url,
        type: isImage ? 'image' : 'video',
        file: file
      });
    } catch (err) {
      console.error(err);
      showToastMessage('Lỗi đọc file.', 'error');
    }
  };

  const handleRemoveEditFile = () => {
    if (editFile && editFile.url && editFile.url.startsWith('blob:')) {
      URL.revokeObjectURL(editFile.url);
    }
    setEditFile(null);
    if (editFileInputRef.current) editFileInputRef.current.value = '';
  };

  // Xử lý cập nhật bài viết
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContent.trim() && !editFile) return;

    setUpdating(true);
    
    const lines = editContent.trim().split('\n');
    const firstLine = lines[0].trim();
    const title = firstLine.substring(0, 100) || (editFile?.type === 'image' ? 'Hình ảnh mới' : 'Video mới');

    const hashtagRegex = /#(\w+)/g;
    const tags: string[] = [];
    let match;
    while ((match = hashtagRegex.exec(editContent)) !== null) {
      tags.push(match[1]);
    }

    const summary = editContent.substring(0, 150) + (editContent.length > 150 ? '...' : '');

    try {
      let mediaUrl = '';
      if (editFile) {
        if (editFile.file) {
          // File được chọn mới -> Upload lên Cloudinary
          showToastMessage('Đang tải file mới lên Cloudinary...');
          mediaUrl = await uploadToCloudinary(editFile.file);
        } else {
          // Giữ nguyên file cũ (đã là Base64 hoặc là link Cloudinary trước đó)
          mediaUrl = editFile.base64 || editFile.url;
        }
      }

      let mediaEmbed = '';
      if (mediaUrl) {
        if (editFile?.type === 'image') {
          mediaEmbed = `\n\n![image](${mediaUrl})`;
        } else {
          mediaEmbed = `\n\n<video src="${mediaUrl}" controls class="rounded-app w-full max-h-[450px] mt-2 bg-black"></video>`;
        }
      }

      const finalContent = editContent.trim() + mediaEmbed;

      await articleApi.updateArticle(article.id, {
        title,
        summary,
        content: finalContent,
        tags
      });

      if (editFile && editFile.url && editFile.url.startsWith('blob:')) {
        URL.revokeObjectURL(editFile.url);
      }

      if (user) {
        // Cập nhật bookmarks
        const storageKey = `bookmarks_${user.id}`;
        const bookmarks = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const updatedBookmarks = bookmarks.map((b: any) => {
          if (b.id === article.id) {
            return {
              ...b,
              title,
              summary,
              content: finalContent,
              tags,
              updatedAt: new Date().toISOString()
            };
          }
          return b;
        });
        localStorage.setItem(storageKey, JSON.stringify(updatedBookmarks));

        // Cập nhật liked_posts
        const likedKey = `liked_posts_${user.id}`;
        const likedList = JSON.parse(localStorage.getItem(likedKey) || '[]');
        const updatedLiked = likedList.map((b: any) => {
          if (b.id === article.id) {
            return {
              ...b,
              title,
              summary,
              content: finalContent,
              tags,
              updatedAt: new Date().toISOString()
            };
          }
          return b;
        });
        localStorage.setItem(likedKey, JSON.stringify(updatedLiked));

        // Cập nhật reposts
        const repostKey = `reposts_${user.id}`;
        const repostList = JSON.parse(localStorage.getItem(repostKey) || '[]');
        const updatedReposts = repostList.map((b: any) => {
          if (b.id === article.id) {
            return {
              ...b,
              title,
              summary,
              content: finalContent,
              tags,
              updatedAt: new Date().toISOString()
            };
          }
          return b;
        });
        localStorage.setItem(repostKey, JSON.stringify(updatedReposts));
      }

      showToastMessage('Cập nhật bài viết thành công!');
      setIsEditing(false);

      setTimeout(() => {
        if (onRefresh) onRefresh();
      }, 500);
    } catch (err) {
      console.error('Error updating article', err);
      showToastMessage('Cập nhật thất bại.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const renderEmojiPicker = (type: 'comment' | 'reply') => {
    const activeTab = type === 'comment' ? activeCommentEmojiTab : activeReplyEmojiTab;
    const setActiveTab = type === 'comment' ? setActiveCommentEmojiTab : setActiveReplyEmojiTab;
    const searchVal = type === 'comment' ? searchCommentEmoji : searchReplyEmoji;
    const setSearchVal = type === 'comment' ? setSearchCommentEmoji : setSearchReplyEmoji;
    const hoveredEmoji = type === 'comment' ? hoveredCommentEmoji : hoveredReplyEmoji;
    const setHoveredEmoji = type === 'comment' ? setHoveredCommentEmoji : setHoveredReplyEmoji;
    const setTargetText = type === 'comment' ? setCommentText : setReplyText;
    const setShowPicker = type === 'comment' ? setShowCommentEmojiPicker : setShowReplyEmojiPicker;

    const allEmojis = EMOJI_CATEGORIES.flatMap(c => c.emojis);
    const filteredEmojis = searchVal.trim()
      ? allEmojis.filter(emoji => {
          const keywords = EMOJI_KEYWORDS[emoji] || '';
          return keywords.toLowerCase().includes(searchVal.toLowerCase()) || emoji === searchVal.trim();
        })
      : EMOJI_CATEGORIES[activeTab].emojis;

    return (
      <div className="absolute right-0 top-10 bg-[#15181c] border border-gray-800 rounded-2xl p-3.5 shadow-2xl z-50 w-72 flex flex-col gap-2">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Tìm kiếm biểu tượng cảm xúc"
            className="w-full bg-[#202327] border-0 text-text-primary text-xs rounded-full pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary placeholder-text-secondary"
          />
          <span className="absolute left-3 top-2 text-text-secondary text-xs">🔍</span>
        </div>

        {/* Tabs */}
        <div className="flex justify-between border-b border-gray-800 pb-1.5 overflow-x-auto">
          {EMOJI_CATEGORIES.map((cat, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setActiveTab(idx);
                setSearchVal('');
              }}
              className={`text-lg p-1.5 rounded transition-all cursor-pointer ${searchVal === '' && activeTab === idx ? 'bg-primary/20 scale-110 font-bold border-b-2 border-primary' : 'hover:bg-white/5 opacity-70 hover:opacity-100'}`}
              title={cat.title}
            >
              {cat.icon}
            </button>
          ))}
        </div>

        {/* Title */}
        <div className="text-xs font-bold text-text-secondary">
          {searchVal.trim() ? 'Kết quả tìm kiếm' : EMOJI_CATEGORIES[activeTab].title}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-6 gap-1.5 max-h-36 overflow-y-auto pr-1">
          {filteredEmojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onMouseEnter={() => setHoveredEmoji(emoji)}
              onClick={() => {
                setTargetText(prev => prev + emoji);
              }}
              className="text-xl hover:bg-white/10 p-1.5 rounded transition-colors cursor-pointer text-center"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-800 pt-2 mt-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{hoveredEmoji || '😊'}</span>
            <span className="text-[10px] text-text-secondary font-medium">Chèn</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowPicker(false);
              setSearchVal('');
            }}
            className="w-7 h-7 rounded-full bg-[#ffd43b] hover:bg-[#ffe066] text-[#1e1e1e] flex items-center justify-center font-bold text-xs shadow cursor-pointer transition-all hover:scale-105"
            title="Hoàn tất"
          >
            ✓
          </button>
        </div>
      </div>
    );
  };

  const isOwner = user && user.id === article.authorId;
  
  // Thông tin hiển thị (tên thật nếu fetch được, fallback ảo nếu lỗi)
  const authorName = authorProfile ? authorProfile.displayName : `Tác giả ${article.authorId.substring(0, 4)}`;
  const authorHandle = authorProfile ? `@${authorProfile.username}` : `@user_${article.authorId.substring(0, 8)}`;
  const authorInitials = authorName.substring(0, 2).toUpperCase();
  const avatarUrl = authorProfile ? authorProfile.avatarUrl : null;

  // Lọc phân cấp comments
  const rootComments = comments.filter(c => c.parentId === null && !c.content.includes('[repost]'));
  const getRepliesFor = (parentId: string) => comments.filter(c => c.parentId === parentId);

  // Render một phần tử bình luận
  const renderSingleComment = (comment: CommentResponse, isReply = false) => {
    const cProfile = commentProfiles[comment.authorId];
    const cName = cProfile ? cProfile.displayName : `User ${comment.authorId.substring(0, 4)}`;
    const cHandle = cProfile ? `@${cProfile.username}` : `@user_${comment.authorId.substring(0, 6)}`;
    const cInitials = cName.substring(0, 2).toUpperCase();
    const cAvatar = cProfile ? cProfile.avatarUrl : null;
    
    const isCommentOwner = user && user.id === comment.authorId;
    const isEditingThis = editingCommentId === comment.id;
    const likesInfo = commentLikes[comment.id] || { count: 0, liked: false };
    const isCommentAuthorFollowing = commentsFollowStatus[comment.authorId] || false;

    return (
      <div key={comment.id} className="flex gap-3 text-sm animate-fade-in group items-start">
        {/* Avatar bình luận - Click để xem Profile */}
        <div 
          onClick={() => navigate(`/profile?userId=${comment.authorId}`)}
          className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center text-white text-xs font-semibold shrink-0 overflow-hidden shadow cursor-pointer hover:opacity-90 transition-opacity"
        >
          {cAvatar ? (
            <img src={cAvatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            cInitials
          )}
        </div>

        {/* Nội dung bình luận */}
        <div className="flex-1 min-w-0 bg-white/[0.012] rounded-2xl px-4 py-2.5 border border-gray-800/40 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Tên bình luận - Click để xem Profile */}
              <span 
                onClick={() => navigate(`/profile?userId=${comment.authorId}`)}
                className="font-bold text-text-primary hover:underline text-xs cursor-pointer"
              >
                {cName}
              </span>
              <span className="text-text-secondary text-[11px]">{cHandle}</span>
              
              {/* Nút Follow nhanh cho tác giả bình luận */}
              {user && comment.authorId !== user.id && (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      let res: any;
                      if (isCommentAuthorFollowing) {
                        res = await userApi.unfollowUser(comment.authorId);
                        showToastMessage(`Đã hủy theo dõi @${cProfile?.username || 'user'}`);
                      } else {
                        res = await userApi.followUser(comment.authorId);
                        showToastMessage(`Đã theo dõi @${cProfile?.username || 'user'}!`);
                      }
                      setCommentsFollowStatus(prev => ({ ...prev, [comment.authorId]: res.following }));
                    } catch (err) {
                      showToastMessage('Thao tác thất bại.', 'error');
                    }
                  }}
                  className="text-[11px] font-bold text-primary hover:underline ml-1 cursor-pointer"
                >
                  {isCommentAuthorFollowing ? '· Following' : '· Follow'}
                </button>
              )}

              <span className="text-text-secondary text-[10px]">·</span>
              <span className="text-text-secondary text-[11px]">{formatTime(comment.createdAt)}</span>
            </div>

            {/* Cụm hành động cho Comment */}
            <div className="flex items-center gap-2">
              {isCommentOwner && !isEditingThis && (
                <button
                  onClick={() => {
                    setEditingCommentId(comment.id);
                    let text = comment.content;
                    const imgMatch = comment.content.match(/!\[comment_image\]\(([^\)]+)\)/);
                    if (imgMatch) {
                      text = text.replace(imgMatch[0], '');
                    }
                    setEditCommentText(text.trim());
                  }}
                  className="text-text-secondary hover:text-primary transition-colors p-1 opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Chỉnh sửa bình luận"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}

              {isCommentOwner && (
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="text-text-secondary hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Xóa bình luận"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Body bình luận */}
          <div className="mt-1">
            {isEditingThis ? (
              <form onSubmit={(e) => handleUpdateComment(comment.id, e)} className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={editCommentText}
                  onChange={(e) => setEditCommentText(e.target.value)}
                  className="flex-1 bg-background border border-gray-700 text-text-primary text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  disabled={!editCommentText.trim()}
                  className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Lưu
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCommentId(null)}
                  className="text-text-secondary hover:text-text-primary text-xs font-semibold px-1 cursor-pointer"
                >
                  Hủy
                </button>
              </form>
            ) : (
              renderCommentContent(comment.content)
            )}
          </div>

          {/* Footer bình luận (Thích, Phản hồi) */}
          {!isEditingThis && (
            <div className="flex items-center gap-4 mt-2 text-xs text-text-secondary">
              {/* Nút Thích bình luận */}
              <button
                onClick={(e) => handleLikeComment(comment.id, e)}
                className={`flex items-center gap-1 hover:text-red-500 transition-all cursor-pointer ${likesInfo.liked ? 'text-red-500 font-semibold' : ''}`}
              >
                <Heart className={`w-3.5 h-3.5 ${likesInfo.liked ? 'fill-current' : ''}`} />
                <span>{likesInfo.count}</span>
              </button>

              {/* Nút Phản hồi */}
              {!isReply && (
                <button
                  onClick={() => {
                    setReplyingToId(replyingToId === comment.id ? null : comment.id);
                    setReplyText('');
                    setReplyImage(null);
                  }}
                  className="hover:text-primary transition-colors cursor-pointer"
                >
                  Phản hồi
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };



  return (
    <div 
      className="bg-surface p-4 border-b border-gray-800 hover:bg-white/[0.01] transition-colors duration-200 flex flex-col gap-3 animate-fade-in text-[15px] relative cursor-pointer"
      onClick={() => navigate(`/article/${article.id}`, { state: { backgroundLocation: location } })}
    >
      {/* Khung nội dung chính của Post */}
      <div className="flex gap-3">
        {/* Cột bên trái: Avatar tròn - Click để xem Profile */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/profile?userId=${article.authorId}`);
          }}
          className="shrink-0"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white font-semibold text-sm shadow-md cursor-pointer hover:opacity-90 transition-opacity overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              authorInitials
            )}
          </div>
        </div>

        {/* Cột bên phải: Header & Body */}
        <div className="flex-1 min-w-0">
          {/* Header: Tác giả, Follow nhanh và nút tác vụ */}
          <div className="flex items-center justify-between relative">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Tên hiển thị - Click để xem Profile */}
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/profile?userId=${article.authorId}`);
                }}
                className="font-bold text-text-primary hover:underline cursor-pointer"
              >
                {authorName}
              </span>
              <span className="text-text-secondary text-sm">
                {authorHandle}
              </span>
              <span className="text-text-secondary text-sm">·</span>
              <span className="text-text-secondary text-sm">
                {formatTime(article.publishedAt || article.createdAt)}
              </span>
            </div>

            {/* Cụm nút Follow nhanh & Thao tác ba chấm */}
            <div className="flex items-center gap-1 relative">
              {/* Nút Follow nhanh bên cạnh bài đăng của người khác */}
              {!isOwner && user && (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      let res: any;
                      if (isAuthorFollowing) {
                        res = await userApi.unfollowUser(article.authorId);
                        showToastMessage(`Đã hủy theo dõi @${authorProfile?.username || 'user'}`);
                      } else {
                        res = await userApi.followUser(article.authorId);
                        showToastMessage(`Đã theo dõi @${authorProfile?.username || 'user'}!`);
                      }
                      setIsAuthorFollowing(res.following);
                    } catch (err) {
                      console.error('Follow error', err);
                      showToastMessage('Thao tác thất bại.', 'error');
                    }
                  }}
                  className={`px-3 py-1 font-bold text-xs rounded-full transition-all cursor-pointer ${isAuthorFollowing ? 'border border-gray-700 text-text-primary hover:border-red-500 hover:text-red-500 hover:bg-red-500/10' : 'bg-primary text-white hover:bg-primary/95'}`}
                >
                  {isAuthorFollowing ? 'Following' : 'Follow'}
                </button>
              )}

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(!showDropdown);
                  }}
                  className="text-text-secondary hover:text-primary p-1.5 rounded-full hover:bg-primary/10 transition-colors cursor-pointer"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-1 w-48 bg-surface border border-gray-800 rounded-lg shadow-xl py-1.5 z-30 animate-fade-in text-sm">
                    {/* Hành động Bookmark */}
                    <button
                      onClick={handleBookmark}
                      className="flex items-center gap-2.5 w-full text-left px-4 py-2 hover:bg-white/5 text-text-primary transition-colors cursor-pointer"
                    >
                      <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-primary text-primary' : 'text-text-secondary'}`} />
                      <span>{bookmarked ? 'Bỏ lưu bài viết' : 'Thêm vào đã lưu'}</span>
                    </button>

                    {/* Các hành động chỉ dành cho chủ bài viết (Chỉnh sửa / Xóa) */}
                    {isOwner && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsEditing(true);
                            setShowDropdown(false);
                          }}
                          className="flex items-center gap-2.5 w-full text-left px-4 py-2 hover:bg-white/5 text-text-primary transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4 text-text-secondary" />
                          <span>Chỉnh sửa bài đăng</span>
                        </button>
                        <div className="border-t border-gray-800/80 my-1" />
                        <button
                          onClick={handleDelete}
                          className="flex items-center gap-2.5 w-full text-left px-4 py-2 hover:bg-red-500/5 text-red-500 hover:text-red-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Xóa bài đăng</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Body: Nội dung bài viết */}
          <div className="mt-1 space-y-1 text-text-primary leading-normal">
            {article.title && !article.content.startsWith(article.title) && (
              <h3 className="font-bold text-base mb-1 text-text-primary">
                {article.title}
              </h3>
            )}
            {renderContentWithMedia(article.content)}
          </div>

          {/* Footer: Hộp tương tác */}
          <div className="flex justify-between items-center max-w-md mt-3 text-text-secondary text-[13px] -ml-2">
            {/* Like (Đa cảm xúc) */}
            <div 
              className="flex items-center gap-1 relative"
              onMouseEnter={() => setShowReactionPicker(true)}
              onMouseLeave={() => setShowReactionPicker(false)}
            >
              {/* Bảng chọn cảm xúc (Reaction Picker) */}
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

              <button
                onClick={(e) => handleLike(e, 'LIKE')}
                className={`flex items-center justify-center p-2 rounded-full hover:bg-primary/10 transition-all cursor-pointer group`}
                title="Thích"
              >
                {myReaction === 'LOVE' ? <span className="text-xl leading-none">❤️</span> :
                 myReaction === 'HAHA' ? <span className="text-xl leading-none">😆</span> :
                 myReaction === 'WOW' ? <span className="text-xl leading-none">😮</span> :
                 myReaction === 'SAD' ? <span className="text-xl leading-none">😢</span> :
                 myReaction === 'ANGRY' ? <span className="text-xl leading-none">😡</span> :
                 myReaction === 'LIKE' ? <span className="text-xl leading-none text-primary">👍</span> :
                 <ThumbsUp className={`w-4 h-4 group-hover:scale-110 transition-transform ${liked ? 'fill-current text-primary' : ''}`} />
                }
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setShowLikersModal(true); }}
                className={`hover:underline transition-colors cursor-pointer text-[13px] hover:text-primary ${liked ? 'text-primary' : ''}`}
                title="Xem người thích"
                disabled={likeCount === 0}
              >
                {likeCount > 0 ? likeCount : ''}
              </button>
              {likeCount === 0 && <span className="text-[13px]">0</span>}
            </div>

            {/* Comment */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/article/${article.id}`, { state: { backgroundLocation: location } });
              }}
              className={`flex items-center gap-1.5 hover:text-primary group p-2 rounded-full hover:bg-primary/10 transition-all cursor-pointer ${showComments ? 'text-primary' : ''}`}
            >
              <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>{comments.filter(c => !c.content.includes('[repost]')).length}</span>
            </button>

            {/* Repost */}
            <button
              onClick={user?.id !== article.authorId ? handleRepost : undefined}
              className={`flex items-center gap-1.5 group p-2 rounded-full transition-all cursor-pointer ${user?.id === article.authorId ? 'opacity-50 cursor-not-allowed' : reposted ? 'text-green-500 hover:text-green-400' : 'text-text-secondary hover:text-green-400 hover:bg-green-500/10'}`}
              title={user?.id === article.authorId ? "Không thể tự đăng lại bài của mình" : "Đăng lại"}
            >
              <Repeat className={`w-4 h-4 group-hover:rotate-180 transition-transform duration-300 ${reposted ? 'scale-110' : ''}`} />
              <span>{repostCount}</span>
            </button>

            {/* Bookmark */}
            <button
              onClick={handleBookmark}
              className={`flex items-center gap-1.5 hover:text-blue-500 group p-2 rounded-full hover:bg-blue-500/10 transition-all cursor-pointer ${bookmarked ? 'text-blue-500' : ''}`}
            >
              <Bookmark className={`w-4 h-4 group-hover:scale-110 transition-transform ${bookmarked ? 'fill-current' : ''}`} />
            </button>

            {/* AI Assistant */}
            {user && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setAiChatOpen(true);
                }}
                className="flex items-center gap-1.5 hover:text-purple-500 group p-2 rounded-full hover:bg-purple-500/10 transition-all cursor-pointer text-text-secondary"
                title="Hỏi trợ lý AI"
              >
                <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform text-purple-400 fill-purple-400/20" />
              </button>
            )}

            {/* Share */}
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 hover:text-primary group p-2 rounded-full hover:bg-primary/10 transition-all cursor-pointer"
              title="Chia sẻ liên kết"
            >
              <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* KHUNG BÌNH LUẬN NÂNG CAO (COMMENTS SECTION MULTI-LEVEL) */}
      {showComments && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="mt-2 border-t border-gray-800/80 pt-3 pl-12 space-y-4"
        >
          
          {/* Ô nhập bình luận gốc */}
          {user && (
            <div className="space-y-2">
              <form onSubmit={handlePostComment} className="flex gap-2.5 items-center" onClick={e => e.stopPropagation()}>
                <input
                  ref={commentInputRef}
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={postingComment}
                  placeholder="Viết phản hồi..."
                  className="flex-1 bg-background border border-gray-700 text-text-primary text-sm rounded-full px-4 py-2 focus:outline-none focus:border-primary transition-colors"
                />
                
                {/* Nút chọn ảnh bình luận */}
                <button
                  type="button"
                  onClick={() => commentImageInputRef.current?.click()}
                  className={`p-2 rounded-full hover:bg-white/5 transition-colors cursor-pointer ${commentImage ? 'text-primary' : 'text-text-secondary'}`}
                  title="Thêm hình ảnh vào bình luận"
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

                {/* Nút chọn Emoji bình luận */}
                <div className="relative" ref={commentEmojiPickerRef}>
                  <button
                    type="button"
                    onClick={() => setShowCommentEmojiPicker(!showCommentEmojiPicker)}
                    disabled={postingComment}
                    className={`p-2 rounded-full hover:bg-white/5 transition-colors cursor-pointer ${showCommentEmojiPicker ? 'text-primary' : 'text-text-secondary'}`}
                    title="Biểu cảm"
                  >
                    <Smile className="w-4.5 h-4.5" />
                  </button>
                  {showCommentEmojiPicker && renderEmojiPicker('comment')}
                </div>

                <button
                  type="submit"
                  disabled={postingComment || (!commentText.trim() && !commentImage)}
                  className="p-2 bg-primary hover:bg-primary/95 text-white rounded-full transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

              {/* Preview ảnh đính kèm bình luận cha */}
              {commentImage && (
                <div className="relative inline-block mt-1 bg-black/35 rounded-lg border border-gray-800 max-h-24 overflow-hidden">
                  <img src={commentImage || undefined} alt="Comment Preview" className="max-h-24 max-w-[150px] object-contain rounded-lg" />
                  <button
                    type="button"
                    onClick={() => {
                      setCommentImage(null);
                      if (commentImageInputRef.current) commentImageInputRef.current.value = '';
                    }}
                    className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:scale-105"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Danh sách bình luận đa cấp */}
          <div className="space-y-4">
            {loadingComments ? (
              <div className="text-xs text-text-secondary animate-pulse py-2">Đang tải các bình luận...</div>
            ) : rootComments.length === 0 ? (
              <div className="text-xs text-text-secondary italic py-1">Chưa có bình luận nào. Hãy gửi câu trả lời đầu tiên!</div>
            ) : (
              rootComments.map((comment) => {
                const childReplies = getRepliesFor(comment.id);

                return (
                  <div key={comment.id} className="space-y-3">
                    
                    {/* Render bình luận cha */}
                    {renderSingleComment(comment, false)}

                    {/* Khung ô nhập phản hồi thụt lề dưới comment cha */}
                    {replyingToId === comment.id && user && (
                      <div className="ml-10 mt-1 pl-3 border-l-2 border-primary/40 space-y-2">
                        <form onSubmit={(e) => handlePostReply(comment.id, e)} className="flex gap-2.5 items-center">
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            disabled={postingComment}
                            placeholder="Viết phản hồi..."
                            className="flex-1 bg-background border border-gray-700 text-text-primary text-xs rounded-full px-3.5 py-1.5 focus:outline-none focus:border-primary"
                          />
                          
                          {/* Nút chọn ảnh phản hồi */}
                          <button
                            type="button"
                            onClick={() => replyImageInputRef.current?.click()}
                            className={`p-1.5 rounded-full hover:bg-white/5 transition-colors cursor-pointer ${replyImage ? 'text-primary' : 'text-text-secondary'}`}
                            title="Thêm hình ảnh"
                          >
                            <ImageIcon className="w-4 h-4" />
                          </button>
                          <input
                            type="file"
                            ref={replyImageInputRef}
                            onChange={handleReplyImageChange}
                            accept="image/*"
                            className="hidden"
                          />

                          {/* Nút chọn Emoji phản hồi */}
                          <div className="relative" ref={replyEmojiPickerRef}>
                            <button
                              type="button"
                              onClick={() => setShowReplyEmojiPicker(!showReplyEmojiPicker)}
                              disabled={postingComment}
                              className={`p-1.5 rounded-full hover:bg-white/5 transition-colors cursor-pointer ${showReplyEmojiPicker ? 'text-primary' : 'text-text-secondary'}`}
                              title="Biểu cảm"
                            >
                              <Smile className="w-4 h-4" />
                            </button>
                            {showReplyEmojiPicker && renderEmojiPicker('reply')}
                          </div>

                          <button
                            type="submit"
                            disabled={postingComment || (!replyText.trim() && !replyImage)}
                            className="p-1.5 bg-primary hover:bg-primary/95 text-white rounded-full transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </form>

                        {/* Preview ảnh phản hồi */}
                        {replyImage && (
                          <div className="relative inline-block mt-1 bg-black/35 rounded-lg border border-gray-800 max-h-20 overflow-hidden">
                            <img src={replyImage || undefined} alt="Reply Preview" className="max-h-20 max-w-[120px] object-contain rounded-lg" />
                            <button
                              type="button"
                              onClick={() => {
                                setReplyImage(null);
                                if (replyImageInputRef.current) replyImageInputRef.current.value = '';
                              }}
                              className="absolute top-1 right-1 p-0.5 bg-black/60 text-white rounded-full"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Render danh sách bình luận con (Thụt lề) */}
                    {childReplies.length > 0 && (
                      <div className="ml-10 space-y-3 mt-1 pl-3 border-l-2 border-gray-800/60">
                        {childReplies.map((reply) => renderSingleComment(reply, true))}
                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODAL CHỈNH SỬA BÀI VIẾT (EDIT MODAL - NÂNG CẤP CHỌN FILE) */}
      {isEditing && (
        <div className="fixed inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface w-full max-w-lg rounded-app border border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h2 className="text-lg font-bold text-text-primary">Chỉnh sửa bài đăng</h2>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                }}
                className="text-text-secondary hover:text-text-primary p-1.5 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                disabled={updating}
                rows={5}
                className="w-full bg-background border border-gray-700 text-text-primary rounded-lg p-3 text-[15px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none placeholder-text-secondary"
                placeholder="Nội dung bài đăng..."
              />

              {/* Khung hiển thị Preview tệp đính kèm trong Modal */}
              {editFile && (
                <div className="relative mt-2 rounded-lg overflow-hidden border border-gray-800 bg-black/40 max-h-56 flex items-center justify-center">
                  <img
                    src={editFile.url}
                    alt="Preview"
                    className="max-h-56 max-w-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveEditFile}
                    className="absolute top-2.5 right-2.5 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer hover:scale-105"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Input file ẩn trong Modal chỉnh sửa */}
            <input
              type="file"
              ref={editFileInputRef}
              onChange={handleEditFileChange}
              accept="image/*,video/mp4,video/quicktime"
              className="hidden"
            />

            {/* Modal Footer với nút công cụ chọn file */}
            <div className="flex justify-between items-center px-6 py-4 bg-background border-t border-gray-800/80">
              {/* Nút chọn hình ảnh/video mới */}
              <div>
                <button
                  type="button"
                  onClick={() => editFileInputRef.current?.click()}
                  className="p-2 rounded-full hover:bg-primary/10 text-primary transition-colors cursor-pointer"
                  title="Thay đổi hoặc thêm hình ảnh/video"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Các nút Hủy / Lưu */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => {
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-text-primary text-sm font-semibold rounded-full transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={updating || (!editContent.trim() && !editFile)}
                  className="px-5 py-2 bg-primary hover:bg-primary/95 text-white text-sm font-bold rounded-full transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {updating ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST SYSTEM */}
      {toast && (
        <div className="fixed bottom-5 right-5 bg-surface border border-gray-800 text-text-primary px-4 py-3.5 rounded-app shadow-2xl flex items-center gap-2.5 animate-fade-in z-50 min-w-[200px]">
          <div className={`p-1 rounded-full ${toast.type === 'success' ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'}`}>
            {toast.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </div>
          <span className="font-semibold text-sm">{toast.message}</span>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal && (
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={() => {
            confirmModal.onConfirm();
            setConfirmModal(null);
          }}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {/* Modal Danh sách người Thích */}
      {showLikersModal && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => { e.stopPropagation(); setShowLikersModal(false); }}
        >
          <div 
            className="bg-background border border-gray-800 rounded-2xl w-full max-w-sm overflow-hidden relative shadow-2xl animate-[slideIn_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h3 className="font-bold text-lg text-text-primary">Đã thích</h3>
              <button 
                onClick={() => setShowLikersModal(false)}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {loadingLikers ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-primary" />
                </div>
              ) : likers.length === 0 ? (
                <div className="text-center p-8 text-text-secondary text-sm">
                  Không có thông tin.
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {likers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-xl transition-colors cursor-pointer" onClick={() => window.location.href = `/?userId=${user.id}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white font-semibold shadow-md overflow-hidden shrink-0">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            (user.displayName || user.username || 'U').substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-[15px] text-text-primary hover:underline">{user.displayName || user.username}</span>
                          <span className="text-text-secondary text-[13px]">@{user.username}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Fullscreen Map Modal */}
      {showMapModal && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-fade-in">
          <div className="p-4 flex justify-between items-center bg-black/50 absolute top-0 left-0 right-0 z-[101]">
            <h3 className="text-white font-semibold">Vị trí Check-in</h3>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowMapModal(false); }}
              className="text-white p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            >
              <X size={24} />
            </button>
          </div>
          <div className="flex-1 w-full h-full pt-16">
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              style={{ border: 0 }}
              src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}&q=${encodeURIComponent((article as any).location || '')}`}
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
      
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareUrl={`${window.location.origin}/article/${article.id}`}
        title={article.title || 'Bài viết từ Axion'}
        onRepost={user?.id !== article.authorId ? () => {
          handleRepost({ stopPropagation: () => {} } as any);
        } : undefined}
        reposted={reposted}
      />

      <div onClick={(e) => e.stopPropagation()}>
        <AiChatDrawer
          isOpen={aiChatOpen}
          onClose={() => setAiChatOpen(false)}
          articleId={article.id}
          articleTitle={article.title || 'Bài đăng'}
          articleContent={article.content}
        />
      </div>
    </div>
  );
};

export default ArticleCard;
