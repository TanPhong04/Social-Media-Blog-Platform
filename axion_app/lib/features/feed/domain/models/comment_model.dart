class CommentModel {
  final String id;
  final String articleId;
  final String authorId;
  final String? parentId;
  final String content;
  final String createdAt;
  
  // Might come from backend mapping
  final String? authorName;
  final String? authorAvatar;

  CommentModel({
    required this.id,
    required this.articleId,
    required this.authorId,
    this.parentId,
    required this.content,
    required this.createdAt,
    this.authorName,
    this.authorAvatar,
  });

  factory CommentModel.fromJson(Map<String, dynamic> json) {
    return CommentModel(
      id: json['id'] as String,
      articleId: json['articleId'] as String,
      authorId: json['authorId'] as String,
      parentId: json['parentId'] as String?,
      content: json['content'] as String,
      createdAt: json['createdAt'] as String,
      authorName: json['authorName'] as String?,
      authorAvatar: json['authorAvatar'] as String?,
    );
  }
}
