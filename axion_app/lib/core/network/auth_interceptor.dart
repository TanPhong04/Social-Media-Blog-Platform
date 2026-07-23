import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AuthInterceptor extends Interceptor {
  @override
  Future<void> onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    // Retrieve token from SharedPreferences
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('accessToken');

    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }

    // Continue the request
    return handler.next(options);
  }

  @override
  Future<void> onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      // Handle Unauthorized error (e.g. token expired)
      // Clear token and force user to login
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('accessToken');
      
      // Note: Navigation to Login screen should be handled via a global navigator key 
      // or by listening to an auth state provider in Riverpod.
    }
    return handler.next(err);
  }
}
