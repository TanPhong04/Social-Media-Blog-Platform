import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../providers/article_provider.dart';
import '../services/article_service.dart' as import_service;

class MyArticlesScreen extends StatefulWidget {
  const MyArticlesScreen({Key? key}) : super(key: key);

  @override
  _MyArticlesScreenState createState() => _MyArticlesScreenState();
}

class _MyArticlesScreenState extends State<MyArticlesScreen> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(() {
      if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
        context.read<ArticleProvider>().loadMoreMyArticles();
      }
    });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<ArticleProvider>();
      if (provider.myArticles.items.isEmpty) provider.loadMoreMyArticles();
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ArticleProvider>();
    final articles = provider.myArticles.items;
    final isLoading = provider.isMyArticlesLoading;
    final hasMore = provider.myArticles.hasMore;

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Articles'),
      ),
      body: (isLoading && articles.isEmpty)
          ? const Center(child: CircularProgressIndicator())
          : articles.isEmpty
              ? RefreshIndicator(
                  onRefresh: () => provider.refreshMyArticles(),
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: Container(
                      height: MediaQuery.of(context).size.height * 0.6,
                      alignment: Alignment.center,
                      child: const Text('You have no articles yet.'),
                    ),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: () => provider.refreshMyArticles(),
                  child: ListView.builder(
                    controller: _scrollController,
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
                        child: ListTile(
                          title: Text(article.title),
                          subtitle: Text('Status: ${article.status}'),
                          trailing: PopupMenuButton<String>(
                            onSelected: (value) async {
                              final api = context.read<import_service.ArticleService>();
                              try {
                                if (value == 'publish') {
                                  await api.publishArticle(article.id);
                                } else if (value == 'unpublish') {
                                  await api.unpublishArticle(article.id);
                                } else if (value == 'delete') {
                                  await api.deleteArticle(article.id);
                                }
                                provider.refreshMyArticles();
                              } catch (e) {
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text('Failed to update article')),
                                  );
                                }
                              }
                            },
                            itemBuilder: (context) => [
                              if (article.status == 'DRAFT' || article.status == 'UNPUBLISHED')
                                const PopupMenuItem(value: 'publish', child: Text('Publish')),
                              if (article.status == 'PUBLISHED')
                                const PopupMenuItem(value: 'unpublish', child: Text('Unpublish')),
                              const PopupMenuItem(value: 'delete', child: Text('Delete', style: TextStyle(color: Colors.red))),
                            ],
                          ),
                          onTap: () {
                            if (article.slug != null) {
                              context.push('/article/${article.slug}');
                            }
                          },
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
