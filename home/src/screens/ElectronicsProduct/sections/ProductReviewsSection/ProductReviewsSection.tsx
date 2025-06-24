import {
  MessageSquareIcon,
  StarIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  ChevronDownIcon,
  ShoppingCartIcon,
  HeartIcon,
  RefreshCwIcon,
  Loader2Icon,
  AlertCircleIcon,
  LogInIcon,
  PencilIcon,
  CheckIcon,
  XIcon,
  FilterIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  Upload,
  X
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Separator } from "../../../../components/ui/separator";
import { Card, CardContent } from "../../../../components/ui/card";
import { StarRating } from "../../../../components/ui/StarRating";
import { useProduct } from "../../../../contexts/ProductContext";
import { useCart } from "../../../../context/CartContext";
import { useNavigate } from "react-router-dom";
import { reviewService } from "../../../../services/api/reviewService";
import { useAuth } from "../../../../contexts/AuthContext";

// Properly import dialog components from our UI library
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog";

// After imports, add this utility function
const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

// Define sort options for reviews
const sortOptions = [
  { value: "most_recent", label: "Most recent" },
  { value: "most_popular", label: "Most popular" },
  { value: "highest_rating", label: "Highest rating" },
  { value: "lowest_rating", label: "Lowest rating" },
];

// Add this function to handle user profile image display
const getUserProfileImage = (review: any) => {
  if (review.user?.profile_picture) {
    return review.user.profile_picture;
  }
  
  // Return a placeholder image
  return 'https://via.placeholder.com/48';
};

// Add an interface for review replies
interface ReviewReply {
  id: number;
  user?: {
    full_name?: string;
  };
  user_type?: string;
  comment: string;
  created_at: string;
}

