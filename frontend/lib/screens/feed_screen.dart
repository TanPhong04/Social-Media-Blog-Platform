import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../providers/article_provider.dart';

class FeedScreen extends StatefulWidget {
  const FeedScreen({Key? key}) : super(key: key);

  @override
  _FeedScreenState createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ArticleProvider>().loadFeed();
      context.read<ArticleProvider>().loadFollowing();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ArticleProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Social Blog'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Explore'),
            Tab(text: 'Following'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildList(provider.feedPage?.content, provider.isLoading),
          _buildList(provider.followingPage?.content, provider.isLoading),
        ],
      ),
    );
  }

  Widget _buildList(List<dynamic>? articles, bool isLoading) {
    if (isLoading && articles == null) {
      return const Center(child: CircularProgressIndicator());
    }
    if (articles == null || articles.isEmpty) {
      return const Center(child: Text('No articles found.'));
    }

    return RefreshIndicator(
      onRefresh: () async {
        if (_tabController.index == 0) {
          await context.read<ArticleProvider>().loadFeed();
        } else {
          await context.read<ArticleProvider>().loadFollowing();
        }
      },
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: articles.length,
        itemBuilder: (context, index) {
          final article = articles[index];
          return Card(
            margin: const EdgeInsets.only(bottom: 16),
            child: InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: () {
                if (article.slug != null) {
                  context.push('/article/${article.slug}');
                }
              },
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(article.title, style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 8),
                    if (article.summary != null)
                      Text(article.summary!, style: Theme.of(context).textTheme.bodyMedium),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
