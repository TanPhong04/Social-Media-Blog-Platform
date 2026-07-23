import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:share_plus/share_plus.dart';
import '../../features/feed/domain/models/article_model.dart';
import '../../features/feed/data/article_repository.dart';
import '../../features/feed/data/comment_repository.dart';
import '../../features/auth/presentation/providers/auth_provider.dart';
import '../../features/feed/presentation/widgets/ai_chat_bottom_sheet.dart';

class ArticleActionsRow extends ConsumerStatefulWidget {
  final ArticleModel article;
  final int? commentCount;

  const ArticleActionsRow({
    super.key,
    required this.article,
    this.commentCount,
  });

  @override
  ConsumerState<ArticleActionsRow> createState() => _ArticleActionsRowState();
}

class _ArticleActionsRowState extends ConsumerState<ArticleActionsRow> {
  bool _isLiked = false;
  bool _isBookmarked = false;
  bool _isReposted = false;
  int _likeCount = 0;
  int _repostCount = 0;
  String? _myReaction;
  bool _isLoadingInteraction = true;
  bool _isPostingRepost = false;

  static const _reactions = [
    ('LIKE', '\u{1F44D}'),
    ('LOVE', '\u{2764}\u{FE0F}'),
    ('HAHA', '\u{1F602}'),
    ('SAD', '\u{1F622}'),
    ('ANGRY', '\u{1F621}'),
  ];

  @override
  void initState() {
    super.initState();
    _loadInteraction();
    _checkBookmark();
    _checkRepost();
  }