export const ProductReviewsSection = (): JSX.Element => {
  const { product, loading, error } = useProduct();
  const { addToCart } = useCart();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [reviews, setReviews] = useState<any[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<any[]>([]);
  const [ratingDistribution, setRatingDistribution] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [canReview, setCanReview] = useState<boolean>(false);
  const [cannotReviewReason, setCannotReviewReason] = useState<string>("");
  const [isCheckingEligibility, setIsCheckingEligibility] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showLoginDialog, setShowLoginDialog] = useState<boolean>(false);
  const [showReviewDialog, setShowReviewDialog] = useState<boolean>(false);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewTitle, setReviewTitle] = useState<string>("");
  const [reviewComment, setReviewComment] = useState<string>("");
  const [filterVerifiedOnly, setFilterVerifiedOnly] = useState<boolean>(false);
  const [showSortMenu, setShowSortMenu] = useState<boolean>(false);
  const [currentSort, setCurrentSort] = useState<string>("most_popular");
  const [sortOrdering, setSortOrdering] = useState<string>("-created_at");
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Image upload state
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to handle review sorting
  const handleSortReviews = (sortType: string) => {
    setCurrentSort(sortType);
    setShowSortMenu(false);
    
    let ordering = '';
    switch (sortType) {
      case "most_recent":
        ordering = "-created_at";
        break;
      case "most_popular":
        ordering = "-helpful_votes";
        break;
      case "highest_rating":
        ordering = "-rating";
        break;
      case "lowest_rating":
        ordering = "rating";
        break;
      default:
        ordering = "-created_at";
    }
    
    setSortOrdering(ordering);
    fetchReviews(1, ordering);
  };
  
  // Fetch reviews for this product
  const fetchReviews = async (page = currentPage, ordering = sortOrdering) => {
    if (!product || !product.id) return;
    
    setIsLoading(true);
    try {
      // Fetch review summary first
      const productIdString = product.id.toString();
      console.log("Fetching review summary for product ID:", productIdString);
      console.log("API endpoint:", `/api/reviews/reviews/summary/?product=${productIdString}`);
      const summary = await reviewService.getReviewSummary(productIdString);
      console.log("Review summary response:", summary);
      
      // Update summary data
      setAverageRating(summary.average_rating || 0);
      setTotalReviews(summary.total_reviews || 0);
      
      // Calculate rating distribution
      const totalReviewsCount = summary.total_reviews || 1; // Avoid division by zero
      const distribution = [
        { stars: 5, count: summary.rating_distribution?.['5'] || 0, width: `${((summary.rating_distribution?.['5'] || 0) / totalReviewsCount) * 400}px` },
        { stars: 4, count: summary.rating_distribution?.['4'] || 0, width: `${((summary.rating_distribution?.['4'] || 0) / totalReviewsCount) * 400}px` },
        { stars: 3, count: summary.rating_distribution?.['3'] || 0, width: `${((summary.rating_distribution?.['3'] || 0) / totalReviewsCount) * 400}px` },
        { stars: 2, count: summary.rating_distribution?.['2'] || 0, width: `${((summary.rating_distribution?.['2'] || 0) / totalReviewsCount) * 400}px` },
        { stars: 1, count: summary.rating_distribution?.['1'] || 0, width: `${((summary.rating_distribution?.['1'] || 0) / totalReviewsCount) * 400}px` },
      ];
      
      setRatingDistribution(distribution);
      
      // Fetch actual reviews
      const params: any = {
        verified: filterVerifiedOnly ? 'true' : undefined
      };
      
      try {
        console.log("Fetching reviews for product ID:", productIdString);
        console.log("API endpoint:", `/api/reviews/reviews/?product=${productIdString}&page=${page}&page_size=10&ordering=${ordering}`);
        const fetchedReviews = await reviewService.getReviews(
          productIdString,
          page,
          10,
          ordering
        );
        console.log("Reviews response:", fetchedReviews);
        
        if (fetchedReviews && fetchedReviews.results) {
          setReviews(fetchedReviews.results);
          setFilteredReviews(fetchedReviews.results);
          setTotalPages(Math.ceil((fetchedReviews.count || 0) / 10));
          setCurrentPage(page);
        } else {
          // Fallback to empty or default reviews if API fails
          setReviews([]);
          setFilteredReviews([]);
          setTotalPages(1);
          setCurrentPage(1);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
        // Set default empty state
        setReviews([]);
        setFilteredReviews([]);
        setTotalPages(1);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      
      // Set default values in case of error
      setAverageRating(0);
      setTotalReviews(0);
      setRatingDistribution([
        { stars: 5, count: 0, width: '0px' },
        { stars: 4, count: 0, width: '0px' },
        { stars: 3, count: 0, width: '0px' },
        { stars: 2, count: 0, width: '0px' },
        { stars: 1, count: 0, width: '0px' },
      ]);
      setReviews([]);
      setFilteredReviews([]);
      setTotalPages(1);
      setCurrentPage(1);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (product && product.id) {
      fetchReviews();
      checkReviewEligibility();
    }
  }, [product]);
  
  // Refetch when filter changes
  useEffect(() => {
    if (product && product.id) {
      fetchReviews(1, sortOrdering);
    }
  }, [filterVerifiedOnly]);
  
  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchReviews(newPage, sortOrdering);
    }
  };

  // Check if current user can review this product
  const checkReviewEligibility = async () => {
    if (!product) return;
    
    setIsCheckingEligibility(true);
    try {
      // Get token directly
      const token = getAuthToken();
      
      // First check if user is authenticated
      if (!isAuthenticated() || !token) {
        setCanReview(false);
        setCannotReviewReason("Please log in to write a review");
        setIsCheckingEligibility(false);
        return;
      }
      
      // User is authenticated, check if they can review this product
      try {
        const productId = product.id.toString();
        console.log("Checking review eligibility for product ID:", productId);
        console.log("API endpoint:", `/api/reviews/can-review/?product=${productId}`);
        const result = await reviewService.canReviewProduct(productId);
        console.log("Review eligibility response:", result);
        
        // Check if the response indicates an authentication issue
        if (result.status === 'unauthenticated') {
          // Remove invalid token
          localStorage.removeItem('auth_token');
          // Force re-login
          setCanReview(false);
          setCannotReviewReason("Session expired - please log in again");
          setShowLoginDialog(true);
          return;
        }
        
        setCanReview(result.can_review);
        if (!result.can_review && result.reason) {
          setCannotReviewReason(result.reason);
        }
      } catch (error) {
        console.error("Error checking review eligibility:", error);
        setCanReview(false);
        setCannotReviewReason("Error checking eligibility. Please try again later.");
      }
    } catch (error) {
      console.error("Error checking review eligibility:", error);
      setCanReview(false);
      setCannotReviewReason("Error checking eligibility. Please try again later.");
    } finally {
      setIsCheckingEligibility(false);
    }
  };

  // Handle review button click
  const handleReviewButtonClick = () => {
    // If checking eligibility, do nothing
    if (isCheckingEligibility) return;
    
    // If not authenticated, show login dialog
    if (!isAuthenticated()) {
      setShowLoginDialog(true);
      return;
    }
    
    // If can review, show review dialog
    if (canReview) {
      setShowReviewDialog(true);
      return;
    }
    
    // Otherwise, show reason why user can't review
    alert(cannotReviewReason || "You are not eligible to review this product");
  };

  // Handle login redirect
  const handleLoginRedirect = () => {
    setShowLoginDialog(false);
    // Redirect to login page with return URL to come back
    navigate(`/signin?redirect=${encodeURIComponent(window.location.pathname)}`);
  };

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      // Limit to 3 images
      const selectedFiles = files.slice(0, 3 - reviewImages.length);
      
      // Create preview URLs
      const newPreviewUrls = selectedFiles.map(file => URL.createObjectURL(file));
      
      setReviewImages([...reviewImages, ...selectedFiles]);
      setImagePreviewUrls([...imagePreviewUrls, ...newPreviewUrls]);
    }
  };
  
  // Remove selected image
  const removeImage = (index: number) => {
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(imagePreviewUrls[index]);
    
    // Remove image from state
    const newImages = [...reviewImages];
    const newPreviewUrls = [...imagePreviewUrls];
    
    newImages.splice(index, 1);
    newPreviewUrls.splice(index, 1);
    
    setReviewImages(newImages);
    setImagePreviewUrls(newPreviewUrls);
  };
  
  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle submit review
  const handleSubmitReview = async () => {
    if (!product) return;
    
    try {
      // First check if user is authenticated
      if (!isAuthenticated()) {
        setShowLoginDialog(true);
        return;
      }
      
      console.log("Creating review for product:", product.id);
      const reviewData = {
        product: product.id,
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment,
      };
      
      console.log("Review data:", reviewData);
      console.log("Images:", reviewImages);
      
      // Create the review with images if any
      await reviewService.createReview(reviewData, reviewImages.length > 0 ? reviewImages : undefined);
      
      // Reset form and close dialog
      setReviewRating(5);
      setReviewTitle("");
      setReviewComment("");
      setReviewImages([]);
      setImagePreviewUrls([]);
      setShowReviewDialog(false);
      
      // Reload reviews
      fetchReviews();
      
      // Show success message
      alert("Your review has been submitted successfully!");
      
      // Update review eligibility
      setCanReview(false);
      setCannotReviewReason("You have already reviewed this product");
      
    } catch (error: any) {
      console.error("Error submitting review:", error);
      
      // Show more detailed error message if available
      let errorMessage = "There was an error submitting your review. Please try again later.";
      
      if (error.response?.status === 401) {
        errorMessage = "Your session has expired. Please log in again.";
        // Clear token and show login dialog
        localStorage.removeItem('auth_token');
        setShowLoginDialog(true);
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      alert(errorMessage);
    }
  };

  // Handle liking and disliking reviews
  const handleLikeReview = async (reviewId: number, isLike: boolean) => {
    // Check if user is logged in
    if (!isAuthenticated()) {
      setShowLoginDialog(true);
      return;
    }
    
    try {
      await reviewService.voteReview(
        reviewId.toString(), 
        isLike ? 'helpful' : 'unhelpful'
      );
      
      // Refresh reviews to get updated votes
      fetchReviews();
    } catch (error) {
      console.error("Error voting on review:", error);
      alert("There was an error voting on this review. Please try again later.");
    }
  };

  // Handle replying to a review
  const [replyingToReviewId, setReplyingToReviewId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState<string>("");
  const [isSubmittingReply, setIsSubmittingReply] = useState<boolean>(false);

  const handleReplyToReview = async (reviewId: number) => {
    // Check if user is logged in
    if (!isAuthenticated()) {
      setShowLoginDialog(true);
      return;
    }
    
    setReplyingToReviewId(reviewId);
  };

  const submitReply = async (reviewId: number) => {
    if (!replyText.trim()) {
      alert("Please enter a reply");
      return;
    }
    
    setIsSubmittingReply(true);
    try {
      await reviewService.replyToReview(reviewId.toString(), replyText);
      
      // Refresh reviews to get updated replies
      fetchReviews();
      
      // Reset state
      setReplyingToReviewId(null);
      setReplyText("");
      
      // Show success message
      alert("Your reply has been submitted successfully!");
    } catch (error) {
      console.error("Error replying to review:", error);
      alert("There was an error submitting your reply. Please try again later.");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Replace the getCurrentPageReviews function with our updated logic
  const getCurrentPageReviews = () => {
    return filteredReviews;
  };

  // Add this formatDate function after the getCurrentPageReviews function
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (e) {
      return dateString;
    }
  };

  // Add these default reviews after the getCurrentPageReviews function
  const defaultReviews = [
    {
      id: 1,
      user: {
        id: 1,
        full_name: "John Doe",
        profile_picture: null
      },
      rating: 5,
      title: "Great Product",
      comment: "This product exceeded my expectations. The battery life is excellent and the camera quality is amazing.",
      created_at: new Date().toISOString(),
      helpful_votes: 12,
      unhelpful_votes: 2,
      is_verified_purchase: true,
      replies: []
    },
    {
      id: 2,
      user: {
        id: 2,
        full_name: "Jane Smith",
        profile_picture: null
      },
      rating: 4,
      title: "Good value for money",
      comment: "Overall satisfied with this purchase. Fast delivery and good performance. Would recommend to others.",
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      helpful_votes: 8,
      unhelpful_votes: 1,
      is_verified_purchase: true,
      replies: []
    }
  ];

  // Add these default rating distribution after the defaultReviews
  const defaultRatingDistribution = [
    { stars: 5, count: 8, width: "200px" },
    { stars: 4, count: 5, width: "125px" },
    { stars: 3, count: 3, width: "75px" },
    { stars: 2, count: 1, width: "25px" },
    { stars: 1, count: 0, width: "0px" },
  ];

  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2Icon className="w-8 h-8 text-primarymain animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center p-8">
        <AlertCircleIcon className="w-8 h-8 text-dangermain mb-4" />
        <p>Error loading reviews</p>
      </div>
    );
  }

  // Get reviews for the current page
  const currentPageReviews = getCurrentPageReviews();
  
  // Use filtered reviews, fallback to default reviews if no reviews
  const displayReviews = filteredReviews.length > 0 ? currentPageReviews : defaultReviews;
  const displayRatingDistribution = ratingDistribution.length > 0 ? ratingDistribution : defaultRatingDistribution;

  return (
    <div className="flex w-full max-w-[1296px] gap-6 lg:gap-8">
      <div className="flex flex-col w-full lg:w-[746px] gap-6">
        <div className="flex flex-col gap-4 w-full">
          <div className="flex justify-between items-center w-full">
            <h2 className="font-heading-desktop-h3 text-gray-900 text-xl sm:text-2xl">
              Reviews {filteredReviews.length > 0 && `(${filteredReviews.length})`}
            </h2>
            <Button
              variant="secondary"
              className="flex gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-gray-100 rounded-lg"
              onClick={handleReviewButtonClick}
              disabled={isCheckingEligibility}
            >
              {isCheckingEligibility ? (
                <Loader2Icon className="w-4 h-4 animate-spin" />
              ) : canReview ? (
                <PencilIcon className="w-4 h-4" />
              ) : (
                <AlertCircleIcon className="w-4 h-4" />
              )}
              <span className="font-navigation-nav-link-small text-gray-700 text-sm">
                {isCheckingEligibility 
                  ? "Checking..." 
                  : canReview 
                    ? "Leave a review" 
                    : isAuthenticated() 
                      ? "Cannot review" 
                      : "Log in to review"}
              </span>
            </Button>
          </div>
          
          {/* Login Dialog */}
          <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Login Required</DialogTitle>
                <DialogDescription>
                  You need to log in before you can write a review.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowLoginDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleLoginRedirect}>
                  <LogInIcon className="w-4 h-4 mr-2" />
                  Log In
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Review Form Dialog */}
          <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Write a Review</DialogTitle>
                <DialogDescription>
                  Share your experience with this product.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="rating" className="text-sm font-medium">
                    Rating
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="focus:outline-none"
                      >
                        <StarIcon
                          className={`w-6 h-6 ${
                            star <= reviewRating
                              ? "text-yellow-500 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="title" className="text-sm font-medium">
                    Title
                  </label>
                  <input
                    id="title"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    className="border rounded-md px-3 py-2"
                    placeholder="Summarize your experience"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="comment" className="text-sm font-medium">
                    Review
                  </label>
                  <textarea
                    id="comment"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="border rounded-md px-3 py-2 min-h-[100px]"
                    placeholder="Share your experience with this product"
                  ></textarea>
                </div>
                <div className="mb-6">
                  <label className="block text-gray-700 mb-2">Upload Images (Optional)</label>
                  <div className="flex flex-wrap gap-4">
                    {/* Image previews */}
                    {imagePreviewUrls.map((url, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={url} 
                          alt={`Preview ${index + 1}`} 
                          className="w-24 h-24 object-cover border rounded"
                        />
                        <button 
                          type="button"
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow"
                          onClick={() => removeImage(index)}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    
                    {/* Upload button */}
                    {reviewImages.length < 3 && (
                      <button
                        type="button"
                        onClick={triggerFileInput}
                        className="w-24 h-24 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50"
                      >
                        <Upload size={24} />
                        <span className="text-xs mt-1">Upload</span>
                      </button>
                    )}
                    
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    You can upload up to 3 images. Recommended format: JPG, PNG.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
                  <XIcon className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSubmitReview} disabled={!reviewComment.trim()}>
                  <CheckIcon className="w-4 h-4 mr-2" />
                  Submit Review
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full">
            <div className="flex flex-col items-center justify-center w-full sm:w-[196px] h-[150px] sm:h-[170px] bg-gray-50 rounded-lg">
              <span className="font-heading-desktop-h1 text-gray-900 text-center text-3xl sm:text-4xl">
                {averageRating ? averageRating.toFixed(1) : '0.0'}
              </span>
              <div className="flex flex-col items-center gap-2 mt-4">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                      <StarIcon
                      key={star}
                      className={`w-3.5 h-3.5 ${
                        star <= Math.floor(averageRating)
                          ? "fill-current text-yellow-500"
                          : "text-gray-300"
                      }`}
                      />
                    ))}
                </div>
                <span className="font-normal text-gray-600 text-sm text-center">
                  {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                </span>
              </div>
            </div>

            <div className="flex flex-col w-full sm:w-[526px] gap-3 justify-center">
              {displayRatingDistribution.map((rating) => (
                <div
                  key={rating.stars}
                  className="flex items-center gap-3 w-full"
                >
                  <div className="flex items-center gap-1 w-[50px]">
                    <StarIcon className="w-3.5 h-3.5 fill-current text-yellow-500" />
                    <span className="font-normal text-gray-600 text-sm">
                      {rating.stars}
                    </span>
                  </div>
                  <div className="relative flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-500 rounded-full"
                      style={{ width: rating.width }}
                    ></div>
                  </div>
                  <span className="font-normal text-gray-600 text-sm w-[50px] text-right">
                    {rating.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 w-full">
          <div className="flex flex-col gap-4 w-full">
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center gap-2">
                <div className="relative w-5 h-5 cursor-pointer" onClick={() => setFilterVerifiedOnly(!filterVerifiedOnly)}>
                  <div className={`absolute w-4 h-4 rounded border ${filterVerifiedOnly ? 'bg-primarymain border-primarymain' : 'bg-white border-gray-300'}`}></div>
                  {filterVerifiedOnly && <CheckIcon className="absolute w-3 h-3 text-white top-0.5 left-0.5" />}
                </div>
                <span className="font-normal text-gray-700 text-sm">
                  Only verified
                </span>
              </div>

              <div className="relative">
                <button 
                  className="flex items-center gap-2.5 px-4 py-[9px] bg-white-100 rounded-lg border border-gray-200"
                  onClick={() => setShowSortMenu(!showSortMenu)}
                >
                  <FilterIcon className="w-4 h-4 text-gray-600" />
                <span className="flex-1 font-normal text-gray-600 text-sm">
                    {sortOptions.find(option => option.value === currentSort)?.label || "Most popular"}
                </span>
                <ChevronDownIcon className="w-3.5 h-3.5 text-gray-600" />
                </button>
                
                {showSortMenu && (
                  <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    {sortOptions.map(option => (
                      <button
                        key={option.value}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                        onClick={() => {
                          setCurrentSort(option.value);
                          setShowSortMenu(false);
                          handleSortReviews(option.value);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {option.value === currentSort && (
                            <CheckIcon className="w-4 h-4 text-primarymain" />
                          )}
                          <span className={option.value === currentSort ? "ml-0" : "ml-6"}>
                            {option.label}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <Separator className="w-full" />
          </div>

          {filteredReviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center w-full py-8">
              <p className="text-gray-600 mb-4">No reviews yet for this product.</p>
              {canReview ? (
                <Button 
                  variant="secondary"
                  className="flex gap-1.5 px-4 py-2.5 bg-gray-100 rounded-lg"
                  onClick={() => setShowReviewDialog(true)}
                >
                  <PencilIcon className="w-4 h-4" />
                  <span className="font-navigation-nav-link-small text-gray-700">
                    Be the first to write a review
                  </span>
                </Button>
              ) : (
              <Button 
                variant="secondary"
                className="flex gap-1.5 px-4 py-2.5 bg-gray-100 rounded-lg"
                  onClick={handleReviewButtonClick}
                  disabled={isCheckingEligibility}
                >
                  {isCheckingEligibility ? (
                    <Loader2Icon className="w-4 h-4 animate-spin" />
                  ) : (
                    <AlertCircleIcon className="w-4 h-4" />
                  )}
                <span className="font-navigation-nav-link-small text-gray-700">
                    {cannotReviewReason || "Check eligibility to review"}
                </span>
              </Button>
              )}
            </div>
          ) : (
            displayReviews.map((review) => (
              <div key={review.id} className="border rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    <img
                      src={getUserProfileImage(review)}
                      alt={review.user?.full_name || "User"}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold">{review.user?.full_name || "Anonymous"}</h4>
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="mr-2">{formatDate(review.created_at)}</span>
                          {review.is_verified_purchase && (
                            <span className="text-green-600 text-xs font-medium px-2 py-0.5 rounded bg-green-100">
                              Verified Purchase
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} className="text-yellow-400">
                            {star <= review.rating ? "★" : "☆"}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <h5 className="font-semibold mt-2">{review.title}</h5>
                    <p className="text-gray-700 mt-1">{review.comment}</p>
                    
                    {/* Display review images if available */}
                    {(review.image1 || review.image2 || review.image3) && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {review.image1 && (
                          <a href={review.image1} target="_blank" rel="noopener noreferrer">
                            <img 
                              src={review.image1} 
                              alt="Review image 1" 
                              className="w-20 h-20 object-cover rounded border cursor-pointer"
                            />
                          </a>
                        )}
                        {review.image2 && (
                          <a href={review.image2} target="_blank" rel="noopener noreferrer">
                            <img 
                              src={review.image2} 
                              alt="Review image 2" 
                              className="w-20 h-20 object-cover rounded border cursor-pointer"
                            />
                          </a>
                        )}
                        {review.image3 && (
                          <a href={review.image3} target="_blank" rel="noopener noreferrer">
                            <img 
                              src={review.image3} 
                              alt="Review image 3" 
                              className="w-20 h-20 object-cover rounded border cursor-pointer"
                            />
                          </a>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center mt-3">
                      <button
                        className="text-sm flex items-center text-gray-500 hover:text-blue-600 mr-4"
                        onClick={() => handleLikeReview(review.id, true)}
                      >
                        <span className="mr-1">👍</span>
                        Helpful ({review.helpful_votes})
                      </button>
                      <button
                        className="text-sm flex items-center text-gray-500 hover:text-blue-600 mr-4"
                        onClick={() => handleLikeReview(review.id, false)}
                      >
                        <span className="mr-1">👎</span>
                        Not Helpful ({review.unhelpful_votes})
                      </button>
                      <button
                        className="text-sm text-gray-500 hover:text-blue-600"
                        onClick={() => handleReplyToReview(review.id)}
                      >
                        Reply
                      </button>
                    </div>
                    
                    {/* Display replies */}
                    {review.replies && review.replies.length > 0 && (
                      <div className="mt-3 pl-4 border-l-2 border-gray-200">
                        {review.replies.map((reply: ReviewReply) => (
                          <div key={reply.id} className="mb-2 pb-2 border-b border-gray-100">
                            <div className="flex items-start">
                              <img
                                src={`https://ui-avatars.com/api/?name=${reply.user?.full_name || "User"}&background=random`}
                                alt={reply.user?.full_name || "User"}
                                className="w-8 h-8 rounded-full mr-2"
                              />
                              <div>
                                <div className="flex items-center">
                                  <span className="font-semibold text-sm">
                                    {reply.user?.full_name || "Anonymous"}
                                  </span>
                                  {reply.user_type && (
                                    <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                                      reply.user_type === 'admin' ? 'bg-purple-100 text-purple-800' : 
                                      reply.user_type === 'vendor' ? 'bg-blue-100 text-blue-800' : 
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {reply.user_type.charAt(0).toUpperCase() + reply.user_type.slice(1)}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-700">{reply.comment}</p>
                                <span className="text-xs text-gray-500">
                                  {formatDate(reply.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Reply form */}
                    {replyingToReviewId === review.id && (
                      <div className="mt-3 pl-4 border-l-2 border-gray-200">
                        <textarea
                          className="w-full p-2 border rounded text-sm"
                          rows={2}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write your reply..."
                        />
                        <div className="flex justify-end mt-2">
                          <button
                            className="px-3 py-1 text-xs border rounded text-gray-700 hover:bg-gray-100 mr-2"
                            onClick={() => setReplyingToReviewId(null)}
                          >
                            Cancel
                          </button>
                          <button
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                            onClick={() => submitReply(review.id)}
                            disabled={isSubmittingReply || !replyText.trim()}
                          >
                            {isSubmittingReply ? 'Submitting...' : 'Submit Reply'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-6 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ArrowLeftIcon className="w-4 h-4" />
              </Button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Logic to show current page and surrounding pages
                let pageToShow;
                if (totalPages <= 5) {
                  pageToShow = i + 1;
                } else if (currentPage <= 3) {
                  pageToShow = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageToShow = totalPages - 4 + i;
                } else {
                  pageToShow = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageToShow}
                    variant={currentPage === pageToShow ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageToShow)}
                    className="w-8 h-8"
                  >
                    {pageToShow}
                  </Button>
                );
              })}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ArrowRightIcon className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {product && (
        <div className="hidden lg:block md:self-start sticky top-4">
          <Card className="w-full md:w-[280px] lg:w-[320px] border border-[#e0e5eb] rounded-lg">
            <div className="p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2 w-full">
                <div 
                  className="w-[70px] h-[70px] rounded bg-cover bg-center flex-shrink-0" 
                  style={{ 
                    backgroundImage: `url(${
                      product.primary_image ? 
                        (typeof product.primary_image === 'string' 
                        ? product.primary_image 
                          : '/placeholder.png')
                        : (product.image || '/placeholder.png')
                    })`
                  }}
                />
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 w-full">
                    <StarRating
                      rating={product.rating || 0}
                      showCount
                      count={filteredReviews.length || 0}
                      size="sm"
                    />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {product.name}
                  </h3>
                  <div className="flex items-center h-6 w-full">
                    <span className="text-gray-900 font-heading-desktop-h5 text-lg font-semibold">
                      ৳{product.sale_price || product.price}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2 w-full">
                <Button 
                  className="flex-1 bg-primarymain hover:bg-primarymain/90 text-white-100 gap-1 rounded-lg text-xs h-8 px-2"
                  onClick={() => {
                    // Scroll to the product info section
                    const productInfoSection = document.getElementById('product-info-section');
                    if (productInfoSection) {
                      productInfoSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  disabled={!product.is_available && (product.stock_quantity || 0) <= 0}
                >
                  <ShoppingCartIcon className="w-3 h-3" />
                  <span className="hidden sm:inline">Add to cart</span>
                  <span className="sm:hidden">Add</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="p-1.5 bg-gray-100 border-0 h-8 w-8"
                >
                  <HeartIcon className="w-3 h-3" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="p-1.5 bg-gray-100 border-0 h-8 w-8"
                >
                  <RefreshCwIcon className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}; 