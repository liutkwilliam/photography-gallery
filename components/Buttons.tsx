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
  color = "foreground",
  bgColor = "primary",
  colorClasses = `text-${color} bg-${bgColor}`,
  additionalClasses = "",
  className = `${colorClasses} rounded-md py-1 md:py-2 px-2 md:px-4 w-auto text-xs lg:text-lg font-semibold flex flex-row items-center hover:bg-opacity-30 transition cursor-pointer ${additionalClasses}`,
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
