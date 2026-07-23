import '../domain/models/article_model.dart';

bool isReel(ArticleModel article) {
  if (article.tags.contains('reel')) return true;
  if (article.content.isEmpty) return false;

  final videoMatches = RegExp(r'<video src="([^"]+)"').allMatches(article.content);
  final imageMatches = RegExp(r'!\[image\]\([^)]+\)').allMatches(article.content);

  return (videoMatches.length == 1) && (imageMatches.isEmpty);
}

List<ArticleModel> mixFeed(List<ArticleModel> articles, {int minPostsBetweenReels = 2}) {
  final List<ArticleModel> mixedFeed = [];
  final List<ArticleModel> postponedReels = [];

  int normalPostCountSinceLastReel = minPostsBetweenReels;

  for (final article in articles) {
    if (isReel(article)) {
      if (normalPostCountSinceLastReel >= minPostsBetweenReels) {
        mixedFeed.add(article);
        normalPostCountSinceLastReel = 0;
      } else {
        postponedReels.add(article);
      }
    } else {
      mixedFeed.add(article);
      normalPostCountSinceLastReel++;

      if (postponedReels.isNotEmpty && normalPostCountSinceLastReel >= minPostsBetweenReels) {
        mixedFeed.add(postponedReels.removeAt(0));
        normalPostCountSinceLastReel = 0;
      }
    }
  }

  return mixedFeed;
}
