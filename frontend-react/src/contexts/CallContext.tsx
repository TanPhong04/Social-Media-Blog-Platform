import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import Peer, { type MediaConnection } from 'peerjs';
import { useAuth } from './AuthContext';
import { userApi } from '../api/userApi';
import { chatApi } from '../api/chatApi';

interface CallContextType {
  startCall: (contactId: string, contactProfile: any, isVideo: boolean) => void;
  endCall: () => void;
  acceptCall: () => void;
  rejectCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  callStatus: 'idle' | 'outgoing' | 'incoming' | 'connected';
  remoteProfile: any;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isVideo: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  callDuration: number;
}

const CallContext = createContext<CallContextType | null>(null);

export const useCall = () => {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCall must be used within CallProvider');
  return ctx;
};

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [peer, setPeer] = useState<Peer | null>(null);
  
  const [callStatus, setCallStatus] = useState<'idle' | 'outgoing' | 'incoming' | 'connected'>('idle');
  const [remoteProfile, setRemoteProfile] = useState<any>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const connectionRef = useRef<MediaConnection | null>(null);
  const ringAudioRef = useRef<HTMLAudioElement | null>(null);
  
  const isCallerRef = useRef(false);
  const statusRef = useRef<'idle' | 'outgoing' | 'incoming' | 'connected'>('idle');
  const durationRef = useRef(0);
  const isVideoRef = useRef(false);
  const remoteIdRef = useRef<string | null>(null);
  const ringTimeoutRef = useRef<any>(null);

  const updateStatus = (status: 'idle' | 'outgoing' | 'incoming' | 'connected') => {
    statusRef.current = status;
    setCallStatus(status);
  };

  useEffect(() => {
    durationRef.current = callDuration;
  }, [callDuration]);

  useEffect(() => {
    isVideoRef.current = isVideo;
  }, [isVideo]);

  useEffect(() => {
    const audio = new Audio('/sounds/nhac-chuong.mp3');
    audio.loop = true;
    ringAudioRef.current = audio;
  }, []);

  const playRing = () => ringAudioRef.current?.play().catch(() => {});
  const stopRing = () => {
    if (ringAudioRef.current) {
      ringAudioRef.current.pause();
      ringAudioRef.current.currentTime = 0;
    }
    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }
  };

  const sendCallLog = async (type: 'MISSED' | 'REJECTED' | 'ENDED') => {
    const targetId = remoteIdRef.current;
    if (!targetId) return;
    try {
      const payload = JSON.stringify({ type, isVideo: isVideoRef.current, duration: durationRef.current });
      await chatApi.sendMessage(targetId, `[CALL_LOG]:${payload}`);
      window.dispatchEvent(new CustomEvent('new-chat-message-received'));
    } catch (e) {
      console.warn('Failed to send call log', e);
    }
  };

  useEffect(() => {
    if (!user) {
      if (peer) {
        peer.destroy();
        setPeer(null);
      }
      return;
    }
    
    const newPeer = new Peer(`axion-user-${user.id}`);
    
    newPeer.on('open', (id) => {
      console.log('Peer connected with ID: ', id);
    });

    newPeer.on('call', async (call) => {
      connectionRef.current = call;
      isCallerRef.current = false;
      
      const callerId = call.peer.replace('axion-user-', '');
      remoteIdRef.current = callerId;
      
      try {
        const res: any = await userApi.getUserById(callerId);
        setRemoteProfile(res.data || res);
      } catch (e) {
        setRemoteProfile({ displayName: 'Người dùng', id: callerId });
      }

      setIsVideo(call.metadata?.isVideo || false);
      updateStatus('incoming');
      playRing();
      
      ringTimeoutRef.current = setTimeout(() => {
        if (statusRef.current === 'incoming') {
           endCall(false);
        }
      }, 60000);

      call.on('close', () => {
        if (statusRef.current === 'connected' && isCallerRef.current) {
           sendCallLog('ENDED');
        }
        endCall(false);
      });
    });

    setPeer(newPeer);
    return () => newPeer.destroy();
  }, [user]);

  useEffect(() => {
    const handleRemoteCallAction = (e: Event) => {
      const msg = (e as CustomEvent).detail;
      if (!msg) return;
      // If we are currently incoming a call from this sender, and they send MISSED, they cancelled it.
      if (statusRef.current === 'incoming' && remoteIdRef.current === msg.senderId) {
        if (msg.content?.includes('[CALL_LOG]') && msg.content?.includes('MISSED')) {
          endCall(false);
        }
      }
    };
    window.addEventListener('new-chat-message-received', handleRemoteCallAction);
    return () => window.removeEventListener('new-chat-message-received', handleRemoteCallAction);
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (callStatus === 'connected') {
      interval = setInterval(() => setCallDuration(p => p + 1), 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  const getMedia = async (video: boolean) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio: true });
      setLocalStream(stream);
      return stream;
    } catch (e) {
      console.error("No media devices", e);
      return null;
    }
  };

  const stopMedia = () => {
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
  };

  const startCall = async (contactId: string, contactProfile: any, video: boolean) => {
    if (!peer) return;
    setRemoteProfile(contactProfile);
    setIsVideo(video);
    setIsMuted(false);
    setIsVideoOff(false);
    
    isCallerRef.current = true;
    remoteIdRef.current = contactId;
    updateStatus('outgoing');
    playRing();
    
    ringTimeoutRef.current = setTimeout(() => {
      if (statusRef.current === 'outgoing') {
         sendCallLog('MISSED');
         endCall(false);
      }
    }, 60000);

    const stream = await getMedia(video);
    if (!stream) {
      stopRing();
      updateStatus('idle');
      return;
    }

    const call = peer.call(`axion-user-${contactId}`, stream, { metadata: { isVideo: video } });
    connectionRef.current = call;

    call.on('stream', (remoteStreamData) => {
      stopRing();
      setRemoteStream(remoteStreamData);
      updateStatus('connected');
    });

    call.on('close', () => {
      if (statusRef.current === 'connected' && isCallerRef.current) {
         sendCallLog('ENDED');
      }
      endCall(false);
    });
  };

  const acceptCall = async () => {
    stopRing();
    const stream = await getMedia(isVideo);
    if (connectionRef.current && stream) {
      connectionRef.current.answer(stream);
      
      connectionRef.current.on('stream', (remoteStreamData) => {
        setRemoteStream(remoteStreamData);
        updateStatus('connected');
      });

      connectionRef.current.on('close', () => {
        if (isCallerRef.current && statusRef.current === 'connected') {
           sendCallLog('ENDED');
        }
        endCall(false);
      });
    } else {
      endCall(false);
    }
  };

  const rejectCall = () => {
    sendCallLog('REJECTED');
    stopRing();
    if (connectionRef.current) {
      connectionRef.current.close();
    }
    endCall(false);
  };

  const endCall = (isUserInitiated: boolean = true) => {
    if (isUserInitiated && isCallerRef.current) {
      if (statusRef.current === 'outgoing') {
        sendCallLog('MISSED');
      } else if (statusRef.current === 'connected') {
        sendCallLog('ENDED');
      }
    }
    
    stopRing();
    if (connectionRef.current) {
      connectionRef.current.close();
    }
    stopMedia();
    updateStatus('idle');
    setRemoteProfile(null);
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => t.enabled = isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(t => t.enabled = isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <CallContext.Provider value={{
      startCall, endCall, acceptCall, rejectCall, toggleMute, toggleVideo,
      callStatus, remoteProfile, localStream, remoteStream, isVideo, isMuted, isVideoOff, callDuration
    }}>
      {children}
    </CallContext.Provider>
  );
};
