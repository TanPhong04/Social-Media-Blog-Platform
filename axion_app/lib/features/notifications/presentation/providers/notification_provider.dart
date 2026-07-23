import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/models/notification_model.dart';
import '../../data/notification_repository.dart';

final notificationProvider = AsyncNotifierProvider<NotificationNotifier, List<NotificationModel>>(() {
  return NotificationNotifier();
});

class NotificationNotifier extends AsyncNotifier<List<NotificationModel>> {
  int _currentPage = 0;
  bool _hasMore = true;

  @override
  FutureOr<List<NotificationModel>> build() async {
    _currentPage = 0;
    _hasMore = true;
    return _fetchPage(0);
  }

  Future<List<NotificationModel>> _fetchPage(int page) async {
    final repository = ref.read(notificationRepositoryProvider);
    final notifications = await repository.getNotifications(page: page, size: 20);
    
    if (notifications.length < 20) {
      _hasMore = false;
    }
    return notifications;
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      _currentPage = 0;
      _hasMore = true;
      return _fetchPage(0);
    });
  }

  Future<void> loadMore() async {
    if (state.isLoading || state.isRefreshing || state.isReloading || !_hasMore) return;
    
    final current = state.value ?? [];
    try {
      _currentPage++;
      final newItems = await _fetchPage(_currentPage);
      state = AsyncValue.data([...current, ...newItems]);
    } catch (e, st) {
      _currentPage--;
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> markAsRead(String id) async {
    await ref.read(notificationRepositoryProvider).markAsRead(id);
    final current = state.value ?? [];
    final updated = current.map((n) {
      if (n.id == id) {
        return NotificationModel(
          id: n.id,
          type: n.type,
          actorId: n.actorId,
          actorName: n.actorName,
          actorAvatarUrl: n.actorAvatarUrl,
          targetId: n.targetId,
          isRead: true,
          createdAt: n.createdAt,
        );
      }
      return n;
    }).toList();
    state = AsyncValue.data(updated);
  }

  Future<void> markAllAsRead() async {
    await ref.read(notificationRepositoryProvider).markAllAsRead();
    final current = state.value ?? [];
    final updated = current.map((n) {
      return NotificationModel(
        id: n.id,
        type: n.type,
        actorId: n.actorId,
        actorName: n.actorName,
        actorAvatarUrl: n.actorAvatarUrl,
        targetId: n.targetId,
        isRead: true,
        createdAt: n.createdAt,
      );
    }).toList();
    state = AsyncValue.data(updated);
  }
}
