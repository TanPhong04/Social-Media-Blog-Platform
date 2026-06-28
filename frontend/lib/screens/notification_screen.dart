import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/notification.dart';
import '../services/notification_service.dart';

class NotificationScreen extends StatefulWidget {
  const NotificationScreen({Key? key}) : super(key: key);

  @override
  _NotificationScreenState createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen> {
  final List<AppNotification> _notifications = [];
  bool _isLoading = false;
  bool _hasMore = true;
  int _currentPage = 0;
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _loadMore();
    _scrollController.addListener(() {
      if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
        _loadMore();
      }
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadMore() async {
    if (_isLoading || !_hasMore) return;
    setState(() => _isLoading = true);

    try {
      final service = context.read<NotificationService>();
      final page = await service.getNotifications(page: _currentPage);
      if (mounted) {
        setState(() {
          _notifications.addAll(page.content);
          _currentPage++;
          _hasMore = !page.last;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _refresh() async {
    setState(() {
      _notifications.clear();
      _currentPage = 0;
      _hasMore = true;
    });
    await _loadMore();
  }

  Future<void> _markAllRead() async {
    final service = context.read<NotificationService>();
    try {
      await service.markAllAsRead();
      _refresh();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to mark all as read')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          IconButton(
            icon: const Icon(Icons.done_all),
            onPressed: _markAllRead,
            tooltip: 'Mark all as read',
          ),
        ],
      ),
      body: (_isLoading && _notifications.isEmpty)
          ? const Center(child: CircularProgressIndicator())
          : _notifications.isEmpty
              ? RefreshIndicator(
                  onRefresh: _refresh,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: Container(
                      height: MediaQuery.of(context).size.height * 0.8,
                      alignment: Alignment.center,
                      child: const Text('No notifications'),
                    ),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _refresh,
                  child: ListView.builder(
                    controller: _scrollController,
                    itemCount: _notifications.length + (_hasMore ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index == _notifications.length) {
                        return const Padding(
                          padding: EdgeInsets.symmetric(vertical: 16),
                          child: Center(child: CircularProgressIndicator()),
                        );
                      }

                      final note = _notifications[index];
                      return ListTile(
                        tileColor: note.readAt == null ? Theme.of(context).colorScheme.primary.withOpacity(0.1) : null,
                        leading: Icon(
                          note.type == 'ARTICLE_PUBLISHED' ? Icons.article :
                          note.type == 'COMMENT_CREATED' ? Icons.comment :
                          note.type == 'INTERACTION_CREATED' ? Icons.favorite : Icons.notifications,
                        ),
                        title: Text(note.type.replaceAll('_', ' ')),
                        subtitle: Text('Entity: ${note.entityType}'),
                        onTap: () async {
                          if (note.readAt == null) {
                            try {
                              await context.read<NotificationService>().markAsRead(note.id);
                              setState(() {
                                _notifications[index] = AppNotification(
                                  id: note.id,
                                  actorId: note.actorId,
                                  type: note.type,
                                  entityType: note.entityType,
                                  entityId: note.entityId,
                                  metadata: note.metadata,
                                  createdAt: note.createdAt,
                                  readAt: DateTime.now(), // update local state
                                );
                              });
                            } catch (_) {}
                          }
                        },
                      );
                    },
                  ),
                ),
    );
  }
}
