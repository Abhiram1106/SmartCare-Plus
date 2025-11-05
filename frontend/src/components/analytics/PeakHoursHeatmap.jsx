import React from 'react';

const PeakHoursHeatmap = ({ heatmapData, dayNames }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  const getColor = (value, max) => {
    if (value === 0) return 'bg-gray-100';
    const intensity = (value / max) * 100;
    if (intensity >= 80) return 'bg-red-600';
    if (intensity >= 60) return 'bg-orange-500';
    if (intensity >= 40) return 'bg-yellow-500';
    if (intensity >= 20) return 'bg-green-400';
    return 'bg-blue-300';
  };

  const maxValue = Math.max(...heatmapData.flat());

  const formatHour = (hour) => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Peak Booking Hours Heatmap</h3>
        <p className="text-sm text-gray-600">Darker colors indicate higher booking frequency</p>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Hour labels */}
          <div className="flex mb-2">
            <div className="w-24 flex-shrink-0"></div>
            {hours.map((hour) => (
              <div 
                key={hour} 
                className="w-12 text-center text-xs text-gray-600 flex-shrink-0"
              >
                {hour % 4 === 0 ? formatHour(hour) : ''}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          {dayNames.map((day, dayIndex) => (
            <div key={day} className="flex items-center mb-1">
              <div className="w-24 text-sm font-medium text-gray-700 flex-shrink-0">
                {day}
              </div>
              <div className="flex gap-1">
                {hours.map((hour) => {
                  const value = heatmapData[dayIndex]?.[hour] || 0;
                  return (
                    <div
                      key={`${day}-${hour}`}
                      className={`w-10 h-10 flex items-center justify-center rounded ${getColor(value, maxValue)} transition-all hover:scale-110 cursor-pointer`}
                      title={`${day} ${formatHour(hour)}: ${value} bookings`}
                    >
                      {value > 0 && (
                        <span className="text-xs font-semibold text-white">
                          {value}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Legend */}
          <div className="mt-6 flex items-center justify-center gap-6">
            <span className="text-sm text-gray-600">Less</span>
            <div className="flex gap-1">
              <div className="w-8 h-8 bg-gray-100 rounded"></div>
              <div className="w-8 h-8 bg-blue-300 rounded"></div>
              <div className="w-8 h-8 bg-green-400 rounded"></div>
              <div className="w-8 h-8 bg-yellow-500 rounded"></div>
              <div className="w-8 h-8 bg-orange-500 rounded"></div>
              <div className="w-8 h-8 bg-red-600 rounded"></div>
            </div>
            <span className="text-sm text-gray-600">More</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeakHoursHeatmap;
