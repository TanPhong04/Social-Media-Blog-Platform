class ArticleModel {
  final String id;
  final String authorId;
  final String title;
  final String slug;
  final String summary;
  final String content;
  final String status;
  final List<String> tags;
  final String createdAt;
  final String? publishedAt;
  
  // Computed or populated fields from backend (often joined in API)
  final String? authorName;
  final String? authorAvatar;
  final String? mediaUrl;

  ArticleModel({
    required this.id,
    required this.authorId,
    required this.title,
    required this.slug,
    required this.summary,
    required this.content,
    required this.status,
    required this.tags,
    required this.createdAt,
    this.publishedAt,
    this.authorName,
    this.authorAvatar,
    this.mediaUrl,
  });

  factory ArticleModel.fromJson(Map<String, dynamic> json) {
    return ArticleModel(
      id: json['id'] as String,
      authorId: json['authorId'] as String,
      title: json['title'] ?? '',
      slug: json['slug'] ?? '',
      summary: json['summary'] ?? '',
      content: json['content'] ?? '',
      status: json['status'] ?? 'PUBLISHED',
      tags: (json['tags'] as List<dynamic>?)?.map((e) => e as String).toList() ?? [],
      createdAt: json['createdAt'] as String,
      publishedAt: json['publishedAt'] as String?,
      
      // Some backends might include author info in the feed response
      authorName: json['authorName'] as String?,
      authorAvatar: json['authorAvatar'] as String?,
      mediaUrl: json['mediaUrl'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'authorId': authorId,
      'title': title,
      'slug': slug,
      'summary': summary,
      'content': content,
      'mediaUrl': mediaUrl,
      'tags': tags,
      'status': status,
      'createdAt': createdAt,
      'publishedAt': publishedAt,
      'authorAvatar': authorAvatar,
      'authorName': authorName,
    };
  }
}

