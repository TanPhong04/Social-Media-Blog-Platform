import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../feed/presentation/providers/feed_provider.dart';
import '../../../../core/widgets/error_view.dart';
import '../widgets/reel_item_widget.dart';
import '../../../../features/feed/utils/feed_mixer.dart';
import '../../../../core/providers/selected_reel_provider.dart';
import '../../../../core/providers/main_nav_provider.dart';

class ReelsScreen extends ConsumerStatefulWidget {
  final String? initialReelId;
  const ReelsScreen({super.key, this.initialReelId});

  @override
  ConsumerState<ReelsScreen> createState() => _ReelsScreenState();
}

class _ReelsScreenState extends ConsumerState<ReelsScreen> {
  int _currentIndex = 0;
  PageController? _pageController;
  bool _isInit = false;

  @override
  Widget build(BuildContext context) {
    final feedState = ref.watch(feedProvider);

    ref.listen(selectedReelIdProvider, (previous, next) {
      if (next != null && feedState.value != null) {
        final articles = feedState.value!.where(isReel).toList();
        final idx = articles.indexWhere((a) => a.id == next);
        if (idx != -1 && _pageController != null) {
          _pageController!.jumpToPage(idx);
          setState(() => _currentIndex = idx);
        }
        // reset it after jumping
        Future.microtask(() => ref.read(selectedReelIdProvider.notifier).setId(null));
      }
    });

    return Scaffold(
      backgroundColor: Colors.black,
      body: feedState.when(
        data: (allArticles) {
          final articles = allArticles.where(isReel).toList();
          if (articles.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(32.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.movie_outlined,
                      size: 64,
                      color: Colors.white.withOpacity(0.3),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Chưa có thước phim nào',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Hãy theo dõi thêm người dùng để xem các thước phim mới.',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.7),
                        fontSize: 14,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            );
          }
          if (!_isInit) {
            _isInit = true;
            if (widget.initialReelId != null) {
              final idx = articles.indexWhere((a) => a.id == widget.initialReelId);
              if (idx != -1) _currentIndex = idx;
            }
            _pageController = PageController(initialPage: _currentIndex);
          }

          return PageView.builder(
            controller: _pageController,
            scrollDirection: Axis.vertical,
            itemCount: articles.length,
            onPageChanged: (index) {
              setState(() => _currentIndex = index);
              if (index >= articles.length - 2) {
                ref.read(feedProvider.notifier).loadMore();
              }
            },
            itemBuilder: (context, index) {
              final article = articles[index];
              final isCurrentTab = ref.watch(mainNavProvider) == 2;
              final isActive = index == _currentIndex && isCurrentTab;
              final isPreload = (index - _currentIndex).abs() <= 1 && isCurrentTab;

              return ReelItemWidget(
                article: article,
                isActive: isActive,
                isPreload: isPreload,
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => ErrorView(
          error: error.toString(),
          onRetry: () => ref.read(feedProvider.notifier).refresh(),
        ),
      ),
    );
  }
}

