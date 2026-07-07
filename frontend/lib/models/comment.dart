class Comment {
  final String id;
  final String articleId;
  final String? authorId;
  final String? parentId;
  final String content;
  final String status;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Comment({
    required this.id,
    required this.articleId,
    this.authorId,
    this.parentId,
    required this.content,
    required this.status,
    this.createdAt,
    this.updatedAt,
  });

  factory Comment.fromJson(Map<String, dynamic> json) {
    return Comment(
      id: json['id'] as String,
      articleId: json['articleId'] as String,
      authorId: json['authorId'] as String?,
      parentId: json['parentId'] as String?,
      content: json['content'] as String,
      status: json['status'] as String,
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt'] as String) : null,
      updatedAt: json['updatedAt'] != null ? DateTime.parse(json['updatedAt'] as String) : null,
    );
  }
}
