import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Settings as SettingsIcon, LogOut, Bell, Shield, Palette } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto border-x border-gray-800 min-h-screen bg-background">
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
         <div className="bg-surface/50 border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-4 flex items-center gap-3 border-b border-white/5 bg-white/[0.02]">
               <Palette className="w-5 h-5 text-primary" />
               <h3 className="font-semibold text-text-primary">Giao diện</h3>
            </div>
            <div className="p-4">
               <div className="flex items-center justify-between">
                  <div>
                     <p className="text-text-primary font-medium">Chế độ tối</p>
                     <p className="text-text-secondary text-sm">Hiển thị ứng dụng với nền tối (Mặc định)</p>
                  </div>
                  <div className="relative inline-block w-12 h-6 rounded-full bg-primary/20 cursor-not-allowed">
                     <span className="absolute left-1 top-1 w-4 h-4 rounded-full bg-primary transition-transform translate-x-6"></span>
                  </div>
               </div>
            </div>
         </div>

         {/* Thông báo */}
         <div className="bg-surface/50 border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-4 flex items-center gap-3 border-b border-white/5 bg-white/[0.02]">
               <Bell className="w-5 h-5 text-primary" />
               <h3 className="font-semibold text-text-primary">Thông báo</h3>
            </div>
            <div className="p-4 space-y-4">
               <div className="flex items-center justify-between">
                  <div>
                     <p className="text-text-primary font-medium">Email thông báo</p>
                     <p className="text-text-secondary text-sm">Nhận email khi có người tương tác</p>
                  </div>
                  <div className="relative inline-block w-12 h-6 rounded-full bg-surface border border-white/10 cursor-not-allowed">
                     <span className="absolute left-1 top-1 w-4 h-4 rounded-full bg-text-secondary"></span>
                  </div>
               </div>
            </div>
         </div>

         {/* Bảo mật */}
         <div className="bg-surface/50 border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-4 flex items-center gap-3 border-b border-white/5 bg-white/[0.02]">
               <Shield className="w-5 h-5 text-primary" />
               <h3 className="font-semibold text-text-primary">Bảo mật</h3>
            </div>
            <div className="p-4">
               <button className="w-full px-4 py-3 bg-surface border border-white/10 rounded-xl text-text-primary font-medium hover:bg-white/5 transition-colors text-left">
                  Đổi mật khẩu
               </button>
            </div>
         </div>

         {/* Logout */}
         <div className="pt-4">
            <button
               onClick={handleLogout}
               className="w-full px-4 py-4 bg-red-500/10 text-red-500 font-bold rounded-2xl border border-red-500/20 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
            >
               <LogOut className="w-5 h-5" />
               Đăng xuất
            </button>
         </div>
      </div>
    </div>
  );
};

export default Settings;
