import React, { useRef } from 'react';
import { X, Image as ImageIcon, Film } from 'lucide-react';

export interface SelectedFile {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video';
  file: File;
}

interface MediaUploaderProps {
  files: SelectedFile[];
  onFilesSelected: (newFiles: SelectedFile[]) => void;
  onRemoveFile: (id: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
  maxFiles?: number;
  maxVideoDurationSecs?: number;
  triggerButton?: React.ReactNode;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  files,
  onFilesSelected,
  onRemoveFile,
  onError,
  disabled = false,
  maxFiles = 4,
  maxVideoDurationSecs = 150,
  triggerButton
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const checkVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    if (files.length + selected.length > maxFiles) {
      onError(`Chỉ được tải lên tối đa ${maxFiles} tệp tin cùng lúc.`);
      return;
    }

    const newFiles: SelectedFile[] = [];

    for (const file of selected) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        onError(`Tệp ${file.name} không hợp lệ. Chỉ cho phép ảnh/video.`);
        continue;
      }

      if (isVideo) {
        try {
          const duration = await checkVideoDuration(file);
          if (duration > maxVideoDurationSecs) {
            onError(`Thời lượng video ${file.name} vượt quá ${maxVideoDurationSecs / 60} phút.`);
            continue;
          }
        } catch (err) {
          console.error('Error checking video duration', err);
        }
      }

      const url = URL.createObjectURL(file);
      newFiles.push({
        id: Math.random().toString(36).substring(2, 9),
        name: file.name,
        url,
        type: isImage ? 'image' : 'video',
        file: file
      });
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
    onFilesSelected(newFiles);
  };

  const hasReel = files.length === 1 && files[0].type === 'video';

  return (
    <div>
      {/* File Previews */}
      {files.length > 0 && (
        <div className={`mt-3 grid gap-2 ${files.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {files.map((f) => (
            <div key={f.id} className="relative rounded-xl overflow-hidden border border-border-default bg-black/40 flex items-center justify-center">
              {f.type === 'image' ? (
                <img src={f.url} alt="Preview" className="max-h-[300px] w-full object-cover rounded-xl" />
              ) : (
                <video src={f.url} controls className="max-h-[300px] w-full object-cover rounded-xl" />
              )}
              <button
                type="button"
                onClick={() => onRemoveFile(f.id)}
                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer hover:scale-105 z-10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Reel indicator */}
      {hasReel && (
        <div className="mt-2 flex items-center gap-2 text-xs text-primary bg-primary/10 border border-primary/20 rounded-full px-3 py-1.5 w-fit">
          <Film className="w-3.5 h-3.5" />
          <span className="font-medium">Sẽ được đăng dưới dạng Reel</span>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,video/mp4,video/quicktime"
        className="hidden"
      />

      {/* Trigger Button */}
      {triggerButton !== undefined ? (
        triggerButton ? (
          <div onClick={() => !disabled && fileInputRef.current?.click()} className="inline-block">
            {triggerButton}
          </div>
        ) : null
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors cursor-pointer"
          title="Thêm hình ảnh hoặc video ngắn"
        >
          <ImageIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};
