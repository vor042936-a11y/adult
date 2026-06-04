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
    thumbnail = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%231a0e30" /><stop offset="100%" stop-color="%230b0518" /></linearGradient></defs><rect width="640" height="360" fill="url(%23g)"/><polygon points="290,150 290,210 350,180" fill="%23a855f7" /><text x="50%" y="70%" fill="%23a855f7" font-family="sans-serif" font-size="16" text-anchor="middle" opacity="0.8">Premium Video Playback</text></svg>';
  }

  return { thumbnail, type };
}
