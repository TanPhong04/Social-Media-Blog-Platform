import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/auth_repository.dart';
import '../../domain/models/user_model.dart';

final authStateProvider = AsyncNotifierProvider<AuthNotifier, UserModel?>(() {
  return AuthNotifier();
});

class AuthNotifier extends AsyncNotifier<UserModel?> {
  @override
  FutureOr<UserModel?> build() async {
    return _checkAuthStatus();
  }

  Future<UserModel?> _checkAuthStatus() async {
    final repository = ref.read(authRepositoryProvider);
    try {
      final hasToken = await repository.hasToken();
      if (hasToken) {
        return await repository.getProfile();
      }
    } catch (e) {
      await repository.logout();
    }
    return null;
  }

  Future<void> login(String email, String password) async {
    final repository = ref.read(authRepositoryProvider);
    
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      await repository.login(email, password);
      return repository.getProfile();
    });
  }

  Future<void> loginWithGoogle(String idToken) async {
    final repository = ref.read(authRepositoryProvider);
    
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      await repository.googleLogin(idToken);
      return repository.getProfile();
    });
  }

  Future<void> logout() async {
    final repository = ref.read(authRepositoryProvider);
    await repository.logout();
    state = const AsyncValue.data(null);
  }
}
