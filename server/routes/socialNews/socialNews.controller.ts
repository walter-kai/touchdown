import { Request, Response } from "express";
import { db } from "../firebase/firebase.config";
import admin from "firebase-admin";
import { BaseSocialMediaPost, FirebasePost } from "../../../types/tw/Post";

// Helper function to format Firebase posts to the desired structure
function formatFirebasePost(firebasePost: FirebasePost): BaseSocialMediaPost {
  // Convert timestamp to ISO date string
  const date = firebasePost.published ? new Date(firebasePost.published).toISOString() : null;
  
  // Determine source type from source_type array
  let sourcetype = 'unknown';
  if (firebasePost.source_type && Array.isArray(firebasePost.source_type)) {
    // Find the specific social media source type
    const socialMediaSource = firebasePost.source_type.find(type => 
      type.startsWith('SOCIALMEDIA_')
    );
    
    if (socialMediaSource) {
      // Extract the platform name from SOCIALMEDIA_PLATFORM format
      sourcetype = socialMediaSource.replace('SOCIALMEDIA_', '').toLowerCase();
    } else if (firebasePost.source_type.includes('SOCIALMEDIA')) {
      // Fallback to external_provider if only SOCIALMEDIA is present
      sourcetype = firebasePost.external_provider || 'social';
    }
  } else if (firebasePost.external_provider) {
    // Final fallback to external_provider
    sourcetype = firebasePost.external_provider;
  }
  
  // Get content
  const content = firebasePost.content || firebasePost.title || null;
  
  // Extract media URLs (comprehensive)
  const media_urls: string[] = [];
  
  // From Talkwalker images
  if (firebasePost.images) {
    firebasePost.images.forEach(img => {
      if (img.url) media_urls.push(img.url);
    });
  }
  
  // From Twitter API media - get actual media URLs
  if (firebasePost.twitter_api_data?.includes?.media) {
    firebasePost.twitter_api_data.includes.media.forEach((media: any) => {
      // Add the actual media URL if available
      if (media.url) {
        media_urls.push(media.url);
      }
      // Add preview image URL for videos
      if (media.preview_image_url) {
        media_urls.push(media.preview_image_url);
      }
    });
  }
  
  // Also check for media URLs in Twitter entities (t.co links that expand to media)
  if (firebasePost.twitter_api_data?.tweet?.entities?.urls) {
    firebasePost.twitter_api_data.tweet.entities.urls.forEach((urlEntity: any) => {
      // Check if this is a media URL (pic.twitter.com, pic.x.com)
      if (urlEntity.expanded_url && 
          (urlEntity.expanded_url.includes('pic.twitter.com') || 
           urlEntity.expanded_url.includes('pic.x.com'))) {
        media_urls.push(urlEntity.expanded_url);
      }
    });
  }
  
  // Extract post URLs (comprehensive)
  const post_urls: string[] = [];
  if (firebasePost.url) {
    post_urls.push(firebasePost.url);
  }
  if (firebasePost.parent_url && firebasePost.parent_url !== firebasePost.url) {
    post_urls.push(firebasePost.parent_url);
  }
  
  // Add entity URLs (external links mentioned in posts)
  if (firebasePost.entity_url && Array.isArray(firebasePost.entity_url)) {
    firebasePost.entity_url.forEach((urlObj: any) => {
      if (urlObj.url && !post_urls.includes(urlObj.url)) {
        post_urls.push(urlObj.url);
      }
      if (urlObj.resolved_url && !post_urls.includes(urlObj.resolved_url)) {
        post_urls.push(urlObj.resolved_url);
      }
    });
  }
  
  // Get native ID
  const native_id = firebasePost.external_id || null;
  
  // Format author information (comprehensive)
  let author: BaseSocialMediaPost['author'] = null;
  
  if (firebasePost.external_provider === 'twitter' && firebasePost.twitter_api_data?.includes?.users) {
    // Use Twitter API data if available
    const twitterUser = firebasePost.twitter_api_data.includes.users.find((user: any) => 
      user.id === firebasePost.external_author_id
    );
    
    if (twitterUser) {
      author = {
        id: twitterUser.id,
        name: twitterUser.name,
        username: twitterUser.username,
        profile_url: `https://twitter.com/${twitterUser.username}`,
        profile_image_url: twitterUser.profile_image_url,
        location: twitterUser.location,
        description: twitterUser.description,
        verified: twitterUser.verified,
        followers_count: twitterUser.public_metrics?.followers_count,
        following_count: twitterUser.public_metrics?.following_count,
        // Additional Twitter metrics
        tweet_count: twitterUser.public_metrics?.tweet_count,
        listed_count: twitterUser.public_metrics?.listed_count,
        like_count: twitterUser.public_metrics?.like_count,
        media_count: twitterUser.public_metrics?.media_count,
        created_at: twitterUser.created_at,
      };
    }
  } else if (firebasePost.extra_author_attributes) {
    // Use Talkwalker author data for all platforms
    const authorData = firebasePost.extra_author_attributes;
    author = {
      id: authorData.id || firebasePost.external_author_id,
      name: authorData.name || authorData.short_name,
      username: authorData.username,
      profile_url: authorData.url,
      profile_image_url: authorData.image_url,
      location: authorData.world_data ? 
        `${authorData.world_data.city || ''}, ${authorData.world_data.country || ''}`.trim().replace(/^,\s*|,\s*$/g, '') || null 
        : null,
      description: authorData.description,
      verified: authorData.verified,
      gender: authorData.gender,
      // Location details
      world_data: authorData.world_data,
    };
  } else if (firebasePost.external_author_id) {
    // Minimal author info
    author = {
      id: firebasePost.external_author_id,
      name: null,
    };
  }
  
  // Extract comprehensive metrics
  const metrics: any = {};
  
  // Base Talkwalker metrics
  if (firebasePost.engagement !== undefined) metrics.engagement = firebasePost.engagement;
  if (firebasePost.reach !== undefined) metrics.reach = firebasePost.reach;
  if (firebasePost.sentiment !== undefined) metrics.sentiment = firebasePost.sentiment;
  if (firebasePost.fluency_level !== undefined) metrics.fluency_level = firebasePost.fluency_level;
  if (firebasePost.word_count !== undefined) metrics.word_count = firebasePost.word_count;
  
  // Platform-specific metrics
  if (sourcetype === 'twitter' && firebasePost.twitter_api_data?.tweet?.public_metrics) {
    const twitterMetrics = firebasePost.twitter_api_data.tweet.public_metrics;
    metrics.twitter = {
      retweet_count: twitterMetrics.retweet_count,
      like_count: twitterMetrics.like_count,
      reply_count: twitterMetrics.reply_count,
      quote_count: twitterMetrics.quote_count,
      bookmark_count: twitterMetrics.bookmark_count,
      impression_count: twitterMetrics.impression_count,
    };
  } else if (sourcetype === 'youtube' && firebasePost.article_extended_attributes) {
    const youtubeMetrics = firebasePost.article_extended_attributes;
    metrics.youtube = {
      views: youtubeMetrics.youtube_views,
      likes: youtubeMetrics.youtube_likes,
      comments: youtubeMetrics.num_comments,
    };
  }
  
  // Extract hashtags and mentions
  const hashtags: string[] = [];
  const mentions: string[] = [];
  
  // From Talkwalker tokens
  if (firebasePost.tokens_hashtag) {
    hashtags.push(...firebasePost.tokens_hashtag.map(tag => tag.replace('#', '')));
  }
  if (firebasePost.tokens_mention) {
    mentions.push(...firebasePost.tokens_mention.map((mention: string) => mention.replace('@', '')));
  }
  
  // From Twitter entities
  if (firebasePost.twitter_api_data?.tweet?.entities) {
    const entities = firebasePost.twitter_api_data.tweet.entities;
    if (entities.hashtags) {
      hashtags.push(...entities.hashtags.map((h: any) => h.tag));
    }
    if (entities.mentions) {
      mentions.push(...entities.mentions.map((m: any) => m.username));
    }
  }
  
  return {
    date,
    sourcetype,
    content: content ?? undefined,
    media_urls: [...new Set(media_urls)], // Remove duplicates
    post_urls: [...new Set(post_urls)], // Remove duplicates
    native_id,
    author,
    metrics,
    hashtags: [...new Set(hashtags)], // Remove duplicates
    mentions: [...new Set(mentions)], // Remove duplicates
    // Additional metadata
    language: firebasePost.lang,
    post_type: firebasePost.post_type,
    tags: firebasePost.tags_internal,
    iab_categories: firebasePost.iab_category,
  };
}

