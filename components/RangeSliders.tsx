import React from "react";

interface RangeSlidersProps {
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function RangeSliders({
  label,
  min = 1,
  max = 100,
  step = 1,
  value = 50,
  onChange,
}: RangeSlidersProps) {
  return (
    <>
      <div className="w-full">
        <label
          htmlFor="myRange"
          className="block mb-2 text-sm font-medium text-zinc-900 dark:text-white"
        >
          {label}
        </label>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600"
          onChange={onChange}
        />
      </div>
    </>
  );
}
