import '../models/interaction_state.dart';
import 'api_service.dart';

class InteractionService {
  final ApiService _apiService;

  InteractionService(this._apiService);

  Future<InteractionState> getInteractionState(String type, String targetId) async {
    final response = await _apiService.dio.get('/interactions/$type/$targetId');
    return InteractionState.fromJson(response.data);
  }

  Future<InteractionState> like(String type, String targetId) async {
    final response = await _apiService.dio.put('/interactions/$type/$targetId/like');
    return InteractionState.fromJson(response.data);
  }

  Future<InteractionState> unlike(String type, String targetId) async {
    final response = await _apiService.dio.delete('/interactions/$type/$targetId/like');
    return InteractionState.fromJson(response.data);
  }
}
