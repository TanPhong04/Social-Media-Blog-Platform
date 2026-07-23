import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:stomp_dart_client/stomp_dart_client.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/constants/api_constants.dart';
import '../domain/models/chat_model.dart';

final chatRepositoryProvider = Provider<ChatRepository>((ref) {
  return ChatRepository(ref.read(dioProvider));
});

class ChatRepository {
  final Dio _dio;
  StompClient? _stompClient;
  void Function(ChatMessageModel)? onMessageReceived;
  void Function(String senderId, String signalPayload)? onSignalReceived;

  ChatRepository(this._dio);

  Future<void> connectWebSocket(String userId) async {
    if (_stompClient != null && _stompClient!.isActive) return;
    
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('accessToken') ?? '';

    _stompClient = StompClient(
      config: StompConfig(
        url: ApiConstants.wsUrl,
        webSocketConnectHeaders: {'Authorization': 'Bearer $token'},
        onConnect: (frame) {
          _stompClient?.subscribe(
            destination: '/user/$userId/queue/messages',
            callback: (frame) {
              if (frame.body != null) {
                final json = jsonDecode(frame.body!);
                final message = ChatMessageModel.fromJson(json);
                if (message.content.startsWith('WEBRTC_SIGNAL:')) {
                  // Forward signaling to a Stream or callback if needed
                  // But for simplicity, we can let CallProvider handle it or emit it here
                  // Since CallProvider and ChatRepository are separate, we can expose a signaling callback
                  if (onSignalReceived != null) {
                    onSignalReceived!(message.senderId, message.content.substring(14));
                  }
                } else {
                  if (onMessageReceived != null) {
                    onMessageReceived!(message);
                  }
                }
              }
            },
          );
        },
      ),
    );
    _stompClient?.activate();
  }

  void disconnectWebSocket() {
    _stompClient?.deactivate();
    _stompClient = null;
  }

  Future<List<ChatContactModel>> getContacts() async {
    try {
      final response = await _dio.get('/chats/contacts');
      final List<dynamic> data = response.data ?? [];
      return data.map((json) => ChatContactModel.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Không thể tải danh sách liên hệ');
    }
  }

  Future<List<ChatMessageModel>> getChatHistory(String contactId, {int page = 0, int size = 50}) async {
    try {
      final response = await _dio.get('/chats/$contactId', queryParameters: {
        'page': page,
        'size': size,
      });
      final List<dynamic> content = response.data['content'] ?? [];
      return content.map((json) => ChatMessageModel.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Không thể tải lịch sử trò chuyện');
    }
  }

  Future<void> sendMessage(String recipientId, String content) async {
    if (_stompClient != null && _stompClient!.isActive) {
      _stompClient?.send(
        destination: '/app/chat',
        body: jsonEncode({
          'recipientId': recipientId,
          'content': content,
        }),
      );
    } else {
      await _dio.post('/chats', data: {
        'recipientId': recipientId,
        'content': content,
      });
    }
  }

  void sendSignal(String recipientId, String type, Map<String, dynamic> payload) {
    if (_stompClient != null && _stompClient!.isActive) {
      _stompClient?.send(
        destination: '/app/chat', // Use chat endpoint to route message to recipient
        body: jsonEncode({
          'recipientId': recipientId,
          'content': 'WEBRTC_SIGNAL:${jsonEncode({'type': type, 'payload': payload})}',
        }),
      );
    }
  }
}

final contactsProvider = FutureProvider<List<ChatContactModel>>((ref) async {
  return ref.read(chatRepositoryProvider).getContacts();
});

final chatHistoryProvider = FutureProvider.family<List<ChatMessageModel>, String>((ref, contactId) async {
  return ref.read(chatRepositoryProvider).getChatHistory(contactId);
});
