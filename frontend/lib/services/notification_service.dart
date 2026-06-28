import '../models/notification.dart';
import '../models/page.dart';
import 'api_service.dart';

class NotificationService {
  final ApiService _apiService;

  NotificationService(this._apiService);

  Future<PageData<AppNotification>> getNotifications({int page = 0, int size = 20}) async {
    final response = await _apiService.dio.get('/notifications', queryParameters: {'page': page, 'size': size});
    return PageData.fromJson(response.data, AppNotification.fromJson);
  }

  Future<int> getUnreadCount() async {
    final response = await _apiService.dio.get('/notifications/unread-count');
    return response.data['count'] as int;
  }

  Future<AppNotification> markAsRead(String id) async {
    final response = await _apiService.dio.patch('/notifications/$id/read');
    return AppNotification.fromJson(response.data);
  }

  Future<int> markAllAsRead() async {
    final response = await _apiService.dio.patch('/notifications/read-all');
    return response.data['count'] as int;
  }
}
