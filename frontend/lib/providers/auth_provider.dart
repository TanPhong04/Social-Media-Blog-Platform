import 'package:flutter/foundation.dart';
import '../models/user.dart';
import '../services/auth_service.dart';
import '../services/secure_storage_service.dart';

class AuthProvider with ChangeNotifier {
  final AuthService _authService;
  final SecureStorageService _storageService;

  User? _currentUser;
  bool _isLoading = true;

  AuthProvider(this._authService, this._storageService) {
    _init();
  }

  User? get currentUser => _currentUser;
  bool get isAuthenticated => _currentUser != null;
  bool get isLoading => _isLoading;

  Future<void> _init() async {
    final token = await _storageService.getAccessToken();
    if (token != null) {
      try {
        _currentUser = await _authService.getMyProfile();
      } catch (e) {
        await _storageService.clearTokens();
      }
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> login(String email, String password) async {
    _isLoading = true;
    notifyListeners();
    try {
      await _authService.login(email, password);
      _currentUser = await _authService.getMyProfile();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> register(String email, String password, String displayName) async {
    _isLoading = true;
    notifyListeners();
    try {
      await _authService.register(email, password, displayName);
      _currentUser = await _authService.getMyProfile();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();
    await _authService.logout();
    _currentUser = null;
    _isLoading = false;
    notifyListeners();
  }
}
