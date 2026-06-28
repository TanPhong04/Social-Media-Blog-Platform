import '../models/comment.dart';
import '../models/page.dart';
import 'api_service.dart';

class CommentService {
  final ApiService _apiService;

  CommentService(this._apiService);

  Future<PageData<Comment>> getComments(String articleId, {int page = 0, int size = 20}) async {
    final response = await _apiService.dio.get('/comments/articles/$articleId', queryParameters: {'page': page, 'size': size});
    return PageData.fromJson(response.data, Comment.fromJson);
  }

  Future<Comment> createComment(String articleId, String content, {String? parentId}) async {
    final response = await _apiService.dio.post('/comments', data: {
      'articleId': articleId,
      'content': content,
      if (parentId != null) 'parentId': parentId,
    });
    return Comment.fromJson(response.data);
  }

  Future<Comment> updateComment(String id, String content) async {
    final response = await _apiService.dio.put('/comments/$id', data: {
      'content': content,
    });
    return Comment.fromJson(response.data);
  }

  Future<void> deleteComment(String id) async {
    await _apiService.dio.delete('/comments/$id');
  }
}
