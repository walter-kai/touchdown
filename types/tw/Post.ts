// Shared interfaces for common data structures
export interface WorldData {
  city?: string;
  continent?: string;
  country?: string;
  country_code?: string;
  latitude?: number;
  longitude?: number;
  region?: string;
  resolution?: string;
}

export interface ImageData {
  url?: string;
}

export interface IABCategory {
  tier1?: string;
  tier2?: string;
}

// Base social media post interface with common properties
export interface BaseSocialMediaPost {
  external_author_id?: string;
  external_id?: string;
  external_provider?: string;
  fluency_level?: number;
  indexed?: number;
  lang?: string;
  matched_profile?: string[];
  post_type?: string[];
  search_indexed?: number;
  sentiment?: number;
  source_type?: string[];
  content?: string;
  content_snippet?: string;
  domain_url?: string;
  engagement?: number;
  title?: string;
  title_snippet?: string;
  url?: string;
  published?: number;
  reach?: number;
  word_count?: number;
  world_data?: WorldData;
  entity_url?: any[];
  images?: ImageData[];
  tokens_content?: string[];
  tokens_hashtag?: string[];
  tokens_title?: string[];
  tags_internal?: string[];
  [key: string]: any; // Allow for additional properties
}

// Firebase document structure - extends the original response with metadata
export interface FirebasePost extends BaseSocialMediaPost {
  // Common extracted fields for easy querying (all optional to handle undefined)
  external_provider?: string;
  external_id?: string;
  external_author_id?: string;
  published?: number;
  sentiment?: number;
  lang?: string;
  post_type?: string[];
  source_type?: string[];
  
  // Metadata
  created_at: number; // Timestamp when stored in Firebase
}

// Twitter-specific post interface
export interface TwitterPost extends BaseSocialMediaPost {
  external_provider: "twitter";
  source_type?: string[]; // Contains ["SOCIALMEDIA", "SOCIALMEDIA_TWITTER"]
  post_type?: string[]; // Can be ["TEXT"], ["IMAGE"], etc.
  // Twitter-specific attributes
  extra_author_attributes?: {
    [key: string]: any;
  };
  extra_source_attributes?: {
    [key: string]: any;
  };
}

// YouTube-specific author attributes
export interface YouTubeAuthorAttributes {
  gender?: string;
  id?: string;
  image_url?: string;
  name?: string;
  short_name?: string;
  url?: string;
  world_data?: WorldData;
}

// YouTube-specific source attributes
export interface YouTubeSourceAttributes {
  id?: string;
  name?: string;
  world_data?: WorldData;
  alexa_pageviews?: number;
  alexa_unique_visitors?: number;
}

// YouTube-specific article extended attributes
export interface YouTubeArticleExtendedAttributes {
  num_comments?: number;
  youtube_likes?: number;
  youtube_views?: number;
}

// YouTube-specific post interface
export interface YouTubePost extends BaseSocialMediaPost {
  external_provider: "youtube";
  source_type?: string[]; // Contains ["SOCIALMEDIA", "SOCIALMEDIA_YOUTUBE"]
  post_type?: string[]; // Typically ["VIDEO"]
  
  // YouTube-specific properties
  DEPRECATED_spam_level?: number;
  article_extended_attributes?: YouTubeArticleExtendedAttributes;
  host_url?: string;
  parent_url?: string;
  root_url?: string;
  noise_category?: string;
  noise_level?: number;
  porn_level?: number;
  iab_category?: IABCategory[];
  extra_author_attributes?: YouTubeAuthorAttributes;
  extra_source_attributes?: YouTubeSourceAttributes;
  source_extended_attributes?: {
    alexa_pageviews?: number;
    alexa_unique_visitors?: number;
  };
}

// Union type for all social media posts
export type SocialMediaPost = TwitterPost | YouTubePost;

// Main Talkwalker API response interface
export interface TalkwalkerApiResponse {
  status_code: string;
  status_message: string;
  request: string;
  pagination?: {
    next?: string;
    total?: number;
  };
  result_content?: {
    data?: { [key: string]: SocialMediaPost }; // Object with numbered keys, not array
  };
  request_id?: string;
}

