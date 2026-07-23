import React from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface EditArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  editContent: string;
  setEditContent: (val: string) => void;
  editFile: { url: string; type: 'image' | 'video' } | null;
  updating: boolean;
  onUpdate: (e: React.FormEvent) => void;
  onRemoveFile: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const EditArticleModal: React.FC<EditArticleModalProps> = ({
  isOpen,
  onClose,
  editContent,
  setEditContent,
  editFile,
  updating,
  onUpdate,
  onRemoveFile,
  fileInputRef,
  onFileChange
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chỉnh sửa bài đăng">
      <div className="flex flex-col h-full max-h-[80vh]">
        <div className="p-4 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            disabled={updating}
            rows={5}
            className="w-full bg-base border border-border-default text-text-primary rounded-lg p-3 text-[15px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none placeholder-text-muted"
            placeholder="Nội dung bài đăng..."
          />

          {editFile && (
            <div className="relative mt-2 rounded-lg overflow-hidden border border-border-default bg-black/40 max-h-56 flex items-center justify-center">
              {editFile.type === 'video' ? (
                <video src={editFile.url} className="max-h-56 max-w-full object-contain" />
              ) : (
                <img
                  src={editFile.url}
                  alt="Preview"
                  className="max-h-56 max-w-full object-contain"
                />
              )}
              <button
                type="button"
                onClick={onRemoveFile}
                className="absolute top-2.5 right-2.5 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer hover:scale-105"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileChange}
          accept="image/*,video/mp4,video/quicktime"
          className="hidden"
        />

        <div className="flex justify-between items-center px-4 py-3 bg-surface border-t border-border-default">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-full hover:bg-primary/10 text-primary transition-colors cursor-pointer"
            title="Thay đổi hoặc thêm hình ảnh/video"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              disabled={updating}
              onClick={onClose}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              onClick={onUpdate}
              disabled={updating || (!editContent.trim() && !editFile)}
              isLoading={updating}
            >
              Lưu thay đổi
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
