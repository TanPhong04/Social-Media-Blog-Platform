class AppNotification {
  final String id;
  final String actorId;
  final String type;
  final String entityType;
  final String entityId;
  final String? metadata;
  final DateTime? createdAt;
  final DateTime? readAt;

  AppNotification({
    required this.id,
    required this.actorId,
    required this.type,
    required this.entityType,
    required this.entityId,
    this.metadata,
    this.createdAt,
    this.readAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id'] as String,
      actorId: json['actorId'] as String,
      type: json['type'] as String,
      entityType: json['entityType'] as String,
      entityId: json['entityId'] as String,
      metadata: json['metadata'] as String?,
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt'] as String) : null,
      readAt: json['readAt'] != null ? DateTime.parse(json['readAt'] as String) : null,
    );
  }
}
