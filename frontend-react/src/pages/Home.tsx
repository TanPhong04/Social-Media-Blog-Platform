import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { articleApi } from '../api/articleApi';
import { userApi } from '../api/userApi';
import type { ArticleResponse } from '../api/articleApi';
import { mixFeed } from '../utils/feedMixer';
import ArticleCard from '../components/ArticleCard';
import { ReelsCarousel } from '../components/feed/ReelsCarousel';
import { useAuth } from '../contexts/AuthContext';
import { Image, Smile, Globe, AlertCircle, Radio } from 'lucide-react';
import { mediaApi } from '../api/mediaApi';
import CreateLiveModal from '../components/CreateLiveModal';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { MediaUploader } from '../components/shared/MediaUploader';
import type { SelectedFile } from '../components/shared/MediaUploader';
import { EmojiPicker } from '../components/shared/EmojiPicker';

// --- TWEET BOX COMPONENT ---
const TweetBox: React.FC<{
  currentUserProfile: any;
  user: any;
  onPostSuccess: () => void;
  autoFocus?: boolean;
}> = ({ currentUserProfile, user, onPostSuccess, autoFocus }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const [postText, setPostText] = useState('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [uploadingText, setUploadingText] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [autoFocus]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePost = async () => {
    if (!postText.trim() && selectedFiles.length === 0) return;

    setPosting(true);
    setPostError(null);

    const lines = postText.trim().split('\n');
    const firstLine = lines[0].trim();
    const videoFilesCount = selectedFiles.filter(f => f.type === 'video').length;
    const imageFilesCount = selectedFiles.filter(f => f.type === 'image').length;
    const isReelPost = videoFilesCount === 1 && imageFilesCount === 0;
    const title = firstLine.substring(0, 100) || (selectedFiles.length > 0 ? (isReelPost ? 'Reel mới' : selectedFiles[0].type === 'image' ? 'Hình ảnh mới' : 'Video mới') : 'Bài viết mới');

    const hashtagRegex = /#(\w+)/g;
    const tags: string[] = [];
    let match;
    while ((match = hashtagRegex.exec(postText)) !== null) {
      tags.push(match[1]);
    }

    const summary = postText.substring(0, 150) + (postText.length > 150 ? '...' : '');

    try {
      let mediaEmbed = '';
      if (selectedFiles.length > 0) {
        setUploadingText(`Đang tải lên ${selectedFiles.length} tệp tin...`);
        const uploadPromises = selectedFiles.map(f => mediaApi.uploadFile(f.file).then(url => ({ url, type: f.type })));
        const uploadedMedias = await Promise.all(uploadPromises);
        
        uploadedMedias.forEach(media => {
          if (media.type === 'image') {
            mediaEmbed += `\n\n![image](${media.url})`;
          } else {
            mediaEmbed += `\n\n<video src="${media.url}" controls class="rounded-app w-full max-h-[450px] mt-2 bg-black"></video>`;
          }
        });
        setUploadingText(null);
      }

      const finalContent = postText.trim() + mediaEmbed;

      const rVideoFiles = selectedFiles.filter(f => f.type === 'video');
      const rImageFiles = selectedFiles.filter(f => f.type === 'image');
      if (rVideoFiles.length === 1 && rImageFiles.length === 0 && !tags.includes('reel')) {
        tags.push('reel');
      }

      const created = await articleApi.createArticle({
        title,
        content: finalContent,
        summary,
        tags,
      });
      // Tự động publish ngay sau khi tạo để bài viết hiển thị trên bản tin
      await articleApi.publishArticle((created as any).id);

      setPostText('');
      setSelectedFiles([]);
      onPostSuccess();
    } catch (err: any) {
      console.error('Error creating post', err);
      setUploadingText(null);
      const serverError = err.response?.data;
      if (serverError && serverError.code === 'VALIDATION_FAILED' && serverError.fields) {
        const fieldErrors = Object.entries(serverError.fields)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join(', ');
        setPostError(`Lỗi kiểm tra dữ liệu (${fieldErrors})`);
      } else {
        setPostError(err.message || err.response?.data?.message || 'Không thể đăng bài viết lúc này.');
      }
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="p-4 border-b border-border-default flex gap-3 bg-surface/30">
      <div className="shrink-0 pt-1">
        <Avatar 
          src={currentUserProfile?.avatarUrl} 
          fallback={user?.displayName?.substring(0, 2).toUpperCase() || 'US'} 
          size="md" 
        />
      </div>

      <div className="flex-1 min-w-0">
        <textarea
          ref={textareaRef}
          value={postText}
          onChange={(e) => setPostText(e.target.value)}
          disabled={posting}
          placeholder="Có chuyện gì thế?"
          rows={3}
          aria-label="Nội dung bài viết"
          className="w-full bg-transparent border-0 text-text-primary text-lg focus:outline-none focus:ring-0 resize-none placeholder-text-muted py-2"
        />

        <MediaUploader
          files={selectedFiles}
          onFilesSelected={(newFiles) => {
            setPostError(null);
            setSelectedFiles(prev => [...prev, ...newFiles]);
          }}
          onRemoveFile={(id) => {
            setSelectedFiles(prev => {
              const fileToRemove = prev.find(f => f.id === id);
              if (fileToRemove?.url) URL.revokeObjectURL(fileToRemove.url);
              return prev.filter(f => f.id !== id);
            });
          }}
          onError={(err) => setPostError(err)}
          disabled={posting}
          triggerButton={null}
        />

        {postError && (
          <div className="text-error text-xs flex items-center gap-1.5 mt-2 bg-error/10 p-2.5 rounded-md border border-error/20" role="alert">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-medium">{postError}</span>
          </div>
        )}

        {uploadingText && (
          <div className="text-primary text-xs flex items-center gap-2 mt-2 bg-primary/10 p-2.5 rounded-md border border-primary/20" aria-live="polite">
            <Spinner size="sm" className="text-primary" />
            <span className="font-medium">{uploadingText}</span>
          </div>
        )}

        <div className="border-t border-border-subtle pt-3 mt-3 flex justify-between items-center">
          <div className="flex items-center gap-1.5 text-primary text-xs font-bold cursor-pointer hover:bg-primary-muted px-3 py-1.5 rounded-full transition-colors">
            <Globe className="w-4 h-4" />
            <span>Mọi người đều có thể trả lời</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
              disabled={posting}
              aria-label="Thêm hình ảnh hoặc video ngắn"
              className="p-2 text-primary hover:bg-primary-muted rounded-full transition-colors cursor-pointer disabled:opacity-50"
              title="Thêm hình ảnh hoặc video ngắn"
            >
              <Image className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setIsLiveModalOpen(true)}
              disabled={posting}
              className="p-2 text-primary hover:bg-primary-muted rounded-full transition-colors cursor-pointer disabled:opacity-50"
              title="Phát Livestream"
            >
              <Radio className="w-5 h-5 text-red-500 animate-pulse" />
            </button>

            <div className="relative" ref={emojiPickerRef}>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                disabled={posting}
                aria-expanded={showEmojiPicker}
                aria-label="Thêm biểu cảm"
                className="p-2 text-primary hover:bg-primary-muted rounded-full transition-colors cursor-pointer disabled:opacity-50"
                title="Biểu cảm"
              >
                <Smile className="w-5 h-5" />
              </button>
              {showEmojiPicker && (
                <EmojiPicker
                  onEmojiSelect={(emoji) => {
                    setPostText(prev => prev + emoji);
                    setShowEmojiPicker(false);
                  }}
                  onClose={() => setShowEmojiPicker(false)}
                />
              )}
            </div>

            <Button
              onClick={handlePost}
              disabled={posting || (!postText.trim() && selectedFiles.length === 0)}
              isLoading={posting}
              variant="primary"
              size="sm"
              className="rounded-full px-5 ml-2 font-bold shadow-sm"
            >
              Post
            </Button>
          </div>
        </div>
      </div>
      <CreateLiveModal 
        isOpen={isLiveModalOpen} 
        onClose={() => setIsLiveModalOpen(false)} 
        onSuccess={onPostSuccess} 
      />
    </div>
  );
};

