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
      className="flex size-8 items-center justify-center rounded-full bg-zinc-950/70 text-zinc-100 shadow cursor-pointer hover:bg-zinc-950"
    >
      {icon}
    </button>
  );
}
