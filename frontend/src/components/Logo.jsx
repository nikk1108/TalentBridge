import React from 'react';

const Logo = ({ size = 20, className = "" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      <defs>
        {/* Mask to cut a clean gap in the Left Pier around the Bridge Deck and the Right Pier */}
        <mask id="logo-left-pier-mask">
          <rect width="24" height="24" fill="white" />
          {/* Cut out Bridge Deck */}
          <path 
            d="M 5.5 12.5 Q 12 8 18.5 12.5" 
            stroke="black" 
            strokeWidth="5.5" 
            strokeLinecap="round" 
            fill="none" 
          />
          {/* Cut out Right Pier */}
          <rect 
            x="13.75" 
            y="6" 
            width="3.5" 
            height="14" 
            rx="1.75" 
            transform="rotate(20 15.5 13)" 
            fill="black"
            stroke="black"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </mask>

        {/* Mask to cut a clean gap in the Bridge Deck around the Right Pier */}
        <mask id="logo-deck-mask">
          <rect width="24" height="24" fill="white" />
          {/* Cut out Right Pier */}
          <rect 
            x="13.75" 
            y="6" 
            width="3.5" 
            height="14" 
            rx="1.75" 
            transform="rotate(20 15.5 13)" 
            fill="black"
            stroke="black"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </mask>
      </defs>

      {/* Left Pier - Premium SaaS Purple */}
      <rect 
        x="6.75" 
        y="6" 
        width="3.5" 
        height="14" 
        rx="1.75" 
        transform="rotate(-20 8.5 13)" 
        fill="#7C3AED" 
        mask="url(#logo-left-pier-mask)"
      />

      {/* Bridge Deck - Vibrant Pink/Fuchsia */}
      <path 
        d="M 5.5 12.5 Q 12 8 18.5 12.5" 
        stroke="#EC4899" 
        strokeWidth="3.5" 
        strokeLinecap="round" 
        fill="none" 
        mask="url(#logo-deck-mask)"
      />

      {/* Right Pier - Vibrant Rose/Coral */}
      <rect 
        x="13.75" 
        y="6" 
        width="3.5" 
        height="14" 
        rx="1.75" 
        transform="rotate(20 15.5 13)" 
        fill="#F43F5E" 
      />
    </svg>
  );
};

export default Logo;
