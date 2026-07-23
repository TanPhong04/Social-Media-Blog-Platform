import React, { useState, useEffect, useRef } from 'react';
import { Edit2, Trash2, Check, MessageCircle, Repeat, Smile } from 'lucide-react';
import { userApi } from '../../api/userApi';
import { commentApi } from '../../api/commentApi';
import type { CommentResponse } from '../../api/commentApi';
import { EmojiPicker } from '../shared/EmojiPicker';
import { Avatar } from '../ui/Avatar';

interface CommentItemProps {
  comment: CommentResponse;
  replies: CommentResponse[];
  user: any;
  targetUrl?: string | null;
  onReplySuccess: () => void;
}

export const CommentItem: React.FC<CommentItemProps> = ({ comment, replies, user, targetUrl, onReplySuccess }) => {
  const [author, setAuthor] = useState<any>(null);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const isRepost = comment.content.includes('[repost]');

  // State cho chỉnh sửa & xóa bình luận
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isCommentOwner = user && user.id === comment.authorId;
  const isEdited = comment.updatedAt && comment.createdAt && comment.updatedAt !== comment.createdAt;

  // Bắt đầu chỉnh sửa bình luận
  const startEditing = () => {
    setEditText(comment.content);
    setIsEditing(true);
  };

  // Lưu chỉnh sửa bình luận
  const handleUpdateComment = async () => {
    if (!editText.trim()) return;
    setIsUpdating(true);
    try {
      await commentApi.updateComment(comment.id, { content: editText.trim() });
      setIsEditing(false);
      onReplySuccess(); // reload comments
    } catch (err) {
      console.error('Failed to update comment', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Xóa bình luận
  const handleDeleteComment = async () => {
    try {
      await commentApi.deleteComment(comment.id);
      setShowDeleteConfirm(false);
      onReplySuccess(); // reload comments
    } catch (err) {
      console.error('Failed to delete comment', err);
    }
  };

  useEffect(() => {
    const fetchAuthor = async () => {
      try {
        const res = await userApi.getUserById(comment.authorId);
        const data = (res as any).data || res;
        setAuthor(data);
      } catch (e) {
        console.warn(e);
      }
    };
    fetchAuthor();
  }, [comment.authorId]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handlePostReply = async () => {
    if (!user) return;
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      await commentApi.createComment({
        articleId: comment.articleId,
        parentId: comment.id,
        targetUrl: targetUrl,
        content: replyText
      });
      setReplyText('');
      setShowReplyBox(false);
      onReplySuccess();
    } catch (err) {
      console.error('Error posting reply', err);
    } finally {
      setSubmittingReply(false);
    }
  };

  const displayName = author ? author.displayName : `Người dùng ${comment.authorId.substring(0, 4)}`;
  const avatarUrl = author ? author.avatarUrl : null;
  const initials = author ? author.displayName.substring(0, 2).toUpperCase() : 'U';

  if (isRepost) {
    return (
      <div className="flex gap-4 items-center bg-success/5 border border-success/10 rounded-xl p-4 my-2">
        <Avatar src={avatarUrl} fallback={initials} size="sm" className="ring-2 ring-success/20" />
        <div className="flex-1 flex items-center gap-2">
          <span className="font-semibold text-success text-sm">{displayName}</span>
          <span className="text-xs text-text-secondary">đã đăng lại bài viết này</span>
          <Repeat className="w-3.5 h-3.5 text-success ml-1 shrink-0 animate-pulse" />
        </div>
        <span className="text-xs text-text-secondary/50">{new Date(comment.createdAt).toLocaleDateString('vi-VN')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bình luận */}
      <div className="flex gap-4">
        <Avatar src={avatarUrl} fallback={initials} size="md" className="shadow" />
        
        <div className="flex-1 bg-surface border border-border-default rounded-2xl rounded-tl-none p-4 group relative">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-text-primary text-sm">{displayName}</span>
              <span className="text-xs text-text-secondary">{new Date(comment.createdAt).toLocaleDateString('vi-VN')}</span>
              {isEdited && (
                <span 
                  className="text-[10px] text-text-secondary italic" 
                  title={`Chỉnh sửa lúc ${new Date(comment.updatedAt).toLocaleString('vi-VN')}`}
                >
                  · (đã chỉnh sửa)
                </span>
              )}
            </div>
            {/* Nút Sửa/Xóa - chỉ hiện cho chính chủ */}
            {isCommentOwner && !isEditing && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={startEditing}
                  className="p-1.5 text-text-secondary hover:text-primary hover:bg-surface-elevated rounded-full transition-all cursor-pointer"
                  title="Chỉnh sửa bình luận"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-1.5 text-text-secondary hover:text-error hover:bg-error/5 rounded-full transition-all cursor-pointer"
                  title="Xóa bình luận"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Nội dung bình luận hoặc form chỉnh sửa */}
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full bg-base border border-border-default rounded-lg p-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary/50 resize-none min-h-[60px]"
                autoFocus
              />
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 hover:bg-surface-elevated text-text-primary text-xs font-semibold rounded-full transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={handleUpdateComment}
                  disabled={!editText.trim() || isUpdating}
                  className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-full hover:bg-primary-hover disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  {isUpdating ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-text-secondary text-sm leading-relaxed">{comment.content}</p>
          )}

          {/* Hộp xác nhận xóa */}
          {showDeleteConfirm && (
            <div className="mt-3 p-3 bg-error/5 border border-error/20 rounded-xl">
              <p className="text-sm text-error mb-2">Bạn có chắc muốn xóa bình luận này?</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDeleteComment}
                  className="px-3 py-1.5 bg-error text-white text-xs font-semibold rounded-full hover:bg-red-600 transition-colors cursor-pointer"
                >
                  Xóa
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 hover:bg-surface-elevated text-text-primary text-xs font-semibold rounded-full transition-colors cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}
          
          {user && !isEditing && (
            <div className="flex items-center gap-4 mt-3 pt-2 border-t border-border-default">
              <button 
                onClick={() => setShowReplyBox(!showReplyBox)}
                className="text-xs text-text-secondary hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Phản hồi</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Ô phản hồi */}
      {showReplyBox && (
        <div className="ml-12 flex gap-3 bg-surface-elevated p-3 rounded-xl border border-border-default relative">
          <Avatar 
            src={user?.avatarUrl} 
            fallback={user?.displayName?.charAt(0).toUpperCase() || 'U'} 
            size="sm" 
          />
          <div className="flex-1 space-y-2 relative">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Phản hồi @${displayName}...`}
              className="w-full bg-base border border-border-default rounded-lg p-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary/50 resize-none min-h-[60px]"
            />
            <div className="flex justify-between items-center relative">
              {/* Emoji trigger */}
              <div className="relative" ref={emojiPickerRef}>
                <button 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-1.5 hover:bg-surface-elevated rounded-full text-text-secondary hover:text-primary transition-colors cursor-pointer"
                >
                  <Smile className="w-4 h-4" />
                </button>
                {showEmojiPicker && (
                  <EmojiPicker 
                    onEmojiSelect={(emoji) => {
                      setReplyText(prev => prev + emoji);
                      setShowEmojiPicker(false);
                    }} 
                    onClose={() => setShowEmojiPicker(false)} 
                  />
                )}
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setShowReplyBox(false)}
                  className="px-3 py-1 hover:bg-surface-elevated text-text-primary text-xs font-semibold rounded-full transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button 
                  onClick={handlePostReply}
                  disabled={!replyText.trim() || submittingReply}
                  className="px-3 py-1 bg-primary text-white text-xs font-semibold rounded-full hover:bg-primary-hover disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {submittingReply ? 'Đang gửi...' : 'Gửi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bình luận phản hồi con */}
      {replies.length > 0 && (
        <div className="ml-12 pl-4 border-l border-border-default space-y-4">
          {replies.map((reply) => (
            <CommentItem 
              key={reply.id} 
              comment={reply} 
              replies={[]} 
              user={user} 
              targetUrl={targetUrl}
              onReplySuccess={onReplySuccess} 
            />
          ))}
        </div>
      )}
    </div>
  );
};
