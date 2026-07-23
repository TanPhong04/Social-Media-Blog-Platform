import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:image_picker/image_picker.dart';

import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../auth/data/auth_repository.dart';
import '../../../../core/theme/theme_provider.dart';
import '../../../feed/data/article_repository.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  final _nameController = TextEditingController();
  final _bioController = TextEditingController();
  final _oldPassController = TextEditingController();
  final _newPassController = TextEditingController();
  final _confirmPassController = TextEditingController();
  final _picker = ImagePicker();

  bool _saving = false;
  bool _changingPass = false;
  bool _showOldPass = false;
  bool _showNewPass = false;
  bool _showConfirmPass = false;
  String? _avatarUrl;
  String? _accountMsg;
  bool _accountSuccess = false;
  String? _passMsg;
  bool _passSuccess = false;
  bool _notificationsEnabled = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadProfile();
    });
  }

  void _loadProfile() {
    final user = ref.read(authStateProvider).value;
    if (user != null) {
      _nameController.text = user.displayName;
      _bioController.text = user.bio ?? '';
      setState(() => _avatarUrl = user.avatarUrl);
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _bioController.dispose();
    _oldPassController.dispose();
    _newPassController.dispose();
    _confirmPassController.dispose();
    super.dispose();
  }

  Future<void> _pickAvatar() async {
    final file = await _picker.pickImage(source: ImageSource.gallery);
    if (file == null) return;
    try {
      final url = await ref.read(articleRepositoryProvider).uploadMedia(file.path);
      setState(() => _avatarUrl = url);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Tải ảnh thất bại')));
    }
  }

  Future<void> _saveAccount() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) {
      setState(() {
        _accountMsg = 'Tên hiển thị không được bỏ trống';
        _accountSuccess = false;
      });
      return;
    }
    setState(() {
      _saving = true;
      _accountMsg = null;
    });
    try {
      await ref.read(authRepositoryProvider).updateProfile(name, _bioController.text.trim(), _avatarUrl);
      setState(() {
        _accountMsg = 'Cập nhật thông tin thành công';
        _accountSuccess = true;
      });
    } catch (e) {
      setState(() {
        _accountMsg = e.toString().replaceFirst('Exception: ', '');
        _accountSuccess = false;
      });
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _changePassword() async {
    final oldPass = _oldPassController.text;
    final newPass = _newPassController.text;
    final confirmPass = _confirmPassController.text;

    if (oldPass.isEmpty || newPass.isEmpty || confirmPass.isEmpty) {
      setState(() {
        _passMsg = 'Vui lòng điền đầy đủ thông tin';
        _passSuccess = false;
      });
      return;
    }
    if (newPass.length < 8) {
      setState(() {
        _passMsg = 'Mật khẩu mới phải từ 8 ký tự trở lên';
        _passSuccess = false;
      });
      return;
    }
    if (newPass != confirmPass) {
      setState(() {
        _passMsg = 'Mật khẩu xác nhận không trùng khớp';
        _passSuccess = false;
      });
      return;
    }

    setState(() {
      _changingPass = true;
      _passMsg = null;
    });
    try {
      await ref.read(authRepositoryProvider).changePassword(oldPass, newPass);
      setState(() {
        _passMsg = 'Đổi mật khẩu thành công!';
        _passSuccess = true;
      });
      _oldPassController.clear();
      _newPassController.clear();
      _confirmPassController.clear();
    } catch (e) {
      setState(() {
        _passMsg = e.toString().replaceFirst('Exception: ', '');
        _passSuccess = false;
      });
    } finally {
      if (mounted) setState(() => _changingPass = false);
    }
  }

  Future<void> _logout() async {
    await ref.read(authStateProvider.notifier).logout();
    if (mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final themeMode = ref.watch(themeModeProvider);
    final isDark = themeMode == ThemeMode.dark || (themeMode == ThemeMode.system && MediaQuery.of(context).platformBrightness == Brightness.dark);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Cài đặt', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 40),
        children: [
          // === Account Section ===
          _buildCard(
            theme,
            icon: Icons.person_outline,
            title: 'Tài khoản',
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                child: Row(
                  children: [
                    Stack(
                      children: [
                        CircleAvatar(
                          radius: 44,
                          backgroundImage: _avatarUrl != null
                              ? CachedNetworkImageProvider(_avatarUrl!)
                              : null,
                          child: _avatarUrl == null
                              ? Icon(Icons.person, size: 44, color: theme.colorScheme.onSurfaceVariant)
                              : null,
                        ),
                        Positioned(
                          bottom: 0,
                          right: 0,
                          child: GestureDetector(
                            onTap: _pickAvatar,
                            child: Container(
                              padding: const EdgeInsets.all(4),
                              decoration: BoxDecoration(
                                color: theme.colorScheme.primary,
                                shape: BoxShape.circle,
                                border: Border.all(color: theme.colorScheme.surface, width: 2),
                              ),
                              child: const Icon(Icons.camera_alt, color: Colors.white, size: 16),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(width: 20),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _nameController.text.isNotEmpty ? _nameController.text : 'Tên của bạn',
                            style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Nhấn để thay đổi ảnh',
                            style: TextStyle(fontSize: 13, color: theme.colorScheme.primary),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              if (_accountMsg != null)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: _accountSuccess ? Colors.green.withValues(alpha: 0.1) : Colors.red.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: _accountSuccess ? Colors.green.withValues(alpha: 0.3) : Colors.red.withValues(alpha: 0.3),
                      ),
                    ),
                    child: Text(
                      _accountMsg!,
                      style: TextStyle(
                        fontSize: 13,
                        color: _accountSuccess ? Colors.green.shade700 : Colors.red.shade700,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ),
              if (_accountMsg != null) const SizedBox(height: 12),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: TextField(
                  controller: _nameController,
                  decoration: const InputDecoration(
                    labelText: 'Tên hiển thị',
                    border: OutlineInputBorder(),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: TextField(
                  controller: _bioController,
                  maxLines: 3,
                  decoration: const InputDecoration(
                    labelText: 'Tiểu sử',
                    border: OutlineInputBorder(),
                    hintText: 'Mô tả ngắn gọn về bạn...',
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: _saving ? null : _saveAccount,
                    child: _saving
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Text('Lưu thay đổi'),
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
          const SizedBox(height: 20),

          // === Preferences Section ===
          _buildCard(
            theme,
            icon: Icons.palette_outlined,
            title: 'Tùy chọn',
            children: [
              _buildSwitchTile(
                theme,
                icon: Icons.dark_mode_outlined,
                title: 'Chế độ tối',
                subtitle: 'Hiển thị ứng dụng với nền tối dễ chịu',
                value: isDark,
                onChanged: (v) {
                  ref.read(themeModeProvider.notifier).setThemeMode(v ? ThemeMode.dark : ThemeMode.light);
                },
              ),
              const Divider(height: 1, indent: 56, endIndent: 16),
              _buildSwitchTile(
                theme,
                icon: Icons.notifications_outlined,
                title: 'Thông báo hệ thống',
                subtitle: 'Nhận thông báo khi có người tương tác và gửi tin nhắn',
                value: _notificationsEnabled,
                onChanged: (v) => setState(() => _notificationsEnabled = v),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // === Security Section ===
          _buildCard(
            theme,
            icon: Icons.lock_outline,
            title: 'Bảo mật',
            children: [
              if (_passMsg != null)
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: _passSuccess ? Colors.green.withValues(alpha: 0.1) : Colors.red.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: _passSuccess ? Colors.green.withValues(alpha: 0.3) : Colors.red.withValues(alpha: 0.3),
                      ),
                    ),
                    child: Text(
                      _passMsg!,
                      style: TextStyle(
                        fontSize: 13,
                        color: _passSuccess ? Colors.green.shade700 : Colors.red.shade700,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ),
              Padding(
                padding: EdgeInsets.fromLTRB(16, _passMsg != null ? 12 : 16, 16, 0),
                child: _buildPasswordField(
                  controller: _oldPassController,
                  label: 'Mật khẩu hiện tại',
                  show: _showOldPass,
                  toggleShow: () => setState(() => _showOldPass = !_showOldPass),
                  theme: theme,
                ),
              ),
              const SizedBox(height: 12),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: _buildPasswordField(
                  controller: _newPassController,
                  label: 'Mật khẩu mới (Tối thiểu 8 ký tự)',
                  show: _showNewPass,
                  toggleShow: () => setState(() => _showNewPass = !_showNewPass),
                  theme: theme,
                ),
              ),
              const SizedBox(height: 12),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: _buildPasswordField(
                  controller: _confirmPassController,
                  label: 'Xác nhận mật khẩu mới',
                  show: _showConfirmPass,
                  toggleShow: () => setState(() => _showConfirmPass = !_showConfirmPass),
                  theme: theme,
                ),
              ),
              const SizedBox(height: 16),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: _changingPass ? null : _changePassword,
                    child: _changingPass
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Text('Cập nhật mật khẩu'),
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
          const SizedBox(height: 32),

          // === Logout ===
          OutlinedButton.icon(
            onPressed: _logout,
            icon: const Icon(Icons.logout, size: 20),
            label: const Text('Đăng xuất tài khoản', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.red,
              side: BorderSide(color: Colors.red.withValues(alpha: 0.3)),
              minimumSize: const Size(double.infinity, 50),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCard(ThemeData theme, {required IconData icon, required String title, required List<Widget> children}) {
    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: theme.colorScheme.outlineVariant.withValues(alpha: 0.3)),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primaryContainer.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: theme.colorScheme.primary, size: 20),
                ),
                const SizedBox(width: 12),
                Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
          ...children,
        ],
      ),
    );
  }

  Widget _buildSwitchTile(
    ThemeData theme, {
    required IconData icon,
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: theme.colorScheme.onSurfaceVariant, size: 20),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text(subtitle, style: TextStyle(fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
              ],
            ),
          ),
          Switch.adaptive(
            value: value,
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }

  Widget _buildPasswordField({
    required TextEditingController controller,
    required String label,
    required bool show,
    required VoidCallback toggleShow,
    required ThemeData theme,
  }) {
    return TextField(
      controller: controller,
      obscureText: !show,
      decoration: InputDecoration(
        labelText: label,
        border: const OutlineInputBorder(),
        suffixIcon: IconButton(
          icon: Icon(show ? Icons.visibility_off : Icons.visibility, size: 20),
          onPressed: toggleShow,
        ),
      ),
    );
  }
}
