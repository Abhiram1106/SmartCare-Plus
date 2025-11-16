import React from 'react';
import { Award, TrendingUp, Star } from 'lucide-react';

const TopRatedBadge = ({ rating, size = 'md', showLabel = true }) => {
  // Only show badge for doctors with rating >= 4.5
  if (!rating || rating < 4.5) return null;

  const sizes = {
    sm: { icon: 16, text: 'text-xs', padding: 'px-2 py-1' },
    md: { icon: 20, text: 'text-sm', padding: 'px-3 py-1.5' },
    lg: { icon: 24, text: 'text-base', padding: 'px-4 py-2' }
  };

  const config = sizes[size] || sizes.md;

  return (
    <div 
      className={`
        inline-flex items-center gap-2 
        ${config.padding} 
        bg-gradient-to-r from-yellow-400 to-orange-500 
        text-white font-semibold rounded-full shadow-lg
        animate-pulse-subtle
      `}
      title={`Top Rated Doctor - ${rating.toFixed(1)}/5.0`}
    >
      <Award size={config.icon} className="animate-bounce-subtle" />
      {showLabel && (
        <span className={config.text}>Top Rated</span>
      )}
    </div>
  );
};

export const VerifiedBadge = ({ size = 'md' }) => {
  const sizes = {
    sm: { icon: 14, text: 'text-xs', padding: 'px-2 py-1' },
    md: { icon: 16, text: 'text-sm', padding: 'px-3 py-1.5' },
    lg: { icon: 20, text: 'text-base', padding: 'px-4 py-2' }
  };

  const config = sizes[size] || sizes.md;

  return (
    <div 
      className={`
        inline-flex items-center gap-1.5 
        ${config.padding} 
        bg-blue-100 dark:bg-blue-900/30 
        text-blue-800 dark:text-blue-300 
        font-semibold rounded-full border-2 border-blue-300 dark:border-blue-700
      `}
      title="Verified Doctor"
    >
      <Star size={config.icon} className="fill-current" />
      <span className={config.text}>Verified</span>
    </div>
  );
};

export const RisingStarBadge = ({ size = 'md' }) => {
  const sizes = {
    sm: { icon: 14, text: 'text-xs', padding: 'px-2 py-1' },
    md: { icon: 16, text: 'text-sm', padding: 'px-3 py-1.5' },
    lg: { icon: 20, text: 'text-base', padding: 'px-4 py-2' }
  };

  const config = sizes[size] || sizes.md;

  return (
    <div 
      className={`
        inline-flex items-center gap-1.5 
        ${config.padding} 
        bg-gradient-to-r from-green-400 to-emerald-500 
        text-white font-semibold rounded-full shadow-md
      `}
      title="Rising Star Doctor"
    >
      <TrendingUp size={config.icon} />
      <span className={config.text}>Rising Star</span>
    </div>
  );
};

export default TopRatedBadge;
