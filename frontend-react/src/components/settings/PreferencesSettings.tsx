import React, { useState } from 'react';
import { Palette, Bell } from 'lucide-react';

export const PreferencesSettings: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });
  const [emailNotif, setEmailNotif] = useState(() => {
    return localStorage.getItem('emailNotifications') !== 'false';
  });

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'light') document.documentElement.classList.add('light');
    else document.documentElement.classList.remove('light');
  };

  const toggleEmailNotif = () => {
    const newVal = !emailNotif;
    setEmailNotif(newVal);
    localStorage.setItem('emailNotifications', String(newVal));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-surface border border-border-default rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 flex items-center gap-3 border-b border-border-subtle bg-surface-elevated">
          <Palette className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-text-primary">Giao diện</h3>
        </div>
        <div className="p-5 flex items-center justify-between hover:bg-surface-elevated transition-colors cursor-pointer" onClick={toggleTheme}>
          <div>
            <p className="text-text-primary font-bold text-sm">Chế độ tối (Dark mode)</p>
            <p className="text-text-secondary text-xs mt-1">Hiển thị ứng dụng với nền tối dễ chịu</p>
          </div>
          <button
            type="button"
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
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

      <div className="bg-surface border border-border-default rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 flex items-center gap-3 border-b border-border-subtle bg-surface-elevated">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-text-primary">Thông báo</h3>
        </div>
        <div className="p-5 flex items-center justify-between hover:bg-surface-elevated transition-colors cursor-pointer" onClick={toggleEmailNotif}>
          <div>
            <p className="text-text-primary font-bold text-sm">Thông báo hệ thống</p>
            <p className="text-text-secondary text-xs mt-1">Nhận thông báo khi có người tương tác và gửi tin nhắn</p>
          </div>
          <button
            type="button"
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
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
  );
};
