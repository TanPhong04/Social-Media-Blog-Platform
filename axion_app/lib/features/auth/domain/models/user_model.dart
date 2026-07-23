class UserModel {
  final String id;
  final String email;
  final String displayName;
  final String? bio;
  final String? avatarUrl;
  final String role;
  final String? createdAt;

  UserModel({
    required this.id,
    required this.email,
    required this.displayName,
    this.bio,
    this.avatarUrl,
    required this.role,
    this.createdAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      email: json['email'] as String,
      displayName: json['displayName'] as String,
      bio: json['bio'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      role: json['role'] as String,
      createdAt: json['createdAt'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'displayName': displayName,
      'bio': bio,
      'avatarUrl': avatarUrl,
      'role': role,
      'createdAt': createdAt,
    };
  }
}

class RelationshipModel {
  final String targetId;
  final bool following;
  final int followerCount;
  final int followingCount;

  RelationshipModel({
    required this.targetId,
    required this.following,
    required this.followerCount,
    required this.followingCount,
  });

  factory RelationshipModel.fromJson(Map<String, dynamic> json) {
    return RelationshipModel(
      targetId: json['targetId'] as String,
      following: json['following'] as bool,
      followerCount: json['followerCount'] as int,
      followingCount: json['followingCount'] as int,
    );
  }
}

