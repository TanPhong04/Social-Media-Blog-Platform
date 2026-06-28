import 'package:flutter/foundation.dart';
import '../models/article.dart';
import '../services/article_service.dart';
import '../models/page.dart';

class ArticleProvider with ChangeNotifier {
  final ArticleService _articleService;

  ArticleProvider(this._articleService);

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  PageData<Article>? _feedPage;
  PageData<Article>? get feedPage => _feedPage;

  PageData<Article>? _followingPage;
  PageData<Article>? get followingPage => _followingPage;

  PageData<Article>? _myArticlesPage;
  PageData<Article>? get myArticlesPage => _myArticlesPage;

  Future<void> loadFeed({int page = 0}) async {
    _isLoading = true;
    notifyListeners();
    try {
      _feedPage = await _articleService.getArticles(page: page);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadFollowing({int page = 0}) async {
    _isLoading = true;
    notifyListeners();
    try {
      _followingPage = await _articleService.getFollowingArticles(page: page);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadMyArticles({int page = 0}) async {
    _isLoading = true;
    notifyListeners();
    try {
      _myArticlesPage = await _articleService.getMyArticles(page: page);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
