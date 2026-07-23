import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';

import '../../data/chat_repository.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../call/presentation/providers/call_provider.dart';
import '../../domain/models/chat_model.dart';

class ChatDetailScreen extends ConsumerStatefulWidget {
  final String contactId;

  const ChatDetailScreen({super.key, required this.contactId});

  @override
  ConsumerState<ChatDetailScreen> createState() => _ChatDetailScreenState();
}

class _ChatDetailScreenState extends ConsumerState<ChatDetailScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final ImagePicker _picker = ImagePicker();
  String? _pendingImage;
  bool _showEmojiPicker = false;

  static const List<String> _emojis = [
    '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊',
    '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗',
    '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭',
    '🤔', '🤐', '😐', '😑', '😶', '😏', '😒', '🙄',
    '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷',
    '🤒', '🤕', '🤢', '🤮', '🥴', '😵', '🤯', '🥳',
    '😎', '🤓', '🧐', '😕', '😟', '🙁', '😮', '😯',
    '😲', '😳', '🥺', '😢', '😭', '😤', '😠', '😡',
    '🤬', '🤩', '🥶', '🥵', '🤧', '🤮', '🤠', '🥸',
    '👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌',
    '👐', '🤲', '🤝', '🙏', '✌️', '🤞', '🫶', '💪',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _connectWebSocket();
    });
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _connectWebSocket() {
    final user = ref.read(authStateProvider).value;
    if (user == null) return;
    final repo = ref.read(chatRepositoryProvider);
    repo.onMessageReceived = (message) {
      ref.invalidate(chatHistoryProvider(widget.contactId));
    };
    repo.connectWebSocket(user.id);
  }

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty && _pendingImage == null) return;

    String content = text;
    if (_pendingImage != null) {
      content += '\n\n![chat_image]($_pendingImage)';
    }

    try {
      await ref.read(chatRepositoryProvider).sendMessage(widget.contactId, content);
      _messageController.clear();
      setState(() => _pendingImage = null);
      // ignore: unused_result
      ref.refresh(chatHistoryProvider(widget.contactId));
      Future.delayed(const Duration(milliseconds: 100), () {
        if (_scrollController.hasClients) {
          _scrollController.animateTo(0, duration: const Duration(milliseconds: 200), curve: Curves.easeOut);
        }
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  Future<void> _pickImage() async {
    final file = await _picker.pickImage(source: ImageSource.gallery);
    if (file != null) {
      setState(() => _pendingImage = file.path);
    }
  }

  void _toggleEmojiPicker() {
    setState(() => _showEmojiPicker = !_showEmojiPicker);
  }

  void _insertEmoji(String emoji) {
    final text = _messageController.text;
    final selection = _messageController.selection;
    final newText = text.replaceRange(selection.start, selection.end, emoji);
    _messageController.text = newText;
    _messageController.selection = TextSelection.collapsed(offset: selection.start + emoji.length);
  }

  String _formatTime(String dateStr) {
    try {
      final date = DateTime.parse(dateStr).toLocal();
      return '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return '';
    }
  }

  String _formatDateLabel(String dateStr) {
    try {
      final d = DateTime.parse(dateStr).toLocal();
      final now = DateTime.now();
      final isToday = d.day == now.day && d.month == now.month && d.year == now.year;
      if (isToday) return 'Hôm nay';
      final yesterday = now.subtract(const Duration(days: 1));
      if (d.day == yesterday.day && d.month == yesterday.month && d.year == yesterday.year) {
        return 'Hôm qua';
      }
      return '${d.day}/${d.month}/${d.year}';
    } catch (_) {
      return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    final chatState = ref.watch(chatHistoryProvider(widget.contactId));
    final currentUser = ref.read(authStateProvider).value;
    final contactsState = ref.watch(contactsProvider);
    final contact = contactsState.value?.where((c) => c.contactId == widget.contactId).firstOrNull;
    final displayName = contact?.displayName ?? widget.contactId;
    final avatarUrl = contact?.avatarUrl;
    final isOnline = contact?.isOnline ?? false;
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: Row(
          children: [
            Stack(
              children: [
                CircleAvatar(
                  radius: 18,
                  backgroundImage: CachedNetworkImageProvider(
                    avatarUrl ?? 'https://ui-avatars.com/api/?name=$displayName',
                  ),
                ),
                if (isOnline)
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: Colors.green,
                        shape: BoxShape.circle,
                        border: Border.all(color: theme.scaffoldBackgroundColor, width: 2),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    displayName,
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    isOnline ? 'Đang hoạt động' : 'Ngoại tuyến',
                    style: TextStyle(
                      fontSize: 11,
                      color: isOnline ? Colors.green : Colors.grey,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.phone_outlined, size: 22),
            onPressed: () {
              ref.read(callProvider.notifier).startOutgoingCall(
                widget.contactId,
                widget.contactId,
                avatarUrl ?? 'https://ui-avatars.com/api/?name=$displayName',
                isVideo: false,
              );
            },
            tooltip: 'Cuộc gọi thoại',
          ),
          IconButton(
            icon: const Icon(Icons.videocam_outlined, size: 22),
            onPressed: () {
              ref.read(callProvider.notifier).startOutgoingCall(
                widget.contactId,
                widget.contactId,
                avatarUrl ?? 'https://ui-avatars.com/api/?name=$displayName',
                isVideo: true,
              );
            },
            tooltip: 'Cuộc gọi video',
          ),
          IconButton(
            icon: const Icon(Icons.info_outline, size: 22),
            onPressed: () {},
            tooltip: 'Thông tin',
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: chatState.when(
              data: (messages) {
                final filtered = messages.where((m) => !m.content.startsWith('WEBRTC_SIGNAL:')).toList();
                if (filtered.isEmpty) {
                  return _buildEmptyChat(avatarUrl, displayName, theme);
                }
                return _buildMessagesList(filtered, currentUser, theme);
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, _) => ErrorView(
                error: error.toString(),
                onRetry: () => ref.refresh(chatHistoryProvider(widget.contactId)),
              ),
            ),
          ),
          _buildMessageInput(theme),
        ],
      ),
    );
  }

  Widget _buildEmptyChat(String? avatarUrl, String displayName, ThemeData theme) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircleAvatar(
              radius: 48,
              backgroundImage: CachedNetworkImageProvider(
                avatarUrl ?? 'https://ui-avatars.com/api/?name=$displayName',
              ),
            ),
            const SizedBox(height: 20),
            Text(
              displayName,
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'Đây là bắt đầu của cuộc trò chuyện.\nHãy gửi lời chào!',
              style: TextStyle(fontSize: 14, color: Colors.grey.shade500, height: 1.4),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMessagesList(List<ChatMessageModel> messages, dynamic currentUser, ThemeData theme) {
    final grouped = <String, List<ChatMessageModel>>{};
    for (final m in messages) {
      final label = _formatDateLabel(m.createdAt);
      grouped.putIfAbsent(label, () => []).add(m);
    }

    final reversed = grouped.entries.toList().reversed;

    return ListView(
      controller: _scrollController,
      reverse: true,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      children: [
        ...reversed.map((entry) {
              final dateLabel = entry.key;
              final messageWidgets = entry.value.reversed.map((message) {
                final isMe = message.senderId == currentUser?.id;
                if (message.content.startsWith('[CALL_LOG]')) {
                  return _buildCallLogBubble(message, isMe, theme);
                }
                return _buildMessageBubble(message, isMe, theme);
              });
              return Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.8),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        dateLabel,
                        style: TextStyle(fontSize: 12, color: theme.colorScheme.onSurface.withValues(alpha: 0.7), fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                  ...messageWidgets,
                ],
              );
        }),
      ],
    );
  }

  Widget _buildMessageBubble(ChatMessageModel message, bool isMe, ThemeData theme) {
    String text = message.content;
    String? imageSrc;
    final imgMatch = RegExp(r'!\[chat_image\]\(([^)]+)\)').firstMatch(text);
    if (imgMatch != null) {
      imageSrc = imgMatch.group(1);
      text = text.replaceAll(imgMatch.group(0)!, '');
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Column(
        crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          Container(
            constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                if (!isMe) const SizedBox(width: 0),
                Flexible(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: isMe ? theme.colorScheme.primary : theme.colorScheme.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(20).copyWith(
                        bottomRight: isMe ? const Radius.circular(4) : const Radius.circular(20),
                        bottomLeft: isMe ? const Radius.circular(20) : const Radius.circular(4),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (text.trim().isNotEmpty)
                          Padding(
                            padding: imageSrc != null ? const EdgeInsets.only(bottom: 8) : EdgeInsets.zero,
                            child: Text(
                              text.trim(),
                              style: TextStyle(
                                color: isMe ? Colors.white : theme.colorScheme.onSurface,
                                fontSize: 15,
                                height: 1.4,
                              ),
                            ),
                          ),
                        if (imageSrc != null)
                          ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: Image.network(
                              imageSrc,
                              fit: BoxFit.cover,
                              width: 200,
                              height: 160,
                              errorBuilder: (context, error, stackTrace) => Container(
                                color: Colors.grey.shade800,
                                height: 100,
                                child: const Center(child: Icon(Icons.broken_image, color: Colors.white54)),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
                if (isMe) const SizedBox(width: 0),
              ],
            ),
          ),
          Padding(
            padding: EdgeInsets.only(top: 2, right: isMe ? 4 : 0, left: isMe ? 0 : 4),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  _formatTime(message.createdAt),
                  style: TextStyle(fontSize: 10, color: theme.colorScheme.onSurface.withValues(alpha: 0.5)),
                ),
                if (isMe && message.isRead) ...[
                  const SizedBox(width: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      'Đã đọc',
                      style: TextStyle(fontSize: 9, color: theme.colorScheme.primary, fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCallLogBubble(ChatMessageModel message, bool isMe, ThemeData theme) {
    try {
      final jsonStr = message.content.replaceFirst('[CALL_LOG]:', '');
      final data = jsonDecode(jsonStr) as Map<String, dynamic>;
      final type = data['type'] as String? ?? 'ENDED';
      final isVideo = data['isVideo'] as bool? ?? false;
      final duration = data['duration'] as int? ?? 0;
      final callLogType = parseCallLogType(type);

      IconData icon;
      Color color;
      String label;

      switch (callLogType) {
        case CallLogType.missed:
          icon = Icons.phone_missed;
          color = Colors.red;
          label = 'Cuộc gọi nhỡ';
          break;
        case CallLogType.rejected:
          icon = Icons.phone_missed;
          color = Colors.red.shade300;
          label = 'Cuộc gọi bị từ chối';
          break;
        case CallLogType.ended:
          icon = isVideo ? Icons.videocam : Icons.phone;
          color = Colors.green;
          label = isVideo ? 'Cuộc gọi video' : 'Cuộc gọi thoại';
          break;
        default:
          icon = Icons.phone;
          color = Colors.grey;
          label = 'Cuộc gọi';
      }

      final m = duration ~/ 60;
      final s = duration % 60;
      final subText = duration > 0 ? '$m phút $s giây' : '';

      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.6),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: theme.colorScheme.outlineVariant.withValues(alpha: 0.3)),
              ),
              constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.65),
              child: Column(
                children: [
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.surface,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(icon, color: color, size: 20),
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(label, style: TextStyle(color: color, fontSize: 14, fontWeight: FontWeight.w600)),
                          if (subText.isNotEmpty)
                            Text(subText, style: TextStyle(color: theme.colorScheme.onSurface.withValues(alpha: 0.6), fontSize: 12)),
                        ],
                      ),
                    ],
                  ),
                  if (type == 'MISSED' || type == 'REJECTED')
                    Padding(
                      padding: const EdgeInsets.only(top: 10),
                      child: SizedBox(
                        width: double.infinity,
                        child: OutlinedButton.icon(
                          onPressed: () {
                            ref.read(callProvider.notifier).startOutgoingCall(
                              widget.contactId,
                              widget.contactId,
                              'https://ui-avatars.com/api/?name=$widget.contactId',
                              isVideo: isVideo,
                            );
                          },
                          icon: Icon(isVideo ? Icons.videocam : Icons.phone, size: 16),
                          label: const Text('Gọi lại', style: TextStyle(fontSize: 13)),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: theme.colorScheme.primary,
                            side: BorderSide(color: theme.colorScheme.outlineVariant),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            padding: const EdgeInsets.symmetric(vertical: 8),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      );
    } catch (_) {
      return const SizedBox.shrink();
    }
  }

  Widget _buildMessageInput(ThemeData theme) {
    return SafeArea(
      child: Container(
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          border: Border(top: BorderSide(color: theme.colorScheme.outlineVariant.withValues(alpha: 0.3))),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (_pendingImage != null)
              Container(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
                child: Row(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.file(
                        File(_pendingImage!),
                        height: 60,
                        width: 60,
                        fit: BoxFit.cover,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text('Ảnh đã chọn', style: TextStyle(fontSize: 13, color: theme.colorScheme.onSurface.withValues(alpha: 0.7))),
                    const Spacer(),
                    IconButton(
                      icon: const Icon(Icons.close, size: 18),
                      onPressed: () => setState(() => _pendingImage = null),
                    ),
                  ],
                ),
              ),
            if (_showEmojiPicker)
              Container(
                height: 220,
                padding: const EdgeInsets.all(8),
                child: GridView.builder(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 8,
                    mainAxisSpacing: 2,
                    crossAxisSpacing: 2,
                  ),
                  itemCount: _emojis.length,
                  itemBuilder: (context, index) {
                    return InkWell(
                      onTap: () => _insertEmoji(_emojis[index]),
                      child: Center(
                        child: Text(_emojis[index], style: const TextStyle(fontSize: 26)),
                      ),
                    );
                  },
                ),
              ),
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 4, 8, 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  IconButton(
                    icon: Icon(
                      Icons.emoji_emotions_outlined,
                      color: _showEmojiPicker ? theme.colorScheme.primary : Colors.grey,
                    ),
                    onPressed: _toggleEmojiPicker,
                  ),
                  Expanded(
                    child: TextField(
                      controller: _messageController,
                      maxLines: 4,
                      minLines: 1,
                      textInputAction: TextInputAction.send,
                      decoration: InputDecoration(
                        hintText: 'Soạn tin nhắn...',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: BorderSide.none,
                        ),
                        filled: true,
                        fillColor: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                      ),
                      onSubmitted: (_) => _sendMessage(),
                    ),
                  ),
                  const SizedBox(width: 4),
                  IconButton(
                    icon: const Icon(Icons.image_outlined, color: Colors.grey),
                    onPressed: _pickImage,
                  ),
                  Container(
                    decoration: BoxDecoration(
                      color: theme.colorScheme.primary,
                      shape: BoxShape.circle,
                    ),
                    child: IconButton(
                      icon: const Icon(Icons.send, color: Colors.white, size: 20),
                      onPressed: _sendMessage,
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
}
