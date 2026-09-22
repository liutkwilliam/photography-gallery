import React from "react";

interface arrowButtonProp {
  ariaLabel: string;
  onClick: () => void;
  icon: React.ReactNode;
}

export default function ArrowButtons({
  ariaLabel,
  onClick,
  icon,
}: arrowButtonProp) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className="flex size-8 items-center justify-center rounded-full bg-background/90 text-foreground shadow cursor-pointer hover:bg-background/70"
    >
      {icon}
    </button>
  );
}
