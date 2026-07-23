import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../widgets/article_card_widget.dart';
import '../providers/feed_provider.dart';
import '../../../reels/presentation/widgets/reels_carousel_widget.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../../core/widgets/offline_banner.dart';
import '../../../../core/widgets/skeleton_article_card.dart';
import 'create_article_screen.dart';

class FeedScreen extends ConsumerStatefulWidget {
  const FeedScreen({super.key});

  @override
  ConsumerState<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends ConsumerState<FeedScreen> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    // Load more when user scrolls near the bottom
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
      ref.read(feedProvider.notifier).loadMore();
    }
  }

  Widget _buildInlineTweetBox(BuildContext context) {
    return InkWell(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const CreateArticleScreen()),
        );
      },
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CircleAvatar(
              backgroundColor: Theme.of(context).colorScheme.surfaceContainerHighest,
              child: const Icon(LucideIcons.user, color: Colors.grey),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 8),
                  Text(
                    'Có chuyện gì thế?',
                    style: TextStyle(
                      fontSize: 18,
                      color: Theme.of(context).colorScheme.onSurface.withOpacity(0.5),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Icon(LucideIcons.image, color: Theme.of(context).colorScheme.primary, size: 20),
                      const SizedBox(width: 16),
                      Icon(LucideIcons.smile, color: Theme.of(context).colorScheme.primary, size: 20),
                      const Spacer(),
                      FilledButton(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (context) => const CreateArticleScreen()),
                          );
                        },
                        style: FilledButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 0),
                          minimumSize: const Size(0, 32),
                        ),
                        child: const Text('Post', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final feedState = ref.watch(feedProvider);
    final isFollowing = ref.read(feedProvider.notifier).isFollowingFeed;

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            if (feedState.hasError && feedState.hasValue)
              const OfflineBanner(),
            Expanded(
              child: RefreshIndicator(
                onRefresh: () => ref.read(feedProvider.notifier).refresh(),
                child: CustomScrollView(
                  controller: _scrollController,
                  slivers: [
                    SliverAppBar(
                      floating: true,
                      pinned: true,
                      elevation: 0,
                      backgroundColor: Theme.of(context).colorScheme.surface.withOpacity(0.8),
                      flexibleSpace: ClipRect(
                        child: BackdropFilter(
                          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                          child: Container(color: Colors.transparent),
                        ),
                      ),
                      toolbarHeight: 52,
                      titleSpacing: 0,
                      title: Row(
                        children: [
                          Expanded(
                            child: InkWell(
                              onTap: () => ref.read(feedProvider.notifier).switchFeedType(false),
                              child: Container(
                                padding: const EdgeInsets.only(top: 16),
                                alignment: Alignment.center,
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      'Dành cho bạn',
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: !isFollowing ? FontWeight.bold : FontWeight.normal,
                                        color: !isFollowing ? Theme.of(context).colorScheme.onSurface : Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                                      ),
                                    ),
                                    const SizedBox(height: 12),
                                    Container(
                                      height: 4,
                                      width: 60,
                                      decoration: BoxDecoration(
                                        color: !isFollowing ? Theme.of(context).colorScheme.primary : Colors.transparent,
                                        borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          Expanded(
                            child: InkWell(
                              onTap: () => ref.read(feedProvider.notifier).switchFeedType(true),
                              child: Container(
                                padding: const EdgeInsets.only(top: 16),
                                alignment: Alignment.center,
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      'Đang theo dõi',
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: isFollowing ? FontWeight.bold : FontWeight.normal,
                                        color: isFollowing ? Theme.of(context).colorScheme.onSurface : Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                                      ),
                                    ),
                                    const SizedBox(height: 12),
                                    Container(
                                      height: 4,
                                      width: 60,
                                      decoration: BoxDecoration(
                                        color: isFollowing ? Theme.of(context).colorScheme.primary : Colors.transparent,
                                        borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      bottom: PreferredSize(
                        preferredSize: const Size.fromHeight(1),
                        child: Divider(height: 1, thickness: 1, color: Theme.of(context).colorScheme.outlineVariant),
                      ),
                    ),
                    SliverToBoxAdapter(
                      child: Column(
                        children: [
                          _buildInlineTweetBox(context),
                          Divider(height: 1, thickness: 1, color: Theme.of(context).colorScheme.outlineVariant),
                        ],
                      ),
                    ),
                    feedState.when(
                      data: (articles) {
                        if (articles.isEmpty) {
                          return const SliverFillRemaining(
                            child: Center(child: Text('Chưa có bài viết nào.')),
                          );
                        }
                        return SliverList(
                          delegate: SliverChildBuilderDelegate(
                            (context, index) {
                              if (index == articles.length) {
                                return feedState.isLoading && !feedState.isRefreshing
                                    ? const Padding(
                                        padding: EdgeInsets.all(16.0),
                                        child: Center(child: CircularProgressIndicator()),
                                      )
                                    : const SizedBox.shrink();
                              }
                              if (index == 2 && articles.length >= 3) {
                                return Column(
                                  children: [
                                    ArticleCardWidget(article: articles[index]),
                                    const ReelsCarouselWidget(),
                                  ],
                                );
                              }
                              return ArticleCardWidget(article: articles[index]);
                            },
                            childCount: articles.length + 1,
                          ),
                        );
                      },
                      loading: () => SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (context, index) => const SkeletonArticleCard(),
                          childCount: 3,
                        ),
                      ),
                      error: (error, _) => SliverFillRemaining(
                        child: ErrorView(
                          error: error.toString(),
                          onRetry: () => ref.read(feedProvider.notifier).refresh(),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

