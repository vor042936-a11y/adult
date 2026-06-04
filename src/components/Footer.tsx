'use client';

import React from 'react';
import { ShieldCheck, Mail, HelpCircle, FileLock } from 'lucide-react';

interface FooterProps {
  onOpenModal: (modalType: 'dmca' | 'privacy' | 'terms' | 'contact') => void;
}

export default function Footer({ onOpenModal }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="glass-footer">
      <div className="footer-container">
        <div className="footer-brand">
          <h3><span>GLOW</span>PLAY</h3>
          <p>Stream ultra-fast, premium video streams under a highly responsive interface. Complete control over contents and configurations.</p>
        </div>

        <div className="footer-links-section">
          <h4>LEGAL & INFO</h4>
          <ul className="footer-links">
            <li>
              <button onClick={() => onOpenModal('dmca')} className="footer-link-btn">
                <ShieldCheck size={14} />
                <span>DMCA Notice</span>
              </button>
            </li>
            <li>
              <button onClick={() => onOpenModal('privacy')} className="footer-link-btn">
                <FileLock size={14} />
                <span>Privacy Policy</span>
              </button>
            </li>
            <li>
              <button onClick={() => onOpenModal('terms')} className="footer-link-btn">
                <HelpCircle size={14} />
                <span>Terms of Service</span>
              </button>
            </li>
            <li>
              <button onClick={() => onOpenModal('contact')} className="footer-link-btn">
                <Mail size={14} />
                <span>Contact Support</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-container">
          <p>© {currentYear} GlowPlay. All Rights Reserved. Built with Next.js and Vercel.</p>
          <div className="footer-badges">
            <span className="footer-badge vercel-badge">Vercel Ready</span>
            <span className="footer-badge ads-badge">Adsterra Optimized</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
