import * as React from "react"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"
import { ToastProps } from "./use-toast-hook"

// Simple toast component without external dependencies
const Toast = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div"> & { 
    variant?: "default" | "destructive", 
    onOpenChange?: (open: boolean) => void,
    open?: boolean
  }
>(({ className, variant = "default", children, ...props }, ref) => {
  const isOpen = props.open ?? true;
  
  React.useEffect(() => {
    if (isOpen && props.onOpenChange) {
      const timer = setTimeout(() => {
        props.onOpenChange?.(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, props.onOpenChange]);
  
  if (!isOpen) return null;
  
  return (
    <div
      ref={ref}
      className={cn(
        "fixed bottom-4 right-4 z-50 flex max-w-md items-start gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-lg",
        variant === "destructive" && "border-red-500 bg-red-50",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
Toast.displayName = "Toast";

const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const ToastViewport = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("fixed bottom-0 right-0 flex flex-col p-4 gap-2 z-50", className)}
    {...props}
  />
));
ToastViewport.displayName = "ToastViewport";

const ToastTitle = React.forwardRef<
  HTMLHeadingElement,
  React.ComponentPropsWithoutRef<"h2">
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("font-semibold text-gray-900", className)}
    {...props}
  />
));
ToastTitle.displayName = "ToastTitle";

const ToastDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<"p">
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-500", className)}
    {...props}
  />
));
ToastDescription.displayName = "ToastDescription";

const ToastClose = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<"button">
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "absolute top-2 right-2 rounded-md p-1 text-gray-500 hover:text-gray-900",
      className
    )}
    onClick={() => {
      // Find the closest Toast component and close it
      const toast = (props as any).closest?.("[data-toast]");
      if (toast) {
        toast.remove();
      }
    }}
    {...props}
  >
    <X className="h-4 w-4" />
  </button>
));
ToastClose.displayName = "ToastClose";

export {
  Toast,
  ToastProvider,
  ToastViewport,
  ToastTitle,
  ToastDescription,
  ToastClose,
}; 