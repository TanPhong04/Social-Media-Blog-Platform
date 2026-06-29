class Article {
  final String id;
  final String? authorId;
  final String title;
  final String? slug;
  final String? summary;
  final String? content;
  final String status;
  final List<String> tags;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final DateTime? publishedAt;

  Article({
    required this.id,
    this.authorId,
    required this.title,
    this.slug,
    this.summary,
    this.content,
    required this.status,
    required this.tags,
    this.createdAt,
    this.updatedAt,
    this.publishedAt,
  });

  factory Article.fromJson(Map<String, dynamic> json) {
    return Article(
      id: json['id'] as String,
      authorId: json['authorId'] as String?,
      title: json['title'] as String,
      slug: json['slug'] as String?,
      summary: json['summary'] as String?,
      content: json['content'] as String?,
      status: json['status'] as String,
      tags: (json['tags'] as List<dynamic>?)?.map((e) => e as String).toList() ?? [],
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt'] as String) : null,
      updatedAt: json['updatedAt'] != null ? DateTime.parse(json['updatedAt'] as String) : null,
      publishedAt: json['publishedAt'] != null ? DateTime.parse(json['publishedAt'] as String) : null,
    );
  }
}
