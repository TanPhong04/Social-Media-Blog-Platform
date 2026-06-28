class InteractionState {
  final String targetType;
  final String targetId;
  final bool liked;
  final int count;

  InteractionState({
    required this.targetType,
    required this.targetId,
    required this.liked,
    required this.count,
  });

  factory InteractionState.fromJson(Map<String, dynamic> json) {
    return InteractionState(
      targetType: json['targetType'] as String,
      targetId: json['targetId'] as String,
      liked: json['liked'] as bool? ?? false,
      count: json['count'] as int? ?? 0,
    );
  }
}
