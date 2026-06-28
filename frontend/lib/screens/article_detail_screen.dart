import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/article.dart';
import '../services/article_service.dart';
import '../widgets/like_button.dart';
import '../widgets/follow_button.dart';
import '../widgets/comment_section.dart';

class ArticleDetailScreen extends StatefulWidget {
  final String slug;
  const ArticleDetailScreen({Key? key, required this.slug}) : super(key: key);

  @override
  _ArticleDetailScreenState createState() => _ArticleDetailScreenState();
}

class _ArticleDetailScreenState extends State<ArticleDetailScreen> {
  Article? _article;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadArticle();
  }

  Future<void> _loadArticle() async {
    try {
      final service = context.read<ArticleService>();
      final article = await service.getArticleBySlug(widget.slug);
      if (mounted) {
        setState(() {
          _article = article;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Failed to load article.';
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    if (_error != null || _article == null) {
      return Scaffold(
        appBar: AppBar(),
        body: Center(child: Text(_error ?? 'Article not found')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(_article!.title),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(_article!.title, style: Theme.of(context).textTheme.displayLarge?.copyWith(fontSize: 32)),
            const SizedBox(height: 16),
            if (_article!.authorId != null) ...[
              Row(
                children: [
                  const CircleAvatar(child: Icon(Icons.person)),
                  const SizedBox(width: 12),
                  const Expanded(child: Text('Author Name')),
                  FollowButton(targetId: _article!.authorId!),
                ],
              ),
              const SizedBox(height: 24),
            ],
            if (_article!.summary != null) ...[
              Text(_article!.summary!, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontStyle: FontStyle.italic)),
              const SizedBox(height: 24),
            ],
            Text(_article!.content ?? '', style: Theme.of(context).textTheme.bodyLarge?.copyWith(height: 1.6)),
            const SizedBox(height: 32),
            Row(
              children: [
                LikeButton(targetType: 'ARTICLE', targetId: _article!.id),
              ],
            ),
            const SizedBox(height: 24),
            CommentSection(articleId: _article!.id),
          ],
        ),
      ),
    );
  }
}
