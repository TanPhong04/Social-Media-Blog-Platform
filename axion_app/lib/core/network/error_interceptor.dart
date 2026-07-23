import 'dart:io';
import 'package:dio/dio.dart';

class ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    String errorMessage = err.message ?? 'Đã xảy ra lỗi kết nối';

    if (err.type == DioExceptionType.connectionTimeout ||
        err.type == DioExceptionType.sendTimeout ||
        err.type == DioExceptionType.receiveTimeout) {
      errorMessage = 'Kết nối quá hạn. Vui lòng kiểm tra lại mạng.';
    } else if (err.error is SocketException) {
      errorMessage = 'Không có kết nối mạng. Vui lòng kiểm tra WiFi hoặc 3G/4G.';
    } else if (err.type == DioExceptionType.badResponse) {
      errorMessage = 'Lỗi máy chủ (${err.response?.statusCode}). Vui lòng thử lại sau.';
    } else if (err.type == DioExceptionType.cancel) {
      errorMessage = 'Yêu cầu bị hủy.';
    } else if (err.type == DioExceptionType.unknown) {
      if (err.message != null && err.message!.contains('SocketException')) {
        errorMessage = 'Không có kết nối mạng.';
      } else {
        errorMessage = 'Lỗi không xác định. Vui lòng thử lại.';
      }
    }

    final newErr = err.copyWith(message: errorMessage);
    return handler.next(newErr);
  }
}
