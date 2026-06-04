import fs from 'fs';
import path from 'path';

export interface Video {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  thumbnail: string;
  createdAt: string;
}

export interface AdPlacement {
  id: string;
  placement: string; // 'ad_header' | 'ad_under_player' | 'ad_sidebar' | 'ad_popunder' | 'ad_social_bar'
  code: string;
}

const DB_DIR = path.join(process.cwd(), 'src', 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Initial mock data
const INITIAL_VIDEOS: Video[] = [
  {
    id: '1',
    title: 'Sintel - Open Source CGI Animation',
    description: 'Sintel is a short computer-animated fantasy film by the Blender Foundation. It tells the story of a girl named Sintel who rescues a baby dragon and forms a deep bond with him.',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    category: 'Fantasy',
    thumbnail: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Tears of Steel - Sci-Fi VFX Showcase',
    description: 'A classic sci-fi open-source movie by Blender, showcasing high-end visual effects, CGI tracking, and sci-fi robotics in a futuristic Amsterdam setting.',
    url: 'https://www.youtube.com/watch?v=R6MlUcmg5ny',
    category: 'Sci-Fi',
    thumbnail: 'https://img.youtube.com/vi/R6MlUcmg5ny/maxresdefault.jpg',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Big Buck Bunny',
    description: 'A large and lovable rabbit deals with bullying forest creatures in this classic open-source 3D computer-animated comedy.',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    category: 'Comedy',
    thumbnail: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Vimeo Cinematic Landscape',
    description: 'A beautiful visual display of cinematic landscapes, exploring the depth of nature and modern video production techniques.',
    url: 'https://vimeo.com/76979871',
    category: 'Cinematic',
    thumbnail: 'https://vumbnail.com/76979871.jpg',
    createdAt: new Date().toISOString(),
  }
];

const INITIAL_ADS: AdPlacement[] = [
  { id: 'ad_header', placement: 'ad_header', code: '' },
  { id: 'ad_under_player', placement: 'ad_under_player', code: '' },
  { id: 'ad_sidebar', placement: 'ad_sidebar', code: '' },
  { id: 'ad_popunder', placement: 'ad_popunder', code: '' },
  { id: 'ad_social_bar', placement: 'ad_social_bar', code: '' },
];

import { parseVideoUrl } from './videoParser';

// Memory cache fallback for Serverless environment when DB keys are missing
let memoryVideos: Video[] = [...INITIAL_VIDEOS];
let memoryAds: AdPlacement[] = [...INITIAL_ADS];

// Sanitized getters to prevent copy-paste whitespace or trailing slash errors
const getSupabaseUrl = () => {
  return process.env.SUPABASE_URL?.trim().replace(/\/$/, '') || '';
};

const getSupabaseKey = () => {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';
};

// Check environment variables for DB configurations
const isSupabaseConfigured = () => {
  return !!(getSupabaseUrl() && getSupabaseKey());
};

// Supabase Direct REST Helpers
async function supabaseFetch(path: string, options: RequestInit = {}) {
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseKey();
  
  const url = `${supabaseUrl}/rest/v1/${path}`;
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
    ...options.headers,
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    console.error(`Supabase error: ${res.status} ${text}`);
    throw new Error(`Supabase API failed: ${text}`);
  }
  return res.json();
}

// Global helper to load the state
function readLocalData(): { videos: Video[]; ads: AdPlacement[] } {
  if (process.env.NODE_ENV === 'production') {
    // On Vercel, if not configured, use in-memory state
    return { videos: memoryVideos, ads: memoryAds };
  }

  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const data = { videos: INITIAL_VIDEOS, ads: INITIAL_ADS };
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
      return data;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading local JSON db:', err);
    return { videos: memoryVideos, ads: memoryAds };
  }
}

// Global helper to save the state
function writeLocalData(data: { videos: Video[]; ads: AdPlacement[] }) {
  if (process.env.NODE_ENV === 'production') {
    memoryVideos = data.videos;
    memoryAds = data.ads;
    return;
  }

  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local JSON db:', err);
    memoryVideos = data.videos;
    memoryAds = data.ads;
  }
}

// Database Operations Core
export async function getVideos(): Promise<Video[]> {
  if (isSupabaseConfigured()) {
    const data = await supabaseFetch('videos?select=*&order=createdAt.desc');
    return data;
  }

  const data = readLocalData();
  // Sort descending by date
  return data.videos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function addVideo(videoData: Omit<Video, 'id' | 'createdAt' | 'thumbnail'>, customThumbnail?: string): Promise<Video> {
  const { url } = videoData;
  const { thumbnail } = parseVideoUrl(url, customThumbnail);
  const newVideo: Video = {
    ...videoData,
    id: Math.random().toString(36).substring(2, 11),
    thumbnail,
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    const inserted = await supabaseFetch('videos', {
      method: 'POST',
      body: JSON.stringify(newVideo)
    });
    return inserted[0] || newVideo;
  }

  const data = readLocalData();
  data.videos.push(newVideo);
  writeLocalData(data);
  return newVideo;
}

export async function deleteVideo(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    await supabaseFetch(`videos?id=eq.${id}`, {
      method: 'DELETE'
    });
    return true;
  }

  const data = readLocalData();
  const index = data.videos.findIndex(v => v.id === id);
  if (index !== -1) {
    data.videos.splice(index, 1);
    writeLocalData(data);
    return true;
  }
  return false;
}

export async function getAds(): Promise<AdPlacement[]> {
  if (isSupabaseConfigured()) {
    const data = await supabaseFetch('ads?select=*');
    // If table is empty in supabase, seed it
    if (data.length === 0) {
      await supabaseFetch('ads', {
        method: 'POST',
        body: JSON.stringify(INITIAL_ADS)
      });
      return INITIAL_ADS;
    }
    return data;
  }

  const data = readLocalData();
  if (!data.ads || data.ads.length === 0) {
    data.ads = INITIAL_ADS;
    writeLocalData(data);
  }
  return data.ads;
}

export async function updateAds(placement: string, code: string): Promise<AdPlacement> {
  if (isSupabaseConfigured()) {
    const updated = await supabaseFetch(`ads?placement=eq.${placement}`, {
      method: 'PATCH',
      body: JSON.stringify({ code })
    });
    return updated[0] || { id: placement, placement, code };
  }

  const data = readLocalData();
  const adIndex = data.ads.findIndex(a => a.placement === placement);
  if (adIndex !== -1) {
    data.ads[adIndex].code = code;
  } else {
    data.ads.push({ id: placement, placement, code });
  }
  writeLocalData(data);
  return { id: placement, placement, code };
}

// Return state description for Admin display
export function getDbConnectionStatus() {
  if (isSupabaseConfigured()) {
    return {
      connected: true,
      provider: 'Supabase (Production Database Connected)',
      description: 'Your videos and ads are saved in your persistent Supabase cloud database.'
    };
  }
  if (process.env.NODE_ENV === 'production') {
    return {
      connected: false,
      provider: 'Temporary Memory Storage (Non-Persistent)',
      description: 'Running on Vercel without database credentials. Changes will reset when Vercel spins down the container. Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your Vercel project environment variables for persistent cloud storage.'
    };
  }
  return {
    connected: true,
    provider: 'Local File Storage (Development)',
    description: 'Running locally. Videos and ads are saved to src/data/db.json.'
  };
}
