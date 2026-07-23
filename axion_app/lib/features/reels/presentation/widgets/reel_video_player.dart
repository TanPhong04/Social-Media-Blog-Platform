import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

class ReelVideoPlayer extends StatefulWidget {
  final String url;
  final bool isActive;
  final bool isPreload;
  final bool showControls;
  final VoidCallback? onTap;

  const ReelVideoPlayer({
    super.key,
    required this.url,
    required this.isActive,
    required this.isPreload,
    this.showControls = true,
    this.onTap,
  });

  @override
  State<ReelVideoPlayer> createState() => _ReelVideoPlayerState();
}

class _ReelVideoPlayerState extends State<ReelVideoPlayer> {
  VideoPlayerController? _controller;
  bool _isMuted = false;
  bool _isError = false;

  @override
  void initState() {
    super.initState();
    if (widget.isPreload) {
      _initController();
    }
  }

  @override
  void didUpdateWidget(covariant ReelVideoPlayer oldWidget) {
    super.didUpdateWidget(oldWidget);

    if (widget.isPreload != oldWidget.isPreload) {
      if (widget.isPreload) {
        _initController();
      } else {
        _disposeController();
      }
    }

    if (widget.isActive != oldWidget.isActive) {
      if (widget.isActive) {
        _controller?.play();
      } else {
        _controller?.pause();
      }
    }
  }

  @override
  void dispose() {
    _disposeController();
    super.dispose();
  }

  void _initController() {
    if (_controller != null) return;
    _controller = VideoPlayerController.networkUrl(Uri.parse(widget.url))
      ..setLooping(true)
      ..setVolume(_isMuted ? 0.0 : 1.0)
      ..addListener(_onVideoUpdate)
      ..initialize().then((_) {
        if (mounted) {
          setState(() {});
          if (widget.isActive) _controller?.play();
        }
      }).catchError((_) {
        if (mounted) setState(() => _isError = true);
      });
  }

  void _disposeController() {
    _controller?.removeListener(_onVideoUpdate);
    _controller?.dispose();
    _controller = null;
  }

  void _onVideoUpdate() {
    if (mounted) setState(() {});
  }

  void _toggleMute() {
    setState(() {
      _isMuted = !_isMuted;
      _controller?.setVolume(_isMuted ? 0.0 : 1.0);
    });
  }

  void _togglePlay() {
    if (_controller == null || !_controller!.value.isInitialized) return;
    _controller!.value.isPlaying ? _controller!.pause() : _controller!.play();
  }

  String _formatDuration(Duration d) {
    final minutes = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final seconds = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '${d.inHours > 0 ? '${d.inHours}:' : ''}$minutes:$seconds';
  }

  BoxFit _videoFit() {
    if (_controller == null || !_controller!.value.isInitialized) return BoxFit.cover;
    final size = _controller!.value.size;
    if (size.width > size.height * 1.2) {
      return BoxFit.contain;
    }
    return BoxFit.cover;
  }

  @override
  Widget build(BuildContext context) {
    if (_isError) {
      return Container(
        color: Colors.grey.shade900,
        child: const Center(
          child: Icon(Icons.videocam_off, color: Colors.white24, size: 80),
        ),
      );
    }

    if (_controller == null || !_controller!.value.isInitialized) {
      return Container(
        color: Colors.grey.shade900,
        child: const Center(
          child: CircularProgressIndicator(color: Colors.white),
        ),
      );
    }

    final isLandscape = _controller!.value.size.width > _controller!.value.size.height * 1.2;

    return GestureDetector(
      onTap: widget.onTap ?? _togglePlay,
      child: Stack(
        fit: StackFit.expand,
        children: [
          Center(
            child: FittedBox(
              fit: _videoFit(),
              clipBehavior: Clip.hardEdge,
              child: SizedBox(
                width: _controller!.value.size.width,
                height: _controller!.value.size.height,
                child: VideoPlayer(_controller!),
              ),
            ),
          ),
          if (_controller!.value.isBuffering)
            const Center(
              child: CircularProgressIndicator(color: Colors.white),
            ),
          if (widget.showControls && !_controller!.value.isPlaying && !_controller!.value.isBuffering)
            Container(
              color: Colors.black26,
              child: const Center(
                child: Icon(Icons.play_arrow, color: Colors.white70, size: 80),
              ),
            ),
          if (widget.showControls)
            Positioned(
              top: 48,
              right: 16,
              child: CircleAvatar(
                backgroundColor: Colors.black45,
                child: IconButton(
                  icon: Icon(
                    _isMuted ? Icons.volume_off : Icons.volume_up,
                    color: Colors.white,
                  ),
                  onPressed: _toggleMute,
                ),
              ),
            ),
          if (isLandscape && widget.showControls)
            Positioned(
              top: 48,
              left: 16,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                    color: Colors.black45,
                    borderRadius: BorderRadius.circular(4)),
                child: const Text(
                  'Video ngang',
                  style: TextStyle(color: Colors.white70, fontSize: 11),
                ),
              ),
            ),
          if (widget.showControls)
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: Container(
                padding: EdgeInsets.only(
                  left: 12,
                  right: 12,
                  bottom: MediaQuery.of(context).padding.bottom + 4,
                ),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Colors.transparent, Colors.black54],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    VideoProgressIndicator(
                      _controller!,
                      allowScrubbing: true,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      colors: const VideoProgressColors(
                        playedColor: Colors.white,
                        bufferedColor: Colors.white30,
                        backgroundColor: Colors.white12,
                      ),
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          _formatDuration(_controller!.value.position),
                          style: const TextStyle(color: Colors.white70, fontSize: 11),
                        ),
                        Text(
                          _formatDuration(_controller!.value.duration),
                          style: const TextStyle(color: Colors.white70, fontSize: 11),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
