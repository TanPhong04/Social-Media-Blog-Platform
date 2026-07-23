import React, { useEffect, useRef, useState } from 'react';
import { PhoneOff, Phone, Mic, MicOff, Video as VideoIcon, VideoOff, Minimize2, Maximize2 } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { useCall } from '../../contexts/CallContext';

export const GlobalCallModal: React.FC = () => {
  const [isMinimized, setIsMinimized] = useState(false);
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
  }, [localStream, callStatus, isMinimized]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callStatus, isMinimized]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (callStatus === 'idle') {
    if (isMinimized) setIsMinimized(false);
    return null;
  }

  const isIncoming = callStatus === 'incoming';
  const isConnected = callStatus === 'connected';

  const hasAudio = !!(localStream && localStream.getAudioTracks().length > 0);
  const hasVideo = !!(localStream && localStream.getVideoTracks().length > 0);

  // Chế độ thu nhỏ (PIP)
  if (isMinimized) {
    return (
      <div 
        className="fixed bottom-6 right-6 z-[9999] w-72 bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10 cursor-pointer animate-fade-in hover:scale-105 transition-transform group"
        onClick={() => setIsMinimized(false)}
      >
        <div className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full z-50 opacity-0 group-hover:opacity-100 transition-opacity">
          <Maximize2 className="w-4 h-4 text-white" />
        </div>
        
        {isConnected && remoteStream && isVideo ? (
          <div className="relative aspect-video w-full">
            <video ref={remoteVideoRef} className="w-full h-full object-cover" autoPlay playsInline />
            <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center z-10">
              <span className="text-white text-xs font-semibold bg-black/50 px-2 py-1 rounded-md">
                {formatDuration(callDuration)}
              </span>
              <div className="flex gap-1">
                {(!hasAudio || isMuted) && <MicOff className="w-3 h-3 text-red-400" />}
                {(!hasVideo || isVideoOff) && <VideoOff className="w-3 h-3 text-red-400" />}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 flex items-center gap-3">
            <Avatar 
              src={remoteProfile?.avatarUrl} 
              fallback={remoteProfile?.displayName?.charAt(0).toUpperCase() || 'U'}
              className="w-12 h-12"
            />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{remoteProfile?.displayName}</p>
              <p className="text-white/60 text-xs">
                {isIncoming ? 'Đang gọi...' : callStatus === 'outgoing' ? 'Đang đổ chuông...' : formatDuration(callDuration)}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl aspect-video sm:rounded-[32px] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] flex border border-white/5 bg-gray-900">
        
        {/* Nút Thu nhỏ */}
        {!isIncoming && (
          <button 
            onClick={() => setIsMinimized(true)}
            className="absolute top-6 left-6 z-50 p-3 bg-black/40 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-colors border border-white/10"
            title="Thu nhỏ cửa sổ"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
        )}

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
            <div className="flex flex-col items-center justify-center relative z-10 w-full h-full bg-gradient-to-b from-gray-900/50 to-black">
              <div className="relative">
                {!isConnected && <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />}
                <Avatar 
                  src={remoteProfile?.avatarUrl} 
                  fallback={remoteProfile?.displayName?.charAt(0).toUpperCase() || 'U'}
                  size="xl"
                  className="w-40 h-40 border-4 border-white/10 shadow-2xl relative z-10"
                />
              </div>
              <h2 className="text-3xl font-bold text-white mt-8 drop-shadow-md tracking-wide">
                {remoteProfile?.displayName || 'Người dùng'}
              </h2>
              <p className="text-lg font-medium mt-2 text-white/60">
                {isIncoming ? 'Đang gọi cho bạn...' : 
                 callStatus === 'outgoing' ? 'Đang đổ chuông...' : 
                 formatDuration(callDuration)}
              </p>
            </div>
          )}
          
          {/* Gradient Overlay for Controls */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/10 pointer-events-none" />
        </div>

        {/* Picture-in-Picture (Local) */}
        {isConnected && localStream && isVideo && (
          <div className="absolute top-6 right-6 w-56 aspect-video bg-gray-800 rounded-xl overflow-hidden border border-white/20 shadow-2xl z-30">
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
        <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center gap-6 z-40">
          
          {isIncoming ? (
            <>
              <button 
                onClick={rejectCall}
                className="w-16 h-16 rounded-full bg-error hover:bg-error-hover text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
              >
                <PhoneOff className="w-8 h-8" />
              </button>
              <button 
                onClick={acceptCall}
                className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(34,197,94,0.3)] animate-bounce"
              >
                <Phone className="w-8 h-8" />
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={toggleMute}
                disabled={!hasAudio}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl backdrop-blur-md ${
                  !hasAudio 
                    ? 'bg-gray-800/80 text-gray-500 cursor-not-allowed opacity-60 border border-gray-700/50' 
                    : isMuted 
                      ? 'bg-white text-black hover:scale-105 active:scale-95' 
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/10 hover:scale-105 active:scale-95'
                }`}
              >
                {(!hasAudio || isMuted) ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
              
              <button 
                onClick={endCall}
                className="w-20 h-20 mx-4 rounded-full bg-error hover:bg-error-hover text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(239,68,68,0.3)]"
              >
                <PhoneOff className="w-8 h-8" />
              </button>

              {isVideo && (
                <button 
                  onClick={toggleVideo}
                  disabled={!hasVideo}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl backdrop-blur-md ${
                    !hasVideo 
                      ? 'bg-gray-800/80 text-gray-500 cursor-not-allowed opacity-60 border border-gray-700/50' 
                      : isVideoOff 
                        ? 'bg-white text-black hover:scale-105 active:scale-95' 
                        : 'bg-white/10 text-white hover:bg-white/20 border border-white/10 hover:scale-105 active:scale-95'
                  }`}
                >
                  {(!hasVideo || isVideoOff) ? <VideoOff className="w-6 h-6" /> : <VideoIcon className="w-6 h-6" />}
                </button>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
};
