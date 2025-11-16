/**
 * Predictive Analytics Engine
 * ML-based predictions for appointments, revenue, and patterns
 */

/**
 * Predict likelihood of appointment no-show
 * Based on historical data patterns
 */
function predictNoShow(appointmentData, userHistory) {
  let riskScore = 0;
  
  // Factor 1: Previous no-show history (40% weight)
  if (userHistory.totalAppointments > 0) {
    const noShowRate = (userHistory.noShows / userHistory.totalAppointments) * 100;
    riskScore += (noShowRate / 100) * 40;
  }
  
  // Factor 2: Booking lead time (20% weight)
  const daysBefore = Math.floor((new Date(appointmentData.appointmentDate) - new Date()) / (1000 * 60 * 60 * 24));
  if (daysBefore > 30) {
    riskScore += 15; // Long lead time = higher no-show risk
  } else if (daysBefore < 3) {
    riskScore += 5; // Very short notice = moderate risk
  } else {
    riskScore += 0; // Optimal window
  }
  
  // Factor 3: Time of day (15% weight)
  const hour = new Date(appointmentData.appointmentDate).getHours();
  if (hour < 9 || hour > 17) {
    riskScore += 10; // Early morning or late evening
  }
  
  // Factor 4: Day of week (10% weight)
  const day = new Date(appointmentData.appointmentDate).getDay();
  if (day === 0 || day === 6) {
    riskScore += 8; // Weekend appointments
  } else if (day === 1) {
    riskScore += 5; // Monday appointments
  }
  
  // Factor 5: Payment status (15% weight)
  if (!appointmentData.isPaid) {
    riskScore += 15; // Unpaid appointments have higher no-show
  }
  
  // Normalize to 0-100
  riskScore = Math.min(Math.max(riskScore, 0), 100);
  
  return {
    probability: Math.round(riskScore),
    riskLevel: riskScore > 70 ? 'high' : riskScore > 40 ? 'medium' : 'low',
    factors: {
      historicalNoShowRate: userHistory.totalAppointments > 0 
        ? Math.round((userHistory.noShows / userHistory.totalAppointments) * 100) 
        : 0,
      leadTimeDays: daysBefore,
      isWeekend: day === 0 || day === 6,
      isPaid: appointmentData.isPaid
    }
  };
}

/**
 * Forecast revenue for upcoming period
 */
function forecastRevenue(historicalData, period = 30) {
  if (!historicalData || historicalData.length === 0) {
    return {
      forecast: 0,
      trend: 'insufficient_data',
      confidence: 0
    };
  }
  
  // Simple moving average with trend analysis
  const recentData = historicalData.slice(-period);
  const averageDaily = recentData.reduce((sum, day) => sum + day.revenue, 0) / recentData.length;
  
  // Calculate trend (comparing first half vs second half)
  const midpoint = Math.floor(recentData.length / 2);
  const firstHalfAvg = recentData.slice(0, midpoint).reduce((sum, d) => sum + d.revenue, 0) / midpoint;
  const secondHalfAvg = recentData.slice(midpoint).reduce((sum, d) => sum + d.revenue, 0) / (recentData.length - midpoint);
  
  const trendPercentage = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
  
  // Apply trend to forecast
  const trendFactor = 1 + (trendPercentage / 100);
  const forecastAmount = averageDaily * period * trendFactor;
  
  // Calculate confidence based on data consistency
  const variance = recentData.reduce((sum, day) => {
    return sum + Math.pow(day.revenue - averageDaily, 2);
  }, 0) / recentData.length;
  
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = (stdDev / averageDaily) * 100;
  
  // Lower variation = higher confidence
  const confidence = Math.max(0, 100 - coefficientOfVariation);
  
  return {
    forecast: Math.round(forecastAmount),
    dailyAverage: Math.round(averageDaily),
    trend: trendPercentage > 5 ? 'growing' : trendPercentage < -5 ? 'declining' : 'stable',
    trendPercentage: Math.round(trendPercentage),
    confidence: Math.round(confidence),
    period: `Next ${period} days`
  };
}

/**
 * Identify peak hours and patterns
 */
