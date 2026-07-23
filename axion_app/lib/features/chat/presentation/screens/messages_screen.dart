import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../data/chat_repository.dart';
import '../../domain/models/chat_model.dart';
import '../../../../core/widgets/error_view.dart';
import 'chat_detail_screen.dart';
import '../../../../features/profile/presentation/screens/settings_screen.dart';
import '../../../../features/search/presentation/providers/search_provider.dart';
import '../../../../features/auth/domain/models/user_model.dart';
import '../../../../features/auth/presentation/providers/auth_provider.dart';

class MessagesScreen extends ConsumerStatefulWidget {
  const MessagesScreen({super.key});

  @override
  ConsumerState<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends ConsumerState<MessagesScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  bool _showSuggestions = false;
  String? _activeContactId;
  Timer? _debounce;

  @override
  void dispose() {
    _searchController.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _onSearchChanged(String value) {
    _debounce?.cancel();
    setState(() {
      _searchQuery = value;
      _showSuggestions = value.trim().isNotEmpty;
    });
  }

  String _formatMessageTime(String timeStr) {
    try {
      final date = DateTime.parse(timeStr).toLocal();
      final now = DateTime.now();
      final diff = now.difference(date);
      if (diff.inMinutes < 1) return 'Vừa xong';
      if (diff.inHours < 24) {
        return '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
      }
      final yesterday = now.subtract(const Duration(days: 1));
      if (date.day == yesterday.day && date.month == yesterday.month && date.year == yesterday.year) {
        return 'Hôm qua';
      }
      return '${date.day}/${date.month}';
    } catch (_) {
      return '';
    }
  }

  String _renderLastMessage(String msg) {
    if (!msg.startsWith('[CALL_LOG]:')) return msg;
    try {
      final payload = msg.replaceFirst('[CALL_LOG]:', '');
      final data = jsonDecode(payload) as Map<String, dynamic>;
      final type = data['type'] as String? ?? '';
      if (type == 'MISSED') return '📞 Cuộc gọi nhỡ';
      if (type == 'REJECTED') return '📞 Cuộc gọi bị từ chối';
      if (type == 'ENDED') return data['isVideo'] == true ? '📹 Cuộc gọi video' : '📞 Cuộc gọi thoại';
    } catch (_) {}
    return msg;
  }

  void _selectContact(String contactId) {
    setState(() => _activeContactId = contactId);
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => ChatDetailScreen(contactId: contactId)),
    ).then((_) {
      setState(() => _activeContactId = null);
    });
  }

  @override
  Widget build(BuildContext context) {
    final contactsState = ref.watch(contactsProvider);
    final searchState = _searchQuery.trim().isNotEmpty
        ? ref.watch(searchUsersProvider(_searchQuery.trim()))
        : null;
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Tin nhắn', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const SettingsScreen()),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: TextField(
              controller: _searchController,
              onChanged: _onSearchChanged,
              onTap: () => setState(() => _showSuggestions = _searchQuery.trim().isNotEmpty),
              decoration: InputDecoration(
                hintText: 'Tìm người chat...',
                prefixIcon: const Icon(Icons.search, size: 20),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.close, size: 18),
                        onPressed: () {
                          _searchController.clear();
                          _onSearchChanged('');
                        },
                      )
                    : null,
                filled: true,
                fillColor: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(28),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              ),
            ),
          ),
          Expanded(
            child: contactsState.when(
              data: (contacts) {
                if (_showSuggestions && searchState != null) {
                  return _buildSuggestions(searchState, theme);
                }
                if (contacts.isEmpty) {
                  return _buildEmptyConversationList(theme);
                }
                return ListView.separated(
                  padding: const EdgeInsets.only(top: 4),
                  itemCount: contacts.length,
                  separatorBuilder: (context, index) => const Padding(
                    padding: EdgeInsets.only(left: 72, right: 16),
                    child: Divider(height: 1, indent: 72),
                  ),
                  itemBuilder: (context, index) {
                    final contact = contacts[index];
                    final isActive = contact.contactId == _activeContactId;
                    return _buildContactItem(contact, isActive, theme);
                  },
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, _) => ErrorView(
                error: error.toString(),
                onRetry: () => ref.refresh(contactsProvider),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSuggestions(AsyncValue<List<UserModel>> searchState, ThemeData theme) {
    return searchState.when(
      data: (users) {
        final currentUser = ref.read(authStateProvider).value;
        final filtered = users.where((u) => u.id != currentUser?.id).toList();
        if (filtered.isEmpty) {
          return const Center(
            child: Text('Không tìm thấy người dùng', style: TextStyle(color: Colors.grey)),
          );
        }
        return ListView.builder(
          padding: const EdgeInsets.symmetric(vertical: 4),
          itemCount: filtered.length,
          itemBuilder: (context, index) {
            final user = filtered[index];
            return InkWell(
              onTap: () => _selectContact(user.id),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 22,
                      backgroundImage: CachedNetworkImageProvider(
                        user.avatarUrl ?? 'https://ui-avatars.com/api/?name=${user.displayName}',
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(user.displayName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                          const SizedBox(height: 2),
                          Text('@${user.displayName.replaceAll(' ', '_').toLowerCase()}', style: TextStyle(color: Colors.grey, fontSize: 13)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
      loading: () => const Center(child: Padding(
        padding: EdgeInsets.all(32),
        child: CircularProgressIndicator(),
      )),
      error: (error, stackTrace) => const SizedBox.shrink(),
    );
  }

  Widget _buildContactItem(ChatContactModel contact, bool isActive, ThemeData theme) {
    final hasMissedCall = contact.missedCallCount > 0;
    return InkWell(
      onTap: () => _selectContact(contact.contactId),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        color: isActive ? theme.colorScheme.primary.withValues(alpha: 0.08) : null,
        child: Row(
          children: [
            Stack(
              children: [
                CircleAvatar(
                  radius: 26,
                  backgroundImage: CachedNetworkImageProvider(
                    contact.avatarUrl ?? 'https://ui-avatars.com/api/?name=${contact.displayName}',
                  ),
                ),
                if (contact.isOnline)
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: Container(
                      width: 14,
                      height: 14,
                      decoration: BoxDecoration(
                        color: Colors.green,
                        shape: BoxShape.circle,
                        border: Border.all(color: theme.scaffoldBackgroundColor, width: 2.5),
                      ),
                    ),
                  ),
                if (hasMissedCall)
                  Positioned(
                    top: -2,
                    right: -2,
                    child: Container(
                      width: 18,
                      height: 18,
                      decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                      child: const Icon(Icons.phone_missed, color: Colors.white, size: 10),
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          contact.displayName,
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                            color: isActive ? theme.colorScheme.primary : theme.colorScheme.onSurface,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        _formatMessageTime(contact.lastMessageTime),
                        style: TextStyle(
                          color: isActive ? theme.colorScheme.primary.withValues(alpha: 0.7) : Colors.grey,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          hasMissedCall ? 'Cuộc gọi nhỡ' : _renderLastMessage(contact.lastMessage),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: hasMissedCall
                                ? Colors.red.shade400
                                : contact.unreadCount > 0
                                    ? theme.colorScheme.onSurface
                                    : Colors.grey,
                            fontWeight: contact.unreadCount > 0 || hasMissedCall
                                ? FontWeight.bold
                                : FontWeight.normal,
                            fontSize: 13,
                          ),
                        ),
                      ),
                      if (contact.unreadCount > 0)
                        Container(
                          margin: const EdgeInsets.only(left: 8),
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: theme.colorScheme.primary,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            contact.unreadCount > 99 ? '99+' : contact.unreadCount.toString(),
                            style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                          ),
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

  Widget _buildEmptyConversationList(ThemeData theme) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainerHighest,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Icon(
                  Icons.chat_bubble_outline,
                  size: 40,
                  color: theme.colorScheme.primary.withValues(alpha: 0.5),
                ),
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Hộp thư trống',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Tìm bạn bè để bắt đầu những cuộc trò chuyện thú vị.',
              style: TextStyle(fontSize: 15, color: Colors.grey, height: 1.4),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
