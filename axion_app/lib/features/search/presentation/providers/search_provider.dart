import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/dio_client.dart';
import '../../../feed/domain/models/article_model.dart';
import '../../../feed/data/article_repository.dart';
import '../../../auth/domain/models/user_model.dart';

final searchProvider = FutureProvider.family<List<ArticleModel>, String>((ref, query) async {
  if (query.isEmpty) return [];
  
  final dio = ref.read(dioProvider);
  try {
    final response = await dio.get('/articles/search', queryParameters: {
      'query': query,
      'page': 0,
      'size': 20,
    });
    final List<dynamic> content = response.data['content'] ?? [];
    return content.map((json) => ArticleModel.fromJson(json)).toList();
  } catch (e) {
    throw Exception('Lỗi tìm kiếm');
  }
});

final trendingTagsProvider = FutureProvider<List<TrendingTagModel>>((ref) async {
  return ref.read(articleRepositoryProvider).getTrendingTags();
});

final searchUsersProvider = FutureProvider.family<List<UserModel>, String>((ref, query) async {
  if (query.isEmpty) return [];
  
  final dio = ref.read(dioProvider);
  try {
    final response = await dio.get('/users/search', queryParameters: {
      'query': query,
    });
    final List<dynamic> content = response.data is List ? response.data : (response.data['content'] ?? []);
    return content.map((json) => UserModel.fromJson(json)).toList();
  } catch (e) {
    throw Exception('Lỗi tìm kiếm người dùng');
  }
});

