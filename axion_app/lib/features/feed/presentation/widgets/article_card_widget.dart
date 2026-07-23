import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../domain/models/article_model.dart';
import '../screens/article_detail_screen.dart';
import '../screens/create_article_screen.dart';
import '../../../auth/domain/models/user_model.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../auth/data/auth_repository.dart';
import '../providers/feed_provider.dart';
import '../../data/article_repository.dart';
import 'video_player_widget.dart';
import 'fullscreen_image_viewer.dart';
import '../../../../core/widgets/article_actions_row.dart';
import '../../../../core/utils/relative_time.dart';
import '../../../reels/presentation/screens/reels_screen.dart';

class ArticleCardWidget extends ConsumerStatefulWidget {
  final ArticleModel article;

  const ArticleCardWidget({super.key, required this.article});

  @override
  ConsumerState<ArticleCardWidget> createState() => _ArticleCardWidgetState();
}

class _ArticleCardWidgetState extends ConsumerState<ArticleCardWidget> {
  UserModel? _authorProfile;
  bool _isFollowing = false;
  String? _relativeTime;
  final RelativeTimeUpdater _timeUpdater = RelativeTimeUpdater();

  @override
  void initState() {
    super.initState();
    _loadAuthorProfile();
    _checkFollowStatus();
    _timeUpdater.start(widget.article.createdAt, (time) {
      if (mounted) setState(() => _relativeTime = time);
    });
  }

  @override
  void dispose() {
    _timeUpdater.cancel();
    super.dispose();
  }

  Future<void> _loadAuthorProfile() async {
    try {
      final repo = ref.read(authRepositoryProvider);
      final profile = await repo.getUserById(widget.article.authorId);
      if (mounted) setState(() => _authorProfile = profile);
    } catch (_) {}
  }

  Future<void> _checkFollowStatus() async {
    final user = ref.read(authStateProvider).value;
    if (user == null || user.id == widget.article.authorId) return;
    try {
      final repo = ref.read(authRepositoryProvider);
      final rel = await repo.getFollowStatus(widget.article.authorId);
      if (mounted) setState(() => _isFollowing = rel.following);
    } catch (_) {}
  }

  Future<void> _toggleFollow() async {
    final user = ref.read(authStateProvider).value;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Vui lòng đăng nhập')));
      return;
    }
    final repo = ref.read(authRepositoryProvider);
    setState(() => _isFollowing = !_isFollowing);
    try {
      if (_isFollowing) {
        await repo.followUser(widget.article.authorId);
      } else {
        await repo.unfollowUser(widget.article.authorId);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isFollowing = !_isFollowing);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
  }

