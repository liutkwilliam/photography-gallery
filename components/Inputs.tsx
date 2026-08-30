import React from "react";

type SelectOption = {
  value: string;
  label: string;
};

interface InputsProps {
  label?: string;
  type?: string;
  placeholder?: string;
  value?: string | number;
  min?: number;
  max?: number;
  step?: number;
  options?: SelectOption[];
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  children?: React.ReactNode;
}

export default function Inputs({
  label,
  type,
  placeholder,
  value,
  min,
  max,
  step,
  options,
  onChange,
  children,
  ...props
}: InputsProps) {
  const controlClasses = "mt-1 block w-full rounded-md border p-2 text-sm";

  return (
    <div className="flex flex-col">
      <label className="block text-sm font-medium">{label}</label>
      {options ? (
        <select
          value={value}
          onChange={onChange}
          className={controlClasses}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value || option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type || "text"}
          placeholder={placeholder}
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={onChange}
          className={controlClasses}
          {...props}
        />
      )}
      {children}
    </div>
  );
}
