import React from "react";
import { cn } from "../../lib/utils";
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from "lucide-react";

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
  currentPage = 1, 
  totalPages = 1, 
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
  if (totalPages <= 1) return null;
  
  // Generate page numbers with ellipsis for large page counts
  const getPageNumbers = () => {
    const pageNumbers = [];
    
    // Always show first page
    pageNumbers.push(1);
    
    // For small number of pages, show all
    if (totalPages <= 7) {
      for (let i = 2; i < totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // For larger number of pages, show with ellipsis
      if (currentPage > 3) {
        pageNumbers.push('ellipsis-start');
      }
      
      // Show pages around current page
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pageNumbers.push('ellipsis-end');
      }
    }
    
    // Always show last page
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };
  
  const pageNumbers = getPageNumbers();
  
  return (
    <nav className={cn("flex items-center justify-center gap-1 sm:gap-2 mt-4", className)} aria-label="Pagination">
      <button
        className="p-2 rounded-md bg-gray-100 text-gray-700 disabled:opacity-50 hover:bg-gray-200 transition-colors"
        onClick={() => onPageChange && onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </button>
      
      <div className="hidden sm:flex items-center gap-1">
        {pageNumbers.map((page, index) => {
          if (page === 'ellipsis-start' || page === 'ellipsis-end') {
            return (
              <div key={`ellipsis-${index}`} className="flex items-center justify-center w-8 h-8">
                <MoreHorizontalIcon className="h-4 w-4 text-gray-400" />
              </div>
            );
          }
          
          return (
            <button
              key={page}
              className={`flex items-center justify-center w-8 h-8 rounded-md ${page === currentPage 
                ? "bg-primarymain text-white font-medium" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
              onClick={() => onPageChange && onPageChange(page as number)}
              aria-current={page === currentPage ? "page" : undefined}
              aria-label={`Page ${page}`}
            >
              {page}
            </button>
          );
        })}
      </div>
      
      {/* Mobile view - just show current page */}
      <div className="flex sm:hidden items-center">
        <span className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </span>
      </div>
      
      <button
        className="p-2 rounded-md bg-gray-100 text-gray-700 disabled:opacity-50 hover:bg-gray-200 transition-colors"
        onClick={() => onPageChange && onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        <ChevronRightIcon className="h-4 w-4" />
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