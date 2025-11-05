import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const ComparisonChart = ({ monthlyData, quarterlyData }) => {
  if (!monthlyData || !quarterlyData) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-center text-gray-500">Loading comparison data...</p>
      </div>
    );
  }

  const calculateTrend = (growth) => {
    const value = parseFloat(growth);
    if (value > 0) return { icon: '↑', color: 'text-green-600', bg: 'bg-green-100' };
    if (value < 0) return { icon: '↓', color: 'text-red-600', bg: 'bg-red-100' };
    return { icon: '→', color: 'text-gray-600', bg: 'bg-gray-100' };
  };

  const MetricCard = ({ title, current, previous, growth, type = 'number' }) => {
    const trend = calculateTrend(growth);
    const formatValue = (value) => {
      if (type === 'currency') return `₹${value.toLocaleString()}`;
      return value.toLocaleString();
    };

    return (
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <h4 className="text-sm font-medium text-gray-600 mb-3">{title}</h4>
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-3xl font-bold text-gray-800">{formatValue(current)}</p>
            <p className="text-xs text-gray-500 mt-1">Current</p>
          </div>
          <div className={`px-3 py-1 rounded-full ${trend.bg} flex items-center gap-1`}>
            <span className={`text-lg font-bold ${trend.color}`}>{trend.icon}</span>
            <span className={`text-sm font-semibold ${trend.color}`}>{Math.abs(growth)}%</span>
          </div>
        </div>
        <div className="pt-2 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Previous: <span className="font-semibold">{formatValue(previous)}</span>
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Monthly Comparison */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">📊 Monthly Comparison</h3>
          <p className="text-sm text-gray-600">
            {monthlyData.current.period} vs {monthlyData.previous.period}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Appointments"
            current={monthlyData.current.appointments}
            previous={monthlyData.previous.appointments}
            growth={monthlyData.growth.appointments}
          />
          <MetricCard
            title="Revenue"
            current={monthlyData.current.revenue}
            previous={monthlyData.previous.revenue}
            growth={monthlyData.growth.revenue}
            type="currency"
          />
          <MetricCard
            title="Patients"
            current={monthlyData.current.patients}
            previous={monthlyData.previous.patients}
            growth={monthlyData.growth.patients}
          />
        </div>

        {/* Monthly Trend Visualization */}
        <div className="mt-6">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart
              data={[
                {
                  name: monthlyData.previous.period.split(' ')[0].substring(0, 3),
                  appointments: monthlyData.previous.appointments,
                  revenue: monthlyData.previous.revenue / 1000,
                  patients: monthlyData.previous.patients
                },
                {
                  name: monthlyData.current.period.split(' ')[0].substring(0, 3),
                  appointments: monthlyData.current.appointments,
                  revenue: monthlyData.current.revenue / 1000,
                  patients: monthlyData.current.patients
                }
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'revenue' ? `₹${(value * 1000).toLocaleString()}` : value,
                  name.charAt(0).toUpperCase() + name.slice(1)
                ]}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
              />
              <Legend />
              <Line type="monotone" dataKey="appointments" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue (₹K)" />
              <Line type="monotone" dataKey="patients" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quarterly Comparison */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">📈 Quarterly Comparison</h3>
          <p className="text-sm text-gray-600">
            {quarterlyData.current.period} vs {quarterlyData.previous.period}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Appointments"
            current={quarterlyData.current.appointments}
            previous={quarterlyData.previous.appointments}
            growth={quarterlyData.growth.appointments}
          />
          <MetricCard
            title="Revenue"
            current={quarterlyData.current.revenue}
            previous={quarterlyData.previous.revenue}
            growth={quarterlyData.growth.revenue}
            type="currency"
          />
          <MetricCard
            title="Patients"
            current={quarterlyData.current.patients}
            previous={quarterlyData.previous.patients}
            growth={quarterlyData.growth.patients}
          />
        </div>

        {/* Quarterly Trend Visualization */}
        <div className="mt-6">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart
              data={[
                {
                  name: quarterlyData.previous.period,
                  appointments: quarterlyData.previous.appointments,
                  revenue: quarterlyData.previous.revenue / 1000,
                  patients: quarterlyData.previous.patients
                },
                {
                  name: quarterlyData.current.period,
                  appointments: quarterlyData.current.appointments,
                  revenue: quarterlyData.current.revenue / 1000,
                  patients: quarterlyData.current.patients
                }
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'revenue' ? `₹${(value * 1000).toLocaleString()}` : value,
                  name.charAt(0).toUpperCase() + name.slice(1)
                ]}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
              />
              <Legend />
              <Line type="monotone" dataKey="appointments" stroke="#8b5cf6" strokeWidth={2} />
              <Line type="monotone" dataKey="revenue" stroke="#06b6d4" strokeWidth={2} name="Revenue (₹K)" />
              <Line type="monotone" dataKey="patients" stroke="#ec4899" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ComparisonChart;
