import React, { useState, useEffect } from 'react';
import { 
  Filter, 
  TrendingUp, 
  Clock, 
  Star,
  CheckCircle,
  ChevronDown
} from 'lucide-react';
import ReviewCard from './ReviewCard';
import RatingBreakdown from './RatingBreakdown';
import StarRating from './StarRating';
import { getDoctorReviews } from '../../services/reviewService';

const DoctorReviewsList = ({ doctorId, onWriteReview, onEditReview, onRespondToReview }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    sort: '-createdAt',
    minRating: null,
    verified: false
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [doctorId, filters]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (filters.page) params.page = filters.page;
      if (filters.limit) params.limit = filters.limit;
      if (filters.sort) params.sort = filters.sort;
      if (filters.minRating) params.minRating = filters.minRating;
      if (filters.verified) params.verified = 'true';

      const data = await getDoctorReviews(doctorId, params);
      setReviews(data.reviews);
      setStats(data.stats);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Fetch reviews error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (sortOption) => {
    setFilters({ ...filters, sort: sortOption, page: 1 });
  };

  const handleFilterChange = (filterName, value) => {
    setFilters({ ...filters, [filterName]: value, page: 1 });
  };

  const handleLoadMore = () => {
    setFilters({ ...filters, page: filters.page + 1 });
  };

  const handleDeleteReview = (reviewId) => {
    setReviews(reviews.filter(r => r._id !== reviewId));
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      {stats && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Average Rating */}
            <div className="text-center">
              <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
                {stats.averageRating.toFixed(1)}
              </div>
              <StarRating rating={stats.averageRating} size={24} className="justify-center mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Rating Breakdown */}
            <div className="md:col-span-2">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Rating Distribution
              </h4>
              <RatingBreakdown 
                ratingBreakdown={stats.ratingBreakdown} 
                totalReviews={stats.totalReviews} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Filters & Sort */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition"
            >
              <Filter size={18} />
              <span className="font-medium">Filters</span>
              <ChevronDown 
                size={18} 
                className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`}
              />
            </button>

            <button
              onClick={() => handleFilterChange('verified', !filters.verified)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg transition
                ${filters.verified 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                }
              `}
            >
              <CheckCircle size={18} />
              <span className="font-medium">Verified Only</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
            <select
              value={filters.sort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="-createdAt">Most Recent</option>
              <option value="helpful">Most Helpful</option>
              <option value="rating-high">Highest Rating</option>
              <option value="rating-low">Lowest Rating</option>
            </select>
          </div>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Minimum Rating
                </label>
                <select
                  value={filters.minRating || ''}
                  onChange={(e) => handleFilterChange('minRating', e.target.value || null)}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="2">2+ Stars</option>
                  <option value="1">1+ Stars</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reviews per page
                </label>
                <select
                  value={filters.limit}
                  onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Write Review Button */}
      {onWriteReview && (
        <button
          onClick={onWriteReview}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
        >
          <Star size={20} />
          Write a Review
        </button>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center border border-gray-200 dark:border-gray-700">
          <Star size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No reviews yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Be the first to share your experience with this doctor!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review._id}
              review={review}
              onEdit={onEditReview}
              onDelete={handleDeleteReview}
              onRespond={onRespondToReview}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.hasMore && (
        <div className="text-center">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load More Reviews'}
          </button>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Showing {reviews.length} of {pagination.totalReviews} reviews
          </p>
        </div>
      )}
    </div>
  );
};

export default DoctorReviewsList;
