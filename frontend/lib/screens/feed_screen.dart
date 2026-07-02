import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../providers/article_provider.dart';
import '../models/article.dart';

class FeedScreen extends StatefulWidget {
  const FeedScreen({super.key});

  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final ScrollController _feedScrollController = ScrollController();
  final ScrollController _followingScrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);

    _feedScrollController.addListener(() {
      if (_feedScrollController.position.pixels >= _feedScrollController.position.maxScrollExtent - 200) {
        context.read<ArticleProvider>().loadMoreFeed();
      }
    });

    _followingScrollController.addListener(() {
      if (_followingScrollController.position.pixels >= _followingScrollController.position.maxScrollExtent - 200) {
        context.read<ArticleProvider>().loadMoreFollowing();
      }
    });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<ArticleProvider>();
      if (provider.feed.items.isEmpty) provider.loadMoreFeed();
      if (provider.following.items.isEmpty) provider.loadMoreFollowing();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _feedScrollController.dispose();
    _followingScrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ArticleProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Social Blog'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () => context.push('/notifications'),
          ),
        ],
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
          _buildList(
            provider.feed.items,
            provider.isFeedLoading,
            provider.feed.hasMore,
            () => provider.refreshFeed(),
            _feedScrollController,
          ),
          _buildList(
            provider.following.items,
            provider.isFollowingLoading,
            provider.following.hasMore,
            () => provider.refreshFollowing(),
            _followingScrollController,
          ),
        ],
      ),
    );
  }

  Widget _buildList(
    List<Article> articles,
    bool isLoading,
    bool hasMore,
    Future<void> Function() onRefresh,
    ScrollController scrollController,
  ) {
    if (isLoading && articles.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }
    if (articles.isEmpty) {
      return RefreshIndicator(
        onRefresh: onRefresh,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Container(
            height: MediaQuery.of(context).size.height * 0.6,
            alignment: Alignment.center,
            child: const Text('No articles found.'),
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView.builder(
        controller: scrollController,
        padding: const EdgeInsets.all(16),
        itemCount: articles.length + (hasMore ? 1 : 0),
        itemBuilder: (context, index) {
          if (index == articles.length) {
            return const Padding(
              padding: EdgeInsets.symmetric(vertical: 16),
              child: Center(child: CircularProgressIndicator()),
            );
          }

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