// Controller for getting social media posts
export async function getSocialNews(req: Request, res: Response) {
  try {
    const collectionRef = db.collection('socialPosts');
    
    // Get query parameters for filtering and pagination
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const sourcetype = req.query.sourcetype as string;
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;
    
    // Build query
    let query: admin.firestore.Query = collectionRef;
    
    // Note: Commented out filters due to Firestore indexing requirements
    // Uncomment and create appropriate indexes if needed
    
    console.log(`Fetching posts from Firebase: limit=${limit}, offset=${offset}, sourcetype=${sourcetype || 'all'}`);
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: {
          total: 0,
          limit,
          offset,
          has_more: false,
        },
      });
    }
    
    // Format posts
    const formattedPosts: BaseSocialMediaPost[] = [];
    snapshot.forEach(doc => {
      try {
        const firebasePost = doc.data() as FirebasePost;
        const formattedPost = formatFirebasePost(firebasePost);
        formattedPosts.push(formattedPost);
      } catch (error) {
        console.error(`Error formatting post ${doc.id}:`, error);
        // Continue with other posts
      }
    });
    
    // Get total count for pagination (this is approximate due to Firestore limitations)
    const hasMore = snapshot.size === limit;
    
    console.log(`Successfully formatted ${formattedPosts.length} posts`);
    
    res.status(200).json({
      success: true,
      data: formattedPosts,
      pagination: {
        total: offset + formattedPosts.length, // Approximate
        limit,
        offset,
        has_more: hasMore,
      },
      filters: {
        sourcetype: sourcetype || null,
        start_date: startDate || null,
        end_date: endDate || null,
      },
    });
    
  } catch (error) {
    console.error('Error fetching posts from Firebase:', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      error: `Failed to fetch posts: ${errorMessage}`,
      data: [],
    });
  }
}
    