  Future<void> _handleDelete() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Xóa bài viết'),
        content: const Text('Bạn có chắc chắn muốn xóa bài viết này?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Hủy')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Xóa', style: TextStyle(color: Colors.red))),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      await ref.read(articleRepositoryProvider).deleteArticle(widget.article.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Đã xóa bài viết')));
        ref.invalidate(feedProvider);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
  }

  void _showActionSheet() {
    final user = ref.read(authStateProvider).value;
    final isAuthor = user?.id == widget.article.authorId;

    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Wrap(
          children: [
            if (isAuthor) ...[
              ListTile(
                leading: const Icon(Icons.edit_outlined),
                title: const Text('Chỉnh sửa'),
                onTap: () {
                  Navigator.pop(context);
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => CreateArticleScreen(editArticle: widget.article),
                    ),
                  );
                },
              ),
              ListTile(
                leading: const Icon(Icons.delete_outline, color: Colors.red),
                title: const Text('Xóa', style: TextStyle(color: Colors.red)),
                onTap: () {
                  Navigator.pop(context);
                  _handleDelete();
                },
              ),
            ],
            if (!isAuthor)
              ListTile(
                leading: const Icon(Icons.flag_outlined),
                title: const Text('Báo cáo'),
                onTap: () => Navigator.pop(context),
              ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ArticleDetailScreen(article: widget.article),
          ),
        );
      },
      child: Card(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(context),
              const SizedBox(height: 12),
              _buildContent(context),
              _buildMedia(context),
              const SizedBox(height: 16),
              const Divider(color: Color(0xFF1F2937), height: 1),
              const SizedBox(height: 12),
              ArticleActionsRow(article: widget.article),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    final displayName = _authorProfile?.displayName ?? widget.article.authorName ?? 'Người dùng Ẩn danh';
    final avatarUrl = _authorProfile?.avatarUrl ?? widget.article.authorAvatar ?? 'https://ui-avatars.com/api/?name=$displayName';
    final user = ref.read(authStateProvider).value;
    final isAuthor = user?.id == widget.article.authorId;

    return Row(
      children: [
        CircleAvatar(
          radius: 20,
          backgroundImage: CachedNetworkImageProvider(avatarUrl),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                displayName,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 16),
              ),
              Text(
                _relativeTime ?? 'Vừa xong',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 12, color: Colors.white54),
              ),
            ],
          ),
        ),
        if (!isAuthor && user != null)
          TextButton(
            onPressed: _toggleFollow,
            style: TextButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              minimumSize: const Size(0, 32),
              backgroundColor: _isFollowing ? Colors.transparent : Theme.of(context).colorScheme.primary.withValues(alpha: 0.1),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: BorderSide(
                  color: _isFollowing ? Colors.grey : Theme.of(context).colorScheme.primary,
                ),
              ),
            ),
            child: Text(
              _isFollowing ? 'Đang theo dõi' : 'Theo dõi',
              style: TextStyle(
                fontSize: 12,
                color: _isFollowing ? Colors.grey : Theme.of(context).colorScheme.primary,
              ),
            ),
          ),
        IconButton(
          icon: const Icon(LucideIcons.moreHorizontal, color: Colors.white70),
          onPressed: _showActionSheet,
        ),
      ],
    );
  }

  List<InlineSpan> _parseContent(String text) {
    final spans = <InlineSpan>[];
    final hashtagRegex = RegExp(r'#(\w+)');
    final style = Theme.of(context).textTheme.bodyLarge;

    int lastEnd = 0;
    final allMatches = hashtagRegex.allMatches(text).toList();

    for (final m in allMatches) {
      if (m.start > lastEnd) {
        spans.add(TextSpan(text: text.substring(lastEnd, m.start), style: style));
      }
      spans.add(TextSpan(
        text: m.group(0),
        style: style?.copyWith(color: Theme.of(context).colorScheme.primary, fontWeight: FontWeight.w600),
      ));
      lastEnd = m.end;
    }

    if (lastEnd < text.length) {
      spans.add(TextSpan(text: text.substring(lastEnd), style: style));
    }

    return spans;
  }

  Widget _buildContent(BuildContext context) {
    String text = widget.article.content.isNotEmpty ? widget.article.content : widget.article.summary;
    
    // Strip markdown media to prevent TextPainter errors and separate media
    final imageRegex = RegExp(r'!\[image\]\(([^)]+)\)');
    final videoRegex = RegExp(r'<video\s+src="([^"]+)"[^>]*><\/video>');
    text = text.replaceAll(imageRegex, '').replaceAll(videoRegex, '').trim();

    final spans = _parseContent(text);
    if (spans.isEmpty) return const SizedBox.shrink();
    
    return LayoutBuilder(builder: (context, size) {
      final span = TextSpan(children: spans);
      final tp = TextPainter(
        text: span,
        maxLines: 1,
        textDirection: TextDirection.ltr,
      );
      tp.layout(maxWidth: size.maxWidth);
      final isOverflowing = tp.didExceedMaxLines;

      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RichText(
            text: span,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          if (isOverflowing)
            GestureDetector(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => ArticleDetailScreen(article: widget.article),
                  ),
                );
              },
              child: Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text('...xem thêm', style: TextStyle(color: Theme.of(context).colorScheme.primary, fontWeight: FontWeight.bold)),
              ),
            ),
        ],
      );
    });
  }

  Widget _buildMedia(BuildContext context) {
    final List<String> allUrls = [];
    final rawText = widget.article.content.isNotEmpty ? widget.article.content : widget.article.summary;
    final imageRegex = RegExp(r'!\[image\]\(([^)]+)\)');
    final videoRegex = RegExp(r'<video\s+src="([^"]+)"[^>]*><\/video>');
    
    for (final m in imageRegex.allMatches(rawText)) {
      final url = m.group(1);
      if (url != null && !allUrls.contains(url)) allUrls.add(url);
    }
    for (final m in videoRegex.allMatches(rawText)) {
      final url = m.group(1);
      if (url != null && !allUrls.contains(url)) allUrls.add(url);
    }

    bool hasDbVideo = false;
    if (widget.article.mediaUrl != null && widget.article.mediaUrl!.isNotEmpty) {
      hasDbVideo = widget.article.mediaUrl!.endsWith('#video');
      final dbUrls = widget.article.mediaUrl!.replaceAll('#video', '').split(',');
      for (final u in dbUrls) {
        if (!allUrls.contains(u)) allUrls.add(u);
      }
    }

    if (allUrls.isEmpty) return const SizedBox.shrink();

    // Check if it's a video
    if (allUrls.length == 1 && (hasDbVideo || allUrls[0].endsWith('.mp4') || allUrls[0].contains('video'))) {
      return Padding(
        padding: const EdgeInsets.only(top: 12),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: VideoPlayerWidget(
            url: allUrls[0],
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => ReelsScreen(initialReelId: widget.article.id),
                ),
              );
            },
          ),
        ),
      );
    }

    // Single image fast path
    if (allUrls.length == 1) {
      return Padding(
        padding: const EdgeInsets.only(top: 12),
        child: GestureDetector(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => FullscreenImageViewer(imageUrls: allUrls, initialIndex: 0),
              ),
            );
          },
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: CachedNetworkImage(
              imageUrl: allUrls.first,
              width: double.infinity,
              fit: BoxFit.cover,
              placeholder: (context, url) => Container(
                height: 200,
                color: const Color(0xFF1F2937),
                child: const Center(child: CircularProgressIndicator()),
              ),
              errorWidget: (context, url, error) => Container(
                height: 200,
                color: const Color(0xFF1F2937),
                child: const Icon(Icons.broken_image, color: Colors.white30, size: 40),
              ),
            ),
          ),
        ),
      );
    }

    // Multiple images
    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: _buildMediaGallery(allUrls),
      ),
    );
  }

  Widget _buildMediaGallery(List<String> urls) {
    final count = urls.length;

    if (count == 2) {
      return SizedBox(
        height: 250,
        child: Row(
          children: List.generate(2, (i) => Expanded(
            child: Padding(
              padding: EdgeInsets.only(left: i == 1 ? 4.0 : 0),
              child: _buildMediaThumb(urls[i], () {
                Navigator.push(context, MaterialPageRoute(
                  builder: (context) => FullscreenImageViewer(imageUrls: urls, initialIndex: i),
                ));
              }),
            ),
          )),
        ),
      );
    }

    if (count == 3) {
      return SizedBox(
        height: 300,
        child: Row(
          children: [
            Expanded(flex: 2, child: _buildMediaThumb(urls[0], () {
              Navigator.push(context, MaterialPageRoute(
                builder: (context) => FullscreenImageViewer(imageUrls: urls, initialIndex: 0),
              ));
            })),
            const SizedBox(width: 4),
            Expanded(
              flex: 1,
              child: Column(
                children: [
                  Expanded(child: _buildMediaThumb(urls[1], () {
                    Navigator.push(context, MaterialPageRoute(
                      builder: (context) => FullscreenImageViewer(imageUrls: urls, initialIndex: 1),
                    ));
                  })),
                  const SizedBox(height: 4),
                  Expanded(child: _buildMediaThumb(urls[2], () {
                    Navigator.push(context, MaterialPageRoute(
                      builder: (context) => FullscreenImageViewer(imageUrls: urls, initialIndex: 2),
                    ));
                  })),
                ],
              ),
            ),
          ],
        ),
      );
    }

    if (count == 4) {
      return SizedBox(
        height: 350,
        child: Column(
          children: [
            Expanded(flex: 2, child: _buildMediaThumb(urls[0], () {
              Navigator.push(context, MaterialPageRoute(
                builder: (context) => FullscreenImageViewer(imageUrls: urls, initialIndex: 0),
              ));
            })),
            const SizedBox(height: 4),
            Expanded(
              flex: 1,
              child: Row(
                children: [
                  Expanded(child: _buildMediaThumb(urls[1], () {
                    Navigator.push(context, MaterialPageRoute(
                      builder: (context) => FullscreenImageViewer(imageUrls: urls, initialIndex: 1),
                    ));
                  })),
                  const SizedBox(width: 4),
                  Expanded(child: _buildMediaThumb(urls[2], () {
                    Navigator.push(context, MaterialPageRoute(
                      builder: (context) => FullscreenImageViewer(imageUrls: urls, initialIndex: 2),
                    ));
                  })),
                  const SizedBox(width: 4),
                  Expanded(child: _buildMediaThumb(urls[3], () {
                    Navigator.push(context, MaterialPageRoute(
                      builder: (context) => FullscreenImageViewer(imageUrls: urls, initialIndex: 3),
                    ));
                  })),
                ],
              ),
            ),
          ],
        ),
      );
    }

    if (count >= 5) {
      return SizedBox(
        height: 350,
        child: Column(
          children: [
            Expanded(
              flex: 1,
              child: Row(
                children: [
                  Expanded(child: _buildMediaThumb(urls[0], () {
                    Navigator.push(context, MaterialPageRoute(
                      builder: (context) => FullscreenImageViewer(imageUrls: urls, initialIndex: 0),
                    ));
                  })),
                  const SizedBox(width: 4),
                  Expanded(child: _buildMediaThumb(urls[1], () {
                    Navigator.push(context, MaterialPageRoute(
                      builder: (context) => FullscreenImageViewer(imageUrls: urls, initialIndex: 1),
                    ));
                  })),
                ],
              ),
            ),
            const SizedBox(height: 4),
            Expanded(
              flex: 1,
              child: Row(
                children: [
                  Expanded(child: _buildMediaThumb(urls[2], () {
                    Navigator.push(context, MaterialPageRoute(
                      builder: (context) => FullscreenImageViewer(imageUrls: urls, initialIndex: 2),
                    ));
                  })),
                  const SizedBox(width: 4),
                  Expanded(child: _buildMediaThumb(urls[3], () {
                    Navigator.push(context, MaterialPageRoute(
                      builder: (context) => FullscreenImageViewer(imageUrls: urls, initialIndex: 3),
                    ));
                  })),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        _buildMediaThumb(urls[4], () {
                          Navigator.push(context, MaterialPageRoute(
                            builder: (context) => FullscreenImageViewer(imageUrls: urls, initialIndex: 4),
                          ));
                        }),
                        if (count > 5)
                          GestureDetector(
                            onTap: () {
                              Navigator.push(context, MaterialPageRoute(
                                builder: (context) => FullscreenImageViewer(imageUrls: urls, initialIndex: 4),
                              ));
                            },
                            child: Container(
                              decoration: BoxDecoration(
                                color: Colors.black54,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Center(
                                child: Text('+${count - 5}', style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    return const SizedBox.shrink();
  }

  Widget _buildMediaThumb(String url, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: CachedNetworkImage(
          imageUrl: url,
          fit: BoxFit.cover,
          width: double.infinity,
          height: double.infinity,
          placeholder: (context, url) => Container(
            color: const Color(0xFF1F2937),
            child: const Center(child: CircularProgressIndicator()),
          ),
          errorWidget: (context, url, error) => Container(
            color: const Color(0xFF1F2937),
            child: const Icon(Icons.broken_image, color: Colors.white30),
          ),
        ),
      ),
    );
  }

}

