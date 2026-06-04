'use client';

import React from 'react';
import { Search, Settings, Film, Sparkles } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  onOpenAdmin: () => void;
}

const CATEGORIES = ['All', 'Trending', 'Animation', 'Cinematic', 'Sci-Fi', 'Action', 'Music', 'Comedy'];

export default function Header({ 
  searchQuery, 
  setSearchQuery, 
  selectedCategory, 
  setSelectedCategory, 
  onOpenAdmin 
}: HeaderProps) {
  return (
    <header className="glass-header">
      <div className="header-container">
        {/* Logo */}
        <div className="logo-section">
          <div className="logo-icon-box">
            <Film className="logo-icon" />
            <Sparkles className="logo-glow-icon" />
          </div>
          <h1>
            <span>GLOW</span>PLAY
          </h1>
        </div>

        {/* Search Bar */}
        <div className="search-section">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search premium videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
              &times;
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="action-section">
          <button className="admin-trigger-btn" onClick={onOpenAdmin}>
            <Settings size={16} />
            <span>Dashboard</span>
          </button>
        </div>
      </div>

      {/* Category Pills Navigation */}
      <div className="categories-bar-wrapper">
        <div className="categories-container">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              className={`category-pill ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
