import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/interaction_service.dart';

class LikeButton extends StatefulWidget {
  final String targetType;
  final String targetId;
  const LikeButton({super.key, required this.targetType, required this.targetId});

  @override
  State<LikeButton> createState() => _LikeButtonState();
}

class _LikeButtonState extends State<LikeButton> {
  bool _liked = false;
  int _count = 0;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadState();
  }

  Future<void> _loadState() async {
    try {
      final service = context.read<InteractionService>();
      final state = await service.getInteractionState(widget.targetType, widget.targetId);
      if (mounted) {
        setState(() {
          _liked = state.liked;
          _count = state.count;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _toggleLike() async {
    if (_isLoading) return;
    setState(() {
      _liked = !_liked;
      _count += _liked ? 1 : -1;
    });
    try {
      final service = context.read<InteractionService>();
      if (_liked) {
        await service.like(widget.targetType, widget.targetId);
      } else {
        await service.unlike(widget.targetType, widget.targetId);
      }
    } catch (_) {
      // Revert optimistic update
      if (mounted) {
        setState(() {
          _liked = !_liked;
          _count += _liked ? 1 : -1;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const SizedBox(width: 48, height: 48, child: Center(child: CircularProgressIndicator(strokeWidth: 2)));
    
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        IconButton(
          icon: Icon(_liked ? Icons.favorite : Icons.favorite_border),
          color: _liked ? Colors.redAccent : Theme.of(context).colorScheme.onSurface,
          onPressed: _toggleLike,
        ),
        Text('$_count', style: Theme.of(context).textTheme.bodyMedium),
      ],
    );
  }
}
