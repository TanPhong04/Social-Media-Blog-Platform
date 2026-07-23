class NotificationModel {
  final String id;
  final String type;
  final String actorId;
  final String actorName;
  final String? actorAvatarUrl;
  final String targetId;
  final bool isRead;
  final String createdAt;
  final String? entityType;
  final String? entityId;
  final String? metadata;

  NotificationModel({
    required this.id,
    required this.type,
    required this.actorId,
    this.actorName = '',
    this.actorAvatarUrl,
    this.targetId = '',
    required this.isRead,
    required this.createdAt,
    this.entityType,
    this.entityId,
    this.metadata,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    final readAt = json['readAt'];
    final isRead = readAt != null && readAt.toString().isNotEmpty;
    return NotificationModel(
      id: json['id'] as String,
      type: json['type'] as String? ?? '',
      actorId: json['actorId'] as String,
      actorName: json['actorName'] as String? ?? '',
      actorAvatarUrl: json['actorAvatarUrl'] as String?,
      targetId: json['targetId'] as String? ?? json['entityId'] as String? ?? '',
      isRead: isRead,
      createdAt: json['createdAt'] as String,
      entityType: json['entityType'] as String?,
      entityId: json['entityId'] as String?,
      metadata: json['metadata'] as String?,
    );
  }
}
