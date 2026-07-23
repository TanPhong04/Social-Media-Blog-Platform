import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:shared_preferences/shared_preferences.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../feed/domain/models/article_model.dart';
import '../../../feed/presentation/widgets/article_card_widget.dart';

final bookmarksProvider = FutureProvider<List<ArticleModel>>((ref) async {
  final user = ref.watch(authStateProvider).value;
  if (user == null) return [];
  
  final prefs = await SharedPreferences.getInstance();
  final bookmarksStr = prefs.getString('bookmarks_${user.id}') ?? '[]';
  final List<dynamic> jsonList = jsonDecode(bookmarksStr);
  return jsonList.map((j) => ArticleModel.fromJson(j)).toList();
});

class BookmarksScreen extends ConsumerWidget {
  const BookmarksScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(bookmarksProvider);
    
    return Scaffold(
      appBar: AppBar(title: const Text('Bài viết đã lưu')),
      body: state.when(
        data: (articles) {
          if (articles.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.bookmark_border, size: 80, color: Colors.grey.shade700),
                  const SizedBox(height: 16),
                  const Text('Chưa có bài viết nào được lưu', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  const Text('Các bài viết bạn lưu sẽ xuất hiện ở đây', style: TextStyle(color: Colors.grey)),
                ],
              ),
            );
          }
          return ListView.builder(
            itemCount: articles.length,
            itemBuilder: (context, index) => ArticleCardWidget(article: articles[index]),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Lỗi: $e')),
      ),
    );
  }
}

