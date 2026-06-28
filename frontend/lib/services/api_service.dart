import 'package:dio/dio.dart';
import '../core/config.dart';
import 'secure_storage_service.dart';

class ApiService {
  late final Dio dio;
  final SecureStorageService _storageService;

  ApiService(this._storageService) {
    dio = Dio(BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
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
