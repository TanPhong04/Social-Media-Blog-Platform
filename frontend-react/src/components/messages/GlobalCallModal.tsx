import React, { useEffect, useRef } from 'react';
import { PhoneOff, Phone, Mic, MicOff, Video as VideoIcon, VideoOff } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { useCall } from '../../contexts/CallContext';

export const GlobalCallModal: React.FC = () => {
  const {
    callStatus,
    remoteProfile,
    localStream,
    remoteStream,
    isVideo,
    isMuted,
    isVideoOff,
    callDuration,
    endCall,
    acceptCall,
    rejectCall,
    toggleMute,
    toggleVideo
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callStatus]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callStatus]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (callStatus === 'idle') return null;

  const isIncoming = callStatus === 'incoming';
  const isConnected = callStatus === 'connected';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl aspect-video sm:rounded-[32px] overflow-hidden shadow-2xl flex border border-white/10 bg-gray-900">
        
        {/* Main Video Area (Remote) */}
        <div className="flex-1 relative bg-black flex items-center justify-center">
          {isConnected && remoteStream && isVideo ? (
            <video 
              ref={remoteVideoRef} 
              className="absolute inset-0 w-full h-full object-cover" 
              autoPlay 
              playsInline 
            />
          ) : (
            <div className="flex flex-col items-center justify-center relative z-10">
              <div className="relative">
                {!isConnected && <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />}
                <Avatar 
                  src={remoteProfile?.avatarUrl} 
                  fallback={remoteProfile?.displayName?.charAt(0).toUpperCase() || 'U'}
                  size="xl"
                  className="w-32 h-32 border-4 border-surface shadow-xl relative z-10"
                />
              </div>
              <h2 className="text-3xl font-bold text-white mt-6 drop-shadow-md tracking-wide">
                {remoteProfile?.displayName || 'Người dùng'}
              </h2>
              <p className="text-lg font-medium mt-2 text-white/80">
                {isIncoming ? 'Đang gọi cho bạn...' : 
                 callStatus === 'outgoing' ? 'Đang đổ chuông...' : 
                 formatDuration(callDuration)}
              </p>
            </div>
          )}
          
          {/* Gradient Overlay for Controls */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
        </div>

        {/* Picture-in-Picture (Local) */}
        {isConnected && localStream && isVideo && (
          <div className="absolute top-6 right-6 w-48 aspect-video bg-gray-800 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl z-30">
            <video 
              ref={localVideoRef} 
              className="w-full h-full object-cover" 
              autoPlay 
              playsInline 
              muted 
            />
          </div>
        )}

        {/* Controls */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-6 z-40">
          
          {isIncoming ? (
            <>
              <button 
                onClick={rejectCall}
                className="w-16 h-16 rounded-full bg-error hover:bg-error-hover text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-error/30"
              >
                <PhoneOff className="w-8 h-8" />
              </button>
              <button 
                onClick={acceptCall}
                className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-green-500/30 animate-bounce"
              >
                <Phone className="w-8 h-8" />
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={toggleMute}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl backdrop-blur-md hover:scale-105 active:scale-95 ${isMuted ? 'bg-white text-black' : 'bg-white/20 text-white hover:bg-white/30 border border-white/10'}`}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
              
              <button 
                onClick={endCall}
                className="w-16 h-16 rounded-full bg-error hover:bg-error-hover text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-error/30"
              >
                <PhoneOff className="w-7 h-7" />
              </button>

              <button 
                onClick={toggleVideo}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl backdrop-blur-md hover:scale-105 active:scale-95 ${isVideoOff ? 'bg-white text-black' : 'bg-white/20 text-white hover:bg-white/30 border border-white/10'}`}
              >
                {isVideoOff ? <VideoOff className="w-6 h-6" /> : <VideoIcon className="w-6 h-6" />}
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
