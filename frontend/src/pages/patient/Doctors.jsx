import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filterOptions, setFilterOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Search and filter states
  const [filters, setFilters] = useState({
    search: '',
    specialization: '',
    minFee: '',
    maxFee: '',
    minExperience: '',
    maxExperience: '',
    minRating: '',
    gender: '',
    sortBy: 'name',
    sortOrder: 'asc',
    page: 1
  });

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchDoctors();
    }, 300); // Debounce API calls

    return () => clearTimeout(timeoutId);
  }, [filters]);

  const fetchFilterOptions = async () => {
    try {
      const response = await api.get('/doctors/filters/options');
      setFilterOptions(response.data);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          queryParams.append(key, value);
        }
      });

      const response = await api.get(`/doctors?${queryParams.toString()}`);
      setDoctors(response.data.doctors || response.data);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value // Reset to page 1 when other filters change
    }));
  }, []);

  const resetFilters = () => {
    setFilters({
      search: '',
      specialization: '',
      minFee: '',
      maxFee: '',
      minExperience: '',
      maxExperience: '',
      minRating: '',
      gender: '',
      sortBy: 'name',
      sortOrder: 'asc',
      page: 1
    });
  };

  const handleSortChange = (sortBy) => {
    const newOrder = filters.sortBy === sortBy && filters.sortOrder === 'asc' ? 'desc' : 'asc';
    updateFilter('sortBy', sortBy);
    updateFilter('sortOrder', newOrder);
  };

  const renderPriceSlider = () => {
    const { minFee = 0, maxFee = 2000 } = filterOptions.feeRange || {};
    return (
      <div className="space-y-3">
        <div className="flex justify-between text-sm text-gray-600">
          <span>₹{filters.minFee || minFee}</span>
          <span>₹{filters.maxFee || maxFee}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="range"
            min={minFee}
            max={maxFee}
            step="50"
            value={filters.minFee || minFee}
            onChange={(e) => updateFilter('minFee', e.target.value)}
            className="w-full"
          />
          <input
            type="range"
            min={minFee}
            max={maxFee}
            step="50"
            value={filters.maxFee || maxFee}
            onChange={(e) => updateFilter('maxFee', e.target.value)}
            className="w-full"
          />
        </div>
      </div>
    );
  };

  if (loading && doctors.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Find Doctors
          </h1>
          <p className="text-gray-600 mt-2">Browse qualified doctors and book appointments with advanced filters</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-80">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden sticky top-4">
              {/* Filter Header */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-white">Filters</h2>
                  <button
                    onClick={resetFilters}
                    className="text-white hover:text-emerald-100 text-sm font-medium"
                  >
                    Reset All
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                {/* Quick Search */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    🔍 Quick Search
                  </label>
                  <input
                    type="text"
                    placeholder="Search by name, specialization, symptoms..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    value={filters.search}
                    onChange={(e) => updateFilter('search', e.target.value)}
                  />
                </div>

                {/* Specialization */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    🩺 Specialization
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    value={filters.specialization}
                    onChange={(e) => updateFilter('specialization', e.target.value)}
                  >
                    <option value="">All Specializations</option>
                    {filterOptions.specializations?.map((spec) => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>

                {/* Rating Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    ⭐ Minimum Rating
                  </label>
                  <div className="grid grid-cols-5 gap-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => updateFilter('minRating', rating === parseInt(filters.minRating) ? '' : rating)}
                        className={`py-2 px-1 text-sm rounded-lg border transition-colors ${
                          parseInt(filters.minRating) === rating
                            ? 'bg-yellow-500 text-white border-yellow-500'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-yellow-400'
                        }`}
                      >
                        {rating}★
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    💰 Consultation Fee Range
                  </label>
                  {renderPriceSlider()}
                </div>

                {/* Experience Range */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    🎓 Experience (Years)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      placeholder="Min"
                      min="0"
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      value={filters.minExperience}
                      onChange={(e) => updateFilter('minExperience', e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      min="0"
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      value={filters.maxExperience}
                      onChange={(e) => updateFilter('maxExperience', e.target.value)}
                    />
                  </div>
                </div>

                {/* Gender Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    👨‍⚕️ Gender Preference
                  </label>
                  <div className="space-y-2">
                    {['', 'male', 'female'].map((gender) => (
                      <label key={gender} className="flex items-center">
                        <input
                          type="radio"
                          name="gender"
                          value={gender}
                          checked={filters.gender === gender}
                          onChange={(e) => updateFilter('gender', e.target.value)}
                          className="mr-3 text-emerald-500"
                        />
                        <span className="text-sm text-gray-700">
                          {gender === '' ? 'Any' : gender.charAt(0).toUpperCase() + gender.slice(1)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Availability Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    🕒 Quick Filters
                  </label>
                  <div className="space-y-2">
                    <button className="w-full text-left px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-sm">
                      📅 Available Today
                    </button>
                    <button className="w-full text-left px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm">
                      🔥 Most Popular
                    </button>
                    <button className="w-full text-left px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm">
                      💎 Premium Doctors
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Sort and Results Header */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {pagination.totalDoctors || doctors.length} Doctors Found
                  </h3>
                  <p className="text-sm text-gray-600">
                    Showing {((filters.page - 1) * 12) + 1}-{Math.min(filters.page * 12, pagination.totalDoctors || doctors.length)} of {pagination.totalDoctors || doctors.length} results
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {['name', 'rating', 'experience', 'fee'].map((sortOption) => (
                    <button
                      key={sortOption}
                      onClick={() => handleSortChange(sortOption)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filters.sortBy === sortOption
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {sortOption === 'name' ? 'Name' : 
                       sortOption === 'rating' ? 'Rating' :
                       sortOption === 'experience' ? 'Experience' : 'Fee'}
                      {filters.sortBy === sortOption && (
                        <span className="ml-1">
                          {filters.sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Doctors Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading doctors...</p>
              </div>
            ) : doctors.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-lg">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No doctors found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your filters or search terms</p>
                <button
                  onClick={resetFilters}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {doctors.map((doctor) => (
                    <div
                      key={doctor._id}
                      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
                    >
                      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-20 relative">
                        <div className="absolute top-4 right-4 flex space-x-2">
                          {doctor.isAvailableToday && (
                            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                              Available Today
                            </span>
                          )}
                          {doctor.averageRating >= 4.5 && (
                            <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                              Top Rated
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <div className="flex justify-center -mt-12 mb-4">
                          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-3xl shadow-lg border-4 border-white">
                            {doctor.gender === 'female' ? '👩‍⚕️' : '👨‍⚕️'}
                          </div>
                        </div>
                        
                        <div className="text-center mb-4">
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            Dr. {doctor.name}
                          </h3>
                          <p className="text-emerald-600 font-semibold mb-2">
                            {doctor.specialization}
                          </p>
                          
                          {/* Rating */}
                          <div className="flex items-center justify-center mb-3">
                            <div className="flex text-yellow-400">
                              {[...Array(5)].map((_, i) => (
                                <svg key={i} className={`w-4 h-4 ${i < Math.floor(doctor.averageRating) ? 'fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                            <span className="ml-2 text-sm text-gray-600">
                              {doctor.averageRating || 'New'} ({doctor.totalReviews || 0})
                            </span>
                          </div>
                        </div>
                        
                        {/* Doctor Details */}
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center text-sm text-gray-600">
                            <svg className="w-4 h-4 mr-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium">Experience:</span>
                            <span className="ml-1">{doctor.experience || 0} years</span>
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600">
                            <svg className="w-4 h-4 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <span className="font-medium">Education:</span>
                            <span className="ml-1 text-xs">{doctor.education || 'MBBS'}</span>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center text-gray-600">
                              <svg className="w-4 h-4 mr-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                              </svg>
                              <span className="font-semibold text-emerald-600">₹{doctor.consultationFee || 500}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {doctor.upcomingSlots > 0 ? (
                                <span className="text-green-600 font-medium">
                                  {doctor.upcomingSlots} slots available
                                </span>
                              ) : (
                                <span className="text-orange-600 font-medium">
                                  Busy this week
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="space-y-2">
                          <Link
                            to={`/patient/book-appointment/${doctor._id}`}
                            className="block w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-center py-3 px-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
                          >
                            Book Appointment
                          </Link>
                          <Link
                            to={`/patient/chat-with-doctor`}
                            className="block w-full bg-blue-100 hover:bg-blue-200 text-blue-700 text-center py-2 px-4 rounded-lg font-medium transition-colors text-sm"
                          >
                            💬 Chat with Doctor
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => updateFilter('page', Math.max(1, filters.page - 1))}
                        disabled={!pagination.hasPrev}
                        className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                          pagination.hasPrev
                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        ← Previous
                      </button>
                      
                      <div className="flex space-x-2">
                        {[...Array(pagination.totalPages)].map((_, index) => {
                          const page = index + 1;
                          if (
                            page === 1 ||
                            page === pagination.totalPages ||
                            (page >= filters.page - 2 && page <= filters.page + 2)
                          ) {
                            return (
                              <button
                                key={page}
                                onClick={() => updateFilter('page', page)}
                                className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                                  page === filters.page
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                }`}
                              >
                                {page}
                              </button>
                            );
                          } else if (
                            page === filters.page - 3 ||
                            page === filters.page + 3
                          ) {
                            return (
                              <span key={page} className="w-10 h-10 flex items-center justify-center text-gray-400">
                                ...
                              </span>
                            );
                          }
                          return null;
                        })}
                      </div>
                      
                      <button
                        onClick={() => updateFilter('page', Math.min(pagination.totalPages, filters.page + 1))}
                        disabled={!pagination.hasNext}
                        className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                          pagination.hasNext
                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Doctors;
