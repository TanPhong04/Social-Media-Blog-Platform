import React, { useState, useEffect, useRef } from 'react';
import { userApi } from '../../api/userApi';
import { mediaApi } from '../../api/mediaApi';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Spinner } from '../ui/Spinner';

export const AccountSettings: React.FC<{ user: any }> = ({ user }) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    userApi.getUserById(user.id).then((res: any) => {
      const p = res.data || res;
      setProfile(p);
      setEditName(p.displayName || '');
      setEditBio(p.bio || '');
      setEditUsername(p.username || '');
      setEditAvatar(p.avatarUrl || '');
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!editName.trim()) return setMsg({ text: 'Tên hiển thị không được bỏ trống.', type: 'error' });
    if (!editUsername.trim()) return setMsg({ text: 'Tên tài khoản không được bỏ trống.', type: 'error' });

    setSaving(true);
    try {
      await userApi.updateProfile({
        displayName: editName.trim(),
        bio: editBio.trim(),
        username: editUsername.trim().toLowerCase(),
        avatarUrl: editAvatar,
        dob: profile?.dob || ''
      });
      setMsg({ text: 'Cập nhật thông tin thành công.', type: 'success' });
    } catch (err: any) {
      if (err.response?.data?.code === 'USERNAME_ALREADY_TAKEN') {
        setMsg({ text: 'Tên tài khoản đã tồn tại.', type: 'error' });
      } else {
        setMsg({ text: 'Cập nhật thất bại.', type: 'error' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    try {
      setMsg({ text: 'Đang tải ảnh lên...', type: 'success' });
      const url = await mediaApi.uploadFile(file);
      setEditAvatar(url);
      setMsg(null);
    } catch (err) {
      setMsg({ text: 'Tải ảnh thất bại.', type: 'error' });
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Spinner size="lg" /></div>;

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="flex flex-col items-center space-y-3">
          <Avatar src={editAvatar} fallback={editName.charAt(0).toUpperCase() || 'U'} size="xl" />
          <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
            Thay đổi ảnh
          </Button>
          <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
        </div>
        
        <div className="flex-1 space-y-4">
          {msg && (
            <div className={`p-3 text-sm rounded-lg ${msg.type === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
              {msg.text}
            </div>
          )}
          
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-text-primary">Tên hiển thị</label>
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-text-primary">Tên người dùng (Username)</label>
            <Input value={editUsername} onChange={(e) => setEditUsername(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-text-primary">Tiểu sử</label>
            <Textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={3} placeholder="Mô tả ngắn gọn về bạn..." />
          </div>
          
          <div className="pt-2 flex justify-end">
            <Button type="submit" disabled={saving} className="w-full sm:w-auto">
              {saving ? <Spinner size="sm" className="mr-2" /> : null}
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};
