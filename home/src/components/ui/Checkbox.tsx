import * as React from "react";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = "", ...props }, ref) => (
    <label className={"inline-flex items-center gap-2 cursor-pointer " + className}>
      <input
        type="checkbox"
        ref={ref}
        className="form-checkbox h-5 w-5 text-primary rounded border-gray-300 focus:ring focus:ring-primary/30"
        {...props}
      />
      {label && <span className="text-sm text-gray-800">{label}</span>}
    </label>
  )
);
Checkbox.displayName = "Checkbox"; 