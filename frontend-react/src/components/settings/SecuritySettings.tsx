import React, { useState } from 'react';
import { KeyRound, Eye, EyeOff } from 'lucide-react';
import { userApi } from '../../api/userApi';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

export const SecuritySettings: React.FC = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!oldPassword) return setErrorMsg('Vui lòng nhập mật khẩu hiện tại.');
    if (newPassword.length < 8) return setErrorMsg('Mật khẩu mới phải từ 8 ký tự trở lên.');
    if (newPassword !== confirmPassword) return setErrorMsg('Mật khẩu xác nhận không trùng khớp.');

    setSaving(true);
    try {
      await userApi.changePassword({ oldPassword, newPassword });
      setSuccessMsg('Đổi mật khẩu thành công!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Mật khẩu hiện tại không chính xác.');
    } finally {
      setSaving(false);
    }
  };

  const EyeButton = ({ show, toggle }: { show: boolean, toggle: () => void }) => (
    <button type="button" onClick={toggle} className="absolute right-3 top-[34px] text-text-secondary hover:text-text-primary focus-visible:outline-none">
      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  return (
    <div className="bg-surface border border-border-default rounded-xl overflow-hidden shadow-sm animate-fade-in">
      <div className="p-4 flex items-center gap-3 border-b border-border-subtle bg-surface-elevated">
        <KeyRound className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-text-primary">Đổi mật khẩu</h3>
      </div>
      <form onSubmit={handleSubmit} className="p-5 space-y-5">
        {errorMsg && <div className="p-3 bg-red-500/10 text-red-500 text-sm rounded-lg border border-red-500/20">{errorMsg}</div>}
        {successMsg && <div className="p-3 bg-green-500/10 text-green-500 text-sm rounded-lg border border-green-500/20">{successMsg}</div>}

        <div className="relative space-y-1.5">
          <label className="text-sm font-semibold text-text-primary">Mật khẩu hiện tại</label>
          <Input type={showOldPass ? 'text' : 'password'} value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
          <EyeButton show={showOldPass} toggle={() => setShowOldPass(!showOldPass)} />
        </div>

        <div className="relative space-y-1.5">
          <label className="text-sm font-semibold text-text-primary">Mật khẩu mới (Tối thiểu 8 ký tự)</label>
          <Input type={showNewPass ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <EyeButton show={showNewPass} toggle={() => setShowNewPass(!showNewPass)} />
        </div>

        <div className="relative space-y-1.5">
          <label className="text-sm font-semibold text-text-primary">Xác nhận mật khẩu mới</label>
          <Input type={showConfirmPass ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          <EyeButton show={showConfirmPass} toggle={() => setShowConfirmPass(!showConfirmPass)} />
        </div>

        <div className="pt-2 flex justify-end">
          <Button type="submit" disabled={saving} className="w-full sm:w-auto">
            {saving ? <Spinner size="sm" className="mr-2" /> : null}
            {saving ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          </Button>
        </div>
      </form>
    </div>
  );
};
