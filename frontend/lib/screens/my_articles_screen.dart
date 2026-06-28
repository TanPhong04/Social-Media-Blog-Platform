import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../providers/article_provider.dart';
import '../services/article_service.dart' as import_service;
import '../providers/article_provider.dart';

class MyArticlesScreen extends StatefulWidget {
  const MyArticlesScreen({Key? key}) : super(key: key);

  @override
  _MyArticlesScreenState createState() => _MyArticlesScreenState();
}

class _MyArticlesScreenState extends State<MyArticlesScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ArticleProvider>().loadMyArticles();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ArticleProvider>();
    final articles = provider.myArticlesPage?.content;

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Articles'),
      ),
      body: (provider.isLoading && articles == null)
          ? const Center(child: CircularProgressIndicator())
          : (articles == null || articles.isEmpty)
              ? const Center(child: Text('You have no articles yet.'))
              : RefreshIndicator(
                  onRefresh: () => context.read<ArticleProvider>().loadMyArticles(),
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: articles.length,
                    itemBuilder: (context, index) {
                      final article = articles[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 16),
                        child: ListTile(
                          title: Text(article.title),
                          subtitle: Text('Status: ${article.status}'),
                          trailing: PopupMenuButton<String>(
                            onSelected: (value) async {
                              final service = context.read<ArticleProvider>();
                              final api = context.read<import_service.ArticleService>();
                              if (value == 'publish') {
                                await api.publishArticle(article.id);
                              } else if (value == 'unpublish') {
                                await api.unpublishArticle(article.id);
                              } else if (value == 'delete') {
                                await api.deleteArticle(article.id);
                              }
                              service.loadMyArticles();
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
