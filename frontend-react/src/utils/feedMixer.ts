import type { ArticleResponse } from '../api/articleApi';

export interface FeedMixerOptions {
  /** Minimum number of normal posts required between two reels */
  minPostsBetweenReels?: number;
}

/**
 * Determines if an article is considered a Reel.
 */
export const isReel = (article: ArticleResponse): boolean => {
  if (article.tags && article.tags.includes('reel')) return true;
  if (!article.content) return false;
  
  const videoMatches = article.content.match(/<video src="([^"]+)"/g);
  const imageMatches = article.content.match(/!\[image\]\([^)]+\)/g);
  
  return (videoMatches?.length === 1) && (!imageMatches || imageMatches.length === 0);
};

/**
 * Mixes the feed to ensure a balanced distribution of content types (e.g., Posts and Reels).
 * 
 * Rules applied:
 * 1. Never allow two Reel items to appear consecutively.
 * 2. Always insert at least `minPostsBetweenReels` normal posts between two reels.
 * 3. If there are insufficient normal posts, extra reels are postponed (and dropped from this batch if they can't be placed).
 * 4. Preserves the original logical ordering as much as possible.
 */
export const mixFeed = (
  articles: ArticleResponse[], 
  options: FeedMixerOptions = {}
): ArticleResponse[] => {
  const { minPostsBetweenReels = 2 } = options;
  
  const mixedFeed: ArticleResponse[] = [];
  const postponedReels: ArticleResponse[] = [];
  
  // Initialize to minPostsBetweenReels so a reel can appear as the very first item if it naturally occurs there.
  let normalPostCountSinceLastReel = minPostsBetweenReels;
  
  for (const article of articles) {
    if (isReel(article)) {
      if (normalPostCountSinceLastReel >= minPostsBetweenReels) {
        // Safe to insert a reel
        mixedFeed.push(article);
        normalPostCountSinceLastReel = 0;
      } else {
        // Too soon for another reel, postpone it
        postponedReels.push(article);
      }
    } else {
      // Normal post
      mixedFeed.push(article);
      normalPostCountSinceLastReel++;
      
      // Check if we can now insert a postponed reel
      if (postponedReels.length > 0 && normalPostCountSinceLastReel >= minPostsBetweenReels) {
        mixedFeed.push(postponedReels.shift()!);
        normalPostCountSinceLastReel = 0;
      }
    }
  }
  
  // Any remaining reels in `postponedReels` are intentionally left out (dropped from this batch)
  // because there were insufficient normal posts to space them out.
  // In a fully paginated system with a Redux store, these could be kept in state for the next page.
  
  return mixedFeed;
};
