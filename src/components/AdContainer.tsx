'use client';

import React, { useEffect, useRef } from 'react';

interface AdContainerProps {
  code: string;
  placement: string;
  placeholderText?: string;
}

export default function AdContainer({ code, placement, placeholderText }: AdContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous contents
    containerRef.current.innerHTML = '';

    if (!code || code.trim() === '') {
      return;
    }

    try {
      // Parse the HTML block
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = code;

      // Extract script tags and non-script nodes
      const children = Array.from(tempDiv.childNodes);

      children.forEach((child) => {
        if (child.nodeName === 'SCRIPT') {
          const originalScript = child as HTMLScriptElement;
          const newScript = document.createElement('script');

          // Copy attributes
          Array.from(originalScript.attributes).forEach((attr) => {
            newScript.setAttribute(attr.name, attr.value);
          });

          // Copy inner JS content
          newScript.textContent = originalScript.textContent;

          // If the script contains atOptions (often used in Adsterra) we assign it to window
          if (originalScript.textContent && originalScript.textContent.includes('atOptions')) {
            try {
              // Safely execute atOptions configuration in client window context
              // This ensures that when the invoke.js script loads, it finds window.atOptions
              const evalCode = `(function() { ${originalScript.textContent} })();`;
              // eslint-disable-next-line no-eval
              eval(evalCode);
            } catch (e) {
              console.error('Error executing inline ad options:', e);
            }
          }

          containerRef.current?.appendChild(newScript);
        } else {
          // Clone other markup (like divs, iframes, style tags)
          containerRef.current?.appendChild(child.cloneNode(true));
        }
      });
    } catch (err) {
      console.error('Error rendering ad script for placement:', placement, err);
    }
  }, [code, placement]);

  // Show a beautiful, premium placeholder if no ad code is set
  if (!code || code.trim() === '') {
    return (
      <div className={`ad-placeholder-wrapper ad-${placement}`}>
        <div className="ad-placeholder-content">
          <span className="ad-badge">AD ZONE</span>
          <p className="ad-title">{placeholderText || 'Banner Ad Area'}</p>
          <span className="ad-subtext">Insert Adsterra code in Admin Panel</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`ad-container-wrapper ad-${placement}`}>
      <span className="ad-badge-live">ADVERTISEMENT</span>
      <div ref={containerRef} className="ad-content-box" />
    </div>
  );
}
