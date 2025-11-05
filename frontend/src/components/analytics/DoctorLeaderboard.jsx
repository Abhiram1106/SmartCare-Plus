import React from 'react';

const DoctorLeaderboard = ({ leaderboard, loading }) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const getMedalColor = (index) => {
    if (index === 0) return 'text-yellow-500'; // Gold
    if (index === 1) return 'text-gray-400'; // Silver
    if (index === 2) return 'text-orange-600'; // Bronze
    return 'text-gray-600';
  };

  const getMedalIcon = (index) => {
    if (index < 3) {
      return (
        <svg className={`w-8 h-8 ${getMedalColor(index)}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
    return (
      <div className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full text-gray-600 font-bold">
        {index + 1}
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-800">🏆 Top Performing Doctors</h3>
        <span className="text-sm text-gray-500">Based on revenue generated</span>
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No performance data available</p>
        </div>
      ) : (
        <div className="space-y-4">
          {leaderboard.map((doctor, index) => (
            <div
              key={doctor.doctorId}
              className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                index < 3 ? 'border-2 border-blue-200 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Rank/Medal */}
                <div className="flex-shrink-0">
                  {getMedalIcon(index)}
                </div>

                {/* Doctor Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-lg font-semibold text-gray-800 truncate">
                      Dr. {doctor.doctorName}
                    </h4>
                    {doctor.rating > 0 && (
                      <span className="flex items-center text-sm text-yellow-600">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {doctor.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{doctor.specialization}</p>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                    <div className="bg-white p-2 rounded border border-gray-200">
                      <p className="text-xs text-gray-500">Revenue</p>
                      <p className="text-sm font-bold text-green-600">₹{doctor.totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-gray-200">
                      <p className="text-xs text-gray-500">Appointments</p>
                      <p className="text-sm font-bold text-blue-600">{doctor.completedAppointments}/{doctor.totalAppointments}</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-gray-200">
                      <p className="text-xs text-gray-500">Success Rate</p>
                      <p className="text-sm font-bold text-purple-600">{doctor.completionRate}%</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-gray-200">
                      <p className="text-xs text-gray-500">Patients</p>
                      <p className="text-sm font-bold text-orange-600">{doctor.uniquePatients}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorLeaderboard;
