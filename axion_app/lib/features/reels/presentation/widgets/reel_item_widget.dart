import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:share_plus/share_plus.dart' show SharePlus, ShareParams;

import '../../../../features/auth/presentation/providers/auth_provider.dart';
import '../../../../features/feed/data/article_repository.dart';
import '../../../../features/feed/data/comment_repository.dart';
import '../../../../features/feed/domain/models/article_model.dart';
import '../../../../features/feed/presentation/screens/article_detail_screen.dart';
import 'reel_video_player.dart';

class ReelItemWidget extends ConsumerStatefulWidget {
  final ArticleModel article;
  final bool isActive;
  final bool isPreload;

  const ReelItemWidget({
    super.key,
    required this.article,
    required this.isActive,
    required this.isPreload,
  });

  @override
  ConsumerState<ReelItemWidget> createState() => _ReelItemWidgetState();
}

class _ReelItemWidgetState extends ConsumerState<ReelItemWidget> {
  bool _isLiked = false;
  int _likeCount = 0;
  int _commentCount = 0;

  @override
  void initState() {
    super.initState();
    _loadInteraction();
  }

  Future<void> _loadInteraction() async {
    try {
      final repo = ref.read(articleRepositoryProvider);
      final interaction = await repo.getArticleInteraction(widget.article.id);
      
      final commentRepo = ref.read(commentRepositoryProvider);
      int cCount = 0;
      try {
        final comments = await commentRepo.getComments(widget.article.id);
        cCount = comments.where((c) => !c.content.contains('[repost]')).length;
      } catch (_) {}

      if (mounted) {
        setState(() {
          _likeCount = interaction['count'] ?? 0;
          _commentCount = cCount;
          _isLiked = interaction['likedByCurrentUser'] == true;
        });
      }
    } catch (e) {
      // Ignore
    }
  }

  Future<void> _toggleLike() async {
    final user = ref.read(authStateProvider).value;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Vui lòng đăng nhập')));
      return;
    }
    final repo = ref.read(articleRepositoryProvider);
    
    if (_isLiked) {
      setState(() {
        _isLiked = false;
        _likeCount -= 1;
      });
      try {
        await repo.unlikeArticle(widget.article.id);
      } catch (e) {
        if (mounted) {
          setState(() {
            _isLiked = true;
            _likeCount += 1;
          });
        }
      }
    } else {
      setState(() {
        _isLiked = true;
        _likeCount += 1;
      });
      try {
        await repo.likeArticle(widget.article.id, reaction: 'LIKE');
      } catch (e) {
        if (mounted) {
          setState(() {
            _isLiked = false;
            _likeCount -= 1;
          });
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        // Background Media
        Builder(
          builder: (context) {
            String? videoUrl;
            if (widget.article.mediaUrl != null && (widget.article.mediaUrl!.endsWith('#video') || widget.article.mediaUrl!.endsWith('.mp4'))) {
              videoUrl = widget.article.mediaUrl!.replaceAll('#video', '').split(',').first;
            } else {
              final match = RegExp(r'<video\s+src="([^"]+)"').firstMatch(widget.article.content);
              videoUrl = match?.group(1);
            }

            if (videoUrl != null) {
              return ReelVideoPlayer(
                url: videoUrl,
                isActive: widget.isActive,
                isPreload: widget.isPreload,
              );
            } else if (widget.article.mediaUrl != null && widget.article.mediaUrl!.isNotEmpty) {
              final url = widget.article.mediaUrl!.split(',').first;
              return CachedNetworkImage(
                imageUrl: url,
                fit: BoxFit.cover,
                placeholder: (context, url) => const Center(child: CircularProgressIndicator()),
                errorWidget: (context, url, error) => Container(color: Colors.grey.shade900),
              );
            } else {
              return Container(
                color: Colors.grey.shade900,
                child: const Center(
                  child: Icon(Icons.movie_outlined, size: 80, color: Colors.white24),
                ),
              );
            }
          },
        ),
          
        // Gradient Overlay
        Positioned.fill(
          child: IgnorePointer(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.transparent,
                    Colors.black.withOpacity(0.2),
                    Colors.black.withOpacity(0.8),
                  ],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  stops: const [0.4, 0.8, 1.0],
                ),
              ),
            ),
          ),
        ),
        
        // Content Overlay
        Positioned(
          bottom: MediaQuery.paddingOf(context).bottom + 24,
          left: 16,
          right: 80,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: 20,
                    backgroundImage: CachedNetworkImageProvider(
                      widget.article.authorAvatar ?? 'https://ui-avatars.com/api/?name=${widget.article.authorName ?? 'User'}',
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    widget.article.authorName ?? 'Người dùng',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      shadows: [Shadow(color: Colors.black54, blurRadius: 4, offset: Offset(0, 1))],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.white70),
                      borderRadius: BorderRadius.circular(16),
                      color: Colors.black26,
                    ),
                    child: const Text('Theo dõi', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                widget.article.content.isNotEmpty ? widget.article.content : widget.article.summary,
                style: const TextStyle(
                  color: Colors.white, 
                  fontSize: 15,
                  shadows: [Shadow(color: Colors.black54, blurRadius: 4, offset: Offset(0, 1))],
                ),
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
        
        // Action Buttons (Right side)
        Positioned(
          bottom: MediaQuery.paddingOf(context).bottom + 24,
          right: 8,
          child: Column(
            children: [
              _buildActionIcon(
                icon: LucideIcons.thumbsUp,
                color: _isLiked ? Theme.of(context).colorScheme.primary : Colors.white,
                label: formatCount(_likeCount),
                onTap: _toggleLike,
              ),
              const SizedBox(height: 24),
              _buildActionIcon(
                icon: Icons.chat_bubble_outline_rounded,
                color: Colors.white,
                label: '$_commentCount',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => ArticleDetailScreen(article: widget.article),
                    ),
                  );
                },
              ),
              const SizedBox(height: 24),
              _buildActionIcon(
                icon: Icons.share_rounded,
                color: Colors.white,
                label: 'Chia sẻ',
                onTap: () {
                  SharePlus.instance.share(ShareParams(text: 'Xem bài viết này trên mạng xã hội: \n${widget.article.content}'));
                },
              ),
              const SizedBox(height: 24),
              _buildActionIcon(
                icon: Icons.more_horiz,
                color: Colors.white,
                label: 'Khác',
                onTap: () {},
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildActionIcon({
    required IconData icon,
    required Color color,
    required String label,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 30),
          ),
          const SizedBox(height: 6),
          Text(
            label, 
            style: const TextStyle(
              color: Colors.white, 
              fontSize: 12,
              fontWeight: FontWeight.w600,
              shadows: [Shadow(color: Colors.black54, blurRadius: 4, offset: Offset(0, 1))],
            ),
          ),
        ],
      ),
    );
  }
}

String formatCount(int count) {
  if (count >= 1000000) return '${(count / 1000000).toStringAsFixed(1)}Tr';
  if (count >= 1000) return '${(count / 1000).toStringAsFixed(1)}K';
  return count.toString();
}
