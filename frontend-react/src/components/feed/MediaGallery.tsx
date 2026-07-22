import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Play } from 'lucide-react';

interface MediaItemProps {
  url: string;
  articleId: string;
  isVideo?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export const MediaItem: React.FC<MediaItemProps> = ({ url, isVideo, className, onClick }) => {
  return (
    <div 
      className={`relative group/media overflow-hidden flex items-center justify-center ${className || 'rounded-app border border-border-default bg-black/20 max-h-[450px]'}`}
      onClick={onClick}
    >
      {isVideo ? (
        <>
          <video src={url} className="w-full h-full object-contain bg-black" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform group-hover/media:scale-110">
            <div className="w-14 h-14 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-xl">
               <Play className="w-6 h-6 text-white fill-white ml-1" />
            </div>
          </div>
        </>
      ) : (
        <img 
          src={url} 
          alt="Attachment" 
          className="w-full h-full object-cover hover:opacity-95 transition-opacity" 
        />
      )}
    </div>
  );
};

interface MediaGalleryProps {
  items: {url: string, isVideo: boolean}[];
  articleId: string;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({ items, articleId }) => {
  const navigate = useNavigate();
  const location = useLocation();

  if (!items || items.length === 0) return null;

  const count = items.length;

  const handleImageClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    navigate(`/article/${articleId}?mediaUrl=${encodeURIComponent(items[index].url)}`, { state: { backgroundLocation: location } });
  };

  const renderGrid = () => {
    if (count === 1) {
      return <MediaItem url={items[0].url} isVideo={items[0].isVideo} articleId={articleId} className="w-full max-h-[500px] border border-border-default rounded-app cursor-pointer" onClick={(e) => handleImageClick(e, 0)} />;
    }
    if (count === 2) {
      return (
        <div className="grid grid-cols-2 gap-1 mt-2">
          {items.map((item, idx) => (
            <MediaItem key={idx} url={item.url} isVideo={item.isVideo} articleId={articleId} className={`w-full aspect-[4/5] border border-border-default cursor-pointer ${idx === 0 ? 'rounded-l-app rounded-r-none' : 'rounded-r-app rounded-l-none'}`} onClick={(e) => handleImageClick(e, idx)} />
          ))}
        </div>
      );
    }
    if (count === 3) {
      return (
        <div className="grid grid-cols-2 gap-1 mt-2 h-[400px]">
          <MediaItem url={items[0].url} isVideo={items[0].isVideo} articleId={articleId} className="w-full h-full border border-border-default rounded-l-app rounded-r-none cursor-pointer" onClick={(e) => handleImageClick(e, 0)} />
          <div className="grid grid-rows-2 gap-1 h-full">
            <MediaItem url={items[1].url} isVideo={items[1].isVideo} articleId={articleId} className="w-full h-full border border-border-default rounded-none rounded-tr-app cursor-pointer" onClick={(e) => handleImageClick(e, 1)} />
            <MediaItem url={items[2].url} isVideo={items[2].isVideo} articleId={articleId} className="w-full h-full border border-border-default rounded-none rounded-br-app cursor-pointer" onClick={(e) => handleImageClick(e, 2)} />
          </div>
        </div>
      );
    }
    if (count === 4) {
      return (
        <div className="grid grid-cols-2 gap-1 mt-2 h-[400px]">
          <div className="grid grid-rows-2 gap-1 h-full">
             <MediaItem url={items[0].url} isVideo={items[0].isVideo} articleId={articleId} className="w-full h-full border border-border-default rounded-tl-app rounded-bl-none rounded-r-none cursor-pointer" onClick={(e) => handleImageClick(e, 0)} />
             <MediaItem url={items[1].url} isVideo={items[1].isVideo} articleId={articleId} className="w-full h-full border border-border-default rounded-bl-app rounded-tl-none rounded-r-none cursor-pointer" onClick={(e) => handleImageClick(e, 1)} />
          </div>
          <div className="grid grid-rows-2 gap-1 h-full">
             <MediaItem url={items[2].url} isVideo={items[2].isVideo} articleId={articleId} className="w-full h-full border border-border-default rounded-tr-app rounded-br-none rounded-l-none cursor-pointer" onClick={(e) => handleImageClick(e, 2)} />
             <MediaItem url={items[3].url} isVideo={items[3].isVideo} articleId={articleId} className="w-full h-full border border-border-default rounded-br-app rounded-tr-none rounded-l-none cursor-pointer" onClick={(e) => handleImageClick(e, 3)} />
          </div>
        </div>
      );
    }
    // count >= 5
    return (
      <div className="grid grid-cols-2 gap-1 mt-2 h-[450px]">
        <div className="grid grid-rows-2 gap-1 h-full">
           <MediaItem url={items[0].url} isVideo={items[0].isVideo} articleId={articleId} className="w-full h-full border border-border-default rounded-tl-app rounded-bl-none rounded-r-none cursor-pointer" onClick={(e) => handleImageClick(e, 0)} />
           <MediaItem url={items[1].url} isVideo={items[1].isVideo} articleId={articleId} className="w-full h-full border border-border-default rounded-bl-app rounded-tl-none rounded-r-none cursor-pointer" onClick={(e) => handleImageClick(e, 1)} />
        </div>
        <div className="grid grid-rows-3 gap-1 h-full">
           <MediaItem url={items[2].url} isVideo={items[2].isVideo} articleId={articleId} className="w-full h-full border border-border-default rounded-tr-app rounded-b-none rounded-l-none cursor-pointer" onClick={(e) => handleImageClick(e, 2)} />
           <MediaItem url={items[3].url} isVideo={items[3].isVideo} articleId={articleId} className="w-full h-full border border-border-default rounded-none cursor-pointer" onClick={(e) => handleImageClick(e, 3)} />
           <div className="relative w-full h-full cursor-pointer" onClick={(e) => handleImageClick(e, 4)}>
             <MediaItem url={items[4].url} isVideo={items[4].isVideo} articleId={articleId} className="w-full h-full border border-border-default rounded-br-app rounded-t-none rounded-l-none" />
             {count > 5 && (
               <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-br-app text-white text-2xl font-bold">
                 +{count - 5}
               </div>
             )}
           </div>
        </div>
      </div>
    );
  };

  return renderGrid();
};
