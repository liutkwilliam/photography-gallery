export type MediaType = 'movie' | 'tv-show';

export interface Episode {
  id: string;
  season: number;
  episodeNumber: number;
  title: string;
  duration: string;
  synopsis: string;
  thumbnailUrl: string;
  videoUrl: string;
}

export interface MediaItem {
  id: string;
  type: MediaType;
  title: string;
  slug: string;
  synopsis: string;
  releaseYear: number;
  maturityRating: string;
  duration?: string; // Optional for TV shows
  rating: number;
  matchPercentage: number;
  isFeatured: boolean;
  categories: string[];
  cast: string[];
  director?: string;
  creator?: string;
  posterUrl: string;
  bannerUrl: string;
  videoUrl?: string; // Optional for TV shows
  seasonsCount?: number;
  episodes?: Episode[];
}