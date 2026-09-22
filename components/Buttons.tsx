import React from "react";

interface ButtonsProps {
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  color?: string;
  bgColor?: string;
  colorClasses?: string;
  additionalClasses?: string;
  className?: string;

  disabled?: boolean;
  children?: React.ReactNode;
}

export default function Buttons({
  type,
  onClick,
  color = "text-foreground",
  bgColor = "bg-primary",
  colorClasses = `${color} ${bgColor}`,
  additionalClasses = "",
  className = `${colorClasses} rounded-md px-2 py-1 w-auto text-1x1 lg:text-lg font-semibold flex flex-row items-center hover:bg-opacity-30 transition cursor-pointer ${additionalClasses}`,
  disabled,
  children,
}: ButtonsProps) {
  return (
    <>
      <button
        type={type}
        onClick={onClick}
        className={className}
        disabled={disabled}
      >
        {children}
      </button>
    </>
  );
}
