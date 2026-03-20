import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function Button({ 
  children, 
  variant = "primary", 
  size = "md", 
  className = "", 
  style,
  ...props 
}: ButtonProps) {
  const baseStyles: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 600,
    borderRadius: "12px",
    transition: "all 0.3s ease",
    cursor: "pointer",
    border: "none",
    outline: "none",
  };

  const variants = {
    primary: {
      background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
      color: "#0A0B1A",
    },
    secondary: {
      background: "rgba(255, 215, 0, 0.1)",
      color: "#FFD700",
      border: "1px solid rgba(255, 215, 0, 0.3)",
    },
    outline: {
      background: "transparent",
      color: "#FFD700",
      border: "1px solid #FFD700",
    },
    ghost: {
      background: "transparent",
      color: "#FFFFFF",
    },
  };

  const sizes = {
    sm: { padding: "8px 16px", fontSize: "12px" },
    md: { padding: "12px 24px", fontSize: "14px" },
    lg: { padding: "16px 32px", fontSize: "16px" },
  };

  return (
    <button
      className={className}
      style={{ 
        ...baseStyles, 
        ...variants[variant], 
        ...sizes[size],
        ...style 
      }}
      {...props}
    >
      {children}
    </button>
  );
}