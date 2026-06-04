'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Eye, Shield, Key, Settings, Video, FileText, Sparkles, CheckCircle2, AlertCircle, RefreshCw, LogOut, Database
} from 'lucide-react';
import { parseVideoUrl, getProxiedThumbnailUrl } from '@/lib/videoParser';

interface AdminPanelProps {
  onClose: () => void;
  onRefreshData: () => void;
  videos: any[];
  ads: any[];
  dbStatus: any;
}

export default function AdminPanel({ onClose, onRefreshData, videos, ads, dbStatus }: AdminPanelProps) {
  // Authentication states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Panel navigation state
  const [activeTab, setActiveTab] = useState<'videos' | 'ads' | 'status'>('videos');

  // Video Form states
  const [videoTitle, setVideoTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoDesc, setVideoDesc] = useState('');
  const [videoCategory, setVideoCategory] = useState('Trending');
  const [customThumbnail, setCustomThumbnail] = useState('');
  const [urlPreview, setUrlPreview] = useState<{ thumbnail: string; type: string } | null>(null);
  const [videoFormSuccess, setVideoFormSuccess] = useState('');
  const [videoFormError, setVideoFormError] = useState('');
  const [isSubmittingVideo, setIsSubmittingVideo] = useState(false);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);

  // Ads Form states
  const [adHeader, setAdHeader] = useState('');
  const [adUnderPlayer, setAdUnderPlayer] = useState('');
  const [adSidebar, setAdSidebar] = useState('');
  const [adPopunder, setAdPopunder] = useState('');
  const [adSocialBar, setAdSocialBar] = useState('');
  const [adsFormSuccess, setAdsFormSuccess] = useState('');
  const [adsFormError, setAdsFormError] = useState('');
  const [isSubmittingAds, setIsSubmittingAds] = useState(false);

  // Load session token on mount
  useEffect(() => {
    const savedToken = sessionStorage.getItem('admin_token');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  // Update URL preview when videoUrl or customThumbnail changes
  useEffect(() => {
    if (videoUrl) {
      setUrlPreview(parseVideoUrl(videoUrl, customThumbnail));
    } else {
      setUrlPreview(null);
    }
  }, [videoUrl, customThumbnail]);

  // Load ad settings into inputs when ads prop changes
  useEffect(() => {
    if (ads && ads.length > 0) {
      setAdHeader(ads.find(a => a.placement === 'ad_header')?.code || '');
      setAdUnderPlayer(ads.find(a => a.placement === 'ad_under_player')?.code || '');
      setAdSidebar(ads.find(a => a.placement === 'ad_sidebar')?.code || '');
      setAdPopunder(ads.find(a => a.placement === 'ad_popunder')?.code || '');
      setAdSocialBar(ads.find(a => a.placement === 'ad_social_bar')?.code || '');
    }
  }, [ads]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setAuthError('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.success && data.token) {
        setToken(data.token);
        sessionStorage.setItem('admin_token', data.token);
      } else {
        setAuthError(data.error || 'Login failed');
      }
    } catch (err) {
      setAuthError('Connection error. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    setToken(null);
    sessionStorage.removeItem('admin_token');
  };

  // Handle Metadata Auto-Fill
  const handleFetchMetadata = async () => {
    if (!videoUrl) {
      setVideoFormError('Please enter a Video URL first.');
      return;
    }

    setIsFetchingMetadata(true);
    setVideoFormSuccess('');
    setVideoFormError('');

    try {
      const res = await fetch(`/api/metadata?url=${encodeURIComponent(videoUrl)}`);
      const data = await res.json();

      if (res.ok) {
        if (data.title) {
          setVideoTitle(data.title);
        }
        if (data.thumbnail) {
          setCustomThumbnail(data.thumbnail);
        }
        setVideoFormSuccess('Metadata auto-filled successfully!');
      } else {
        setVideoFormError(data.error || 'Failed to auto-fetch details from site.');
      }
    } catch (err) {
      setVideoFormError('Could not connect to the metadata crawler API.');
    } finally {
      setIsFetchingMetadata(false);
    }
  };

  // Handle Add Video
  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setVideoFormSuccess('');
    setVideoFormError('');
    setIsSubmittingVideo(true);

    if (!videoTitle || !videoUrl || !videoCategory) {
      setVideoFormError('All fields marked * are required.');
      setIsSubmittingVideo(false);
      return;
    }

    try {
      const res = await fetch('/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: videoTitle,
          url: videoUrl,
          description: videoDesc,
          category: videoCategory,
          customThumbnail: customThumbnail || undefined
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setVideoFormSuccess(`Video "${data.title}" successfully added!`);
        // Reset form
        setVideoTitle('');
        setVideoUrl('');
        setVideoDesc('');
        setVideoCategory('Trending');
        setCustomThumbnail('');
        onRefreshData();
      } else {
        setVideoFormError(data.error || 'Failed to add video.');
      }
    } catch (err) {
      setVideoFormError('Connection error. Try again.');
    } finally {
      setIsSubmittingVideo(false);
    }
  };

  // Handle Delete Video
  const handleDeleteVideo = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const res = await fetch(`/api/videos?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        onRefreshData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete video.');
      }
    } catch (err) {
      alert('Connection error.');
    }
  };

  // Handle Save Ads
  const handleSaveAds = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdsFormSuccess('');
    setAdsFormError('');
    setIsSubmittingAds(true);

    const placements = [
      { placement: 'ad_header', code: adHeader },
      { placement: 'ad_under_player', code: adUnderPlayer },
      { placement: 'ad_sidebar', code: adSidebar },
      { placement: 'ad_popunder', code: adPopunder },
      { placement: 'ad_social_bar', code: adSocialBar }
    ];

    try {
      let hasError = false;

      for (const item of placements) {
        const res = await fetch('/api/ads', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(item),
        });

        if (!res.ok) {
          hasError = true;
          break;
        }
      }

      if (!hasError) {
        setAdsFormSuccess('All Adsterra scripts saved successfully!');
        onRefreshData();
      } else {
        setAdsFormError('Failed to save some ads. Verify admin session.');
      }
    } catch (err) {
      setAdsFormError('Connection error saving scripts.');
    } finally {
      setIsSubmittingAds(false);
    }
  };

  // Login view if not verified
  if (!token) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="admin-modal login-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>
              <Shield className="header-icon secure" />
              Admin Portal
            </h2>
            <button className="close-btn" onClick={onClose}>&times;</button>
          </div>
          
          <form className="login-form" onSubmit={handleLogin}>
            <div className="login-badge">
              <Key className="key-icon" />
            </div>
            <h3>Authentication Required</h3>
            <p>Enter the administrator password to manage videos and advertisement configurations.</p>
            
            {authError && (
              <div className="auth-alert error">
                <AlertCircle size={18} />
                <span>{authError}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="admin-email">Admin Email Address</label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="default: spkchaudhary9211@gmail.com"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="admin-pass">Access Password</label>
              <input
                id="admin-pass"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="default: Ankit@9211"
                required
              />
            </div>

            <button 
              type="submit" 
              className="login-btn" 
              disabled={isAuthenticating}
            >
              {isAuthenticating ? (
                <>
                  <RefreshCw className="spinner-icon" size={18} />
                  Verifying...
                </>
              ) : (
                'Unlock Dashboard'
              )}
            </button>
            <span className="login-tip">If hosting on Vercel, set the ADMIN_EMAIL and ADMIN_PASSWORD environment variables to override defaults.</span>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard view if logged in
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="admin-modal dashboard-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <Settings className="header-icon pulse" />
            Admin Dashboard
          </h2>
          <div className="header-actions">
            <button className="logout-btn" onClick={handleLogout} title="Log Out">
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
            <button className="close-btn" onClick={onClose}>&times;</button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="admin-tabs">
          <button 
            className={`tab-btn ${activeTab === 'videos' ? 'active' : ''}`}
            onClick={() => setActiveTab('videos')}
          >
            <Video size={16} />
            <span>Manage Videos</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'ads' ? 'active' : ''}`}
            onClick={() => setActiveTab('ads')}
          >
            <FileText size={16} />
            <span>Configure Ads</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'status' ? 'active' : ''}`}
            onClick={() => setActiveTab('status')}
          >
            <Database size={16} />
            <span>DB Connection</span>
          </button>
        </div>

        {/* Tab Content: Manage Videos */}
        {activeTab === 'videos' && (
          <div className="tab-pane">
            <div className="admin-grid-layout">
              {/* Form Column */}
              <form className="admin-form" onSubmit={handleAddVideo}>
                <h3>
                  <Sparkles size={16} className="text-accent" />
                  Add New Video
                </h3>

                {videoFormSuccess && (
                  <div className="alert success">
                    <CheckCircle2 size={16} />
                    <span>{videoFormSuccess}</span>
                  </div>
                )}
                {videoFormError && (
                  <div className="alert error">
                    <AlertCircle size={16} />
                    <span>{videoFormError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label>Video Title *</label>
                  <input
                    type="text"
                    value={videoTitle}
                    onChange={e => setVideoTitle(e.target.value)}
                    placeholder="e.g. Sintel Open CGI Movie"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Video URL * (YouTube, Vimeo, Dailymotion, MP4, HLS)</label>
                  <div className="input-with-button">
                    <input
                      type="url"
                      value={videoUrl}
                      onChange={e => setVideoUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      required
                    />
                    <button
                      type="button"
                      className="inline-action-btn"
                      onClick={handleFetchMetadata}
                      disabled={isFetchingMetadata}
                      title="Fetch Title and Thumbnail automatically from page"
                    >
                      {isFetchingMetadata ? (
                        <RefreshCw className="spinner-icon" size={16} />
                      ) : (
                        'Auto-Fill'
                      )}
                    </button>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      value={videoCategory}
                      onChange={e => setVideoCategory(e.target.value)}
                    >
                      <option value="Trending">Trending</option>
                      <option value="Animation">Animation</option>
                      <option value="Cinematic">Cinematic</option>
                      <option value="Sci-Fi">Sci-Fi</option>
                      <option value="Action">Action</option>
                      <option value="Music">Music</option>
                      <option value="Comedy">Comedy</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Custom Thumbnail URL (Optional)</label>
                    <input
                      type="url"
                      value={customThumbnail}
                      onChange={e => setCustomThumbnail(e.target.value)}
                      placeholder="https://image-hosting.com/img.jpg"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={videoDesc}
                    onChange={e => setVideoDesc(e.target.value)}
                    placeholder="Enter details about this video content..."
                    rows={3}
                  />
                </div>

                {/* Live URL Parser Preview */}
                {urlPreview && (
                  <div className="url-parser-preview">
                    <span className="preview-label">Live Link Analyzer:</span>
                    <div className="preview-pill">
                      Detected Source: <strong>{urlPreview.type.toUpperCase()}</strong>
                    </div>
                    {urlPreview.thumbnail && (
                      <div className="preview-thumbnail-container">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={getProxiedThumbnailUrl(urlPreview.thumbnail)} 
                          alt="Thumbnail preview"
                          className="preview-img-box" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="170"><rect width="300" height="170" fill="%231a1a2e"/><text x="50%" y="50%" fill="%23a855f7" text-anchor="middle">Broken Custom Image Link</text></svg>';
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}

                <button 
                  type="submit" 
                  className="submit-btn" 
                  disabled={isSubmittingVideo}
                >
                  {isSubmittingVideo ? (
                    <>
                      <RefreshCw className="spinner-icon" size={16} />
                      Publishing Video...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Publish Video
                    </>
                  )}
                </button>
              </form>

              {/* List Column */}
              <div className="admin-videos-list-container">
                <h3>Current Live Videos ({videos.length})</h3>
                <div className="admin-videos-scroll">
                  {videos.length === 0 ? (
                    <div className="empty-list">No videos found. Publish some above!</div>
                  ) : (
                    videos.map(v => (
                      <div key={v.id} className="admin-video-item">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={getProxiedThumbnailUrl(v.thumbnail)} 
                          alt="" 
                          className="item-thumbnail" 
                        />
                        <div className="item-details">
                          <span className="item-title">{v.title}</span>
                          <span className="item-category">{v.category}</span>
                        </div>
                        <button 
                          className="delete-item-btn" 
                          onClick={() => handleDeleteVideo(v.id, v.title)}
                          title="Delete Video"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Configure Ads */}
        {activeTab === 'ads' && (
          <form className="tab-pane ads-form" onSubmit={handleSaveAds}>
            <div className="pane-intro">
              <h3>Adsterra Placements Manager</h3>
              <p>Paste the raw HTML or Javascript code blocks generated by Adsterra directly into the areas below. If empty, the website will show beautiful responsive layout placeholders.</p>
            </div>

            {adsFormSuccess && (
              <div className="alert success">
                <CheckCircle2 size={16} />
                <span>{adsFormSuccess}</span>
              </div>
            )}
            {adsFormError && (
              <div className="alert error">
                <AlertCircle size={16} />
                <span>{adsFormError}</span>
              </div>
            )}

            <div className="ads-input-grid">
              <div className="form-group">
                <label>Header Leaderboard Banner (728x90 or 468x60)</label>
                <textarea
                  value={adHeader}
                  onChange={e => setAdHeader(e.target.value)}
                  placeholder="Paste Adsterra JS/HTML Code here..."
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label>Below Video Player Banner (468x60 or 728x90)</label>
                <textarea
                  value={adUnderPlayer}
                  onChange={e => setAdUnderPlayer(e.target.value)}
                  placeholder="Paste Adsterra JS/HTML Code here..."
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label>Sidebar Rectangle Banner (300x250)</label>
                <textarea
                  value={adSidebar}
                  onChange={e => setAdSidebar(e.target.value)}
                  placeholder="Paste Adsterra JS/HTML Code here..."
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label>Global Popunder Code</label>
                <textarea
                  value={adPopunder}
                  onChange={e => setAdPopunder(e.target.value)}
                  placeholder="Paste Adsterra Script Source for Popunder (loaded globally) here..."
                  rows={4}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Global Social Bar Code (Slide-in mobile banners)</label>
              <textarea
                value={adSocialBar}
                onChange={e => setAdSocialBar(e.target.value)}
                placeholder="Paste Adsterra Social Bar Code here..."
                rows={3}
              />
            </div>

            <button 
              type="submit" 
              className="submit-btn save-ads-btn"
              disabled={isSubmittingAds}
            >
              {isSubmittingAds ? (
                <>
                  <RefreshCw className="spinner-icon" size={16} />
                  Saving Configuration...
                </>
              ) : (
                'Save Ad Script Placements'
              )}
            </button>
          </form>
        )}

        {/* Tab Content: Connection Status Info */}
        {activeTab === 'status' && (
          <div className="tab-pane status-pane">
            <div className="status-card">
              <div className={`status-glow ${dbStatus.connected ? 'active' : 'inactive'}`}></div>
              <div className="status-header-line">
                <Database size={24} className="db-icon-status" />
                <h4>Database Engine Status</h4>
              </div>
              <div className="status-detail-box">
                <div className="status-row">
                  <span className="status-label">Active Provider:</span>
                  <strong className="status-val">{dbStatus.provider}</strong>
                </div>
                <div className="status-row">
                  <span className="status-label">Connection Status:</span>
                  <span className={`status-badge-val ${dbStatus.connected ? 'success' : 'warning'}`}>
                    {dbStatus.connected ? 'CONNECTED' : 'DISCONNECTED'}
                  </span>
                </div>
              </div>
              <p className="status-description-text">{dbStatus.description}</p>
            </div>

            <div className="status-guide-card">
              <h5>How to connect Supabase Database for Free Cloud Persistence:</h5>
              <ol className="guide-list">
                <li>Create a free account at <strong>supabase.com</strong>.</li>
                <li>Create a new project.</li>
                <li>Go to the SQL Editor and execute this table creation code:
                  <pre className="sql-code-block">
{`CREATE TABLE videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  category TEXT NOT NULL,
  thumbnail TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE ads (
  id TEXT PRIMARY KEY,
  placement TEXT UNIQUE NOT NULL,
  code TEXT
);`}
                  </pre>
                </li>
                <li>Go to Project Settings &gt; API.</li>
                <li>Add these Environment Variables to your <strong>Vercel</strong> settings:
                  <ul className="env-sublist">
                    <li><code>SUPABASE_URL</code>: Your Project URL</li>
                    <li><code>SUPABASE_SERVICE_ROLE_KEY</code>: Your Service Role secret key</li>
                    <li><code>ADMIN_PASSWORD</code>: Set a secure dashboard password</li>
                  </ul>
                </li>
                <li>Redeploy your Vercel project, and it will persist perfectly for all users!</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
