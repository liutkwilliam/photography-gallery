import React from "react";

interface RangeSlidersProps {
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  activeValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function RangeSliders({
  label,
  min = 1,
  max = 100,
  step = 1,
  value = 50,
  activeValue,
  onChange,
}: RangeSlidersProps) {
  return (
    <>
      <div className="w-full">
        <label
          htmlFor="myRange"
          className="block mb-2 text-sm font-medium text-zinc-100"
        >
          {label}
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
            onChange={onChange}
          />
          <span className="w-14 text-right text-sm text-zinc-300">
            {activeValue}
          </span>
        </div>
      </div>
    </>
  );
}
