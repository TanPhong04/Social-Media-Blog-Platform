import React, { useState } from 'react';
import { X, Radio, Copy, Check, Info, AlertCircle } from 'lucide-react';
import { livestreamApi } from '../api/livestreamApi';
import type { LiveSessionResponse } from '../api/livestreamApi';

interface CreateLiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CreateLiveModal: React.FC<CreateLiveModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [session, setSession] = useState<LiveSessionResponse | null>(null);
  
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await livestreamApi.createLiveSession({
        title: title.trim(),
      });

      const data = (res as any).data || res;
      setSession(data);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Failed to create livestream:', err);
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi khởi tạo Livestream. Vui lòng thử lại sau.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: 'url' | 'key') => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleReset = () => {
    setSession(null);
    setTitle('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={session ? undefined : onClose} />

      <div className="relative w-full max-w-lg bg-surface border border-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] z-10">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl shadow-inner">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-text-primary text-[17px]">Phát Trực Tiếp</h3>
              <p className="text-[11px] text-text-secondary">Bắt đầu livestream ngay</p>
            </div>
          </div>
          <button 
            onClick={handleReset}
            className="p-1.5 rounded-full hover:bg-white/5 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!session ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Tiêu đề buổi phát sóng <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nhập tiêu đề livestream..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-800 focus:border-red-500 focus:ring-1 focus:ring-red-500/30 focus:outline-none bg-background text-text-primary text-sm placeholder:text-gray-500 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !title.trim()}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang khởi tạo...
                  </span>
                ) : (
                  <>
                    <Radio className="w-4 h-4" /> Bắt đầu phát sóng
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-emerald-500 flex gap-2 text-xs">
                <Check className="w-5 h-5 shrink-0" />
                <div>
                  <h4 className="font-bold text-[13px] text-emerald-400 mb-0.5">Khởi tạo thành công!</h4>
                  <p className="text-emerald-500/80">Hãy dùng OBS Studio để đẩy luồng video lên.</p>
                </div>
              </div>

              <div className="space-y-3.5">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-text-secondary">RTMP Server URL</label>
                    <button 
                      onClick={() => copyToClipboard(session.rtmpUrl, 'url')}
                      className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedUrl ? <><Check className="w-3 h-3" /> Đã sao chép</> : <><Copy className="w-3 h-3" /> Sao chép</>}
                    </button>
                  </div>
                  <div className="px-3.5 py-2.5 bg-black/40 border border-gray-800 rounded-xl text-text-primary font-mono text-xs select-all truncate">
                    {session.rtmpUrl}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-text-secondary">Stream Key (Giữ bí mật)</label>
                    <button 
                      onClick={() => copyToClipboard(session.streamKey, 'key')}
                      className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey ? <><Check className="w-3 h-3" /> Đã sao chép</> : <><Copy className="w-3 h-3" /> Sao chép</>}
                    </button>
                  </div>
                  <div className="px-3.5 py-2.5 bg-black/40 border border-gray-800 rounded-xl text-text-primary font-mono text-xs select-all truncate">
                    {session.streamKey}
                  </div>
                </div>
              </div>

              {/* OBS Guide */}
              <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl space-y-2 text-xs text-text-secondary">
                <h4 className="font-bold text-text-primary flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-primary" /> Hướng dẫn OBS Studio:
                </h4>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Mở OBS → <strong>Settings &gt; Stream</strong></li>
                  <li>Service chọn <strong>Custom...</strong></li>
                  <li>Dán Server URL và Stream Key</li>
                  <li>Nhấn <strong>Start Streaming</strong></li>
                </ol>
              </div>

              <button
                onClick={handleReset}
                className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-text-primary font-bold rounded-xl transition-all cursor-pointer text-sm"
              >
                Đóng
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateLiveModal;
