type TmdbImageSize =
  | 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original';

const TMDB_BASE = 'https://image.tmdb.org/t/p';

export function getPosterUrl(
  path: string | null | undefined,
  size: TmdbImageSize = 'w342',
): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${TMDB_BASE}/${size}${path}`;
}

export function getBackdropUrl(
  path: string | null | undefined,
  size: TmdbImageSize = 'w780',
): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${TMDB_BASE}/${size}${path}`;
}

// Size guide:
// SearchDropdown / AdminTable (tiny):  w92   (~8 KB)
// MovieCard thumbnail:                 w185  (~15 KB vs ~1.2 MB original)
// MovieDetailPage hero poster:         w342  (~50 KB)
// HeroCarousel / backdrop:             w780  (~100 KB)
