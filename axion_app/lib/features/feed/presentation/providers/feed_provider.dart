import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/models/article_model.dart';
import '../../data/article_repository.dart';
import '../../utils/feed_mixer.dart';

final feedProvider = AsyncNotifierProvider<FeedNotifier, List<ArticleModel>>(() {
  return FeedNotifier();
});

class FeedNotifier extends AsyncNotifier<List<ArticleModel>> {
  int _currentPage = 0;
  bool _hasMore = true;

  bool isFollowingFeed = false;

  @override
  FutureOr<List<ArticleModel>> build() async {
    _currentPage = 0;
    _hasMore = true;
    return _fetchPage(0);
  }

  void switchFeedType(bool following) {
    if (isFollowingFeed == following) return;
    isFollowingFeed = following;
    refresh();
  }

  Future<List<ArticleModel>> _fetchPage(int page) async {
    final repository = ref.read(articleRepositoryProvider);
    final articles = isFollowingFeed 
        ? await repository.getFollowingFeed(page: page, size: 10)
        : await repository.getFeed(page: page, size: 10);
    
    if (articles.isEmpty || articles.length < 10) {
      _hasMore = false;
    }
    
    return mixFeed(articles, minPostsBetweenReels: 2);
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      _currentPage = 0;
      _hasMore = true;
      return _fetchPage(0);
    });
  }

  Future<void> loadMore() async {
    if (state.isLoading || state.isRefreshing || state.isReloading || !_hasMore) return;

    final currentArticles = state.value ?? [];
    
    try {
      _currentPage++;
      final newArticles = await _fetchPage(_currentPage);
      
      state = AsyncValue.data([...currentArticles, ...newArticles]);
    } catch (e) {
      // Revert page if failed
      _currentPage--;
      state = AsyncValue.data(currentArticles);
    }
  }
}
