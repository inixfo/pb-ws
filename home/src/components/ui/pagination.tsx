import React from "react";
import { cn } from "../../lib/utils";

interface PaginationProps {
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  className?: string;
  children?: React.ReactNode;
}

interface PaginationItemProps {
  className?: string;
  children?: React.ReactNode;
}

interface PaginationLinkProps {
  className?: string;
  isActive?: boolean;
  children?: React.ReactNode;
  onClick?: () => void;
}

const Pagination: React.FC<PaginationProps> = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  className,
  children
}) => {
  // If we have children, render them (used for custom pagination in the Account component)
  if (children) {
    return (
      <nav className={cn("flex items-center gap-2 mt-4", className)} aria-label="Pagination">
        {children}
      </nav>
    );
  }
  
  // Otherwise, render the standard pagination (used in other components)
  if (totalPages && totalPages <= 1) return null;
  const pages = totalPages ? Array.from({ length: totalPages }, (_, i) => i + 1) : [];
  
  return (
    <nav className={cn("flex items-center gap-2 mt-4", className)} aria-label="Pagination">
      <button
        className="px-3 py-1 rounded bg-gray-100 text-gray-700 disabled:opacity-50"
        onClick={() => onPageChange && onPageChange(currentPage ? currentPage - 1 : 1)}
        disabled={currentPage === 1}
      >
        Prev
      </button>
      {pages.map((page) => (
        <button
          key={page}
          className={`px-3 py-1 rounded ${page === currentPage ? "bg-primary text-white" : "bg-gray-100 text-gray-700"}`}
          onClick={() => onPageChange && onPageChange(page)}
          aria-current={page === currentPage ? "page" : undefined}
        >
          {page}
        </button>
      ))}
      <button
        className="px-3 py-1 rounded bg-gray-100 text-gray-700 disabled:opacity-50"
        onClick={() => onPageChange && onPageChange(currentPage ? currentPage + 1 : 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </button>
    </nav>
  );
};

const PaginationItem: React.FC<PaginationItemProps> = ({ className, children }) => {
  return (
    <div className={cn("", className)}>
      {children}
    </div>
  );
};

const PaginationLink: React.FC<PaginationLinkProps> = ({ 
  className, 
  isActive,
  children,
  onClick
}) => {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center text-sm rounded",
        isActive ? "bg-primary text-white" : "text-gray-700",
        className
      )}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
    >
      {children}
    </button>
  );
};

// Export as both named exports and default export
export { Pagination, PaginationItem, PaginationLink };
export default Pagination; 