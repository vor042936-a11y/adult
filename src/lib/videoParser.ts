// Helper to extract video ID and thumbnail URL based on the URL type (Client safe)
export function parseVideoUrl(url: string, customThumbnail?: string): { thumbnail: string; type: string } {
  let thumbnail = customThumbnail || '';
  let type = 'direct';

  if (!url) return { thumbnail: '/placeholder.jpg', type: 'unknown' };

  // YouTube
  const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const ytMatch = url.match(ytRegex);
  if (ytMatch && ytMatch[1]) {
    type = 'youtube';
    if (!thumbnail) {
      thumbnail = `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`;
    }
    return { thumbnail, type };
  }

  // Vimeo
  const vimeoRegex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/i;
  const vimeoMatch = url.match(vimeoRegex);
  if (vimeoMatch && vimeoMatch[1]) {
    type = 'vimeo';
    if (!thumbnail) {
      thumbnail = `https://vumbnail.com/${vimeoMatch[1]}.jpg`;
    }
    return { thumbnail, type };
  }

  // Dailymotion
  const dmRegex = /(?:dailymotion\.com\/video\/|dai\.ly\/)([a-zA-Z0-9]+)/i;
  const dmMatch = url.match(dmRegex);
  if (dmMatch && dmMatch[1]) {
    type = 'dailymotion';
    if (!thumbnail) {
      thumbnail = `https://www.dailymotion.com/thumbnail/video/${dmMatch[1]}`;
    }
    return { thumbnail, type };
  }

  // Default fallback if no thumbnail is provided
  if (!thumbnail) {
    thumbnail = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NDAiIGhlaWdodD0iMzYwIiB2aWV3Qm94PSIwIDAgNjQwIDM2MCI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMWEwZTMwIiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMwYjA1MTgiIC8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8cmVjdCB3aWR0aD0iNjQwIiBoZWlnaHQ9IjM2MCIgZmlsbD0idXJsKCNnKSIvPgogIDxwb2x5Z29uIHBvaW50cz0iMjkwLDE1MCAyOTAsMjEwIDM1MCwxODAiIGZpbGw9IiNhODU1ZjciIC8+CiAgPHRleHQgeD0iNTAlIiB5PSI3MCUiIGZpbGw9IiNhODU1ZjciIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBvcGFjaXR5PSIwLjgiPlByZW1pdW0gVmlkZW8gUGxheWJhY2s8L3RleHQ+Cjwvc3ZnPg==';
  }

  return { thumbnail, type };
}

// Helper to proxy external hotlink-protected thumbnail images
export function getProxiedThumbnailUrl(thumbnailUrl: string): string {
  if (!thumbnailUrl) return '';

  // Return base64/data URIs as-is
  if (thumbnailUrl.startsWith('data:')) {
    return thumbnailUrl;
  }

  // YouTube allows hotlinking
  if (thumbnailUrl.includes('youtube.com') || thumbnailUrl.includes('youtu.be') || thumbnailUrl.includes('img.youtube.com')) {
    return thumbnailUrl;
  }

  // Vimeo thumbnails (vumbnail) allow hotlinking
  if (thumbnailUrl.includes('vumbnail.com')) {
    return thumbnailUrl;
  }

  // Route other external CDNs through our server-side referer spoofer proxy
  return `/api/proxy?url=${encodeURIComponent(thumbnailUrl)}`;
}