// --- HOME COMPONENT ---
const Home: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  
  const [articles, setArticles] = useState<ArticleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'for-you' | 'following'>('for-you');
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

  const shouldFocus = new URLSearchParams(location.search).get('focus') === 'true';

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let response: any;
      if (activeTab === 'following' && isAuthenticated) {
        response = await articleApi.getFollowingFeed(0, 20);
      } else {
        response = await articleApi.getFeed(0, 20);
      }
      const fetchedArticles = response.content || [];
      const mixedArticles = mixFeed(fetchedArticles, { minPostsBetweenReels: 2 });
      setArticles(mixedArticles);
    } catch (err) {
      console.error('Failed to fetch articles', err);
      setError('Không thể tải danh sách bài viết. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, isAuthenticated]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  useEffect(() => {
    if (isAuthenticated) {
      userApi.getProfile()
        .then((res: any) => {
          setCurrentUserProfile(res);
        })
        .catch(err => {
          console.warn('Không thể tải profile thật của user hiện tại, dùng fallback', err);
        });
    }
  }, [isAuthenticated]);

  return (
    <div className="w-full max-w-[840px] mx-auto border-x-0 sm:border-x border-border-default min-h-screen bg-background pb-20">
      {/* Header Tabs */}
      <div 
        role="tablist"
        aria-label="Trang chủ"
        className="flex border-b border-border-default sticky top-16 bg-background/80 backdrop-blur-xl z-40"
      >
        <button
          role="tab"
          aria-selected={activeTab === 'for-you'}
          onClick={() => setActiveTab('for-you')}
          className="flex-1 py-4 text-center font-bold text-sm relative hover:bg-surface-elevated transition-colors cursor-pointer focus-visible:bg-surface-elevated focus-visible:outline-none"
        >
          <span className={activeTab === 'for-you' ? 'text-text-primary' : 'text-text-secondary'}>
            Dành cho bạn
          </span>
          {activeTab === 'for-you' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-primary rounded-t-full" />
          )}
        </button>

        {isAuthenticated && (
          <button
            role="tab"
            aria-selected={activeTab === 'following'}
            onClick={() => setActiveTab('following')}
            className="flex-1 py-4 text-center font-bold text-sm relative hover:bg-surface-elevated transition-colors cursor-pointer focus-visible:bg-surface-elevated focus-visible:outline-none"
          >
            <span className={activeTab === 'following' ? 'text-text-primary' : 'text-text-secondary'}>
              Đang theo dõi
            </span>
            {activeTab === 'following' && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-primary rounded-t-full" />
            )}
          </button>
        )}
      </div>

      {/* Tweet Box */}
      {isAuthenticated && (
        <TweetBox 
          currentUserProfile={currentUserProfile} 
          user={user} 
          onPostSuccess={fetchArticles} 
          autoFocus={shouldFocus} 
        />
      )}

      {/* Feed List */}
      <div role="feed" aria-busy={loading} className="divide-y divide-border-default">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-text-secondary">
            <Spinner size="lg" className="mb-4 text-primary" />
            <p className="text-sm font-medium">Đang tải bảng tin...</p>
          </div>
        ) : error ? (
          <EmptyState
            title="Đã xảy ra lỗi"
            description={error}
            icon={<AlertCircle className="w-8 h-8 text-error" />}
            action={<Button onClick={fetchArticles} variant="secondary" size="md">Thử lại</Button>}
            className="my-8 border-none bg-transparent"
          />
        ) : articles.length === 0 ? (
          <EmptyState
            title="Bảng tin trống"
            description="Hãy đăng bài viết đầu tiên của bạn hoặc theo dõi người dùng khác!"
            icon={<Globe className="w-8 h-8 text-text-muted" />}
            className="my-8 border-none bg-transparent"
          />
        ) : (
          <div className="flex flex-col">
            {articles.map((art, index) => (
              <React.Fragment key={art.id}>
                <ArticleCard article={art} onRefresh={fetchArticles} />
                {index === 2 && <ReelsCarousel />}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