  Future<void> _loadInteraction() async {
    try {
      final repo = ref.read(articleRepositoryProvider);
      final interaction = await repo.getArticleInteraction(widget.article.id);

      final commentRepo = ref.read(commentRepositoryProvider);
      int rCount = 0;
      try {
        final comments = await commentRepo.getComments(widget.article.id);
        rCount = comments.where((c) => c.content.contains('[repost]')).length;
      } catch (_) {}

      if (mounted) {
        setState(() {
          _likeCount = interaction['count'] ?? 0;
          _repostCount = rCount;
          _isLiked = interaction['likedByCurrentUser'] == true;
          _myReaction = interaction['reactionType'] as String? ??
              (interaction['userInteraction'] != null ? interaction['userInteraction']['reactionType'] as String? : null) ??
              (_isLiked ? 'LIKE' : null);
          _isLoadingInteraction = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoadingInteraction = false);
    }
  }

  Future<void> _checkBookmark() async {
    final user = ref.read(authStateProvider).value;
    if (user == null) return;
    final prefs = await SharedPreferences.getInstance();
    final str = prefs.getString('bookmarks_${user.id}') ?? '[]';
    final List<dynamic> list = jsonDecode(str);
    if (list.any((a) => a['id'] == widget.article.id)) {
      if (mounted) setState(() => _isBookmarked = true);
    }
  }

  Future<void> _checkRepost() async {
    final user = ref.read(authStateProvider).value;
    if (user == null) return;
    final prefs = await SharedPreferences.getInstance();
    final str = prefs.getString('reposts_${user.id}') ?? '[]';
    final List<dynamic> list = jsonDecode(str);
    if (list.any((a) => a['id'] == widget.article.id)) {
      if (mounted) setState(() => _isReposted = true);
    }
  }

  Future<void> _toggleBookmark() async {
    final user = ref.read(authStateProvider).value;
    if (user == null) {
      _showSnackBar('Vui lòng đăng nhập');
      return;
    }
    final prefs = await SharedPreferences.getInstance();
    final key = 'bookmarks_${user.id}';
    final str = prefs.getString(key) ?? '[]';
    final List<dynamic> list = jsonDecode(str);

    if (_isBookmarked) {
      list.removeWhere((a) => a['id'] == widget.article.id);
    } else {
      list.add(widget.article.toJson());
    }

    await prefs.setString(key, jsonEncode(list));
    if (mounted) setState(() => _isBookmarked = !_isBookmarked);
  }

  Future<void> _toggleLike(String reactionType) async {
    final user = ref.read(authStateProvider).value;
    if (user == null) {
      _showSnackBar('Vui lòng đăng nhập');
      return;
    }
    final repo = ref.read(articleRepositoryProvider);

    if (_isLiked && _myReaction == reactionType) {
      setState(() {
        _isLiked = false;
        _likeCount -= 1;
        _myReaction = null;
      });
      try {
        await repo.unlikeArticle(widget.article.id);
      } catch (e) {
        if (mounted) {
          setState(() {
            _isLiked = true;
            _likeCount += 1;
            _myReaction = reactionType;
          });
        }
      }
    } else {
      final wasLiked = _isLiked;
      final prevReaction = _myReaction;
      setState(() {
        _isLiked = true;
        if (!wasLiked) _likeCount += 1;
        _myReaction = reactionType;
      });
      try {
        await repo.likeArticle(widget.article.id, reaction: reactionType);
      } catch (e) {
        if (mounted) {
          setState(() {
            _isLiked = wasLiked;
            _myReaction = prevReaction;
            if (!wasLiked) _likeCount -= 1;
          });
          _showSnackBar(e.toString());
        }
      }
    }
  }

  Future<void> _toggleRepost() async {
    if (_isPostingRepost) return;
    final user = ref.read(authStateProvider).value;
    if (user == null) {
      _showSnackBar('Vui lòng đăng nhập');
      return;
    }
    if (user.id == widget.article.authorId) return;

    _isPostingRepost = true;
    final prefs = await SharedPreferences.getInstance();
    final key = 'reposts_${user.id}';
    final str = prefs.getString(key) ?? '[]';
    final List<dynamic> list = jsonDecode(str);

    if (mounted) {
      setState(() {
        _isReposted = !_isReposted;
        _repostCount += _isReposted ? 1 : -1;
      });
    }

    if (_isReposted) {
      list.add(widget.article.toJson());
    } else {
      list.removeWhere((a) => a['id'] == widget.article.id);
    }
    await prefs.setString(key, jsonEncode(list));
    _isPostingRepost = false;
  }

  void _showReactionPickerOverlay(BuildContext context) {
    showDialog(
      context: context,
      barrierColor: Colors.black12,
      builder: (context) {
        return Center(
          child: Material(
            color: Colors.transparent,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(32),
                boxShadow: const [BoxShadow(color: Colors.black38, blurRadius: 10, offset: Offset(0, 4))],
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: _reactions.map((r) => GestureDetector(
                  onTap: () {
                    Navigator.pop(context);
                    _toggleLike(r.$1);
                  },
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    child: Text(r.$2, style: const TextStyle(fontSize: 32)),
                  ),
                )).toList(),
              ),
            ),
          ),
        );
      },
    );
  }

  String _reactionEmoji(String? type) {
    for (final r in _reactions) {
      if (r.$1 == type) return r.$2;
    }
    return '';
  }

  void _showSnackBar(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  Widget _buildLikeButton() {
    final primary = Theme.of(context).colorScheme.primary;
    final Color btnColor;
    final Widget iconWidget;
    if (_isLiked && _myReaction != null && _myReaction != 'LIKE') {
      btnColor = primary;
      iconWidget = Text(_reactionEmoji(_myReaction), style: const TextStyle(fontSize: 18));
    } else {
      btnColor = _isLiked ? primary : Colors.white70;
      iconWidget = Icon(LucideIcons.thumbsUp, color: btnColor, size: 20);
    }
    return SizedBox(
      height: 32,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              color: _isLiked ? primary.withValues(alpha: 0.1) : Colors.transparent,
            ),
            child: Center(child: iconWidget),
          ),
          const SizedBox(width: 4),
          Text(_likeCount.toString(), style: TextStyle(fontSize: 13, color: btnColor)),
        ],
      ),
    );
  }

  Widget _buildActionButton(Widget icon, VoidCallback? onTap, {Color color = Colors.white70, int? count}) {
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      child: GestureDetector(
        onTap: onTap,
        child: SizedBox(
          height: 32,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  color: Colors.transparent,
                ),
                child: Center(child: icon),
              ),
              if (count != null) ...[
                const SizedBox(width: 4),
                Text(count.toString(), style: TextStyle(fontSize: 13, color: color)),
              ],
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoadingInteraction) {
      return const Center(child: SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2)));
    }

    final primary = Theme.of(context).colorScheme.primary;
    final authorName = widget.article.authorName ?? 'Người dùng';

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        GestureDetector(
          onTap: () => _toggleLike('LIKE'),
          onLongPress: () => _showReactionPickerOverlay(context),
          child: _buildLikeButton(),
        ),
        _buildActionButton(
          Icon(LucideIcons.messageCircle, size: 20, color: Colors.white70),
          null,
          count: widget.commentCount,
        ),
        _buildActionButton(
          Icon(LucideIcons.repeat, size: 20, color: _isReposted ? Colors.green : Colors.white70),
          _toggleRepost,
          color: _isReposted ? Colors.green : Colors.white70,
          count: _repostCount,
        ),
        _buildActionButton(
          Icon(LucideIcons.bookmark, color: _isBookmarked ? primary : Colors.white70, size: 20),
          _toggleBookmark,
          color: _isBookmarked ? primary : Colors.white70,
        ),
        _buildActionButton(
          Icon(LucideIcons.share2, size: 20, color: Colors.white70),
          () {
            SharePlus.instance.share(ShareParams(
              text: 'Đọc bài viết "${widget.article.title}" của $authorName trên Axion:\nhttps://axion.app/article/${widget.article.slug}',
            ));
          },
        ),
        _buildActionButton(
          const Icon(LucideIcons.sparkles, color: Colors.blueAccent, size: 18),
          () {
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
          color: Colors.blueAccent,
        ),
      ],
    );
  }
}
