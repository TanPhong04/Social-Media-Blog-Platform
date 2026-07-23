import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../auth/data/auth_repository.dart';
import '../../../auth/domain/models/user_model.dart';

class FollowListScreen extends ConsumerStatefulWidget {
  final String userId;
  final String type;

  const FollowListScreen({super.key, required this.userId, required this.type});

  @override
  ConsumerState<FollowListScreen> createState() => _FollowListScreenState();
}

class _FollowListScreenState extends ConsumerState<FollowListScreen> {
  List<UserModel> _users = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    try {
      final repo = ref.read(authRepositoryProvider);
      final users = widget.type == 'followers'
          ? await repo.getFollowers(widget.userId)
          : await repo.getFollowing(widget.userId);
      if (mounted) setState(() { _users = users; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.type == 'followers' ? 'Người theo dõi' : 'Đang theo dõi')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _users.isEmpty
              ? const Center(child: Text('Danh sách trống'))
              : ListView.builder(
                  itemCount: _users.length,
                  itemBuilder: (context, index) {
                    final u = _users[index];
                    return ListTile(
                      leading: CircleAvatar(
                        backgroundImage: CachedNetworkImageProvider(
                          u.avatarUrl ?? 'https://ui-avatars.com/api/?name=${u.displayName}',
                        ),
                      ),
                      title: Text(u.displayName),
                      subtitle: u.bio != null && u.bio!.isNotEmpty ? Text(u.bio!, maxLines: 1, overflow: TextOverflow.ellipsis) : null,
                    );
                  },
                ),
    );
  }
}
