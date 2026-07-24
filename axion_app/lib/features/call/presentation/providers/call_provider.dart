import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:peerdart/peerdart.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../auth/data/auth_repository.dart';
import '../../../chat/data/chat_repository.dart';

class PeerCallOption implements CallOption {
  @override
  dynamic metadata;
  
  @override
  Function? sdpTransform;
  
  PeerCallOption({this.metadata, this.sdpTransform});
  
  @override
  Map<String, dynamic> toMap() => {
    "metadata": metadata,
    "sdpTransform": sdpTransform,
  };
}

enum CallState { none, ringing, inCall }

class CallData {
  final CallState state;
  final String? callerName;
  final String? callerAvatar;
  final bool isVideo;
  final bool isMicMuted;
  final bool isSpeakerOn;

  CallData({
    this.state = CallState.none,
    this.callerName,
    this.callerAvatar,
    this.isVideo = false,
    this.isMicMuted = false,
    this.isSpeakerOn = true,
  });

  CallData copyWith({
    CallState? state,
    String? callerName,
    String? callerAvatar,
    bool? isVideo,
    bool? isMicMuted,
    bool? isSpeakerOn,
  }) {
    return CallData(
      state: state ?? this.state,
      callerName: callerName ?? this.callerName,
      callerAvatar: callerAvatar ?? this.callerAvatar,
      isVideo: isVideo ?? this.isVideo,
      isMicMuted: isMicMuted ?? this.isMicMuted,
      isSpeakerOn: isSpeakerOn ?? this.isSpeakerOn,
    );
  }
}

final callProvider = NotifierProvider<CallNotifier, CallData>(() {
  return CallNotifier();
});

class CallNotifier extends Notifier<CallData> {
  MediaStream? _localStream;
  Peer? _peer;
  MediaConnection? _connection;
  
  final RTCVideoRenderer localRenderer = RTCVideoRenderer();
  final RTCVideoRenderer remoteRenderer = RTCVideoRenderer();

  bool _isInit = false;
  String? _targetUserId;
  bool _isCaller = false;

  @override
  CallData build() {
    _initRenderers();
    ref.onDispose(() {
      _disposeAll();
      _peer?.dispose();
    });

    // Initialize Peer if user is already logged in
    final currentUser = ref.read(authStateProvider).value;
    if (currentUser != null) {
      _initPeer(currentUser.id);
    }

    // Listen to auth state to initialize Peer on login/logout
    ref.listen(authStateProvider, (previous, next) {
      next.whenData((user) {
        if (user != null) {
          _initPeer(user.id);
        } else {
          _peer?.dispose();
          _peer = null;
        }
      });
    });
    
    // Listen to chatRepositoryProvider to catch [CALL_LOG] MISSED from remote caller
    ref.listen(chatRepositoryProvider, (previous, next) {
      next.onMessageReceived = (msg) {
        if (state.state == CallState.ringing && 
            _targetUserId != null &&
            msg.senderId == _targetUserId && 
            msg.content.contains('[CALL_LOG]') && 
            msg.content.contains('MISSED')) {
          endCall(isUserInitiated: false);
        }
      };
    });

    return CallData();
  }

  Future<void> _initRenderers() async {
    if (_isInit) return;
    await localRenderer.initialize();
    await remoteRenderer.initialize();
    _isInit = true;
  }

  /// Load user profile to get the real display name and avatar
  Future<void> _loadCallerProfile(String userId) async {
    try {
      final authRepo = ref.read(authRepositoryProvider);
      final profile = await authRepo.getUserById(userId);
      // Update state with the real name and avatar
      if (state.state != CallState.none) {
        state = state.copyWith(
          callerName: profile.displayName,
          callerAvatar: profile.avatarUrl ?? 'https://ui-avatars.com/api/?name=${Uri.encodeComponent(profile.displayName)}&background=6366f1&color=fff',
        );
      }
    } catch (e) {
      if (kDebugMode) print('Failed to load caller profile: $e');
    }
  }

  void _initPeer(String userId) {
    if (_peer != null) return;
    _peer = Peer(id: 'axion-app-$userId');
    
    _peer!.on('open').listen((id) {});

    _peer!.on<MediaConnection>('call').listen((call) {
      _connection = call;
      _isCaller = false;
      _targetUserId = call.peer.replaceAll(RegExp(r'^axion-(web|app)-'), '');
      
      bool isVideo = false;
      try {
        // In peerdart, metadata might be on the call object directly or inside options
        dynamic meta;
        try {
          meta = (call as dynamic).metadata;
        } catch (_) {}
        
        if (meta == null) {
          try {
            meta = call.options?.metadata;
          } catch (_) {}
        }
        
        if (meta is Map && meta['isVideo'] == true) {
          isVideo = true;
        }
      } catch (e) {
        if (kDebugMode) print('Error parsing call metadata: $e');
      }
      
      // Set initial state with placeholder name, then load real profile
      state = state.copyWith(
        state: CallState.ringing,
        callerName: 'Đang tải...',
        callerAvatar: 'https://ui-avatars.com/api/?name=User&background=6366f1&color=fff',
        isVideo: isVideo,
      );

      // Load the real caller profile asynchronously
      _loadCallerProfile(_targetUserId!);

      call.on('close').listen((_) {
        endCall(isUserInitiated: false);
      });
    });

    _peer!.on('disconnected').listen((_) {
      _peer?.reconnect();
    });

    _peer!.on('error').listen((err) {
      if (kDebugMode) print('PeerJS Error: $err');
    });
  }

