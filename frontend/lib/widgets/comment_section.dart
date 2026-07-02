import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/comment.dart';
import '../services/comment_service.dart';
import 'like_button.dart';

class CommentSection extends StatefulWidget {
  final String articleId;
  const CommentSection({super.key, required this.articleId});

  @override
  State<CommentSection> createState() => _CommentSectionState();
}

class _CommentSectionState extends State<CommentSection> {
  final List<Comment> _comments = [];
  bool _isLoading = false;
  bool _hasMore = true;
  int _currentPage = 0;
  final _controller = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadMore();
  }

  Future<void> _loadMore() async {
    if (_isLoading || !_hasMore) return;
    setState(() => _isLoading = true);

    try {
      final service = context.read<CommentService>();
      final page = await service.getComments(widget.articleId, page: _currentPage);
      if (mounted) {
        setState(() {
          _comments.addAll(page.content);
          _currentPage++;
          _hasMore = !page.last;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _postComment() async {
    if (_controller.text.trim().isEmpty) return;
    final service = context.read<CommentService>();
    try {
      final newComment = await service.createComment(widget.articleId, _controller.text.trim());
      _controller.clear();
      setState(() {
        _comments.insert(0, newComment);
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to post comment')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Divider(),
        Text('Comments', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _controller,
                decoration: const InputDecoration(hintText: 'Add a comment...'),
              ),
            ),
            const SizedBox(width: 8),
            IconButton(
              icon: const Icon(Icons.send),
              onPressed: _postComment,
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (_comments.isEmpty && _isLoading)
          const Center(child: CircularProgressIndicator())
        else if (_comments.isEmpty)
          const Text('No comments yet. Be the first!')
        else
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _comments.length + (_hasMore ? 1 : 0),
            itemBuilder: (context, index) {
              if (index == _comments.length) {
                return TextButton(
                  onPressed: _loadMore,
                  child: _isLoading ? const CircularProgressIndicator() : const Text('Load More Comments'),
                );
              }
              final comment = _comments[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: Padding(
                  padding: const EdgeInsets.all(12.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(comment.content, style: Theme.of(context).textTheme.bodyLarge),
                      const SizedBox(height: 8),
                      LikeButton(targetType: 'COMMENT', targetId: comment.id),
                    ],
                  ),
                ),
              );
            },
          ),
      ],
    );
  }
}
