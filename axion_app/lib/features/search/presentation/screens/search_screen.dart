import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../providers/search_provider.dart';
import '../../../feed/presentation/widgets/article_card_widget.dart';
import '../../../../core/widgets/skeleton_article_card.dart';

class SearchScreen extends ConsumerStatefulWidget {
  final String query;
  const SearchScreen({super.key, this.query = ''});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  late TextEditingController _searchController;
  late String _query;
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _query = widget.query;
    _searchController = TextEditingController(text: _query);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _onSearchChanged(String value) {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    _debounce = Timer(const Duration(milliseconds: 500), () {
      if (mounted && _query != value.trim()) {
        setState(() {
          _query = value.trim();
        });
      }
    });
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(LucideIcons.search, size: 64, color: Colors.grey.withValues(alpha: 0.3)),
          const SizedBox(height: 24),
          const Text('Tìm kiếm trên Axion', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          const Text('Nhập từ khóa để khám phá bài viết và mọi người', style: TextStyle(color: Colors.grey)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          titleSpacing: 0,
          title: Padding(
            padding: const EdgeInsets.only(right: 16.0),
            child: Container(
              height: 40,
              decoration: BoxDecoration(
                color: const Color(0xFF1F2937),
                borderRadius: BorderRadius.circular(20),
              ),
              child: TextField(
                controller: _searchController,
                onChanged: _onSearchChanged,
                autofocus: _query.isEmpty,
                textInputAction: TextInputAction.search,
                decoration: InputDecoration(
                  hintText: 'Tìm kiếm...',
                  hintStyle: TextStyle(color: Colors.grey.shade500),
                  prefixIcon: Icon(LucideIcons.search, color: Colors.grey.shade500, size: 20),
                  suffixIcon: _searchController.text.isNotEmpty
                      ? IconButton(
                          icon: Icon(LucideIcons.x, color: Colors.grey.shade500, size: 18),
                          onPressed: () {
                            _searchController.clear();
                            _onSearchChanged('');
                          },
                        )
                      : null,
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                ),
              ),
            ),
          ),
          bottom: const TabBar(
            indicatorSize: TabBarIndicatorSize.tab,
            tabs: [
              Tab(text: 'Bài viết'),
              Tab(text: 'Mọi người'),
            ],
          ),
        ),
        body: _query.isEmpty
            ? _buildEmptyState()
            : TabBarView(
                children: [
                  _buildArticleResults(),
                  _buildUserResults(),
                ],
              ),
      ),
    );
  }

  Widget _buildArticleResults() {
    final searchState = ref.watch(searchProvider(_query));
    
    return searchState.when(
      data: (articles) {
        if (articles.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(LucideIcons.fileSearch, size: 48, color: Colors.grey.withValues(alpha: 0.5)),
                const SizedBox(height: 16),
                const Text('Không tìm thấy bài viết nào', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                const Text('Hãy thử tìm kiếm với các từ khóa khác.', style: TextStyle(color: Colors.grey)),
              ],
            )
          );
        }
        return ListView.builder(
          padding: const EdgeInsets.only(top: 8, bottom: 80),
          itemCount: articles.length,
          itemBuilder: (context, index) => ArticleCardWidget(article: articles[index]),
        );
      },
      loading: () => ListView.builder(
        padding: const EdgeInsets.only(top: 8),
        itemCount: 4,
        itemBuilder: (context, index) => const SkeletonArticleCard(),
      ),
      error: (e, _) => Center(child: Text('Lỗi: $e')),
    );
  }

  Widget _buildUserResults() {
    final searchUsersState = ref.watch(searchUsersProvider(_query));

    return searchUsersState.when(
      data: (users) {
        if (users.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(LucideIcons.userX, size: 48, color: Colors.grey.withValues(alpha: 0.5)),
                const SizedBox(height: 16),
                const Text('Không tìm thấy người dùng nào', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                const Text('Hãy thử tìm kiếm với các từ khóa khác.', style: TextStyle(color: Colors.grey)),
              ],
            )
          );
        }
        return ListView.separated(
          padding: const EdgeInsets.only(top: 8, bottom: 80),
          itemCount: users.length,
          separatorBuilder: (context, index) => const Divider(height: 1, color: Color(0xFF1F2937)),
          itemBuilder: (context, index) {
            final user = users[index];
            final username = user.email.split('@').first;
            return ListTile(
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              leading: CircleAvatar(
                radius: 28,
                backgroundColor: Theme.of(context).colorScheme.primary.withValues(alpha: 0.2),
                backgroundImage: user.avatarUrl != null ? NetworkImage(user.avatarUrl!) : null,
                child: user.avatarUrl == null
                    ? Text(user.displayName.isNotEmpty
                        ? user.displayName.substring(0, 2).toUpperCase()
                        : 'US', style: TextStyle(color: Theme.of(context).colorScheme.primary, fontWeight: FontWeight.bold))
                    : null,
              ),
              title: Text(
                user.displayName,
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 4),
                  Text(
                    '@$username',
                    style: TextStyle(color: Colors.grey.shade400, fontSize: 14),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (user.bio != null && user.bio!.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(
                      user.bio!,
                      style: const TextStyle(fontSize: 14, color: Colors.white70),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ]
                ],
              ),
              trailing: OutlinedButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => Scaffold(
                        appBar: AppBar(title: Text(user.displayName)),
                        body: Center(child: Text('Trang cá nhân của ${user.displayName}')),
                      ),
                    ),
                  );
                },
                style: OutlinedButton.styleFrom(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  side: const BorderSide(color: Colors.white24),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  minimumSize: const Size(0, 32),
                ),
                child: const Text('Xem', style: TextStyle(color: Colors.white)),
              ),
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => Scaffold(
                      appBar: AppBar(title: Text(user.displayName)),
                      body: Center(child: Text('Trang cá nhân của ${user.displayName}')),
                    ),
                  ),
                );
              },
            );
          },
        );
      },
      loading: () => const Center(
        child: CircularProgressIndicator(),
      ),
      error: (e, _) => Center(child: Text('Lỗi: $e')),
    );
  }
}
