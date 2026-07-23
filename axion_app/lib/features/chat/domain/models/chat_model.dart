class ChatContactModel {
  final String contactId;
  final String displayName;
  final String? avatarUrl;
  final String lastMessage;
  final String lastMessageTime;
  final int unreadCount;
  final bool isOnline;
  final int missedCallCount;

  ChatContactModel({
    required this.contactId,
    this.displayName = '',
    this.avatarUrl,
    required this.lastMessage,
    required this.lastMessageTime,
    required this.unreadCount,
    required this.isOnline,
    this.missedCallCount = 0,
  });

  factory ChatContactModel.fromJson(Map<String, dynamic> json) {
    return ChatContactModel(
      contactId: json['contactId'] as String,
      displayName: json['displayName'] as String? ?? json['contactId'] as String,
      avatarUrl: json['avatarUrl'] as String?,
      lastMessage: json['lastMessage'] as String,
      lastMessageTime: json['lastMessageTime'] as String,
      unreadCount: json['unreadCount'] as int? ?? 0,
      isOnline: json['isOnline'] as bool? ?? false,
      missedCallCount: json['missedCallCount'] as int? ?? 0,
    );
  }
}

class ChatMessageModel {
  final String id;
  final String senderId;
  final String recipientId;
  final String content;
  final String createdAt;
  final bool isRead;
  final String? senderName;
  final String? senderAvatar;

  ChatMessageModel({
    required this.id,
    required this.senderId,
    required this.recipientId,
    required this.content,
    required this.createdAt,
    required this.isRead,
    this.senderName,
    this.senderAvatar,
  });

  factory ChatMessageModel.fromJson(Map<String, dynamic> json) {
    return ChatMessageModel(
      id: json['id'] as String,
      senderId: json['senderId'] as String,
      recipientId: json['recipientId'] as String,
      content: json['content'] as String,
      createdAt: json['createdAt'] as String,
      isRead: json['isRead'] as bool? ?? false,
      senderName: json['senderName'] as String?,
      senderAvatar: json['senderAvatar'] as String?,
    );
  }
}

enum CallLogType { missed, rejected, ended, callLog }

CallLogType parseCallLogType(String type) {
  switch (type) {
    case 'MISSED':
      return CallLogType.missed;
    case 'REJECTED':
      return CallLogType.rejected;
    case 'ENDED':
      return CallLogType.ended;
    default:
      return CallLogType.callLog;
  }
}
