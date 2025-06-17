import * as React from "react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: { value: string; label: string }[];
  className?: string;
  children?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, className = "", children, ...props }, ref) => (
    <label className={`inline-flex flex-col gap-1 ${className}`}>
      {label && <span className="text-sm text-gray-800">{label}</span>}
      <select
        ref={ref}
        className="form-select rounded-lg border border-solid border-gray-300 bg-white px-4 py-3 focus:ring focus:ring-primary/30"
        {...props}
      >
        {options ? 
          options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))
        : children}
      </select>
    </label>
  )
);
Select.displayName = "Select"; 