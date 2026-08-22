import React from "react";

interface InputsProps {
  label?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  children?: React.ReactNode;
}

export default function Inputs({ label, type, placeholder, value, onChange, children, ...props }: InputsProps) {
  return (
    <div className="flex flex-col">
      <label className="block text-sm font-medium">{label}</label>
      <input
        type={type || "text"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="mt-1 block w-full rounded-md border p-2 text-sm"
        {...props}
      />{children}
    </div>
  );
}
