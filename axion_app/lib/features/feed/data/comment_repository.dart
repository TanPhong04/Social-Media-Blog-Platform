import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/dio_client.dart';
import '../domain/models/comment_model.dart';

final commentRepositoryProvider = Provider<CommentRepository>((ref) {
  return CommentRepository(ref.read(dioProvider));
});

class CommentRepository {
  final Dio _dio;

  CommentRepository(this._dio);

  Future<List<CommentModel>> getComments(String articleId) async {
    try {
      final response = await _dio.get('/comments/articles/$articleId', queryParameters: {
        'page': 0,
        'size': 50,
      });
      final List<dynamic> content = response.data['content'] ?? [];
      return content.map((json) => CommentModel.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Không thể tải bình luận');
    }
  }

  Future<void> createComment(String articleId, String content, {String? parentId}) async {
    try {
      final data = <String, dynamic>{
        'articleId': articleId,
        'content': content,
      };
      if (parentId != null) data['parentId'] = parentId;
      await _dio.post('/comments', data: data);
    } catch (e) {
      throw Exception('Không thể đăng bình luận');
    }
  }

  Future<void> deleteComment(String commentId) async {
    try {
      await _dio.delete('/comments/$commentId');
    } catch (e) {
      throw Exception('Không thể xóa bình luận');
    }
  }

  Future<void> updateComment(String commentId, String content) async {
    try {
      await _dio.put('/comments/$commentId', data: {'content': content});
    } catch (e) {
      throw Exception('Không thể cập nhật bình luận');
    }
  }

  Future<CommentModel> getCommentById(String commentId) async {
    try {
      final response = await _dio.get('/comments/$commentId');
      return CommentModel.fromJson(response.data);
    } catch (e) {
      throw Exception('Không thể tải bình luận');
    }
  }
}

final commentsProvider = FutureProvider.family<List<CommentModel>, String>((ref, articleId) async {
  final repo = ref.read(commentRepositoryProvider);
  return repo.getComments(articleId);
});
