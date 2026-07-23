import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../../auth/presentation/providers/auth_provider.dart';
import 'settings_screen.dart';
import '../../../auth/domain/models/user_model.dart';
import '../../../auth/data/auth_repository.dart';
import 'edit_profile_screen.dart';
import 'follow_list_screen.dart';
import 'my_articles_screen.dart';
import '../../../feed/presentation/widgets/article_card_widget.dart';
import '../../../feed/data/article_repository.dart';
import '../../../feed/domain/models/article_model.dart';
import 'bookmarks_screen.dart';

final relationshipProvider = FutureProvider.family<RelationshipModel, String>((ref, userId) async {
  return ref.read(authRepositoryProvider).getFollowStatus(userId);
});

final reelsTabProvider = FutureProvider.family<List<ArticleModel>, String>((ref, authorId) async {
  final repo = ref.read(articleRepositoryProvider);
  final articles = await repo.getByAuthor(authorId, page: 0, size: 50);
  return articles.where((a) => a.tags.contains('reel') || a.mediaUrl?.contains('#video') == true).toList();
});

final repostsTabProvider = FutureProvider.family<List<ArticleModel>, String>((ref, authorId) async {
  final repo = ref.read(articleRepositoryProvider);
  final articles = await repo.getByAuthor(authorId, page: 0, size: 50);
  return articles.where((a) => a.content.contains('[repost]')).toList();
});

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);

    return Scaffold(
      body: authState.when(
        data: (user) {
          if (user == null) return const Center(child: Text('Vui lòng đăng nhập'));

          String joinDate = '';
          if (user.createdAt != null) {
            try {
              final d = DateTime.parse(user.createdAt!);
              final months = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
              joinDate = '${months[d.month - 1]} năm ${d.year}';
            } catch (_) {}
          }

          return SafeArea(
            child: NestedScrollView(
              headerSliverBuilder: (context, innerBoxIsScrolled) {
                return [
                  SliverAppBar(
                    floating: true,
                    pinned: true,
                    title: Row(
                      children: [
                        Icon(Icons.lock_outline, size: 16, color: Theme.of(context).colorScheme.onSurface),
                        const SizedBox(width: 8),
                        Text(
                          user.email.split('@').first, 
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20),
                        ),
                      ],
                    ),
                    actions: [
                      IconButton(
                        icon: const Icon(Icons.add_box_outlined, size: 28),
                        onPressed: () {},
                      ),
                      IconButton(
                        icon: const Icon(Icons.menu, size: 28),
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (context) => const SettingsScreen()),
                          );
                        },
                      ),
                      const SizedBox(width: 8),
                    ],
                  ),
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              // Avatar
                              Container(
                                padding: const EdgeInsets.all(3),
                                decoration: const BoxDecoration(
                                  shape: BoxShape.circle,
                                  gradient: LinearGradient(
                                    colors: [Colors.purple, Colors.orange, Colors.yellow],
                                    begin: Alignment.topRight,
                                    end: Alignment.bottomLeft,
                                  ),
                                ),
                                child: Container(
                                  padding: const EdgeInsets.all(2),
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: Theme.of(context).scaffoldBackgroundColor,
                                  ),
                                  child: CircleAvatar(
                                    radius: 40,
                                    backgroundImage: CachedNetworkImageProvider(
                                      user.avatarUrl ?? 'https://ui-avatars.com/api/?name=${user.displayName}',
                                    ),
                                  ),
                                ),
                              ),
                              // Stats
                              Expanded(
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                                  children: [
                                    Consumer(
                                      builder: (context, ref, child) {
                                        final articlesState = ref.watch(myArticlesProvider);
                                        return _buildStatColumn(
                                          articlesState.maybeWhen(
                                            data: (articles) => articles.length.toString(),
                                            orElse: () => '0',
                                          ),
                                          'Bài viết'
                                        );
                                      },
                                    ),
                                    Consumer(
                                      builder: (context, ref, child) {
                                        final relState = ref.watch(relationshipProvider(user.id));
                                        return GestureDetector(
                                          onTap: () {
                                            Navigator.push(context, MaterialPageRoute(builder: (context) => FollowListScreen(userId: user.id, type: 'followers')));
                                          },
                                          child: _buildStatColumn(
                                            relState.maybeWhen(data: (rel) => rel.followerCount.toString(), orElse: () => '0'),
                                            'Người theo dõi'
                                          ),
                                        );
                                      },
                                    ),
                                    Consumer(
                                      builder: (context, ref, child) {
                                        final relState = ref.watch(relationshipProvider(user.id));
                                        return GestureDetector(
                                          onTap: () {
                                            Navigator.push(context, MaterialPageRoute(builder: (context) => FollowListScreen(userId: user.id, type: 'following')));
                                          },
                                          child: _buildStatColumn(
                                            relState.maybeWhen(data: (rel) => rel.followingCount.toString(), orElse: () => '0'),
                                            'Đang theo dõi'
                                          ),
                                        );
                                      },
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          // Name and Bio
                          Text(
                            user.displayName,
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            user.bio ?? 'Thêm tiểu sử của bạn tại đây...',
                            style: TextStyle(
                              fontSize: 14,
                              color: user.bio == null ? Colors.grey : Theme.of(context).colorScheme.onSurface,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Tham gia tháng $joinDate',
                            style: const TextStyle(color: Colors.grey, fontSize: 13),
                          ),
                          const SizedBox(height: 16),
                          // Action Buttons
                          Row(
                            children: [
                              Expanded(
                                child: OutlinedButton(
                                  onPressed: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(builder: (context) => EditProfileScreen(user: user)),
                                    );
                                  },
                                  style: OutlinedButton.styleFrom(
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                    padding: const EdgeInsets.symmetric(vertical: 8),
                                    backgroundColor: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
                                    side: BorderSide.none,
                                  ),
                                  child: Text('Chỉnh sửa hồ sơ', style: TextStyle(fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface)),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                        ],
                      ),
                    ),
                  ),
                  SliverPersistentHeader(
                    pinned: true,
                    delegate: _SliverAppBarDelegate(
                      TabBar(
                        controller: _tabController,
                        labelColor: Theme.of(context).colorScheme.primary,
                        unselectedLabelColor: Colors.grey,
                        indicatorColor: Theme.of(context).colorScheme.primary,
                        dividerColor: Theme.of(context).dividerColor.withValues(alpha: 0.2),
                        tabs: const [
                          Tab(icon: Icon(Icons.grid_on)),
                          Tab(icon: Icon(Icons.movie_outlined)),
                          Tab(icon: Icon(Icons.repeat)),
                          Tab(icon: Icon(Icons.favorite_border)),
                        ],
                      ),
                    ),
                  ),
                ];
              },
              body: TabBarView(
                controller: _tabController,
                children: [
                  Consumer(
                    builder: (context, ref, child) {
                      final articlesState = ref.watch(myArticlesProvider);
                      return articlesState.when(
                        data: (articles) {
                          if (articles.isEmpty) {
                            return _buildEmptyTab(context, Icons.grid_on, 'Chưa có bài viết nào', 'Khi bạn đăng ảnh hoặc video, chúng sẽ xuất hiện trên hồ sơ của bạn.');
                          }
                          return RefreshIndicator(
                            onRefresh: () => ref.refresh(myArticlesProvider.future),
                            child: ListView.builder(
                              padding: const EdgeInsets.only(top: 8),
                              itemCount: articles.length,
                              itemBuilder: (context, index) {
                                return ArticleCardWidget(article: articles[index]);
                              },
                            ),
                          );
                        },
                        loading: () => const Center(child: CircularProgressIndicator()),
                        error: (error, _) => Center(child: Text('Lỗi: $error')),
                      );
                    },
                  ),
                  Consumer(
                    builder: (context, ref, child) {
                      final user = ref.watch(authStateProvider).value;
                      if (user == null) return _buildEmptyTab(context, Icons.movie_outlined, 'Vui lòng đăng nhập', '');
                      final reelsState = ref.watch(reelsTabProvider(user.id));
                      return reelsState.when(
                        data: (articles) {
                          if (articles.isEmpty) {
                            return _buildEmptyTab(context, Icons.movie_outlined, 'Chưa có thước phim nào', 'Khi bạn đăng thước phim, chúng sẽ xuất hiện ở đây.');
                          }
                          return RefreshIndicator(
                            onRefresh: () => ref.refresh(reelsTabProvider(user.id).future),
                            child: ListView.builder(
                              padding: const EdgeInsets.only(top: 8),
                              itemCount: articles.length,
                              itemBuilder: (context, index) => ArticleCardWidget(article: articles[index]),
                            ),
                          );
                        },
                        loading: () => const Center(child: CircularProgressIndicator()),
                        error: (error, _) => Center(child: Text('Lỗi: $error')),
                      );
                    },
                  ),
                  Consumer(
                    builder: (context, ref, child) {
                      final user = ref.watch(authStateProvider).value;
                      if (user == null) return _buildEmptyTab(context, Icons.repeat, 'Vui lòng đăng nhập', '');
                      final repostsState = ref.watch(repostsTabProvider(user.id));
                      return repostsState.when(
                        data: (articles) {
                          if (articles.isEmpty) {
                            return _buildEmptyTab(context, Icons.repeat, 'Chưa đăng lại bài viết nào', '');
                          }
                          return RefreshIndicator(
                            onRefresh: () => ref.refresh(repostsTabProvider(user.id).future),
                            child: ListView.builder(
                              padding: const EdgeInsets.only(top: 8),
                              itemCount: articles.length,
                              itemBuilder: (context, index) => ArticleCardWidget(article: articles[index]),
                            ),
                          );
                        },
                        loading: () => const Center(child: CircularProgressIndicator()),
                        error: (error, _) => Center(child: Text('Lỗi: $error')),
                      );
                    },
                  ),
                  Consumer(
                    builder: (context, ref, child) {
                      final user = ref.watch(authStateProvider).value;
                      if (user == null) return _buildEmptyTab(context, Icons.favorite_border, 'Vui lòng đăng nhập', '');
                      return const BookmarksScreen();
                    },
                  ),
                ],
              ),
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Lỗi: $e')),
      ),
    );
  }

  Widget _buildStatColumn(String count, String label) {
    return Column(
      children: [
        Text(count, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 13)),
      ],
    );
  }

  Widget _buildEmptyTab(BuildContext context, IconData icon, String title, String subtitle) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(48.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: Colors.grey.withValues(alpha: 0.3), width: 2),
              ),
              child: Icon(icon, size: 48, color: Colors.grey),
            ),
            const SizedBox(height: 16),
            Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
            if (subtitle.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                subtitle, 
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.grey, fontSize: 14),
              ),
            ]
          ],
        ),
      ),
    );
  }
}

class _SliverAppBarDelegate extends SliverPersistentHeaderDelegate {
  _SliverAppBarDelegate(this._tabBar);

  final TabBar _tabBar;

  @override
  double get minExtent => _tabBar.preferredSize.height;
  @override
  double get maxExtent => _tabBar.preferredSize.height;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: Theme.of(context).scaffoldBackgroundColor,
      child: _tabBar,
    );
  }

  @override
  bool shouldRebuild(_SliverAppBarDelegate oldDelegate) {
    return false;
  }
}
