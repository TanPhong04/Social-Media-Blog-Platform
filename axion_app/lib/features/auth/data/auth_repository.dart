import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/dio_client.dart';
import '../domain/models/user_model.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ref.read(dioProvider));
});

class AuthRepository {
  final Dio _dio;

  AuthRepository(this._dio);

  Future<String> login(String email, String password) async {
    try {
      final response = await _dio.post(
        ApiConstants.login,
        data: {
          'email': email,
          'password': password,
        },
      );
      
      final token = response.data['accessToken'] as String;
      
      // Save token securely
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('accessToken', token);
      
      return token;
    } on DioException catch (e) {
      if (e.response != null && e.response?.data != null) {
        throw Exception(e.response?.data['message'] ?? 'Đăng nhập thất bại.');
      }
      throw Exception('Không thể kết nối đến máy chủ.');
    }
  }

  Future<String> googleLogin(String idToken) async {
    try {
      final response = await _dio.post(
        ApiConstants.googleLogin,
        data: {
          'idToken': idToken,
        },
      );
      
      final token = response.data['accessToken'] as String;
      
      // Save token securely
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('accessToken', token);
      
      return token;
    } on DioException catch (e) {
      if (e.response != null && e.response?.data != null) {
        throw Exception(e.response?.data['message'] ?? 'Đăng nhập Google thất bại.');
      }
      throw Exception('Không thể kết nối đến máy chủ.');
    }
  }

  Future<void> register(String email, String displayName, String password) async {
    try {
      await _dio.post(
        '/auth/register',
        data: {
          'email': email,
          'displayName': displayName,
          'password': password,
        },
      );
    } on DioException catch (e) {
      if (e.response != null && e.response?.data != null) {
        throw Exception(e.response?.data['message'] ?? 'Đăng ký thất bại.');
      }
      throw Exception('Không thể kết nối đến máy chủ.');
    }
  }

  Future<UserModel> getProfile() async {
    try {
      final response = await _dio.get('/users/me');
      return UserModel.fromJson(response.data);
    } on DioException {
      throw Exception('Không thể tải thông tin cá nhân.');
    }
  }

  Future<UserModel> updateProfile(String displayName, String bio, String? avatarUrl) async {
    try {
      final data = {
        'displayName': displayName,
        'bio': bio,
      };
      if (avatarUrl != null) {
        data['avatarUrl'] = avatarUrl;
      }
      final response = await _dio.put('/users/me', data: data);
      return UserModel.fromJson(response.data);
    } on DioException catch (e) {
      if (e.response != null && e.response?.data != null) {
        throw Exception(e.response?.data['message'] ?? 'Cập nhật thất bại.');
      }
      throw Exception('Không thể kết nối đến máy chủ.');
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('accessToken');
  }

  Future<RelationshipModel> getFollowStatus(String userId) async {
    try {
      final response = await _dio.get('/follows/status/$userId');
      return RelationshipModel.fromJson(response.data);
    } on DioException catch (e) {
      throw Exception('Không thể tải thông tin theo dõi: ${e.message}');
    }
  }

  Future<RelationshipModel> followUser(String userId) async {
    try {
      final response = await _dio.put('/follows/$userId');
      return RelationshipModel.fromJson(response.data);
    } on DioException catch (e) {
      throw Exception('Không thể theo dõi: ${e.message}');
    }
  }

  Future<RelationshipModel> unfollowUser(String userId) async {
    try {
      final response = await _dio.delete('/follows/$userId');
      return RelationshipModel.fromJson(response.data);
    } on DioException catch (e) {
      throw Exception('Không thể hủy theo dõi: ${e.message}');
    }
  }

  Future<UserModel> getUserById(String userId) async {
    try {
      final response = await _dio.get('/users/$userId');
      return UserModel.fromJson(response.data);
    } on DioException {
      throw Exception('Không thể tải thông tin người dùng.');
    }
  }

  Future<List<UserModel>> getFollowers(String userId, {int page = 0, int size = 20}) async {
    try {
      final response = await _dio.get('/follows/followers/$userId', queryParameters: {'page': page, 'size': size});
      final List<dynamic> data = response.data is List ? response.data : (response.data['content'] ?? []);
      return data.map((json) => UserModel.fromJson(json)).toList();
    } on DioException catch (e) {
      throw Exception('Không thể tải danh sách người theo dõi: ${e.message}');
    }
  }

  Future<List<UserModel>> getFollowing(String userId, {int page = 0, int size = 20}) async {
    try {
      final response = await _dio.get('/follows/following/$userId', queryParameters: {'page': page, 'size': size});
      final List<dynamic> data = response.data is List ? response.data : (response.data['content'] ?? []);
      return data.map((json) => UserModel.fromJson(json)).toList();
    } on DioException catch (e) {
      throw Exception('Không thể tải danh sách đang theo dõi: ${e.message}');
    }
  }

  Future<void> changePassword(String currentPassword, String newPassword) async {
    try {
      await _dio.post(
        '/users/me/password',
        data: {
          'currentPassword': currentPassword,
          'newPassword': newPassword,
        },
      );
    } on DioException catch (e) {
      if (e.response != null && e.response?.data != null) {
        throw Exception(e.response?.data['message'] ?? 'Đổi mật khẩu thất bại.');
      }
      throw Exception('Không thể kết nối đến máy chủ.');
    }
  }
  
  Future<bool> hasToken() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('accessToken');
    return token != null && token.isNotEmpty;
  }
}
