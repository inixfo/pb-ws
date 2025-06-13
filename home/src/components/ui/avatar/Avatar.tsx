import React from "react";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ className = "", children, ...props }) => {
  return (
    <div
      className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
}

export const AvatarImage: React.FC<AvatarImageProps> = ({ className = "", ...props }) => {
  return (
    <img
      className={`aspect-square h-full w-full ${className}`}
      {...props}
    />
  );
};

interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const AvatarFallback: React.FC<AvatarFallbackProps> = ({ className = "", children, ...props }) => {
  return (
    <div
      className={`flex h-full w-full items-center justify-center rounded-full bg-gray-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}; 