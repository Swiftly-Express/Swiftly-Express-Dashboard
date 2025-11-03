import React from 'react';

const HandDrawnSvg= ({
  className,
  width = 90,
  height = 18,
  ariaLabel = 'hand-drawn underline',
  strokeColor = '#10b981',
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 16"
      className={className}
      role="img"
      aria-label={ariaLabel}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/*
        Using transform on the path with the viewBox center as the rotation origin.
        This avoids using a React style object inside the SVG markup.
      */}
      <path
        d="M 15 9 Q 70 -2, 95 7 L 40 10.2 Q 25 13.6, 45 16 L 75 15"
        stroke={strokeColor}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.85}
        transform="rotate(4 50 8)"
      />
    </svg>
  );
};

export default HandDrawnSvg;
