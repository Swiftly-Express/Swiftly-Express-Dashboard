import React from "react";

const RevenueIcon = ({
  width = "1em",
  height = "1em",
  stroke = "currentColor",
  className = ""
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g clipPath="url(#clip0_revenue)">
        <path
          d="M0 7.00002H4.66667M4.66667 7.00002C4.66667 6.38118 4.9125 5.78769 5.35008 5.3501C5.78767 4.91252 6.38116 4.66669 7 4.66669C7.61884 4.66669 8.21233 4.91252 8.64992 5.3501C9.0875 5.78769 9.33333 6.38118 9.33333 7.00002M4.66667 7.00002C4.66667 7.61886 4.9125 8.21235 5.35008 8.64994C5.78767 9.08752 6.38116 9.33335 7 9.33335C7.61884 9.33335 8.21233 9.08752 8.64992 8.64994C9.0875 8.21235 9.33333 7.61886 9.33333 7.00002M9.33333 7.00002H14"
          stroke={stroke}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      <defs>
        <clipPath id="clip0_revenue">
          <rect width="14" height="14" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default RevenueIcon;
