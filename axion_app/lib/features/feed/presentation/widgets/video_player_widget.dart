import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:video_player/video_player.dart';
import 'package:visibility_detector/visibility_detector.dart';
import '../../../../core/providers/main_nav_provider.dart';
import '../../../../core/providers/active_video_provider.dart';

class VideoPlayerWidget extends ConsumerStatefulWidget {
  final String url;
  final VoidCallback? onTap;

  const VideoPlayerWidget({super.key, required this.url, this.onTap});

  @override
  ConsumerState<VideoPlayerWidget> createState() => _VideoPlayerWidgetState();
}

class _VideoPlayerWidgetState extends ConsumerState<VideoPlayerWidget> {
  late VideoPlayerController _controller;
  bool _isError = false;
  bool _isMuted = true;
  bool _isVisible = false;

  @override
  void initState() {
    super.initState();
    _controller = VideoPlayerController.networkUrl(Uri.parse(widget.url))
      ..initialize().then((_) {
        if (mounted) {
          setState(() {});
          _controller.setVolume(0.0);
          _controller.setLooping(true);
        }
      }).catchError((error) {
        if (mounted) setState(() => _isError = true);
      });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _toggleMute() {
    setState(() {
      _isMuted = !_isMuted;
      _controller.setVolume(_isMuted ? 0.0 : 1.0);
    });
  }

  void _play() {
    final activeKey = ref.read(activeVideoProvider);
    if (activeKey != null && activeKey != widget.url && _isVisible) {
      return;
    }
    if (!_controller.value.isPlaying) {
      ref.read(activeVideoProvider.notifier).setActive(widget.url);
      _controller.play();
      setState(() {});
    }
  }

  void _pause() {
    if (_controller.value.isPlaying) {
      if (ref.read(activeVideoProvider) == widget.url) {
        ref.read(activeVideoProvider.notifier).clear();
      }
      _controller.pause();
      setState(() {});
    }
  }

  @override
  Widget build(BuildContext context) {
    final isCurrentTab = ref.watch(mainNavProvider) == 0;
    final activeKey = ref.watch(activeVideoProvider);

    if (!isCurrentTab && _controller.value.isInitialized && _controller.value.isPlaying) {
      _pause();
    }

    if (_isError) {
      return Container(
        height: 200,
        color: const Color(0xFF1F2937),
        child: const Center(
          child: Icon(Icons.videocam_off, color: Colors.white30, size: 40),
        ),
      );
    }

    if (!_controller.value.isInitialized) {
      return Container(
        height: 200,
        color: const Color(0xFF1F2937),
        child: const Center(child: CircularProgressIndicator()),
      );
    }

    return VisibilityDetector(
      key: ValueKey('video_${widget.url}'),
      onVisibilityChanged: (info) {
        if (!mounted || !_controller.value.isInitialized) return;
        final fraction = info.visibleFraction;
        if (fraction > 0.6 && isCurrentTab) {
          if (!_isVisible) {
            _isVisible = true;
            if (activeKey == null || activeKey == widget.url) {
              _play();
            }
          }
        } else {
          if (_isVisible && fraction < 0.1) {
            _isVisible = false;
            _pause();
          }
        }
      },
      child: AspectRatio(
        aspectRatio: _controller.value.aspectRatio,
        child: Stack(
          alignment: Alignment.center,
          children: [
            VideoPlayer(_controller),
            GestureDetector(
              onTap: widget.onTap ?? () {
                if (_controller.value.isPlaying) {
                  _pause();
                } else {
                  _play();
                }
              },
              child: Container(
                color: Colors.transparent,
                child: Center(
                  child: _controller.value.isPlaying
                      ? const SizedBox.shrink()
                      : Icon(
                          Icons.play_arrow,
                          color: Colors.white.withValues(alpha: 0.7),
                          size: 50,
                        ),
                ),
              ),
            ),
            Positioned(
              bottom: 12,
              right: 12,
              child: GestureDetector(
                onTap: _toggleMute,
                child: Container(
                  padding: const EdgeInsets.all(6),
                  decoration: const BoxDecoration(
                    color: Colors.black54,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    _isMuted ? Icons.volume_off : Icons.volume_up,
                    color: Colors.white,
                    size: 20,
                  ),
                ),
              ),
            ),
            if (!_controller.value.isPlaying && _isVisible)
              Positioned(
                bottom: 12,
                left: 12,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.black54,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text(
                    'Tạm dừng',
                    style: TextStyle(color: Colors.white, fontSize: 11),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
