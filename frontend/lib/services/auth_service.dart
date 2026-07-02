import '../models/auth_tokens.dart';
import '../models/user.dart';
import 'api_service.dart';
import 'secure_storage_service.dart';

class AuthService {
  final ApiService _apiService;
  final SecureStorageService _storageService;

  AuthService(this._apiService, this._storageService);

  Future<AuthTokens> login(String email, String password) async {
    final response = await _apiService.dio.post(
      '/auth/login',
      data: {'email': email, 'password': password},
    );
    final tokens = AuthTokens.fromJson(response.data);
    await _storageService.saveTokens(
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    );
    return tokens;
  }

  Future<AuthTokens> register(String email, String password, String displayName) async {
    final response = await _apiService.dio.post(
      '/auth/register',
      data: {
        'email': email,
        'password': password,
        'displayName': displayName,
      },
    );
    final tokens = AuthTokens.fromJson(response.data);
    await _storageService.saveTokens(
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    );
    return tokens;
  }

  Future<void> logout() async {
    try {
      final refreshToken = await _storageService.getRefreshToken();
      if (refreshToken != null) {
        await _apiService.dio.post(
          '/auth/logout',
          data: {'refreshToken': refreshToken},
        );
      }
    } catch (e) {
      // Ignore errors on logout
    } finally {
      await _storageService.clearTokens();
    }
  }

  Future<User> getMyProfile() async {
    final response = await _apiService.dio.get('/users/me');
    return User.fromJson(response.data);
  }
}