function analyzePeakHours(appointments) {
  const hourlyData = Array(24).fill(0).map((_, i) => ({ hour: i, count: 0, revenue: 0 }));
  const dailyData = Array(7).fill(0).map((_, i) => ({ day: i, count: 0, revenue: 0 }));
  
  appointments.forEach(apt => {
    const date = new Date(apt.appointmentDate);
    const hour = date.getHours();
    const day = date.getDay();
    
    hourlyData[hour].count++;
    hourlyData[hour].revenue += apt.consultationFee || 0;
    
    dailyData[day].count++;
    dailyData[day].revenue += apt.consultationFee || 0;
  });
  
  // Find peak hour
  const peakHour = hourlyData.reduce((max, h) => h.count > max.count ? h : max, hourlyData[0]);
  
  // Find peak day
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const peakDay = dailyData.reduce((max, d) => d.count > max.count ? d : max, dailyData[0]);
  
  return {
    peakHour: {
      hour: peakHour.hour,
      time: `${peakHour.hour}:00 - ${peakHour.hour + 1}:00`,
      appointmentCount: peakHour.count,
      revenue: Math.round(peakHour.revenue)
    },
    peakDay: {
      day: dayNames[peakDay.day],
      appointmentCount: peakDay.count,
      revenue: Math.round(peakDay.revenue)
    },
    hourlyDistribution: hourlyData.filter(h => h.count > 0).map(h => ({
      time: `${h.hour}:00`,
      appointments: h.count,
      revenue: Math.round(h.revenue)
    })),
    dailyDistribution: dailyData.map((d, i) => ({
      day: dayNames[i],
      appointments: d.count,
      revenue: Math.round(d.revenue)
    }))
  };
}

/**
 * Calculate treatment success rate
 */
function calculateSuccessRate(appointments, reviews) {
  const completedAppointments = appointments.filter(a => a.status === 'completed');
  
  if (completedAppointments.length === 0) {
    return {
      successRate: 0,
      totalTreated: 0,
      averageRating: 0
    };
  }
  
  // Calculate based on reviews
  const positiveReviews = reviews.filter(r => r.rating >= 4).length;
  const successRate = (positiveReviews / reviews.length) * 100;
  
  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = totalRating / reviews.length;
  
  return {
    successRate: Math.round(successRate),
    totalTreated: completedAppointments.length,
    totalReviewed: reviews.length,
    averageRating: averageRating.toFixed(2),
    positiveReviews,
    negativeReviews: reviews.length - positiveReviews
  };
}

/**
 * Detect disease outbreak patterns
 */
function detectOutbreakPatterns(symptomAnalyses, timeWindow = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - timeWindow);
  
  const recentAnalyses = symptomAnalyses.filter(a => new Date(a.createdAt) >= cutoffDate);
  
  // Count disease predictions
  const diseaseCounts = {};
  recentAnalyses.forEach(analysis => {
    analysis.predictions.forEach(pred => {
      if (pred.confidence > 50) {
        diseaseCounts[pred.disease] = (diseaseCounts[pred.disease] || 0) + 1;
      }
    });
  });
  
  // Sort by frequency
  const outbreaks = Object.entries(diseaseCounts)
    .map(([disease, count]) => ({
      disease,
      cases: count,
      percentageOfTotal: ((count / recentAnalyses.length) * 100).toFixed(2)
    }))
    .sort((a, b) => b.cases - a.cases)
    .slice(0, 10);
  
  return {
    timeWindow: `Last ${timeWindow} days`,
    totalAnalyses: recentAnalyses.length,
    patterns: outbreaks,
    alert: outbreaks.length > 0 && outbreaks[0].cases > recentAnalyses.length * 0.2 
      ? `⚠️ Potential outbreak: ${outbreaks[0].disease} (${outbreaks[0].cases} cases)`
      : null
  };
}

/**
 * Generate patient retention insights
 */
function analyzePatientRetention(patients, appointments) {
  const patientStats = patients.map(patient => {
    const patientAppointments = appointments.filter(a => a.patient.toString() === patient._id.toString());
    
    if (patientAppointments.length === 0) return null;
    
    const firstVisit = new Date(Math.min(...patientAppointments.map(a => new Date(a.appointmentDate))));
    const lastVisit = new Date(Math.max(...patientAppointments.map(a => new Date(a.appointmentDate))));
    const daysSinceFirst = Math.floor((new Date() - firstVisit) / (1000 * 60 * 60 * 24));
    const daysSinceLast = Math.floor((new Date() - lastVisit) / (1000 * 60 * 60 * 24));
    
    return {
      patientId: patient._id,
      totalVisits: patientAppointments.length,
      firstVisit,
      lastVisit,
      daysSinceFirst,
      daysSinceLast,
      isActive: daysSinceLast < 90,
      isAtRisk: daysSinceLast > 90 && daysSinceLast < 180,
      isLost: daysSinceLast > 180
    };
  }).filter(s => s !== null);
  
  const activePatients = patientStats.filter(p => p.isActive).length;
  const atRiskPatients = patientStats.filter(p => p.isAtRisk).length;
  const lostPatients = patientStats.filter(p => p.isLost).length;
  
  const retentionRate = (activePatients / patientStats.length) * 100;
  
  return {
    totalPatients: patientStats.length,
    activePatients,
    atRiskPatients,
    lostPatients,
    retentionRate: retentionRate.toFixed(2),
    averageVisitsPerPatient: (appointments.length / patientStats.length).toFixed(2),
    patientsNeedingFollowUp: atRiskPatients
  };
}

module.exports = {
  predictNoShow,
  forecastRevenue,
  analyzePeakHours,
  calculateSuccessRate,
  detectOutbreakPatterns,
  analyzePatientRetention
};
