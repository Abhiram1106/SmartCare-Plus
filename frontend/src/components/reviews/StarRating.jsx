import React from 'react';
import { Star } from 'lucide-react';

const StarRating = ({ 
  rating = 0, 
  maxRating = 5, 
  size = 20, 
  interactive = false, 
  onRatingChange = () => {},
  showValue = false,
  className = ''
}) => {
  const [hoverRating, setHoverRating] = React.useState(0);

  const handleClick = (selectedRating) => {
    if (interactive) {
      onRatingChange(selectedRating);
    }
  };

  const handleMouseEnter = (selectedRating) => {
    if (interactive) {
      setHoverRating(selectedRating);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  const getStarColor = (index) => {
    const currentRating = interactive && hoverRating ? hoverRating : rating;
    
    if (index <= currentRating) {
      return 'text-yellow-400 fill-yellow-400';
    } else if (index - 0.5 <= currentRating) {
      return 'text-yellow-400 fill-yellow-400 opacity-50';
    }
    return 'text-gray-300 dark:text-gray-600';
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center">
        {[...Array(maxRating)].map((_, index) => {
          const starValue = index + 1;
          return (
            <button
              key={index}
              type="button"
              onClick={() => handleClick(starValue)}
              onMouseEnter={() => handleMouseEnter(starValue)}
              onMouseLeave={handleMouseLeave}
              disabled={!interactive}
              className={`
                ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
                transition-all duration-200 focus:outline-none
              `}
            >
              <Star
                size={size}
                className={`${getStarColor(starValue)} transition-colors duration-200`}
              />
            </button>
          );
        })}
      </div>
      
      {showValue && (
        <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;
