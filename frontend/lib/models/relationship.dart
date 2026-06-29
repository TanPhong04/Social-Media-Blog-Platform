class Relationship {
  final String targetId;
  final bool following;
  final int followerCount;
  final int followingCount;

  Relationship({
    required this.targetId,
    required this.following,
    required this.followerCount,
    required this.followingCount,
  });

  factory Relationship.fromJson(Map<String, dynamic> json) {
    return Relationship(
      targetId: json['targetId'] as String,
      following: json['following'] as bool? ?? false,
      followerCount: json['followerCount'] as int? ?? 0,
      followingCount: json['followingCount'] as int? ?? 0,
    );
  }
}
