import React from "react";

const Button = ({
  variant = "primary",
  className = "",
  children,
  ...rest
}) => {
  const base =
    "inline-flex items-center justify-center rounded-full transition-colors";

  const variants = {
    primary: "bg-[#00B956] hover:bg-[#00a44d] text-white px-6 py-5",
    dark: "bg-[#1A1A1A] hover:bg-black text-white px-6 py-5",
    ghost: "bg-transparent text-[#00B956] px-4 py-2",
  };

  const classes = `${base} ${variants[variant] || variants.primary} ${className}`.trim();

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
};

export default Button;
