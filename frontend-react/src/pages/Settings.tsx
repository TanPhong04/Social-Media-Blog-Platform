import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Settings as SettingsIcon, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tabs } from '../components/ui/Tabs';
import { Button } from '../components/ui/Button';
import { AccountSettings } from '../components/settings/AccountSettings';
import { PreferencesSettings } from '../components/settings/PreferencesSettings';
import { SecuritySettings } from '../components/settings/SecuritySettings';

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const tabs = [
    { id: 'account', label: 'Tài khoản', content: <AccountSettings user={user} /> },
    { id: 'preferences', label: 'Tùy chọn', content: <PreferencesSettings /> },
    { id: 'security', label: 'Bảo mật', content: <SecuritySettings /> },
  ];

  return (
    <div className="w-full max-w-[840px] mx-auto border-x border-border-default min-h-screen bg-background pb-12 transition-colors duration-300">
      {/* Header */}
      <div className="p-4 border-b border-border-default sticky top-[64px] sm:top-16 bg-surface/80 backdrop-blur-md z-40 flex items-center gap-3">
        <div className="p-2.5 bg-primary/10 text-primary rounded-xl border border-primary/20 shadow-sm">
          <SettingsIcon className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-heading font-bold text-text-primary">Cài đặt</h1>
          <p className="text-text-secondary text-xs mt-0.5 font-medium">Quản lý tài khoản & tùy chọn</p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <Tabs tabs={tabs} defaultTab="account" />
        
        <div className="pt-8 border-t border-border-default">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full py-4 text-red-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors focus-visible:ring-red-500"
          >
            <LogOut className="w-5 h-5" />
            Đăng xuất tài khoản
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
