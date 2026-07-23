import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/dio_client.dart';
import '../domain/models/article_model.dart';

final articleRepositoryProvider = Provider<ArticleRepository>((ref) {
  return ArticleRepository(ref.read(dioProvider));
});

class ArticleRepository {
  final Dio _dio;

  ArticleRepository(this._dio);

  Future<List<ArticleModel>> getFeed({int page = 0, int size = 20}) async {
    try {
      final response = await _dio.get(
        ApiConstants.articles,
        queryParameters: {
          'page': page,
          'size': size,
        },
      );
      
      final List<dynamic> content = response.data['content'] ?? [];
      return content.map((json) => ArticleModel.fromJson(json)).toList();
    } on DioException catch (e) {
      throw Exception('Không thể tải bài viết: ${e.message}');
    }
  }

  Future<List<ArticleModel>> getFollowingFeed({int page = 0, int size = 20}) async {
    try {
      final response = await _dio.get(
        '/articles/following',
        queryParameters: {
          'page': page,
          'size': size,
        },
      );
      
      final List<dynamic> content = response.data['content'] ?? [];
      return content.map((json) => ArticleModel.fromJson(json)).toList();
    } on DioException catch (e) {
      throw Exception('Không thể tải bài viết đang theo dõi: ${e.message}');
    }
  }

  Future<void> createArticle(String title, String summary, String content, List<String> tags, {String? mediaUrl}) async {
    try {
      final data = <String, dynamic>{
        'title': title,
        'summary': summary,
        'content': content,
        'tags': tags,
      };
      if (mediaUrl != null) {
        data['mediaUrl'] = mediaUrl;
      }

      await _dio.post(
        ApiConstants.articles,
        data: data,
      );
    } on DioException catch (e) {
      throw Exception('Không thể đăng bài viết: ${e.message}');
    }
  }

  Future<void> updateArticle(String id, String title, String summary, String content, List<String> tags, {String? mediaUrl}) async {
    try {
      final data = <String, dynamic>{
        'title': title,
        'summary': summary,
        'content': content,
        'tags': tags,
      };
      if (mediaUrl != null) {
        data['mediaUrl'] = mediaUrl;
      }

      await _dio.put(
        '${ApiConstants.articles}/$id',
        data: data,
      );
    } on DioException catch (e) {
      throw Exception('Không thể cập nhật bài viết: ${e.message}');
    }
  }

  Future<void> deleteArticle(String id) async {
    try {
      await _dio.delete('${ApiConstants.articles}/$id');
    } on DioException catch (e) {
      throw Exception('Không thể xóa bài viết: ${e.message}');
    }
  }

  Future<void> likeArticle(String id, {String reaction = 'LIKE'}) async {
    try {
      await _dio.put('/interactions/ARTICLE/$id/like?reaction=$reaction');
    } on DioException catch (e) {
      throw Exception('Không thể thích bài viết: ${e.message}');
    }
  }

  Future<void> unlikeArticle(String id) async {
    try {
      await _dio.delete('/interactions/ARTICLE/$id/like');
    } on DioException catch (e) {
      throw Exception('Không thể bỏ thích bài viết: ${e.message}');
    }
  }

  Future<String> uploadMedia(String filePath, {void Function(int, int)? onSendProgress}) async {
    try {
      final fileName = filePath.split('/').last;
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(filePath, filename: fileName),
      });

      final response = await _dio.post(
        '/articles/media/upload',
        data: formData,
        onSendProgress: onSendProgress,
      );
      
      return response.data['url'] ?? '';
    } on DioException catch (e) {
      throw Exception('Không thể tải lên tệp: ${e.message}');
    }
  }

  Future<List<ArticleModel>> getMyArticles({int page = 0, int size = 20}) async {
    try {
      final response = await _dio.get(
        '/articles/mine',
        queryParameters: {
          'page': page,
          'size': size,
        },
      );
      
      final List<dynamic> content = response.data['content'] ?? [];
      return content.map((json) => ArticleModel.fromJson(json)).toList();
    } on DioException catch (e) {
      throw Exception('Không thể tải bài viết của tôi: ${e.message}');
    }
  }

  Future<Map<String, dynamic>> getArticleInteraction(String id) async {
    try {
      final response = await _dio.get('/interactions/ARTICLE/$id');
      return response.data;
    } catch (e) {
      return {'likeCount': 0, 'commentCount': 0, 'userInteraction': null};
    }
  }

  Future<List<TrendingTagModel>> getTrendingTags({int limit = 5}) async {
    try {
      final response = await _dio.get('/articles/trending?limit=$limit');
      final List<dynamic> data = response.data ?? [];
      return data.map((json) => TrendingTagModel.fromJson(json)).toList();
    } catch (e) {
      return [];
    }
  }

  Future<ArticleModel> getArticleById(String id) async {
    try {
      final response = await _dio.get('${ApiConstants.articles}/$id');
      return ArticleModel.fromJson(response.data);
    } on DioException catch (e) {
      throw Exception('Không thể tải bài viết: ${e.message}');
    }
  }

  Future<ArticleModel> getBySlug(String slug) async {
    try {
      final response = await _dio.get('/articles/by-slug/$slug');
      return ArticleModel.fromJson(response.data);
    } on DioException catch (e) {
      throw Exception('Không thể tải bài viết: ${e.message}');
    }
  }

  Future<List<ArticleModel>> getByAuthor(String authorId, {int page = 0, int size = 20}) async {
    try {
      final response = await _dio.get('/articles/users/$authorId', queryParameters: {'page': page, 'size': size});
      final List<dynamic> content = response.data['content'] ?? [];
      return content.map((json) => ArticleModel.fromJson(json)).toList();
    } on DioException catch (e) {
      throw Exception('Không thể tải bài viết: ${e.message}');
    }
  }

  Future<void> publishArticle(String id) async {
    try {
      await _dio.post('/articles/$id/publish');
    } on DioException catch (e) {
      throw Exception('Không thể đăng bài viết: ${e.message}');
    }
  }

  Future<void> unpublishArticle(String id) async {
    try {
      await _dio.post('/articles/$id/unpublish');
    } on DioException catch (e) {
      throw Exception('Không thể gỡ bài viết: ${e.message}');
    }
  }

  Future<String> askAi(String articleId, String question, List<Map<String, dynamic>> history) async {
    try {
      final response = await _dio.post(
        '/articles/$articleId/ask-ai',
        data: {
          'question': question,
          'conversationHistory': history,
        },
      );
      return response.data['reply'] ?? '';
    } on DioException catch (e) {
      throw Exception('Lỗi kết nối AI: ${e.message}');
    }
  }
}


class TrendingTagModel {
  final String tag;
  final int posts;

  TrendingTagModel({required this.tag, required this.posts});

  factory TrendingTagModel.fromJson(Map<String, dynamic> json) {
    return TrendingTagModel(
      tag: json['tag'] as String,
      posts: json['posts'] as int,
    );
  }
}



