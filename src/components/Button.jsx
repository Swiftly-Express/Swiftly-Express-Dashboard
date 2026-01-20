import React from "react";

const Button = ({ variant = 'primary', className = '', children, ...rest }) => {
  const base = 'inline-flex items-center justify-center rounded-full !border !border-[#000000]';

  const variants = {
    primary: 'bg-[#00B75A] text-white',
    dark: 'bg-[#111111] text-white',
    light: 'bg-white text-[#00B75A] border border-gray-200',
    ghost: 'bg-transparent text-[#00B75A]'
  };

  // If caller provided border-related utilities (width or color), ensure a border style is present
  const needsBorderStyle = /(^|\s)(!?border(?:\[|-|$))/m.test(className);
  const borderStyleClass = needsBorderStyle ? 'border' : '';

  const classes = `${base} ${variants[variant] || variants.primary} ${borderStyleClass} ${className}`.trim();

  // Ensure inline border styles override Ionic CSS when caller requests a border
  const passedStyle = rest.style || {};
  const inlineStyle = { ...passedStyle };
  if (needsBorderStyle) {
    if (!inlineStyle.borderStyle) inlineStyle.borderStyle = 'solid';

    // extract explicit border color from className like border-[#0A0A0A]
    const colorMatch = className.match(/border-\[([^\]]+)\]/);
    if (colorMatch) inlineStyle.borderColor = colorMatch[1];

    // extract explicit border width from className like border-[1.5px]
    const widthMatch = className.match(/border-\[([0-9.]+)px\]/);
    if (widthMatch) inlineStyle.borderWidth = `${widthMatch[1]}px`;
  }

  return (
    <button className={classes} style={inlineStyle} {...rest}>
      {children}
    </button>
  );
};

export default Button;
