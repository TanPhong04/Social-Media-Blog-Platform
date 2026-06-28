import 'package:flutter/foundation.dart';
import '../models/article.dart';
import '../services/article_service.dart';

class PaginatedList<T> {
  final List<T> items;
  final int currentPage;
  final bool hasMore;

  PaginatedList({
    required this.items,
    required this.currentPage,
    required this.hasMore,
  });

  PaginatedList<T> copyWith({List<T>? items, int? currentPage, bool? hasMore}) {
    return PaginatedList<T>(
      items: items ?? this.items,
      currentPage: currentPage ?? this.currentPage,
      hasMore: hasMore ?? this.hasMore,
    );
  }
}

class ArticleProvider with ChangeNotifier {
  final ArticleService _articleService;

  ArticleProvider(this._articleService);

  bool _isFeedLoading = false;
  bool get isFeedLoading => _isFeedLoading;

  bool _isFollowingLoading = false;
  bool get isFollowingLoading => _isFollowingLoading;

  bool _isMyArticlesLoading = false;
  bool get isMyArticlesLoading => _isMyArticlesLoading;

  PaginatedList<Article> _feed = PaginatedList(items: [], currentPage: 0, hasMore: true);
  PaginatedList<Article> get feed => _feed;

  PaginatedList<Article> _following = PaginatedList(items: [], currentPage: 0, hasMore: true);
  PaginatedList<Article> get following => _following;

  PaginatedList<Article> _myArticles = PaginatedList(items: [], currentPage: 0, hasMore: true);
  PaginatedList<Article> get myArticles => _myArticles;

  Future<void> refreshFeed() async {
    _feed = PaginatedList(items: [], currentPage: 0, hasMore: true);
    await loadMoreFeed();
  }

  Future<void> loadMoreFeed() async {
    if (_isFeedLoading || !_feed.hasMore) return;
    _isFeedLoading = true;
    // Don't notify listeners here if we already have items to avoid full rebuilds causing jumpy scrolls
    // If it's the first load, notify to show spinner
    if (_feed.items.isEmpty) notifyListeners();

    try {
      final page = await _articleService.getArticles(page: _feed.currentPage);
      _feed = _feed.copyWith(
        items: [..._feed.items, ...page.content],
        currentPage: _feed.currentPage + 1,
        hasMore: !page.last,
      );
    } finally {
      _isFeedLoading = false;
      notifyListeners();
    }
  }

  Future<void> refreshFollowing() async {
    _following = PaginatedList(items: [], currentPage: 0, hasMore: true);
    await loadMoreFollowing();
  }

  Future<void> loadMoreFollowing() async {
    if (_isFollowingLoading || !_following.hasMore) return;
    _isFollowingLoading = true;
    if (_following.items.isEmpty) notifyListeners();

    try {
      final page = await _articleService.getFollowingArticles(page: _following.currentPage);
      _following = _following.copyWith(
        items: [..._following.items, ...page.content],
        currentPage: _following.currentPage + 1,
        hasMore: !page.last,
      );
    } finally {
      _isFollowingLoading = false;
      notifyListeners();
    }
  }

  Future<void> refreshMyArticles() async {
    _myArticles = PaginatedList(items: [], currentPage: 0, hasMore: true);
    await loadMoreMyArticles();
  }

  Future<void> loadMoreMyArticles() async {
    if (_isMyArticlesLoading || !_myArticles.hasMore) return;
    _isMyArticlesLoading = true;
    if (_myArticles.items.isEmpty) notifyListeners();

    try {
      final page = await _articleService.getMyArticles(page: _myArticles.currentPage);
      _myArticles = _myArticles.copyWith(
        items: [..._myArticles.items, ...page.content],
        currentPage: _myArticles.currentPage + 1,
        hasMore: !page.last,
      );
    } finally {
      _isMyArticlesLoading = false;
      notifyListeners();
    }
  }
}
