import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/article_repository.dart';

class AiChatBottomSheet extends ConsumerStatefulWidget {
  final String articleId;
  final String articleTitle;

  const AiChatBottomSheet({
    super.key,
    required this.articleId,
    required this.articleTitle,
  });

  @override
  ConsumerState<AiChatBottomSheet> createState() => _AiChatBottomSheetState();
}

class _AiChatBottomSheetState extends ConsumerState<AiChatBottomSheet> {
  final List<Map<String, dynamic>> _messages = [];
  final _inputController = TextEditingController();
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _messages.add({
      'role': 'model',
      'text': 'Xin chào! Tôi là trợ lý AI của Axion ✨.\nTôi đã đọc bài viết "${widget.articleTitle}". Bạn có câu hỏi nào cần tôi giải đáp không?',
    });
  }

  Future<void> _sendMessage(String text) async {
    if (text.trim().isEmpty || _isLoading) return;

    final userMessage = {'role': 'user', 'text': text};
    setState(() {
      _messages.add(userMessage);
      _isLoading = true;
      _inputController.clear();
    });

    try {
      // Send history excluding the first greeting message
      final history = _messages.sublist(1, _messages.length - 1);
      final reply = await ref.read(articleRepositoryProvider).askAi(widget.articleId, text, history);
      
      if (!mounted) return;
      setState(() {
        _messages.add({'role': 'model', 'text': reply});
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.8,
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: Colors.grey.withValues(alpha: 0.2))),
            ),
            child: Row(
              children: [
                const Icon(Icons.auto_awesome, color: Colors.purple),
                const SizedBox(width: 8),
                const Text('Trợ lý AI Axion', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                )
              ],
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final msg = _messages[index];
                final isModel = msg['role'] == 'model';
                return Align(
                  alignment: isModel ? Alignment.centerLeft : Alignment.centerRight,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(12),
                    constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.8),
                    decoration: BoxDecoration(
                      color: isModel ? Theme.of(context).colorScheme.surfaceContainerHighest : Theme.of(context).colorScheme.primary,
                      borderRadius: BorderRadius.circular(16).copyWith(
                        bottomLeft: isModel ? const Radius.circular(0) : const Radius.circular(16),
                        bottomRight: !isModel ? const Radius.circular(0) : const Radius.circular(16),
                      ),
                    ),
                    child: Text(
                      msg['text'],
                      style: TextStyle(color: isModel ? Theme.of(context).colorScheme.onSurface : Colors.white),
                    ),
                  ),
                );
              },
            ),
          ),
          if (_isLoading)
            const Padding(
              padding: EdgeInsets.all(8.0),
              child: Center(child: CircularProgressIndicator()),
            ),
          if (!_isLoading && _messages.length == 1)
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  ActionChip(label: const Text('📝 Tóm tắt bài đăng'), onPressed: () => _sendMessage('Tóm tắt bài viết này')),
                  const SizedBox(width: 8),
                  ActionChip(label: const Text('💡 Nội dung cốt lõi'), onPressed: () => _sendMessage('Các từ khóa chính và nội dung quan trọng của bài viết này là gì?')),
                ],
              ),
            ),
          Padding(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(context).viewInsets.bottom + 16,
              left: 16,
              right: 16,
              top: 8,
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _inputController,
                    decoration: InputDecoration(
                      hintText: 'Hỏi AI bất kỳ điều gì...',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(20)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    ),
                    onSubmitted: _sendMessage,
                  ),
                ),
                const SizedBox(width: 8),
                CircleAvatar(
                  backgroundColor: Theme.of(context).colorScheme.primary,
                  child: IconButton(
                    icon: const Icon(Icons.send, color: Colors.white, size: 20),
                    onPressed: () => _sendMessage(_inputController.text),
                  ),
                )
              ],
            ),
          ),
        ],
      ),
    );
  }
}
