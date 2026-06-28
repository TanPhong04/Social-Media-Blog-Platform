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
  List<AppNotification> _notifications = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final service = context.read<NotificationService>();
      final page = await service.getNotifications();
      if (mounted) {
        setState(() {
          _notifications = page.content;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _markAllRead() async {
    final service = context.read<NotificationService>();
    await service.markAllAsRead();
    _load();
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
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _notifications.isEmpty
              ? const Center(child: Text('No notifications'))
              : ListView.builder(
                  itemCount: _notifications.length,
                  itemBuilder: (context, index) {
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
                      onTap: () {
                        context.read<NotificationService>().markAsRead(note.id);
                        setState(() => _load()); // Hack to reload, better to just modify local state
                      },
                    );
                  },
                ),
    );
  }
}
