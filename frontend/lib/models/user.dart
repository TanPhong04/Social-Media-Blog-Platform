class User {
  final String id;
  final String email;
  final String displayName;
  final String? bio;
  final String? avatarUrl;
  final String? role;
  final DateTime? createdAt;

  User({
    required this.id,
    required this.email,
    required this.displayName,
    this.bio,
    this.avatarUrl,
    this.role,
    this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      email: json['email'] as String,
      displayName: json['displayName'] as String,
      bio: json['bio'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      role: json['role'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : null,
    );
  }
}
