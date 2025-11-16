import React, { useState, useEffect } from 'react';
import { X, Star } from 'lucide-react';
import StarRating from './StarRating';
import { createReview, updateReview } from '../../services/reviewService';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../ToastContainer';

const ReviewForm = ({ 
  doctorId, 
  appointmentId = null,
  existingReview = null,
  onSuccess, 
  onCancel 
}) => {
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    rating: 0,
    title: '',
    comment: '',
    detailedRatings: {
      professionalism: 0,
      communication: 0,
      waitTime: 0,
      facilityQuality: 0
    }
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (existingReview) {
      setFormData({
        rating: existingReview.rating,
        title: existingReview.title,
        comment: existingReview.comment,
        detailedRatings: existingReview.detailedRatings || {
          professionalism: 0,
          communication: 0,
          waitTime: 0,
          facilityQuality: 0
        }
      });
    }
  }, [existingReview]);

  const validate = () => {
    const newErrors = {};

    if (formData.rating === 0) {
      newErrors.rating = 'Please select a rating';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    if (!formData.comment.trim()) {
      newErrors.comment = 'Review comment is required';
    } else if (formData.comment.length < 10) {
      newErrors.comment = 'Review must be at least 10 characters';
    } else if (formData.comment.length > 1000) {
      newErrors.comment = 'Review must be less than 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);

      const reviewData = {
        ...formData,
        doctorId,
        appointmentId
      };

      let response;
      if (existingReview) {
        response = await updateReview(existingReview._id, reviewData);
      } else {
        response = await createReview(reviewData);
      }

      showSuccess(response.message || 'Review submitted successfully!');
      
      if (onSuccess) {
        onSuccess(response.review);
      }

      // Reset form
      if (!existingReview) {
        setFormData({
          rating: 0,
          title: '',
          comment: '',
          detailedRatings: {
            professionalism: 0,
            communication: 0,
            waitTime: 0,
            facilityQuality: 0
          }
        });
      }

    } catch (error) {
      console.error('Submit review error:', error);
      showError(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const handleDetailedRatingChange = (category, value) => {
    setFormData({
      ...formData,
      detailedRatings: {
        ...formData.detailedRatings,
        [category]: value
      }
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
          {existingReview ? 'Edit Review' : 'Write a Review'}
        </h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
          >
            <X size={24} className="text-gray-600 dark:text-gray-400" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Overall Rating */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Overall Rating *
          </label>
          <StarRating
            rating={formData.rating}
            size={32}
            interactive
            onRatingChange={(rating) => setFormData({ ...formData, rating })}
            className="mb-2"
          />
          {errors.rating && (
            <p className="text-red-500 text-sm mt-1">{errors.rating}</p>
          )}
        </div>

        {/* Review Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Review Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Summarize your experience in one line"
            maxLength={100}
            className={`
              w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 
              dark:bg-gray-700 dark:text-white dark:border-gray-600
              ${errors.title ? 'border-red-500' : 'border-gray-300'}
            `}
          />
          <div className="flex justify-between mt-1">
            {errors.title && (
              <p className="text-red-500 text-sm">{errors.title}</p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
              {formData.title.length}/100
            </p>
          </div>
        </div>

        {/* Review Comment */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Your Review *
          </label>
          <textarea
            value={formData.comment}
            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            placeholder="Share details of your experience with this doctor..."
            maxLength={1000}
            rows={6}
            className={`
              w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 
              dark:bg-gray-700 dark:text-white dark:border-gray-600 resize-none
              ${errors.comment ? 'border-red-500' : 'border-gray-300'}
            `}
          />
          <div className="flex justify-between mt-1">
            {errors.comment && (
              <p className="text-red-500 text-sm">{errors.comment}</p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
              {formData.comment.length}/1000
            </p>
          </div>
        </div>

        {/* Detailed Ratings (Optional) */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Detailed Ratings (Optional)
          </h4>
          
          <div className="space-y-4">
            {[
              { key: 'professionalism', label: 'Professionalism' },
              { key: 'communication', label: 'Communication' },
              { key: 'waitTime', label: 'Wait Time' },
              { key: 'facilityQuality', label: 'Facility Quality' }
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {label}
                </label>
                <StarRating
                  rating={formData.detailedRatings[key]}
                  size={20}
                  interactive
                  onRatingChange={(rating) => handleDetailedRatingChange(key, rating)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : existingReview ? 'Update Review' : 'Submit Review'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-semibold py-3 rounded-lg transition"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Guidelines */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h5 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
          Review Guidelines
        </h5>
        <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
          <li>• Be respectful and constructive in your feedback</li>
          <li>• Focus on your personal experience with the doctor</li>
          <li>• Avoid sharing personal medical information</li>
          <li>• Reviews are public and help other patients make informed decisions</li>
        </ul>
      </div>
      <ToastContainer />
    </div>
  );
};

export default ReviewForm;
