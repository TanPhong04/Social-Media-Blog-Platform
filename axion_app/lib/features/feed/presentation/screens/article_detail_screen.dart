import 'dart:io';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:image_picker/image_picker.dart';
import '../../domain/models/article_model.dart';
import '../../domain/models/comment_model.dart';
import '../../data/comment_repository.dart';
import '../../data/article_repository.dart';
import '../../../auth/domain/models/user_model.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../auth/data/auth_repository.dart';
import '../../../reels/presentation/screens/reels_screen.dart';
import '../widgets/ai_chat_bottom_sheet.dart';
import '../widgets/video_player_widget.dart';
import '../widgets/fullscreen_image_viewer.dart';
import '../../../../core/widgets/article_actions_row.dart';
import '../../../../core/utils/relative_time.dart';

class ArticleDetailScreen extends ConsumerStatefulWidget {
  final ArticleModel article;

  const ArticleDetailScreen({super.key, required this.article});

  @override
  ConsumerState<ArticleDetailScreen> createState() => _ArticleDetailScreenState();
}

class _ArticleDetailScreenState extends ConsumerState<ArticleDetailScreen> {
  final TextEditingController _commentController = TextEditingController();
  final FocusNode _commentFocusNode = FocusNode();
  File? _commentImage;
  bool _isUploadingCommentImage = false;
  CommentModel? _replyingTo;
  UserModel? _authorProfile;
  String? _relativeTime;
  final RelativeTimeUpdater _timeUpdater = RelativeTimeUpdater();
  final Map<String, UserModel> _commentAuthors = {};
  final Map<String, String> _commentRelativeTime = {};

  @override
  void initState() {
    super.initState();
    _loadAuthorProfile();
    _timeUpdater.start(widget.article.createdAt, (time) {
      if (mounted) setState(() => _relativeTime = formatFullTimestamp(widget.article.createdAt));
    });
  }

  @override
  void dispose() {
    _commentController.dispose();
    _commentFocusNode.dispose();
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

  Future<void> _loadCommentAuthor(String authorId) async {
    if (_commentAuthors.containsKey(authorId)) return;
    try {
      final repo = ref.read(authRepositoryProvider);
      final profile = await repo.getUserById(authorId);
      if (mounted) setState(() => _commentAuthors[authorId] = profile);
    } catch (_) {}
  }

  void _ensureCommentAuthors(List<CommentModel> comments) {
    for (final c in comments) {
      _loadCommentAuthor(c.authorId);
      if (c.parentId != null) {
        final parent = comments.where((p) => p.id == c.parentId).firstOrNull;
        if (parent != null) _loadCommentAuthor(parent.authorId);
      }
    }
  }

  Future<void> _pickCommentImage() async {
    try {
      final picker = ImagePicker();
      final pickedFile = await picker.pickImage(source: ImageSource.gallery);
      if (pickedFile != null) {
        final file = File(pickedFile.path);
        final size = await file.length();
        if (size > 10 * 1024 * 1024) { // 10MB limit
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 10MB.')));
          return;
        }
        setState(() {
          _commentImage = file;
        });
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Lỗi chọn ảnh: $e')));
    }
  }

  Future<void> _deleteComment(String commentId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Xóa bình luận'),
        content: const Text('Bạn có chắc chắn muốn xóa bình luận này?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Hủy')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Xóa', style: TextStyle(color: Colors.red))),
        ],
      )
    );

    if (confirm != true) return;