  Future<void> _setupLocalStream() async {
    try {
      final Map<String, dynamic> mediaConstraints = {
        'audio': true,
        'video': state.isVideo
            ? {
                'mandatory': {
                  'minWidth': '640',
                  'minHeight': '480',
                  'minFrameRate': '30',
                },
                'facingMode': 'user',
                'optional': [],
              }
            : false,
      };

      _localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
      localRenderer.srcObject = _localStream;
    } catch (e) {
      if (kDebugMode) print('Media error: $e');
    }
  }

  Future<void> acceptCall() async {
    state = state.copyWith(state: CallState.inCall);
    await _setupLocalStream();
    
    if (_connection != null) {
      if (_localStream != null) {
        _connection!.answer(_localStream!);
      }
      _connection!.on('stream').listen((remoteStream) {
        remoteRenderer.srcObject = remoteStream as MediaStream;
      });
    }
  }

  Future<void> startOutgoingCall(String targetId, String targetName, String targetAvatar, {bool isVideo = false}) async {
    if (_peer == null) return;
    _targetUserId = targetId;
    _isCaller = true;
    
    state = state.copyWith(
      state: CallState.inCall,
      callerName: targetName,
      callerAvatar: targetAvatar,
      isVideo: isVideo,
      isMicMuted: false,
      isSpeakerOn: true,
    );
    
    await _setupLocalStream();
    
    if (_localStream != null) {
      final options = PeerCallOption(metadata: {'isVideo': isVideo});
      // Try calling both web and mobile peer IDs simultaneously
      // The first one to answer wins, the other gets closed
      final targetPeerIds = ['axion-web-$targetId', 'axion-app-$targetId'];
      final List<MediaConnection> pendingCalls = [];
      bool hasConnected = false;

      for (final peerId in targetPeerIds) {
        final call = _peer!.call(peerId, _localStream!, options: options);
        pendingCalls.add(call);

        call.on('stream').listen((remoteStream) {
          if (hasConnected) return; // Already connected via another target
          hasConnected = true;
          _connection = call;

          // Close the other pending call(s)
          for (final c in pendingCalls) {
            if (c != call) {
              try { c.close(); } catch (_) {}
            }
          }

          remoteRenderer.srcObject = remoteStream as MediaStream;
          state = state.copyWith(state: CallState.inCall);
        });

        call.on('close').listen((_) {
          if (_connection == call) {
            endCall(isUserInitiated: false);
          }
        });
      }
    } else {
      endCall(isUserInitiated: true);
    }
  }

  void rejectCall() {
    if (_targetUserId != null) {
      final payload = jsonEncode({
        'type': 'REJECTED',
        'isVideo': state.isVideo,
        'duration': 0
      });
      ref.read(chatRepositoryProvider).sendMessage(_targetUserId!, '[CALL_LOG]:$payload');
    }
    _connection?.close();
    _disposeAll();
    state = CallData();
  }

  void endCall({bool isUserInitiated = true}) {
    if (isUserInitiated && _isCaller && _targetUserId != null) {
      final payload = jsonEncode({
        'type': remoteRenderer.srcObject == null ? 'MISSED' : 'ENDED',
        'isVideo': state.isVideo,
        'duration': 0
      });
      final target = _targetUserId!;
      ref.read(chatRepositoryProvider).sendMessage(target, '[CALL_LOG]:$payload').then((_) {
        // Refresh the chat history locally so the caller sees their sent log immediately
        ref.invalidate(chatHistoryProvider(target));
      }).catchError((_) {});
    }
    
    _connection?.close();
    _disposeAll();
    state = CallData();
  }

  void toggleMic() {
    if (_localStream != null) {
      final audioTrack = _localStream!.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      state = state.copyWith(isMicMuted: !audioTrack.enabled);
    }
  }

  void toggleSpeaker() {
    if (_localStream != null) {
      state = state.copyWith(isSpeakerOn: !state.isSpeakerOn);
      Helper.setSpeakerphoneOn(state.isSpeakerOn);
    }
  }

  void switchCamera() {
    if (_localStream != null && state.isVideo) {
      final videoTrack = _localStream!.getVideoTracks()[0];
      Helper.switchCamera(videoTrack);
    }
  }

  Future<void> reconnectCall() async {
    // Reconnection is handled automatically by PeerJS in most cases,
    // but if the connection was lost, we'd need to re-call.
  }

  void _disposeAll() {
    _localStream?.getTracks().forEach((track) => track.stop());
    _localStream?.dispose();
    _localStream = null;
    
    localRenderer.srcObject = null;
    remoteRenderer.srcObject = null;
    _connection = null;
  }
}
