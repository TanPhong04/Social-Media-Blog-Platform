import React, { useEffect, useRef, useState } from 'react';
import { PhoneOff, Mic, MicOff, Video as VideoIcon, VideoOff } from 'lucide-react';
import { Avatar } from '../ui/Avatar';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactProfile: any;
  isVideo: boolean;
}

export const CallModal: React.FC<CallModalProps> = ({ isOpen, onClose, contactProfile, isVideo }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callStatus, setCallStatus] = useState('Đang đổ chuông...');
  const [callDuration, setCallDuration] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  useEffect(() => {
    if (!isOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setCallStatus('Đang đổ chuông...');
      setCallDuration(0);
      setIsMuted(false);
      setIsVideoOff(false);
      return;
    }

    if (isVideo && !isVideoOff) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.error("Camera access denied or unavailable", err);
        });
    } else {
      if (streamRef.current) {
        streamRef.current.getVideoTracks().forEach(track => track.stop());
      }
    }

    // Simulate call answering after 4 seconds
    const answerTimer = setTimeout(() => {
      setCallStatus('Đang gọi');
    }, 4000);

    return () => {
      clearTimeout(answerTimer);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, isVideo, isVideoOff]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (callStatus === 'Đang gọi') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-surface-elevated overflow-hidden shadow-2xl flex flex-col h-full sm:h-[600px] sm:rounded-[40px] border border-border-default/20">
        
        {/* Background / Video Area */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black pointer-events-none z-10" />
        
        {isVideo && !isVideoOff ? (
          <video 
            ref={videoRef} 
            className="absolute inset-0 w-full h-full object-cover" 
            autoPlay 
            playsInline 
            muted 
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-full bg-surface-elevated/50 flex flex-col items-center justify-center pt-10">
              <div className="relative">
                <div className={`absolute inset-0 rounded-full bg-primary/20 ${callStatus === 'Đang đổ chuông...' ? 'animate-ping' : ''}`} />
                <Avatar 
                  src={contactProfile?.avatarUrl} 
                  fallback={contactProfile?.displayName?.charAt(0).toUpperCase() || 'U'}
                  size="xl"
                  className="w-32 h-32 border-4 border-surface shadow-xl relative z-10"
                />
              </div>
            </div>
          </div>
        )}

        {/* Header Info */}
        <div className="relative z-20 flex flex-col items-center mt-12 text-white">
          <h2 className="text-2xl font-bold tracking-wide drop-shadow-md">
            {contactProfile?.displayName || 'Người dùng'}
          </h2>
          <p className="text-sm font-medium mt-1 text-white/80">
            {callStatus === 'Đang gọi' ? formatDuration(callDuration) : callStatus}
          </p>
        </div>

        {/* Small self-video picture-in-picture (if answering mock) */}
        {isVideo && !isVideoOff && callStatus === 'Đang gọi' && (
           <div className="absolute top-6 right-6 w-24 h-36 bg-black/40 rounded-xl overflow-hidden border-2 border-white/20 shadow-lg z-30 flex items-center justify-center">
             <Avatar 
               src={contactProfile?.avatarUrl} 
               fallback={contactProfile?.displayName?.charAt(0).toUpperCase() || 'U'}
               size="lg"
             />
           </div>
        )}

        {/* Call Controls */}
        <div className="relative z-20 mt-auto pb-12 pt-6 px-8 flex justify-center items-center gap-6 bg-gradient-to-t from-black via-black/80 to-transparent">
          
          {/* Mute */}
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors shadow-lg backdrop-blur-md ${isMuted ? 'bg-white text-black' : 'bg-white/20 text-white hover:bg-white/30'}`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
          
          {/* End Call */}
          <button 
            onClick={onClose}
            className="w-16 h-16 rounded-full bg-error hover:bg-error-hover text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-error/30"
          >
            <PhoneOff className="w-7 h-7" />
          </button>

          {/* Video Toggle */}
          <button 
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors shadow-lg backdrop-blur-md ${isVideoOff ? 'bg-white text-black' : 'bg-white/20 text-white hover:bg-white/30'}`}
          >
            {isVideoOff ? <VideoOff className="w-6 h-6" /> : <VideoIcon className="w-6 h-6" />}
          </button>

        </div>
      </div>
    </div>
  );
};
