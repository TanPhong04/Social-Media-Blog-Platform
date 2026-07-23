import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../feed/data/article_repository.dart';
import '../../../feed/presentation/widgets/article_card_widget.dart';
import '../../../feed/domain/models/article_model.dart';
import '../../../../core/widgets/error_view.dart';

final myArticlesProvider = FutureProvider<List<ArticleModel>>((ref) async {
  return ref.read(articleRepositoryProvider).getMyArticles();
});

class MyArticlesScreen extends ConsumerWidget {
  const MyArticlesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final articlesState = ref.watch(myArticlesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Bài viết của tôi')),
      body: articlesState.when(
        data: (articles) {
          if (articles.isEmpty) {
            return const Center(child: Text('Bạn chưa có bài viết nào.'));
          }
          return RefreshIndicator(
            onRefresh: () => ref.refresh(myArticlesProvider.future),
            child: ListView.builder(
              itemCount: articles.length,
              itemBuilder: (context, index) {
                return ArticleCardWidget(article: articles[index]);
              },
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => ErrorView(
          error: error.toString(),
          onRetry: () => ref.refresh(myArticlesProvider),
        ),
      ),
    );
  }
}
