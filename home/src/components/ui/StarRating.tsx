import { StarIcon } from "lucide-react";
import React from "react";

interface StarRatingProps {
  rating: number;
  size?: "sm" | "md";
  showCount?: boolean;
  count?: number;
}

export const StarRating = ({
  rating,
  size = "sm",
  showCount = false,
  count = 0,
}: StarRatingProps): JSX.Element => {
  const starSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-start gap-1">
        {[...Array(5)].map((_, i) => (
          <StarIcon
            key={i}
            className={`${starSize} ${
              i < Math.floor(rating)
                ? "fill-current text-yellow-500"
                : "text-gray-200"
            }`}
          />
        ))}
      </div>
      {showCount && (
        <span className={`font-body-extra-small text-gray-400 ${textSize}`}>
          ({count})
        </span>
      )}
    </div>
  );
}; 