import React from "react";

const InfoIcon = ({ width = "1em", height = "1em", stroke = "currentColor", className = "" }) => {
    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth="1.5" />
            <path d="M12 8.5v.01" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M11.25 11.5h1.5v4" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

export default InfoIcon;
