import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../features/feed/domain/models/article_model.dart';
import '../../../../features/feed/data/article_repository.dart';
import '../../../../features/feed/utils/feed_mixer.dart';
import 'reel_video_player.dart';
import '../../../../core/providers/main_nav_provider.dart';
import '../../../../core/providers/selected_reel_provider.dart';

class ReelsCarouselWidget extends ConsumerStatefulWidget {
  const ReelsCarouselWidget({super.key});

  @override
  ConsumerState<ReelsCarouselWidget> createState() => _ReelsCarouselWidgetState();
}

class _ReelsCarouselWidgetState extends ConsumerState<ReelsCarouselWidget> {
  List<ArticleModel> _reels = [];
  bool _isLoading = true;
  int? _hoveredIndex;

  @override
  void initState() {
    super.initState();
    _fetchReels();
  }

  Future<void> _fetchReels() async {
    try {
      final repo = ref.read(articleRepositoryProvider);
      final articles = await repo.getFeed(page: 0, size: 30);
      final reels = articles.where(isReel).take(10).toList();
      if (mounted) {
        setState(() {
          _reels = reels;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  String? _extractVideoUrl(ArticleModel article) {
    if (article.mediaUrl != null && (article.mediaUrl!.endsWith('#video') || article.mediaUrl!.endsWith('.mp4'))) {
      return article.mediaUrl!.replaceAll('#video', '').split(',').first;
    }
    final match = RegExp(r'<video\s+src="([^"]+)"').firstMatch(article.content);
    return match?.group(1);
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Container(
        height: 300,
        color: Theme.of(context).colorScheme.surface.withValues(alpha: 0.3),
        padding: const EdgeInsets.symmetric(vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Icon(LucideIcons.film, size: 20, color: Theme.of(context).colorScheme.primary),
                  const SizedBox(width: 8),
                  const Text('Reels', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: 4,
                itemBuilder: (context, index) => Container(
                  width: 140,
                  margin: const EdgeInsets.only(right: 12),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
          ],
        ),
      );
    }

    if (_reels.isEmpty) return const SizedBox.shrink();

    return Container(
      height: 300,
      color: Theme.of(context).colorScheme.surface.withValues(alpha: 0.3),
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                Icon(LucideIcons.film, size: 20, color: Theme.of(context).colorScheme.primary),
                const SizedBox(width: 8),
                const Text('Reels', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _reels.length,
              itemBuilder: (context, index) {
                final reel = _reels[index];
                final videoUrl = _extractVideoUrl(reel);
                final isCurrentTab = ref.watch(mainNavProvider) == 0;

                return MouseRegion(
                  onEnter: (_) => setState(() => _hoveredIndex = index),
                  onExit: (_) => setState(() => _hoveredIndex = null),
                  child: GestureDetector(
                    onTapDown: (_) => setState(() => _hoveredIndex = index),
                    onTapUp: (_) => setState(() => _hoveredIndex = null),
                    onTapCancel: () => setState(() => _hoveredIndex = null),
                    onTap: () {
                      ref.read(selectedReelIdProvider.notifier).setId(reel.id);
                      ref.read(mainNavProvider.notifier).setIndex(2); // 2 is Reels tab
                    },
                    child: Container(
                      width: 150,
                      margin: const EdgeInsets.only(right: 12),
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.surfaceContainerHighest,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          if (videoUrl != null)
                            ReelVideoPlayer(
                              url: videoUrl, 
                              isActive: _hoveredIndex == index && isCurrentTab, 
                              isPreload: isCurrentTab, 
                              showControls: false,
                              onTap: () {
                                ref.read(selectedReelIdProvider.notifier).setId(reel.id);
                                ref.read(mainNavProvider.notifier).setIndex(2); // 2 is Reels tab
                              },
                            )
                          else
                          const Center(child: Icon(Icons.broken_image, color: Colors.white54)),
                        // Removed username display per user request
                      ],
                    ),
                  ),
                ),
              );
            },
            ),
          ),
        ],
      ),
    );
  }
}
