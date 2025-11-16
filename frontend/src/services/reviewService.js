import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with auth header
const getAuthConfig = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

// Create a new review
export const createReview = async (reviewData) => {
  const response = await axios.post(`${API_URL}/reviews`, reviewData, getAuthConfig());
  return response.data;
};

// Get reviews for a specific doctor
export const getDoctorReviews = async (doctorId, params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await axios.get(
    `${API_URL}/reviews/doctor/${doctorId}${queryString ? `?${queryString}` : ''}`
  );
  return response.data;
};

// Get current user's reviews
export const getMyReviews = async () => {
  const response = await axios.get(`${API_URL}/reviews/my-reviews`, getAuthConfig());
  return response.data;
};

// Update a review
export const updateReview = async (reviewId, reviewData) => {
  const response = await axios.put(
    `${API_URL}/reviews/${reviewId}`,
    reviewData,
    getAuthConfig()
  );
  return response.data;
};

// Delete a review
export const deleteReview = async (reviewId) => {
  const response = await axios.delete(`${API_URL}/reviews/${reviewId}`, getAuthConfig());
  return response.data;
};

// Vote on a review (helpful/not helpful)
export const voteReview = async (reviewId, vote) => {
  const response = await axios.post(
    `${API_URL}/reviews/${reviewId}/vote`,
    { vote },
    getAuthConfig()
  );
  return response.data;
};

// Flag a review
export const flagReview = async (reviewId, reason) => {
  const response = await axios.post(
    `${API_URL}/reviews/${reviewId}/flag`,
    { reason },
    getAuthConfig()
  );
  return response.data;
};

// Doctor responds to a review
export const respondToReview = async (reviewId, comment) => {
  const response = await axios.post(
    `${API_URL}/reviews/${reviewId}/respond`,
    { comment },
    getAuthConfig()
  );
  return response.data;
};

// Admin: Get all reviews
export const getAllReviews = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await axios.get(
    `${API_URL}/reviews/admin/all${queryString ? `?${queryString}` : ''}`,
    getAuthConfig()
  );
  return response.data;
};

// Admin: Moderate a review
export const moderateReview = async (reviewId, status, moderationNote) => {
  const response = await axios.put(
    `${API_URL}/reviews/admin/${reviewId}/moderate`,
    { status, moderationNote },
    getAuthConfig()
  );
  return response.data;
};

// Get overall review statistics
export const getOverallStats = async () => {
  const response = await axios.get(`${API_URL}/reviews/stats/overall`);
  return response.data;
};

export default {
  createReview,
  getDoctorReviews,
  getMyReviews,
  updateReview,
  deleteReview,
  voteReview,
  flagReview,
  respondToReview,
  getAllReviews,
  moderateReview,
  getOverallStats
};
