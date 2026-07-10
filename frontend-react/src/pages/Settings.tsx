import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Settings as SettingsIcon, LogOut, Bell, Shield, Palette, KeyRound, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../api/userApi';

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // 1. Giao diện (Theme)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };

  // 2. Nhận thông báo
  const [emailNotif, setEmailNotif] = useState(() => {
    return localStorage.getItem('emailNotifications') !== 'false';
  });

  const toggleEmailNotif = () => {
    const newVal = !emailNotif;
    setEmailNotif(newVal);
    localStorage.setItem('emailNotifications', String(newVal));
  };

  // 3. Đổi mật khẩu
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Ẩn / hiện mật khẩu
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!oldPassword) {
      setErrorMsg('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg('Mật khẩu mới phải từ 8 ký tự trở lên.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setSavingPassword(true);
    try {
      await userApi.changePassword({ oldPassword, newPassword });
      setSuccessMsg('Đổi mật khẩu thành công!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowPasswordForm(false);
        setSuccessMsg('');
      }, 2000);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Mật khẩu hiện tại không chính xác.';
      setErrorMsg(errMsg);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto border-x border-gray-800 min-h-screen bg-background pb-12 transition-colors duration-300">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 sticky top-16 bg-background/80 backdrop-blur-md z-40 flex items-center gap-3">
        <div className="p-2.5 bg-surface text-primary rounded-app border border-white/10 shadow-md">
          <SettingsIcon className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-heading font-bold text-text-primary">Cài đặt</h1>
          <p className="text-text-secondary text-xs mt-0.5">Quản lý tài khoản của bạn</p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Tùy chọn giao diện */}
        <div className="bg-surface/50 border border-white/5 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 flex items-center gap-3 border-b border-white/5 bg-white/[0.02]">
            <Palette className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-text-primary">Giao diện</h3>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-primary font-medium">Chế độ tối (Dark mode)</p>
                <p className="text-text-secondary text-xs mt-1">Hiển thị ứng dụng với nền tối dễ chịu</p>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  theme === 'dark' ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Thông báo */}
        <div className="bg-surface/50 border border-white/5 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 flex items-center gap-3 border-b border-white/5 bg-white/[0.02]">
            <Bell className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-text-primary">Thông báo</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-primary font-medium">Thông báo hệ thống</p>
                <p className="text-text-secondary text-xs mt-1">Nhận thông báo khi có người tương tác và gửi tin nhắn</p>
              </div>
              <button
                type="button"
                onClick={toggleEmailNotif}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  emailNotif ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    emailNotif ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Bảo mật */}
        <div className="bg-surface/50 border border-white/5 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 flex items-center gap-3 border-b border-white/5 bg-white/[0.02]">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-text-primary">Bảo mật</h3>
          </div>
          <div className="p-4 space-y-4">
            {!showPasswordForm ? (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="w-full px-4 py-3 bg-surface border border-white/10 hover:border-primary/40 rounded-xl text-text-primary font-medium hover:bg-white/5 transition-all text-left flex items-center gap-2.5 cursor-pointer"
              >
                <KeyRound className="w-4.5 h-4.5 text-text-secondary" />
                <span>Thay đổi mật khẩu</span>
              </button>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-4 animate-fade-in">
                <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-primary" />
                  <span>Thay đổi mật khẩu tài khoản</span>
                </h4>
                
                {errorMsg && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl">
                    {errorMsg}
                  </div>
                )}
                {successMsg && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-500 text-xs rounded-xl">
                    {successMsg}
                  </div>
                )}

                {/* Mật khẩu cũ */}
                <div className="space-y-1.5">
                  <label className="text-xs text-text-secondary font-medium">Mật khẩu hiện tại</label>
                  <div className="relative">
                    <input
                      type={showOldPass ? 'text' : 'password'}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Nhập mật khẩu hiện tại"
                      className="w-full px-4 py-2.5 bg-background border border-white/10 rounded-xl text-sm focus:outline-none focus:border-primary text-text-primary pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPass(!showOldPass)}
                      className="absolute right-3 top-3 text-text-secondary hover:text-text-primary cursor-pointer"
                    >
                      {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Mật khẩu mới */}
                <div className="space-y-1.5">
                  <label className="text-xs text-text-secondary font-medium">Mật khẩu mới (Tối thiểu 8 ký tự)</label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nhập mật khẩu mới"
                      className="w-full px-4 py-2.5 bg-background border border-white/10 rounded-xl text-sm focus:outline-none focus:border-primary text-text-primary pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-3 text-text-secondary hover:text-text-primary cursor-pointer"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Xác nhận mật khẩu mới */}
                <div className="space-y-1.5">
                  <label className="text-xs text-text-secondary font-medium">Xác nhận mật khẩu mới</label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                      className="w-full px-4 py-2.5 bg-background border border-white/10 rounded-xl text-sm focus:outline-none focus:border-primary text-text-primary pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-3 text-text-secondary hover:text-text-primary cursor-pointer"
                    >
                      {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow disabled:opacity-50"
                  >
                    {savingPassword ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setErrorMsg('');
                      setOldPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="px-4 py-2.5 bg-surface border border-white/10 hover:bg-white/5 text-text-primary text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Logout */}
        <div className="pt-4">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-4 bg-red-500/10 text-red-500 font-bold rounded-2xl border border-red-500/20 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <LogOut className="w-5 h-5" />
            Đăng xuất tài khoản
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
