import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import '../providers/call_provider.dart';

class GlobalCallOverlay extends ConsumerWidget {
  final Widget child;

  const GlobalCallOverlay({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final callData = ref.watch(callProvider);
    final callNotifier = ref.read(callProvider.notifier);

    return Stack(
      children: [
        // The main application UI
        child,

        // The Call Overlay (Ringing or InCall)
        if (callData.state != CallState.none)
          Positioned.fill(
            child: Material(
              color: Colors.black.withValues(alpha: 0.85),
              child: Stack(
                children: [
                  // Remote Video Background
                  if (callData.state == CallState.inCall && callData.isVideo)
                    Positioned.fill(
                      child: RTCVideoView(
                        callNotifier.remoteRenderer,
                        objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
                      ),
                    ),

                  // Local Preview (PiP)
                  if (callData.state == CallState.inCall && callData.isVideo)
                    Positioned(
                      top: 60,
                      right: 16,
                      width: 110,
                      height: 160,
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          color: Colors.black54,
                          child: RTCVideoView(
                            callNotifier.localRenderer,
                            mirror: true,
                            objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
                          ),
                        ),
                      ),
                    ),

                  // UI Overlay
                  SafeArea(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        if (callData.state == CallState.ringing) ...[
                          const Spacer(),
                          // Avatar with pulsing effect
                          Container(
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.5),
                                width: 4,
                              ),
                            ),
                            child: CircleAvatar(
                              radius: 60,
                              backgroundImage: callData.callerAvatar != null
                                  ? CachedNetworkImageProvider(callData.callerAvatar!)
                                  : const NetworkImage('https://ui-avatars.com/api/?name=User'),
                            ),
                          ),
                          const SizedBox(height: 24),
                          
                          Text(
                            callData.callerName ?? 'Người Dùng Khách',
                            style: Theme.of(context).textTheme.displayMedium?.copyWith(
                              fontSize: 28,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 8),
                          
                          Text(
                            callData.isVideo ? 'Đang gọi video đến...' : 'Đang gọi thoại đến...',
                            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                              color: Colors.white70,
                            ),
                          ),
                        ] else ...[
                          // In Call: Move Name to top
                          Padding(
                            padding: const EdgeInsets.only(top: 16.0),
                            child: Column(
                              children: [
                                Text(
                                  callData.callerName ?? 'Người Dùng Khách',
                                  style: const TextStyle(fontSize: 24, color: Colors.white, fontWeight: FontWeight.bold),
                                ),
                                const SizedBox(height: 8),
                                const Text(
                                  'Đang trong cuộc gọi',
                                  style: TextStyle(color: Colors.white70),
                                ),
                              ],
                            ),
                          ),
                        ],
                        
                        const Spacer(),
                        
                        // Call Actions
                        Padding(
                          padding: const EdgeInsets.only(bottom: 40.0, left: 16, right: 16),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                            children: [
                              if (callData.state == CallState.ringing) ...[
                                _buildActionButton(
                                  icon: Icons.call_end,
                                  color: Colors.redAccent,
                                  onPressed: () => callNotifier.rejectCall(),
                                ),
                                _buildActionButton(
                                  icon: callData.isVideo ? Icons.videocam : Icons.phone,
                                  color: Colors.greenAccent,
                                  onPressed: () => callNotifier.acceptCall(),
                                ),
                              ] else ...[
                                // In Call Controls
                                if (callData.isVideo)
                                  _buildActionButton(
                                    icon: Icons.flip_camera_android,
                                    color: Colors.white24,
                                    size: 24,
                                    padding: 16,
                                    onPressed: () => callNotifier.switchCamera(),
                                  ),
                                   
                                 _buildActionButton(
                                  icon: callData.isMicMuted ? Icons.mic_off : Icons.mic,
                                  color: callData.isMicMuted ? Colors.redAccent : Colors.white24,
                                  size: 24,
                                  padding: 16,
                                  onPressed: () => callNotifier.toggleMic(),
                                ),

                                _buildActionButton(
                                  icon: Icons.call_end,
                                  color: Colors.redAccent,
                                  size: 32,
                                  padding: 24,
                                  onPressed: () => callNotifier.endCall(),
                                ),

                                _buildActionButton(
                                  icon: callData.isSpeakerOn ? Icons.volume_up : Icons.volume_off,
                                  color: callData.isSpeakerOn ? Colors.white24 : Colors.redAccent,
                                  size: 24,
                                  padding: 16,
                                  onPressed: () => callNotifier.toggleSpeaker(),
                                ),

                                _buildActionButton(
                                  icon: Icons.refresh,
                                  color: Colors.white24,
                                  size: 24,
                                  padding: 16,
                                  onPressed: () => callNotifier.reconnectCall(),
                                ),
                              ]
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required Color color,
    required VoidCallback onPressed,
    double size = 36,
    double padding = 20,
  }) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        padding: EdgeInsets.all(padding),
        decoration: BoxDecoration(
          color: color,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: color.withValues(alpha: 0.4),
              blurRadius: 12,
              spreadRadius: 2,
            ),
          ],
        ),
        child: Icon(icon, color: Colors.white, size: size),
      ),
    );
  }
}
