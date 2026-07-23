import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import { userApi } from '../../api/userApi';
import { mediaApi } from '../../api/mediaApi';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';

interface EditProfileModalProps {
  profile: any;
  onClose: () => void;
  onSuccess: () => void;
  showToastMessage: (msg: string, type?: 'success' | 'error') => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ profile, onClose, onSuccess, showToastMessage }) => {
  const [editName, setEditName] = useState(profile.displayName || '');
  const [editBio, setEditBio] = useState(profile.bio || '');
  const [editAvatar, setEditAvatar] = useState(profile.avatarUrl || '');
  const [editBanner, setEditBanner] = useState(() => localStorage.getItem(`profile_banner_${profile.id}`) || '');
  const [editUsername, setEditUsername] = useState(profile.username || '');
  const [editDob, setEditDob] = useState(profile.dob || '');
  const [updating, setUpdating] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToastMessage('Chỉ hỗ trợ file hình ảnh.', 'error');
      return;
    }
    try {
      showToastMessage('Đang tải ảnh lên...', 'success');
      const url = await mediaApi.uploadFile(file);
      setEditAvatar(url);
      showToastMessage('Đã nạp ảnh đại diện mới.');
    } catch (err) {
      console.error(err);
      showToastMessage('Lỗi tải ảnh.', 'error');
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToastMessage('Chỉ hỗ trợ file hình ảnh.', 'error');
      return;
    }
    try {
      showToastMessage('Đang tải ảnh lên...', 'success');
      const url = await mediaApi.uploadFile(file);
      setEditBanner(url);
      showToastMessage('Đã nạp ảnh bìa mới.');
    } catch (err) {
      console.error(err);
      showToastMessage('Lỗi tải ảnh.', 'error');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      showToastMessage('Tên hiển thị không được bỏ trống.', 'error');
      return;
    }
    if (!editUsername.trim()) {
      showToastMessage('Tên tài khoản không được bỏ trống.', 'error');
      return;
    }

    setUpdating(true);
    try {
      const updateData = {
        displayName: editName.trim(),
        bio: editBio.trim(),
        avatarUrl: editAvatar,
        username: editUsername.trim().toLowerCase(),
        dob: editDob
      };

      const updatedProfile: any = await userApi.updateProfile(updateData);
      
      if (editBanner) {
        localStorage.setItem(`profile_banner_${updatedProfile.id}`, editBanner);
      } else {
        localStorage.removeItem(`profile_banner_${updatedProfile.id}`);
      }

      showToastMessage('Cập nhật hồ sơ thành công!');
      onSuccess();
    } catch (err: any) {
      console.error('Update profile failed', err);
      const serverErr = err.response?.data;
      if (serverErr && serverErr.code === 'USERNAME_ALREADY_TAKEN') {
        showToastMessage('Tên tài khoản đã tồn tại. Vui lòng chọn tên khác!', 'error');
      } else {
        showToastMessage(serverErr?.message || 'Cập nhật hồ sơ thất bại.', 'error');
      }
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-surface-elevated w-full max-w-md rounded-2xl border border-border-default shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <h2 className="text-lg font-heading font-bold text-text-primary">Edit profile</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary p-2 rounded-full hover:bg-surface transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-text-secondary uppercase">Ảnh bìa (Banner)</label>
            <div 
              onClick={() => bannerInputRef.current?.click()}
              className="h-32 w-full rounded-xl border-2 border-dashed border-border-default bg-background flex flex-col items-center justify-center text-text-secondary cursor-pointer hover:border-primary hover:bg-surface transition-all overflow-hidden"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && bannerInputRef.current?.click()}
              aria-label="Đổi ảnh bìa"
            >
              {editBanner ? (
                <img src={editBanner} alt="Banner Preview" className="w-full h-full object-cover" />
              ) : (
                <>
                  <ImageIcon className="w-6 h-6 mb-2 text-primary" />
                  <span className="text-sm font-medium">Nhấp để chọn ảnh bìa mới</span>
                </>
              )}
            </div>
            <input type="file" ref={bannerInputRef} onChange={handleBannerChange} accept="image/*" className="hidden" aria-hidden="true" />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-text-secondary uppercase">Ảnh đại diện (Avatar)</label>
            <div className="flex items-center gap-4">
              <Avatar src={editAvatar} fallback={editName.substring(0, 2).toUpperCase() || 'U'} size="xl" />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => avatarInputRef.current?.click()}
              >
                Thay đổi hình ảnh
              </Button>
              <input type="file" ref={avatarInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" aria-hidden="true" />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="displayName" className="block text-xs font-bold text-text-secondary uppercase">Tên hiển thị</label>
            <input
              id="displayName"
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              disabled={updating}
              className="w-full bg-background border border-border-default text-text-primary rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              placeholder="Tên của bạn"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="username" className="block text-xs font-bold text-text-secondary uppercase">Tên tài khoản (username)</label>
            <div className="relative">
              <span className="absolute left-4 top-2.5 text-text-secondary text-sm font-medium">@</span>
              <input
                id="username"
                type="text"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                disabled={updating}
                className="w-full bg-background border border-border-default text-text-primary rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="username"
              />
            </div>
            <p className="text-[11px] text-text-secondary">Tên tài khoản viết liền không dấu, là định danh duy nhất (không được trùng).</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="dob" className="block text-xs font-bold text-text-secondary uppercase">Ngày sinh</label>
            <input
              id="dob"
              type="date"
              value={editDob}
              onChange={(e) => setEditDob(e.target.value)}
              disabled={updating}
              className="w-full bg-background border border-border-default text-text-primary rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="bio" className="block text-xs font-bold text-text-secondary uppercase">Tiểu sử</label>
            <textarea
              id="bio"
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              disabled={updating}
              rows={3}
              className="w-full bg-background border border-border-default text-text-primary rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
              placeholder="Giới thiệu đôi nét về bản thân của bạn..."
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-border-subtle gap-3">
            <Button type="button" variant="ghost" onClick={onClose} disabled={updating}>Hủy</Button>
            <Button type="submit" variant="primary" isLoading={updating} disabled={updating}>Lưu hồ sơ</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
