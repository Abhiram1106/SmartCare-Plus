import React from 'react';
import { Star } from 'lucide-react';

const RatingBreakdown = ({ ratingBreakdown, totalReviews }) => {
  const ratings = [5, 4, 3, 2, 1];

  const getPercentage = (count) => {
    if (totalReviews === 0) return 0;
    return Math.round((count / totalReviews) * 100);
  };

  const getBarColor = (rating) => {
    if (rating >= 4) return 'bg-green-500';
    if (rating === 3) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-2">
      {ratings.map((rating) => {
        const count = ratingBreakdown?.[rating] || 0;
        const percentage = getPercentage(count);

        return (
          <div key={rating} className="flex items-center gap-3">
            <div className="flex items-center gap-1 w-12">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {rating}
              </span>
              <Star size={14} className="text-yellow-400 fill-yellow-400" />
            </div>

            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full ${getBarColor(rating)} transition-all duration-300`}
                style={{ width: `${percentage}%` }}
              />
            </div>

            <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default RatingBreakdown;
