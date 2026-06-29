import 'package:dio/dio.dart';
import '../models/article.dart';
import '../models/page.dart';
import 'api_service.dart';

class ArticleService {
  final ApiService _apiService;

  ArticleService(this._apiService);

  Future<PageData<Article>> getArticles({int page = 0, int size = 20}) async {
    final response = await _apiService.dio.get('/articles', queryParameters: {'page': page, 'size': size});
    return PageData.fromJson(response.data, Article.fromJson);
  }

  Future<PageData<Article>> getFollowingArticles({int page = 0, int size = 20}) async {
    final response = await _apiService.dio.get('/articles/following', queryParameters: {'page': page, 'size': size});
    return PageData.fromJson(response.data, Article.fromJson);
  }

  Future<PageData<Article>> getMyArticles({int page = 0, int size = 20}) async {
    final response = await _apiService.dio.get('/articles/mine', queryParameters: {'page': page, 'size': size});
    return PageData.fromJson(response.data, Article.fromJson);
  }

  Future<Article> getArticleBySlug(String slug) async {
    final response = await _apiService.dio.get('/articles/by-slug/$slug');
    return Article.fromJson(response.data);
  }

  Future<Article> createDraft(String title, String content, String summary, List<String> tags) async {
    final response = await _apiService.dio.post('/articles', data: {
      'title': title,
      'content': content,
      'summary': summary,
      'tags': tags,
    });
    return Article.fromJson(response.data);
  }

  Future<Article> updateArticle(String id, String title, String content, String summary, List<String> tags) async {
    final response = await _apiService.dio.put('/articles/$id', data: {
      'title': title,
      'content': content,
      'summary': summary,
      'tags': tags,
    });
    return Article.fromJson(response.data);
  }

  Future<Article> publishArticle(String id) async {
    final response = await _apiService.dio.post('/articles/$id/publish');
    return Article.fromJson(response.data);
  }

  Future<Article> unpublishArticle(String id) async {
    final response = await _apiService.dio.post('/articles/$id/unpublish');
    return Article.fromJson(response.data);
  }

  Future<void> deleteArticle(String id) async {
    await _apiService.dio.delete('/articles/$id');
  }
}
