import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/follow_service.dart';

class FollowButton extends StatefulWidget {
  final String targetId;
  const FollowButton({Key? key, required this.targetId}) : super(key: key);

  @override
  _FollowButtonState createState() => _FollowButtonState();
}

class _FollowButtonState extends State<FollowButton> {
  bool _following = false;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadState();
  }

  Future<void> _loadState() async {
    try {
      final service = context.read<FollowService>();
      final state = await service.getRelationship(widget.targetId);
      if (mounted) {
        setState(() {
          _following = state.following;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _toggleFollow() async {
    if (_isLoading) return;
    setState(() => _following = !_following);
    try {
      final service = context.read<FollowService>();
      if (_following) {
        await service.follow(widget.targetId);
      } else {
        await service.unfollow(widget.targetId);
      }
    } catch (_) {
      if (mounted) setState(() => _following = !_following);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const SizedBox(width: 80, height: 36, child: Center(child: CircularProgressIndicator(strokeWidth: 2)));
    
    return ElevatedButton(
      style: ElevatedButton.styleFrom(
        backgroundColor: _following ? Colors.grey[800] : Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
      ),
      onPressed: _toggleFollow,
      child: Text(_following ? 'Following' : 'Follow'),
    );
  }
}
