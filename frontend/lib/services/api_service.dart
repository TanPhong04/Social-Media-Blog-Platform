import 'package:dio/dio.dart';
import 'secure_storage_service.dart';

class ApiService {
  late final Dio dio;
  final SecureStorageService _storageService;

  // Use 10.0.2.2 if testing on Android Emulator, or localhost for web/desktop.
  // We use localhost here since we are targeting web/desktop according to tests.
  static const String baseUrl = 'http://localhost:8080/api/v1';

  ApiService(this._storageService) {
    dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {
        'Content-Type': 'application/json',
      },
    ));

    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        // Skip auth header for register, login, refresh
        if (!options.path.contains('/auth/')) {
          final accessToken = await _storageService.getAccessToken();
          if (accessToken != null) {
            options.headers['Authorization'] = 'Bearer $accessToken';
          }
        }
        return handler.next(options);
      },
      onError: (DioException e, handler) async {
        // TODO: Handle token refresh logic automatically if 401
        return handler.next(e);
      },
    ));
  }
}
