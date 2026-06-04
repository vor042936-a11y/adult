'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Play, Calendar, HelpCircle, FileText, Mail, ShieldAlert, Sparkles, Send, CheckCircle2 
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import VideoPlayer from '@/components/VideoPlayer';
import AdContainer from '@/components/AdContainer';
import AdminPanel from '@/components/AdminPanel';

export default function Home() {
  // Global Data States
  const [videos, setVideos] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [dbStatus, setDbStatus] = useState<any>({ connected: false, provider: 'Connecting...' });
  const [isLoading, setIsLoading] = useState(true);

  // Active Playback State
  const [activeVideo, setActiveVideo] = useState<any>(null);

  // Search & Navigation States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modals & Panels State
  const [showAdmin, setShowAdmin] = useState(false);
  const [activeLegalModal, setActiveLegalModal] = useState<'dmca' | 'privacy' | 'terms' | 'contact' | null>(null);

  // Contact Form State
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);

  // Load videos and ads configuration from API
  const fetchData = useCallback(async () => {
    try {
      // Fetch videos
      const videosRes = await fetch('/api/videos');
      if (videosRes.ok) {
        const videosData = await videosRes.json();
        setVideos(videosData);
        
        // If there's no active video yet, default to the first video
        if (videosData.length > 0 && !activeVideo) {
          setActiveVideo(videosData[0]);
        }
      }

      // Fetch ads and connection status
      const adsRes = await fetch('/api/ads');
      if (adsRes.ok) {
        const adsData = await adsRes.json();
        setAds(adsData.ads || []);
        setDbStatus(adsData.dbStatus || { connected: false, provider: 'Memory' });
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeVideo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle active video change and scroll to top
  const handleSelectVideo = (video: any) => {
    setActiveVideo(video);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Get specific ad script codes
  const getAdCode = (placement: string) => {
    const ad = ads.find(a => a.placement === placement);
    return ad ? ad.code : '';
  };

  // Contact form submission handler
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSuccess(true);
    setContactEmail('');
    setContactSubject('');
    setContactMsg('');
    setTimeout(() => setContactSuccess(false), 5000);
  };

  // Filter videos based on category and search query
  const filteredVideos = videos.filter((video) => {
    const matchesCategory = selectedCategory === 'All' || video.category === selectedCategory;
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (video.description && video.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Exclude current playing video for the sidebar playlist
  const sidebarPlaylist = videos.filter(v => activeVideo && v.id !== activeVideo.id)
    .filter(v => selectedCategory === 'All' || v.category === selectedCategory);

  return (
    <div className="app-container">
      {/* Background script injection for Popunder and Social Bar (if set) */}
      <AdContainer code={getAdCode('ad_popunder')} placement="ad_popunder" />
      <AdContainer code={getAdCode('ad_social_bar')} placement="ad_social_bar" />

      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        onOpenAdmin={() => setShowAdmin(true)}
      />

      <main className="main-content">
        {/* Top Header Leaderboard Ad */}
        <AdContainer 
          code={getAdCode('ad_header')} 
          placement="ad_header" 
          placeholderText="Header Banner Space (728x90)"
        />

        {isLoading ? (
          <div className="player-loading-placeholder glass-panel" style={{ height: '400px' }}>
            <div className="spinner"></div>
            <p>Loading Platform Videos...</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="player-error-placeholder glass-panel" style={{ minHeight: '300px' }}>
            <span className="error-icon">🎬</span>
            <p className="error-title">No Streams Available</p>
            <p className="error-desc" style={{ marginBottom: '16px' }}>This website is ready to broadcast. Enter the Admin dashboard to add video streams.</p>
            <button className="admin-trigger-btn" onClick={() => setShowAdmin(true)} style={{ margin: '0 auto' }}>
              Open Admin Dashboard
            </button>
          </div>
        ) : (
          <>
            {/* Active Video Player & Playlist Sidebar */}
            <div className="hero-layout">
              {/* Player Area */}
              <div className="player-section glass-panel">
                {activeVideo && (
                  <>
                    <VideoPlayer 
                      url={activeVideo.url} 
                      onEnded={() => {
                        // Play next video in queue if available
                        if (sidebarPlaylist.length > 0) {
                          setActiveVideo(sidebarPlaylist[0]);
                        }
                      }}
                    />
                    
                    <div className="active-video-details">
                      <span className="active-video-category">{activeVideo.category}</span>
                      <h2>{activeVideo.title}</h2>
                      {activeVideo.description && <p>{activeVideo.description}</p>}
                    </div>
                  </>
                )}

                {/* Banner Ad below the Video Player */}
                <AdContainer 
                  code={getAdCode('ad_under_player')} 
                  placement="ad_under_player" 
                  placeholderText="Under Player Ad Banner (468x60)"
                />
              </div>

              {/* Sidebar Up Next Playlist */}
              <div className="playlist-section glass-panel">
                <h3>
                  <Sparkles size={16} className="text-accent" />
                  Up Next {selectedCategory !== 'All' ? `in ${selectedCategory}` : ''}
                </h3>
                
                <div className="playlist-scroll">
                  {sidebarPlaylist.length === 0 ? (
                    <div className="empty-list" style={{ padding: '20px 10px' }}>
                      No other videos in this section.
                    </div>
                  ) : (
                    sidebarPlaylist.slice(0, 8).map((video) => (
                      <div 
                        key={video.id} 
                        className="playlist-card"
                        onClick={() => handleSelectVideo(video)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={video.thumbnail} 
                          alt="" 
                          className="playlist-thumb" 
                        />
                        <div className="playlist-info">
                          <span className="playlist-title">{video.title}</span>
                          <span className="playlist-category">{video.category}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Sidebar Rectangle Banner Ad */}
                <AdContainer 
                  code={getAdCode('ad_sidebar')} 
                  placement="ad_sidebar" 
                  placeholderText="Sidebar Rectangle Ad (300x250)"
                />
              </div>
            </div>

            {/* Video Cards Grid */}
            <div className="grid-section-header">
              <h2>More Premium Streams</h2>
              {searchQuery && <span className="playlist-category">Search results for: "{searchQuery}"</span>}
            </div>

            {filteredVideos.length === 0 ? (
              <div className="player-error-placeholder glass-panel" style={{ minHeight: '200px' }}>
                <p className="error-title">No Results Found</p>
                <p className="error-desc">We couldn't find any videos matching your search terms or category criteria.</p>
              </div>
            ) : (
              <div className="video-grid">
                {filteredVideos.map((video) => (
                  <div 
                    key={video.id} 
                    className="video-grid-card glass-panel"
                    onClick={() => handleSelectVideo(video)}
                  >
                    <div className="card-thumb-wrapper">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={video.thumbnail} 
                        alt={video.title} 
                        className="card-thumb"
                      />
                      <span className="card-badge">{video.category}</span>
                      <div className="play-hover-overlay">
                        <div className="play-hover-btn">
                          <Play className="play-hover-icon" />
                        </div>
                      </div>
                    </div>
                    <div className="card-details">
                      <h4>{video.title}</h4>
                      {video.description && <p>{video.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <Footer onOpenModal={(modalType) => setActiveLegalModal(modalType)} />

      {/* Admin Panel Modal Overlay */}
      {showAdmin && (
        <AdminPanel
          onClose={() => setShowAdmin(false)}
          onRefreshData={fetchData}
          videos={videos}
          ads={ads}
          dbStatus={dbStatus}
        />
      )}

      {/* Legal & Info Modals */}
      {activeLegalModal === 'dmca' && (
        <div className="modal-backdrop" onClick={() => setActiveLegalModal(null)}>
          <div className="admin-modal legal-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <ShieldAlert className="header-icon" />
                DMCA Copyright Policy
              </h2>
              <button className="close-btn" onClick={() => setActiveLegalModal(null)}>&times;</button>
            </div>
            <div className="legal-content">
              <p>GlowPlay respects the intellectual property rights of others. In accordance with the Digital Millennium Copyright Act ("DMCA"), we will respond expeditiously to notices of alleged copyright infringement committed on our website.</p>
              
              <h3>1. Filing a Infringement Notification</h3>
              <p>If you are a copyright owner, or authorized to act on behalf of one, please report alleged copyright infringements by sending a notice containing the following details:</p>
              <ul>
                <li>Identification of the copyrighted work that you claim has been infringed.</li>
                <li>Identification of the material that you claim is infringing (including the specific URL link of the stream on our site).</li>
                <li>Your contact information (name, mailing address, telephone number, and email address).</li>
                <li>A statement that you have a good faith belief that use of the material is not authorized by the copyright owner.</li>
                <li>A statement made under penalty of perjury that the information in the notification is accurate and that you are authorized to act.</li>
                <li>A physical or electronic signature of the copyright owner or authorized representative.</li>
              </ul>
              
              <h3>2. Notice Transmittal</h3>
              <p>Please transmit DMCA notices via email directly to our support desk:</p>
              <p><strong>dmca-notice@glowplay-stream.xyz</strong></p>
              
              <p>We review and remove infringing content within 24 to 48 hours of receipt of a valid notice. Please note that uploaders will be notified and repeated infringements will result in permanent access blocks.</p>
            </div>
          </div>
        </div>
      )}

      {activeLegalModal === 'privacy' && (
        <div className="modal-backdrop" onClick={() => setActiveLegalModal(null)}>
          <div className="admin-modal legal-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <FileText className="header-icon" />
                Privacy & Ad Cookie Policy
              </h2>
              <button className="close-btn" onClick={() => setActiveLegalModal(null)}>&times;</button>
            </div>
            <div className="legal-content">
              <p>This Privacy Policy describes how GlowPlay processes information collected through our streaming interface. By using our website, you consent to the processing of information as described herein.</p>
              
              <h3>1. Information We Collect Automatically</h3>
              <p>We do not require user registrations or profiles. We may automatically collect standard web server logging details including IP address, browser type, referring domain, and operating system.</p>
              
              <h3>2. Third-Party Advertising & Cookies (Adsterra)</h3>
              <p>We work with third-party ad networks, primarily <strong>Adsterra</strong>, to serve advertisements. These advertising networks may place cookies, web beacons, or execute JavaScript code blocks on your browser to collect anonymous behavioral statistics, evaluate ad effectiveness, and deliver personalized ads.</p>
              <p>We do not control or access cookies set by Adsterra. You can disable third-party cookies in your web browser preferences or use ad-blocking plugins if you wish to block analytics tracking.</p>
              
              <h3>3. Data Protection</h3>
              <p>We do not store, rent, or sell any personal visitor profiles. All data stored within our cloud database consists strictly of public video metadata (URLs, titles, categories) uploaded by site administrators.</p>
            </div>
          </div>
        </div>
      )}

      {activeLegalModal === 'terms' && (
        <div className="modal-backdrop" onClick={() => setActiveLegalModal(null)}>
          <div className="admin-modal legal-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <HelpCircle className="header-icon" />
                Terms of Service
              </h2>
              <button className="close-btn" onClick={() => setActiveLegalModal(null)}>&times;</button>
            </div>
            <div className="legal-content">
              <p>Welcome to GlowPlay. By accessing or using our streaming website, you agree to comply with and be bound by these Terms of Service.</p>
              
              <h3>1. Permitted Use</h3>
              <p>GlowPlay is a directory tool linking to public video sources. You may use our player interface for personal, non-commercial streaming entertainment only. You must not attempt to scrap, DDoS, or bypass the advertising layers of this website.</p>
              
              <h3>2. Content Disclaimer</h3>
              <p>GlowPlay does not host or store video files. We compile hyperlinks pointing to external third-party streaming resources. GlowPlay has no control over, and assumes no responsibility for, the content, quality, accuracy, privacy policies, or practices of any third-party websites or streams.</p>
              
              <h3>3. Limitation of Liability</h3>
              <p>In no event shall GlowPlay or its developers be held liable for any damages arising out of the use, inability to use, or external links provided on this streaming website.</p>
            </div>
          </div>
        </div>
      )}

      {activeLegalModal === 'contact' && (
        <div className="modal-backdrop" onClick={() => setActiveLegalModal(null)}>
          <div className="admin-modal legal-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <Mail className="header-icon" />
                Contact Support
              </h2>
              <button className="close-btn" onClick={() => setActiveLegalModal(null)}>&times;</button>
            </div>
            <div className="legal-content">
              {contactSuccess ? (
                <div className="alert success" style={{ margin: '20px 0' }}>
                  <CheckCircle2 size={16} />
                  <span>Your support ticket was sent! We will review your message shortly.</span>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit}>
                  <p>Have copyright claims, technical inquiries, or business propositions? Send us a message using the secure form below.</p>
                  
                  <div className="form-group">
                    <label>Your Email Address *</label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={e => setContactEmail(e.target.value)}
                      placeholder="name@email.com"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Subject *</label>
                    <input
                      type="text"
                      value={contactSubject}
                      onChange={e => setContactSubject(e.target.value)}
                      placeholder="e.g. Broken video link, feedback, DMCA notice"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Message Content *</label>
                    <textarea
                      value={contactMsg}
                      onChange={e => setContactMsg(e.target.value)}
                      placeholder="Describe your issue or request in detail..."
                      rows={5}
                      required
                    />
                  </div>

                  <button type="submit" className="submit-btn contact-form-btn">
                    <Send size={16} />
                    <span>Send Message</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
