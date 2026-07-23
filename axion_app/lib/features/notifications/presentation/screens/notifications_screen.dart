import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../auth/data/auth_repository.dart';

import '../providers/notification_provider.dart';
import '../../domain/models/notification_model.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
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
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
      ref.read(notificationProvider.notifier).loadMore();
    }
  }

  Map<String, List<NotificationModel>> _groupNotifications(List<NotificationModel> notifs) {
    final groups = <String, List<NotificationModel>>{'Hôm nay': [], 'Hôm qua': [], 'Cũ hơn': []};
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));
    
    for (var n in notifs) {
      try {
        final d = DateTime.parse(n.createdAt).toLocal();
        final date = DateTime(d.year, d.month, d.day);
        
        if (date == today) {
          groups['Hôm nay']!.add(n);
        } else if (date == yesterday) {
          groups['Hôm qua']!.add(n);
        } else {
          groups['Cũ hơn']!.add(n);
        }
      } catch (e) {
        groups['Cũ hơn']!.add(n);
      }
    }
    return groups;
  }
  
  String _formatTimeAgo(String dateStr) {
    try {
      final date = DateTime.parse(dateStr).toLocal();
      final now = DateTime.now();
      final diff = now.difference(date);
      if (diff.inMinutes < 1) return 'vừa xong';
      if (diff.inMinutes < 60) return '${diff.inMinutes}p';
      if (diff.inHours < 24) return '${diff.inHours}g';
      if (diff.inDays < 7) return '${diff.inDays}n';
      return '${diff.inDays ~/ 7}t';
    } catch (_) {
      return '';
    }
  }

  Widget _buildSkeletonLoader() {
    return ListView.builder(
      physics: const NeverScrollableScrollPhysics(),
      itemCount: 8,
      itemBuilder: (context, index) {
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.08),
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: double.infinity,
                      height: 14,
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      width: 150,
                      height: 12,
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);
    final isAuthenticated = authState.value != null;

    if (!isAuthenticated) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.notifications_none, size: 64, color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.5)),
              const SizedBox(height: 16),
              const Text('Thông báo', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              const Text('Vui lòng đăng nhập để xem thông báo.', style: TextStyle(color: Colors.grey)),
            ],
          ),
        ),
      );
    }

    final state = ref.watch(notificationProvider);

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(
        child: CustomScrollView(
          controller: _scrollController,
          slivers: [
            SliverAppBar(
              floating: true,
              title: const Text('Thông báo', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 24)),
              actions: [
                state.maybeWhen(
                  data: (notifs) {
                    if (notifs.any((n) => !n.isRead)) {
                      return IconButton(
                        onPressed: () => ref.read(notificationProvider.notifier).markAllAsRead(),
                        icon: const Icon(Icons.done_all),
                        tooltip: 'Đánh dấu tất cả đã đọc',
                      );
                    }
                    return const SizedBox.shrink();
                  },
                  orElse: () => const SizedBox.shrink(),
                ),
              ],
            ),
            state.when(
              data: (notifications) {
                if (notifications.isEmpty) {
                  return SliverFillRemaining(
                    child: RefreshIndicator(
                      onRefresh: () => ref.read(notificationProvider.notifier).refresh(),
                      child: ListView(
                        children: [
                          const SizedBox(height: 100),
                          Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(24),
                                  decoration: BoxDecoration(
                                    color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.05),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(Icons.notifications_none, size: 64, color: Theme.of(context).colorScheme.primary),
                                ),
                                const SizedBox(height: 24),
                                const Text('Chưa có thông báo', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                                const SizedBox(height: 12),
                                const Padding(
                                  padding: EdgeInsets.symmetric(horizontal: 40),
                                  child: Text(
                                    'Khi có người tương tác với bài viết hoặc theo dõi bạn, thông báo sẽ hiển thị ở đây.',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(color: Colors.grey, height: 1.5, fontSize: 15),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                final grouped = _groupNotifications(notifications);
                final validGroups = grouped.entries.where((e) => e.value.isNotEmpty).toList();

                return SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      if (index == validGroups.length) {
                        return state.isLoading && !state.isRefreshing
                            ? const Padding(padding: EdgeInsets.all(24), child: Center(child: CircularProgressIndicator()))
                            : const SizedBox(height: 24);
                      }
                      
                      final entry = validGroups[index];
                      final label = entry.key;
                      final items = entry.value;

                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Padding(
                            padding: const EdgeInsets.fromLTRB(16, 24, 16, 12),
                            child: Text(
                              label,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                          ),
                          ...items.map((notif) => _buildNotificationItem(context, notif)),
                        ],
                      );
                    },
                    childCount: validGroups.length + 1,
                  ),
                );
              },
              loading: () => SliverFillRemaining(child: _buildSkeletonLoader()),
              error: (e, _) => SliverFillRemaining(child: Center(child: Text('Lỗi: $e'))),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNotificationItem(BuildContext context, NotificationModel notif) {
    // Determine icon and color based on notification type
    IconData typeIcon = Icons.notifications;
    Color typeColor = Colors.grey;
    
    if (notif.type == 'NEW_LIKE' || notif.type == 'LIKE_ARTICLE') {
      typeIcon = Icons.favorite;
      typeColor = Colors.red;
    } else if (notif.type == 'NEW_COMMENT' || notif.type == 'COMMENT') {
      typeIcon = Icons.mode_comment;
      typeColor = Colors.blue;
    } else if (notif.type == 'NEW_FOLLOWER' || notif.type == 'FOLLOW') {
      typeIcon = Icons.person;
      typeColor = Colors.green;
    }

    final isUnread = !notif.isRead;

    return InkWell(
      onTap: () {
        if (!notif.isRead) {
          ref.read(notificationProvider.notifier).markAsRead(notif.id);
        }
        // TODO: Navigate to target based on type
      },
      child: Container(
        color: isUnread ? Theme.of(context).colorScheme.primary.withValues(alpha: 0.05) : Colors.transparent,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                CircleAvatar(
                  radius: 26,
                  backgroundImage: notif.actorAvatarUrl != null && notif.actorAvatarUrl!.isNotEmpty
                      ? CachedNetworkImageProvider(notif.actorAvatarUrl!)
                      : null,
                  child: notif.actorAvatarUrl == null || notif.actorAvatarUrl!.isEmpty
                      ? Text(notif.actorName.isNotEmpty ? notif.actorName[0].toUpperCase() : '?', style: const TextStyle(fontWeight: FontWeight.bold))
                      : null,
                ),
                Positioned(
                  bottom: -2,
                  right: -2,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: typeColor,
                      shape: BoxShape.circle,
                      border: Border.all(color: Theme.of(context).scaffoldBackgroundColor, width: 2),
                    ),
                    child: Icon(typeIcon, color: Colors.white, size: 12),
                  ),
                ),
              ],
            ),
            const SizedBox(width: 16),
            Expanded(
              child: RichText(
                text: TextSpan(
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontSize: 15,
                    height: 1.4,
                  ),
                  children: [
                    TextSpan(
                      text: notif.actorName.isNotEmpty ? '${notif.actorName} ' : 'Người dùng ',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    TextSpan(
                      text: _getNotificationText(notif.type),
                    ),
                    TextSpan(
                      text: '  ${_formatTimeAgo(notif.createdAt)}',
                      style: const TextStyle(color: Colors.grey, fontSize: 13),
                    ),
                  ],
                ),
              ),
            ),
            if (notif.type == 'NEW_FOLLOWER' || notif.type == 'FOLLOW')
              Padding(
                padding: const EdgeInsets.only(left: 12),
                child: _FollowButton(targetUserId: notif.actorId),
              )
            else if (isUnread)
              Padding(
                padding: const EdgeInsets.only(left: 12),
                child: Icon(
                  Icons.circle, 
                  size: 10, 
                  color: Theme.of(context).colorScheme.primary,
                ),
              ),
          ],
        ),
      ),
    );
  }

  String _getNotificationText(String type) {
    switch (type) {
      case 'NEW_LIKE': 
      case 'LIKE_ARTICLE': return 'đã thích bài viết của bạn.';
      case 'NEW_COMMENT': 
      case 'COMMENT': return 'đã bình luận về bài viết của bạn.';
      case 'NEW_FOLLOWER': 
      case 'FOLLOW': return 'đã bắt đầu theo dõi bạn.';
      default: return 'đã tương tác với bạn.';
    }
  }
}

class _FollowButton extends ConsumerStatefulWidget {
  final String targetUserId;
  const _FollowButton({required this.targetUserId});

  @override
  ConsumerState<_FollowButton> createState() => _FollowButtonState();
}

class _FollowButtonState extends ConsumerState<_FollowButton> {
  bool _isFollowing = false;
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    return FilledButton(
      onPressed: _isLoading ? null : _toggleFollow,
      style: FilledButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        minimumSize: const Size(0, 32),
        textStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
      ),
      child: _isLoading
          ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
          : Text(_isFollowing ? 'Đang theo dõi' : 'Theo dõi'),
    );
  }

  Future<void> _toggleFollow() async {
    setState(() => _isLoading = true);
    try {
      final repo = ref.read(authRepositoryProvider);
      if (_isFollowing) {
        await repo.unfollowUser(widget.targetUserId);
      } else {
        await repo.followUser(widget.targetUserId);
      }
      if (mounted) setState(() => _isFollowing = !_isFollowing);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }
}
