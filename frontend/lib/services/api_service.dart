import 'dart:async';
import 'package:dio/dio.dart';
import '../core/config.dart';
import 'secure_storage_service.dart';

class ApiService {
  late final Dio dio;
  final SecureStorageService _storageService;
  Completer<String?>? _refreshCompleter;

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
        if (!['/auth/login', '/auth/register', '/auth/refresh'].contains(options.path)) {
          final accessToken = await _storageService.getAccessToken();
          if (accessToken != null) {
            options.headers['Authorization'] = 'Bearer $accessToken';
          }
        }
        return handler.next(options);
      },
      onError: (DioException e, handler) async {
        if (e.response?.statusCode == 401 && !['/auth/login', '/auth/register', '/auth/refresh'].contains(e.requestOptions.path)) {
          if (_refreshCompleter != null) {
            final token = await _refreshCompleter!.future;
            if (token != null) {
              e.requestOptions.headers['Authorization'] = 'Bearer $token';
              return handler.resolve(await dio.fetch(e.requestOptions));
            }
            return handler.next(e);
          }
          _refreshCompleter = Completer<String?>();
          final refreshToken = await _storageService.getRefreshToken();
          if (refreshToken != null) {
            Dio tokenDio = Dio(BaseOptions(baseUrl: AppConfig.apiBaseUrl));
            try {
              final res = await tokenDio.post('/auth/refresh', data: {'refreshToken': refreshToken});
              final newAccess = res.data['accessToken'];
              final newRefresh = res.data['refreshToken'];
              await _storageService.saveTokens(accessToken: newAccess, refreshToken: newRefresh);
              _refreshCompleter!.complete(newAccess);
              _refreshCompleter = null;
              e.requestOptions.headers['Authorization'] = 'Bearer $newAccess';
              return handler.resolve(await dio.fetch(e.requestOptions));
            } catch (_) {
              await _storageService.clearTokens();
              _refreshCompleter!.complete(null);
              _refreshCompleter = null;
            }
          } else {
             _refreshCompleter!.complete(null);
             _refreshCompleter = null;
          }
        }
        return handler.next(e);
      },
    ));
  }
}
