'use client';

import React, { useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
const Player = ReactPlayer as any;

interface VideoPlayerProps {
  url: string;
  onEnded?: () => void;
}

export default function VideoPlayer({ url, onEnded }: VideoPlayerProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Reset states when URL changes
  useEffect(() => {
    setIsReady(false);
    setError(null);
  }, [url]);

  if (!isMounted) {
    return (
      <div className="player-loading-placeholder">
        <div className="spinner"></div>
        <p>Loading Player Component...</p>
      </div>
    );
  }

  return (
    <div className="player-wrapper">
      {!isReady && !error && (
        <div className="player-loading-placeholder overlay">
          <div className="spinner"></div>
          <p>Loading Stream...</p>
        </div>
      )}

      {error && (
        <div className="player-error-placeholder">
          <div className="error-icon">⚠️</div>
          <p className="error-title">Playback Error</p>
          <p className="error-desc">{error}</p>
          <p className="error-note">Please verify the video URL is valid and public.</p>
        </div>
      )}

      <Player
        url={url}
        className="react-player"
        width="100%"
        height="100%"
        controls={true}
        playing={true}
        onReady={() => setIsReady(true)}
        onEnded={onEnded}
        onError={(e: any) => {
          console.error('ReactPlayer playback error:', e);
          setError('The video could not be loaded. Ensure the URL is correct and supported.');
        }}
        config={{
          youtube: {
            playerVars: { rel: 0 }
          }
        }}
      />
    </div>
  );
}