    try {
      await ref.read(commentRepositoryProvider).deleteComment(commentId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Đã xóa bình luận')));
        // ignore: unused_result
        ref.refresh(commentsProvider(widget.article.id));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
  }

  Future<void> _postComment() async {
    if (_isUploadingCommentImage) return;
    final text = _commentController.text.trim();
    if (text.isEmpty && _commentImage == null) return;

    setState(() {
      _isUploadingCommentImage = true;
    });

    try {
      String finalContent = text;
      
      if (_commentImage != null) {
        final mediaUrl = await ref.read(articleRepositoryProvider).uploadMedia(_commentImage!.path);
        finalContent += '\n\n![comment_image]($mediaUrl)';
      }

      await ref.read(commentRepositoryProvider).createComment(
        widget.article.id, 
        finalContent, 
        parentId: _replyingTo?.id,
      );
      
      _commentController.clear();
      setState(() {
        _commentImage = null;
        _replyingTo = null;
      });
      
      // ignore: unused_result
      ref.refresh(commentsProvider(widget.article.id));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      if (mounted) setState(() => _isUploadingCommentImage = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final commentsState = ref.watch(commentsProvider(widget.article.id));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Bài viết'),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.sparkles, color: Colors.purple),
            onPressed: () {
              showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                builder: (context) => AiChatBottomSheet(
                  articleId: widget.article.id,
                  articleTitle: widget.article.title,
                ),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async {
                // ignore: unused_result
                ref.refresh(commentsProvider(widget.article.id));
              },
              child: ListView(
                padding: const EdgeInsets.all(16.0),
                children: [
                  _buildHeader(context),
                const SizedBox(height: 16),
                _buildContent(context),
                _buildMedia(context),
                if (widget.article.tags.isNotEmpty) ...[
                  const SizedBox(height: 24),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: widget.article.tags.map((tag) => Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.surface,
                        border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Text('#$tag', style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant)),
                    )).toList(),
                  ),
                ],
                const SizedBox(height: 24),
                const Divider(),
                const SizedBox(height: 8),
                ArticleActionsRow(
                  article: widget.article,
                  commentCount: commentsState.value?.length,
                ),
                const SizedBox(height: 16),
                const Divider(),
                const Text('Bình luận', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                commentsState.when(
                  data: (comments) {
                    _ensureCommentAuthors(comments);
                    if (comments.isEmpty) return const Text('Chưa có bình luận nào.');
                    final rootComments = comments.where((c) => c.parentId == null).toList();
                    return Column(
                      children: rootComments.map((c) => _buildCommentThread(c, comments, 0)).toList(),
                    );
                  },
                  loading: () => const Center(child: CircularProgressIndicator()),
                  error: (e, _) => Text('Lỗi: $e'),
                ),
              ],
            ),
          )),
          _buildCommentInput(),
        ],
      ),
    );
  }

  Widget _buildCommentThread(CommentModel comment, List<CommentModel> allComments, int depth) {
    final author = _commentAuthors[comment.authorId];
    final displayName = author?.displayName ?? comment.authorName ?? 'Người dùng';
    final avatarUrl = author?.avatarUrl ?? comment.authorAvatar ?? 'https://ui-avatars.com/api/?name=$displayName';

    String displayContent = comment.content;
    String? imageUrl;
    
    final match = RegExp(r'!\[.*?\]\((.*?)\)').firstMatch(comment.content);
    if (match != null) {
      imageUrl = match.group(1);
      displayContent = comment.content.replaceAll(match.group(0)!, '').trim();
    }
    
    final replies = allComments.where((c) => c.parentId == comment.id).toList();
    final currentUser = ref.read(authStateProvider).value;
    final isOwnComment = currentUser?.id == comment.authorId;
    final relTime = _commentRelativeTime.putIfAbsent(comment.id, () => computeRelativeTime(comment.createdAt));

    return Padding(
      padding: EdgeInsets.only(left: depth == 0 ? 0 : 44.0, top: 12, bottom: 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CircleAvatar(
                radius: 16,
                backgroundImage: CachedNetworkImageProvider(avatarUrl),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: GestureDetector(
                  onLongPress: isOwnComment ? () => _deleteComment(comment.id) : null,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
                          borderRadius: BorderRadius.circular(18),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              displayName,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                            if (displayContent.isNotEmpty) ...[
                              const SizedBox(height: 2),
                              Text(displayContent, style: const TextStyle(fontSize: 14)),
                            ],
                          ],
                        ),
                      ),
                      if (imageUrl != null) ...[
                        const SizedBox(height: 6),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: CachedNetworkImage(imageUrl: imageUrl, height: 160, fit: BoxFit.cover),
                        ),
                      ],
                      const SizedBox(height: 4),
                      Padding(
                        padding: const EdgeInsets.only(left: 12),
                        child: Row(
                          children: [
                            Text(
                              relTime,
                              style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
                            ),
                            const SizedBox(width: 16),
                            GestureDetector(
                              onTap: () {
                                setState(() {
                                  _replyingTo = comment;
                                });
                                _commentFocusNode.requestFocus();
                              },
                              child: Text(
                                'Phản hồi',
                                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey.shade400),
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
          ),
          if (replies.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Column(
                children: replies.map((r) => _buildCommentThread(r, allComments, depth + 1)).toList(),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    final displayName = _authorProfile?.displayName ?? widget.article.authorName ?? 'Người dùng';
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
          _buildFollowButton(context, user.id),
      ],
    );
  }

  Widget _buildFollowButton(BuildContext context, String currentUserId) {
    return _buildFollowButtonFromState(context);
  }

  Widget _buildFollowButtonFromState(BuildContext context) {
    return TextButton(
      onPressed: () {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Sử dụng Follow trên feed.')));
      },
      child: const Text('Theo dõi'),
    );
  }

  List<InlineSpan> _parseContent(String text) {
    final spans = <InlineSpan>[];
    final hashtagRegex = RegExp(r'#(\w+)');
    final style = Theme.of(context).textTheme.bodyLarge?.copyWith(height: 1.5);

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
    final imageRegex = RegExp(r'!\[image\]\(([^)]+)\)');
    final videoRegex = RegExp(r'<video\s+src="([^"]+)"[^>]*><\/video>');
    text = text.replaceAll(imageRegex, '').replaceAll(videoRegex, '').trim();

    final spans = _parseContent(text);
    if (spans.isEmpty) return const SizedBox.shrink();
    return RichText(
      text: TextSpan(children: spans),
    );
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

    if (allUrls.length == 1 && (hasDbVideo || allUrls[0].endsWith('.mp4') || allUrls[0].contains('video'))) {
      return Padding(
        padding: const EdgeInsets.only(top: 16),
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

    if (allUrls.length == 1) {
      return Padding(
        padding: const EdgeInsets.only(top: 16),
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
            ),
          ),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: _buildMediaGallery(allUrls),
    );
  }

  Widget _buildMediaGallery(List<String> urls) {
    final count = urls.length;

    if (count == 2) {
      return SizedBox(
        height: 200,
        child: Row(
          children: List.generate(2, (i) => Expanded(
            child: Padding(
              padding: EdgeInsets.only(left: i == 1 ? 4.0 : 0),
              child: _mediaThumb(urls[i], i, urls),
            ),
          )),
        ),
      );
    }

    if (count == 3) {
      return SizedBox(
        height: 200,
        child: Row(
          children: [
            Expanded(flex: 1, child: _mediaThumb(urls[0], 0, urls)),
            const SizedBox(width: 4),
            Expanded(
              flex: 1,
              child: Column(
                children: [
                  Expanded(child: _mediaThumb(urls[1], 1, urls)),
                  const SizedBox(height: 4),
                  Expanded(child: _mediaThumb(urls[2], 2, urls)),
                ],
              ),
            ),
          ],
        ),
      );
    }

    if (count >= 4) {
      final displayCount = count > 4 ? 4 : count;
      return SizedBox(
        height: 200,
        child: GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 4,
            mainAxisSpacing: 4,
            childAspectRatio: 1,
          ),
          itemCount: displayCount,
          itemBuilder: (context, index) {
            if (index == 3 && count > 4) {
              return Stack(
                children: [
                  _mediaThumb(urls[3], 3, urls),
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.black54,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Center(
                      child: Text('+${count - 4}', style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              );
            }
            return _mediaThumb(urls[index], index, urls);
          },
        ),
      );
    }

    return const SizedBox.shrink();
  }

  Widget _mediaThumb(String url, int index, List<String> allUrls) {
    return GestureDetector(
      onTap: () {
        Navigator.push(context, MaterialPageRoute(
          builder: (context) => FullscreenImageViewer(imageUrls: allUrls, initialIndex: index),
        ));
      },
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: CachedNetworkImage(
          imageUrl: url,
          fit: BoxFit.cover,
          width: double.infinity,
          height: double.infinity,
        ),
      ),
    );
  }

  Widget _buildCommentInput() {
    return SafeArea(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          border: Border(top: BorderSide(color: Colors.grey.shade900)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (_replyingTo != null)
              Container(
                margin: const EdgeInsets.only(bottom: 8, left: 40),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.grey.shade900,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Đang trả lời ${_replyingTo!.authorName ?? 'Người dùng'}',
                      style: TextStyle(fontSize: 12, color: Colors.grey.shade400),
                    ),
                    const SizedBox(width: 8),
                    GestureDetector(
                      onTap: () {
                        setState(() => _replyingTo = null);
                      },
                      child: const Icon(Icons.close, size: 14, color: Colors.white),
                    ),
                  ],
                ),
              ),
            if (_commentImage != null)
              Stack(
                children: [
                  Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    height: 80,
                    width: 80,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(8),
                      image: DecorationImage(image: FileImage(_commentImage!), fit: BoxFit.cover),
                    ),
                  ),
                  Positioned(
                    right: 0,
                    top: 0,
                    child: CircleAvatar(
                      radius: 12,
                      backgroundColor: Colors.black54,
                      child: IconButton(
                        padding: EdgeInsets.zero,
                        icon: const Icon(Icons.close, size: 14, color: Colors.white),
                        onPressed: () => setState(() => _commentImage = null),
                      ),
                    ),
                  ),
                ],
              ),
            Row(
              children: [
                IconButton(
                  icon: const Icon(LucideIcons.image, color: Colors.white70),
                  onPressed: _pickCommentImage,
                ),
                Expanded(
                  child: TextField(
                    controller: _commentController,
                    focusNode: _commentFocusNode,
                    decoration: InputDecoration(
                      hintText: _replyingTo != null ? 'Viết phản hồi...' : 'Viết bình luận...',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
                      filled: true,
                      fillColor: Colors.black26,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                _isUploadingCommentImage
                    ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2))
                    : IconButton(
                        icon: Icon(Icons.send, color: Theme.of(context).colorScheme.primary),
                        onPressed: _postComment,
                      ),
              ],
            ),
          ],
        ),
      ),
    );
}
}
