import '../models/relationship.dart';
import 'api_service.dart';

class FollowService {
  final ApiService _apiService;

  FollowService(this._apiService);

  Future<Relationship> getRelationship(String targetId) async {
    final response = await _apiService.dio.get('/follows/status/$targetId');
    return Relationship.fromJson(response.data);
  }

  Future<Relationship> follow(String targetId) async {
    final response = await _apiService.dio.put('/follows/$targetId');
    return Relationship.fromJson(response.data);
  }

  Future<Relationship> unfollow(String targetId) async {
    final response = await _apiService.dio.delete('/follows/$targetId');
    return Relationship.fromJson(response.data);
  }
}
